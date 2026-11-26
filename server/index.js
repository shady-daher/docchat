// ===== 1. IMPORTS (top of the file) =====
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaNeonHTTP } from '@prisma/adapter-neon';   // the Neon HTTPS bridge
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';        // inner path — the plain 'pdf-parse' import fails in ESM

// ===== 2. APP SETUP (just below the imports) =====
const app = express();
const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL, {});   // pass the connection STRING directly
const prisma = new PrismaClient({ adapter });
app.use(express.json());

// sessions: remembers who is logged in, via a signed cookie
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
}));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// keep the uploaded file in memory (not on disk); cap size at 5 MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// middleware: block anyone who is not logged in
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Please log in' });
  next();
}

// ===== 3. ROUTES (all go here, ABOVE app.listen) =====

// health route — kept from Session 1
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is alive' });
});

// REGISTER: create a user with a hashed password
app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  const hash = await bcrypt.hash(password, 10);   // 10 = work factor
  try {
    const user = await prisma.user.create({
      data: { email, name, password: hash },
    });
    req.session.userId = user.id;                  // log them in immediately
    res.json({ id: user.id, name: user.name });
  } catch (e) {
    res.status(400).json({ error: 'Email already in use' });
  }
});

// LOGIN: find the user, compare the password to the stored hash
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'No such user' });

  const ok = await bcrypt.compare(password, user.password); // never compare plain text
  if (!ok) return res.status(401).json({ error: 'Wrong password' });

  req.session.userId = user.id;
  res.json({ id: user.id, name: user.name });
});

// WHO AM I: lets the front end know if someone is logged in
app.get('/api/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  res.json({ user: user ? { id: user.id, name: user.name } : null });
});

// LOGOUT
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// UPLOAD: receive a file from a logged-in user, extract its text, and save it as a Document row
app.post('/api/upload', requireLogin, upload.single('file'), async (req, res) => {
  try {
    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      const parsed = await pdfParse(req.file.buffer);   // PDF -> text
      text = parsed.text;
    } else {
      text = req.file.buffer.toString('utf-8');         // .txt / .md -> text
    }
    const doc = await prisma.document.create({
      data: { title: req.file.originalname, content: text, userId: req.session.userId },
    });
    res.json({ id: doc.id, title: doc.title, chars: text.length });
  } catch (e) {
    res.status(400).json({ error: 'Could not read that file. Try a text-based PDF or a .txt file.' });
  }
});

// CHAT: answer the user's question using ONLY the text of their own uploaded document
app.post('/api/chat', requireLogin, async (req, res) => {
  const { message, documentId } = req.body;
  try {
    // only let users read THEIR OWN document (ownership check — Week 13 / IDOR)
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId: req.session.userId },
    });
    if (!doc) return res.status(404).json({ error: 'Upload a document first.' });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,    // the model name comes from .env (see Step 1) so it's easy to swap
      contents: message,
      config: {
        systemInstruction:
          `You are a study assistant. Answer the student's question using ONLY ` +
          `the course material below. If the answer is not in it, reply ` +
          `"That isn't covered in this material." Never use outside knowledge.\n\n` +
          `=== COURSE MATERIAL ===\n${doc.content}`,
      },
    });
    res.json({ reply: response.text });
  } catch (e) {
    console.error(e);    // log the real reason in the server terminal (never swallow errors silently)
    res.status(500).json({ error: 'DocChat is unavailable right now.' });
  }
});

// ===== 4. START THE SERVER (always the LAST line) =====
app.listen(3000, () => console.log('Server running on http://localhost:3000'));