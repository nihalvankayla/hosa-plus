import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })
  }

  try {
    const { prompt, systemInstruction = '', history = [] } = req.body || {}

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      ...(systemInstruction ? { systemInstruction } : {})
    })

    if (Array.isArray(history) && history.length > 0) {
      const firstUserIndex = history.findIndex((msg) => msg.role === 'user')
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : []

      const chat = model.startChat({
        history: validHistory.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content || '' }]
        }))
      })
      const result = await chat.sendMessage(prompt)
      return res.status(200).json({ text: result.response.text() })
    }

    const result = await model.generateContent(prompt)
    return res.status(200).json({ text: result.response.text() })
  } catch (error) {
    console.error('Error in Gemini API route:', error)
    return res.status(500).json({ error: error.message || 'Gemini request failed' })
  }
}
