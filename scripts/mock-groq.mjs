import { createServer } from 'node:http';

const port = Number(process.env.MOCK_GROQ_PORT || 4010);

createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/openai/v1/chat/completions') {
    response.writeHead(404).end('Not found');
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const failsSearch = process.env.MOCK_FAIL_COMPOUND === '1' && payload.model === 'groq/compound';
  if (process.env.MOCK_ERROR === '1' || failsSearch) {
    response.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Mock upstream error' }));
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const parts = [
    'Salom! ',
    'Bu mock Groq javobi. ',
    `Tanlangan model: ${payload.model}.`,
  ];
  for (const [index, text] of parts.entries()) {
    const delta = { content: text };
    if (index === parts.length - 1 && payload.model === 'groq/compound') {
      delta.executed_tools = [{
        type: 'search',
        results: [{ title: 'Mock taʼlim manbasi', url: 'https://example.com/education' }],
      }];
    }
    response.write(`data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`);
  }
  response.end('data: [DONE]\n\n');
}).listen(port, '127.0.0.1', () => {
  console.log(`Mock Groq server listening at http://127.0.0.1:${port}/openai/v1`);
});
