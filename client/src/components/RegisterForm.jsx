import { useState } from 'react';

function RegisterForm({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();                       // stop the page reloading
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',                 // send/receive the session cookie
      body: JSON.stringify({ email, name, password }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else onLoggedIn(data);                    // tell the app we're in
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name <input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button>Register</button>
      {error && <p role="alert">{error}</p>} {/* role=alert = screen readers announce it */}
    </form>
  );
}
export default RegisterForm;