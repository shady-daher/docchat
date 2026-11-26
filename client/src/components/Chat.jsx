import { useState } from 'react';

function Chat({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (!documentId) { setError('Upload a document first.'); return; }
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput(''); setLoading(true); setError('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, documentId }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setError('Network problem. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="DocChat">
      <div className="chat-log">
        {messages.map((m, i) => (
          <p key={i} className={m.role}><strong>{m.role}:</strong> {m.text}</p>
        ))}
        {loading && <p>Studying your material…</p>}
        {error && <p role="alert">{error}</p>}
      </div>
      <form onSubmit={send}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
               placeholder="Ask about this document…" aria-label="Your question" />
        <button disabled={loading}>Ask</button>
      </form>
      <p className="disclaimer">
        Answers are AI-generated from the file you uploaded and may be inaccurate —
        always check against the original. This is a student course project; your
        uploaded text is sent to Google's Gemini API, so don't upload sensitive or
        copyrighted material you don't have the right to use.
      </p>
    </section>
  );
}
export default Chat;