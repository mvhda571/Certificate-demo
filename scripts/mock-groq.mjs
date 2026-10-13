import { createServer } from 'node:http';

const port = Number(process.env.MOCK_GROQ_PORT || 4010);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Groq'ning gpt-oss + browser_search javobiga o'xshash executed_tools hodisalari.
const browserTools = [
  {
    name: 'browser.search', index: 0, type: 'browser_search', arguments: '{"query":"mock"}',
    output: 'L0: \nL1: URL: https://exa.ai/search?q=mock\nL2: # Search Results',
    search_results: { results: [{ title: 'Mock taʼlim manbasi', url: 'https://example.com/education' }] },
  },
  {
    name: 'browser.open', index: 1, type: 'browser.open', arguments: '{"cursor":0,"id":0}',
    output: 'L0: \nL1: URL: https://example.com/education\nL2: Mock taʼlim manbasi\nL3: Narx: 100 so‘m',
    search_results: { results: null },
  },
];

createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/openai/v1/chat/completions') {
    response.writeHead(404).end('Not found');
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const usesBrowser = payload.tools?.some((tool) => tool.type === 'browser_search');
  const failsSearch = process.env.MOCK_FAIL_SEARCH === '1' && (usesBrowser || payload.model.startsWith('groq/compound'));
  if (process.env.MOCK_ERROR === '1' || failsSearch) {
    response.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Mock upstream error' }));
    return;
  }

  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (delta) => response.write(`data: ${JSON.stringify({ choices: [{ delta }] })}\n\n`);
  if (usesBrowser) {
    for (const tool of browserTools) {
      send({ executed_tools: [tool] });
      await sleep(150);
    }
  }
  const delay = Number(process.env.MOCK_DELAY_MS || 120);
  const parts = [
    'Salom! Bu **mock Groq** javobi. ',
    'Formula: \\(x^2-5x+6=0\\), ildizlar:\n\n\\[ x_1=2,\\; x_2=3 \\]\n\n',
    usesBrowser ? 'Manba bo‘yicha narx 100 so‘m【1†L3】.\n\n' : '',
    `Tanlangan model: ${payload.model}.`,
  ].filter(Boolean);
  for (const text of parts) {
    send({ content: text });
    await sleep(delay);
  }
  response.end('data: [DONE]\n\n');
}).listen(port, '127.0.0.1', () => {
  console.log(`Mock Groq server listening at http://127.0.0.1:${port}/openai/v1`);
});
