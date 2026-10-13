import { createServer } from 'node:http';

// Groq API taqlidi: chat (oqim, browser_search, rasm, IELTS Speaking) va Whisper transkripsiyasi.
// Muhit: MOCK_GROQ_PORT, MOCK_DELAY_MS, MOCK_ERROR, MOCK_FAIL_SEARCH, MOCK_FAIL_VISION, MOCK_FAIL_TRANSCRIBE.
const port = Number(process.env.MOCK_GROQ_PORT || 4010);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (response, status, payload) => response
  .writeHead(status, { 'Content-Type': 'application/json' })
  .end(JSON.stringify(payload));

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
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks);

  if (request.method === 'POST' && request.url === '/openai/v1/audio/transcriptions') {
    if (process.env.MOCK_FAIL_TRANSCRIBE === '1') {
      json(response, 503, { error: 'Mock transcription error' });
      return;
    }
    const language = raw.toString('latin1').match(/name="language"\r\n\r\n(\w+)/)?.[1] || 'auto';
    await sleep(300);
    json(response, 200, { text: `Mock transcription (${language}): I like reading books in the evening.` });
    return;
  }
  if (request.method !== 'POST' || request.url !== '/openai/v1/chat/completions') {
    response.writeHead(404).end('Not found');
    return;
  }

  const payload = JSON.parse(raw.toString('utf8'));
  const usesBrowser = payload.tools?.some((tool) => tool.type === 'browser_search');
  const imageCount = payload.messages
    .flatMap((message) => (Array.isArray(message.content) ? message.content : []))
    .filter((part) => part.type === 'image_url').length;
  const speaking = String(payload.messages[0]?.content || '').includes('IELTS Speaking examiner');
  const failsSearch = process.env.MOCK_FAIL_SEARCH === '1' && (usesBrowser || payload.model.startsWith('groq/compound'));
  if (imageCount && process.env.MOCK_FAIL_VISION === '1') {
    json(response, 404, { error: { message: `The model ${payload.model} does not exist`, code: 'model_not_found' } });
    return;
  }
  if (process.env.MOCK_ERROR === '1' || failsSearch) {
    json(response, 503, { error: 'Mock upstream error' });
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
  let parts;
  if (imageCount) {
    parts = [`Mock vision: ${imageCount} ta rasm ko‘rildi. `, `Model: ${payload.model}.`];
  } else if (speaking) {
    parts = [
      '### Estimated band\n- Fluency and Coherence: 6.0\n- Lexical Resource: 6.0\n- Grammatical Range and Accuracy: 5.5\n\n',
      '**Part 1 — Question 2**\n\nWhat do you usually do at weekends?',
    ];
  } else {
    parts = [
      'Salom! Bu **mock Groq** javobi. ',
      'Formula: \\(x^2-5x+6=0\\), ildizlar:\n\n\\[ x_1=2,\\; x_2=3 \\]\n\n',
      usesBrowser ? 'Manba bo‘yicha narx 100 so‘m【1†L3】.\n\n' : '',
      `Tanlangan model: ${payload.model}.`,
    ].filter(Boolean);
  }
  for (const text of parts) {
    send({ content: text });
    await sleep(delay);
  }
  response.end('data: [DONE]\n\n');
}).listen(port, '127.0.0.1', () => {
  console.log(`Mock Groq server listening at http://127.0.0.1:${port}/openai/v1`);
});
