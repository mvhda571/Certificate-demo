// Vercel Node funksiyasi (req, res) ↔ Web Request/Response handler'i o'rtasidagi ko'prik.
export function toVercelHandler(handle, path) {
  return async function vercelHandler(req, res) {
    const url = `https://${req.headers.host || 'localhost'}${req.url || path}`;
    let body;

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // JSON'ni Vercel oldindan o'qib qo'yishi mumkin; multipart (audio) esa oqim sifatida uzatiladi.
      const isJson = /application\/json/i.test(req.headers['content-type'] || '');
      if (isJson && req.body !== undefined && req.body !== null) {
        body = typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
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
    const response = await handle(request);
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
  };
}
