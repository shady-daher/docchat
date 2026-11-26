import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Uploader from './components/Uploader';
import Chat from './components/Chat';

function App() {
  const [user, setUser] = useState(null);
  const [documentId, setDocumentId] = useState(null);       // the active uploaded document

  useEffect(() => {                                         // on load, ask "who am I?"
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  if (user) {                                               // LOGGED IN: upload + chat
    return (
      <main>
        <p>Hi, {user.name}! <button onClick={logout}>Log out</button></p>
        <Uploader onUploaded={setDocumentId} />
        <Chat documentId={documentId} />
      </main>
    );
  }
  return (                                                  // LOGGED OUT: the forms
    <main>
      <h2>Create an account</h2>
      <RegisterForm onLoggedIn={setUser} />
      <h2>Or log in</h2>
      <LoginForm onLoggedIn={setUser} />
    </main>
  );
}
export default App;