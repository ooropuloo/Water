const http = require('http');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/graph.json'), 'utf8'));

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200);
    res.end(content);
  });
}

function handleGraphQL(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { query } = JSON.parse(body);
      let result = {};
      if (/nodes\s*\{/.test(query)) result.nodes = data.nodes;
      if (/edges\s*\{/.test(query)) result.edges = data.edges;
      const nodeMatch = /node\(id:\s*"(\w+)"\)/.exec(query);
      if (nodeMatch) {
        result.node = data.nodes.find(n => n.id === nodeMatch[1]) || null;
      }
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ data: result }));
    } catch (e) {
      res.writeHead(400);
      res.end('Invalid request');
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/graph') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(data));
  } else if (req.method === 'POST' && req.url === '/graphql') {
    handleGraphQL(req, res);
  } else if (req.method === 'GET' && (req.url === '/' || req.url === '/graph.html')) {
    serveStatic(path.join(__dirname, 'public/graph.html'), res);
  } else if (req.method === 'GET' && req.url === '/graph.js') {
    serveStatic(path.join(__dirname, 'public/graph.js'), res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4000, () => {
  console.log('Server running at http://localhost:4000');
});
