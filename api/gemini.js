const apiKey = process.env.OPENROUTER_API_KEY
const model = process.env.OPENROUTER_MODEL || 'openrouter/free'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt, systemInstruction = '', history = [] } = req.body || {}

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' })
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' })
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
          content: msg.content
        })
      }
    }

    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hosa-plus.vercel.app',
        'X-OpenRouter-Title': 'HOSA Plus'
      },
      body: JSON.stringify({
        model,
        messages
      })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || 'OpenRouter request failed'
      })
    }

    const text = data?.choices?.[0]?.message?.content
    return res.status(200).json({ text: text || '' })
  } catch (error) {
    console.error('Error in OpenRouter API route:', error)
    return res.status(500).json({ error: error.message || 'OpenRouter request failed' })
  }
}
