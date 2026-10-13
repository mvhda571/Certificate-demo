import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleTutorRequest } from './server/tutor/handler.mjs'

// Dev rejimida /api/tutor so'rovlarini Vercel funksiyasi bilan bir xil handler'ga yo'naltiradi.
function tutorApiPlugin() {
  return {
    name: 'certificate-tutor-api',
    configureServer(server) {
      server.middlewares.use('/api/tutor', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Allow', 'POST')
          res.end('Method not allowed')
          return
        }

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const controller = new AbortController()
          res.on('close', () => controller.abort())
          const request = new Request(`http://${req.headers.host || 'localhost'}/api/tutor`, {
            method: req.method,
            headers: req.headers,
            body: Buffer.concat(chunks),
            signal: controller.signal,
          })
          const response = await handleTutorRequest(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          if (!response.body) {
            res.end()
            return
          }

          const reader = response.body.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(Buffer.from(value))
          }
          res.end()
        } catch (error) {
          if (res.headersSent) {
            res.end()
            return
          }
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['GROQ_API_KEY', 'GROQ_BASE_URL', 'GROQ_MODEL', 'GROQ_SEARCH_MODEL']) {
    if (env[key] !== undefined) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tutorApiPlugin()],
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Referrer-Policy': 'no-referrer-when-downgrade',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  }
})
