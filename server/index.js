import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is alive'
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});