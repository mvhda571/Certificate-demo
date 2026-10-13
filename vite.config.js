import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleTutorRequest } from './server/tutor/handler.mjs'
import { handleTranscribeRequest } from './server/tutor/transcribe.mjs'

const tutorApiRoutes = {
  '/api/tutor': handleTutorRequest,
  '/api/transcribe': handleTranscribeRequest,
}

// Dev rejimida /api/tutor va /api/transcribe so'rovlarini Vercel funksiyalari bilan bir xil handler'larga yo'naltiradi.
function tutorApiPlugin() {
  return {
    name: 'certificate-tutor-api',
    configureServer(server) {
      for (const [route, handle] of Object.entries(tutorApiRoutes)) server.middlewares.use(route, async (req, res, next) => {
        // GET faqat /api/tutor uchun (kunlik limit holati).
        const allowGet = route === '/api/tutor'
        if (req.method !== 'POST' && !(allowGet && req.method === 'GET')) {
          res.statusCode = 405
          res.setHeader('Allow', allowGet ? 'GET, POST' : 'POST')
          res.end('Method not allowed')
          return
        }

        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const controller = new AbortController()
          res.on('close', () => controller.abort())
          const request = new Request(`http://${req.headers.host || 'localhost'}${route}`, {
            method: req.method,
            headers: req.headers,
            ...(req.method === 'GET' ? {} : { body: Buffer.concat(chunks) }),
            signal: controller.signal,
          })
          const response = await handle(request)
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
  const serverKeys = [
    'GROQ_API_KEY', 'GROQ_BASE_URL', 'GROQ_MODEL', 'GROQ_SEARCH_MODEL', 'GROQ_VISION_MODEL', 'GROQ_TRANSCRIBE_MODEL',
    'TUTOR_DAILY_LIMIT', 'TUTOR_UNLIMITED_EMAILS', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
    'GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID', 'GOOGLE_CERTS_URL',
  ]
  for (const key of serverKeys) {
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
