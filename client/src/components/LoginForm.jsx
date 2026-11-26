import { useState } from 'react';

function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();                       // stop the page reloading
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',                 // send/receive the session cookie
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else onLoggedIn(data);                    // tell the app we're in
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Email <input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button>Log in</button>
      {error && <p role="alert">{error}</p>} {/* role=alert = screen readers announce it */}
    </form>
  );
}
export default LoginForm;