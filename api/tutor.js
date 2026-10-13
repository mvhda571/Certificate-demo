import { handleTutorRequest } from '../server/tutor/handler.mjs';

export default async function tutor(req, res) {
  const url = `https://${req.headers.host || 'localhost'}${req.url || '/api/tutor'}`;
  let body;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body !== undefined && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) {
      body = JSON.stringify(req.body);
    } else {
      body = req;
    }
  }

  const controller = new AbortController();
  res.on('close', () => controller.abort());
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    signal: controller.signal,
    ...(body === undefined ? {} : { body, duplex: 'half' }),
  });
  const response = await handleTutorRequest(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) {
    res.end();
    return;
  }

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    res.destroy(error);
  }
}
