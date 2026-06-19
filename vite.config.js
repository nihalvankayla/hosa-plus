import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function openRouterApi(env) {
  return {
    name: 'openrouter-api',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
          }

          const { prompt, systemInstruction = '', history = [] } = JSON.parse(body || '{}')
          const apiKey = env.OPENROUTER_API_KEY
          const model = env.OPENROUTER_MODEL || 'openrouter/free'

          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing OPENROUTER_API_KEY' }))
            return
          }

          if (!prompt || typeof prompt !== 'string') {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing prompt' }))
            return
          }

          const messages = []

          if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction })
          }

          if (Array.isArray(history)) {
            for (const msg of history) {
              if (!msg?.content) continue
              messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
              })
            }
          }

          messages.push({ role: 'user', content: prompt })

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5173',
              'X-OpenRouter-Title': 'HOSA Plus',
            },
            body: JSON.stringify({ model, messages }),
          })

          const data = await response.json().catch(() => ({}))
          res.statusCode = response.status
          res.setHeader('Content-Type', 'application/json')

          if (!response.ok) {
            res.end(JSON.stringify({ error: data?.error?.message || data?.message || 'OpenRouter request failed' }))
            return
          }

          res.end(JSON.stringify({ text: data?.choices?.[0]?.message?.content || '' }))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message || 'OpenRouter request failed' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [openRouterApi(env), react(), tailwindcss()],
  }
})
