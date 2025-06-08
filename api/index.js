import http from 'http';

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message: 'API is running' }));
});

server.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
