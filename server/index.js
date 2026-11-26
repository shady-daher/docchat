// ===== 1. IMPORTS (top of the file) =====
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// ===== 2. APP SETUP (just below the imports) =====
const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// sessions: remembers who is logged in, via a signed cookie
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret',
  resave: false,
  saveUninitialized: false,
}));

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

// ===== 4. START THE SERVER (always the LAST line) =====
app.listen(3000, () => console.log('Server running on http://localhost:3000'));