import { useState } from 'react';

function Uploader({ onUploaded }) {
  const [status, setStatus] = useState('');
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Reading your file…');
    const form = new FormData();              // multipart upload
    form.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST', credentials: 'include', body: form,   // no Content-Type: the browser sets it
    });
    const data = await res.json();
    if (data.error) setStatus(data.error);
    else { setStatus(`Loaded "${data.title}" (${data.chars} characters).`); onUploaded(data.id); }
  }
  return (
    <div>
      <label>Upload a document (PDF or .txt):{' '}
        <input type="file" accept=".pdf,.txt,.md" onChange={handleFile} />
      </label>
      <p role="status">{status}</p>
    </div>
  );
}
export default Uploader;