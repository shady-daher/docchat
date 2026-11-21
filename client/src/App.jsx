import { useState, useEffect } from 'react';
import ProjectCard from './components/ProjectCard';

function App() {
  const [dark, setDark] = useState(false);
  const [serverMsg, setServerMsg] = useState('loading...');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setServerMsg(data.message));
  }, []);

  return (
    <main className={dark ? 'dark' : 'light'}>
      <header>
        <h1>My Portfolio</h1>
        <button onClick={() => setDark(!dark)}>
          Toggle theme
        </button>
      </header>

      <p>Server says: {serverMsg}</p>

      <ProjectCard
        title="Team Project"
        description="A Flask web app."
      />

      <ProjectCard
        title="DocChat"
        description="React + AI you can ask about any document."
      />
    </main>
  );
}

export default App;