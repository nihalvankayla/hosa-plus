import { GoogleGenerativeAI } from '@google/generative-ai'

// API key must be set in your .env file as VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(apiKey)

/**
 * Sends a message to the Gemini API with context, optional chat history, and system instructions.
 * @param {string} prompt - The user prompt/message.
 * @param {string} systemInstruction - Instruction defining model behavior.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history - Previous messages.
 */
export async function askGemini(prompt, systemInstruction = '', history = []) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      ...(systemInstruction ? { systemInstruction } : {})
    })

    // If we have history, start a chat session. Otherwise, generate content directly.
    if (history && history.length > 0) {
      // Find the first index where the role is 'user' to ensure it starts with a 'user' message
      const firstUserIndex = history.findIndex(msg => msg.role === 'user')
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : []

      const chat = model.startChat({
        history: validHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      })
      const result = await chat.sendMessage(prompt)
      return result.response.text()
    } else {
      const result = await model.generateContent(prompt)
      return result.response.text()
    }
  } catch (error) {
    console.error('Error in askGemini:', error)
    throw error
  }
}
