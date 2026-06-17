import { GoogleGenerativeAI } from '@google/generative-ai'

// API key must be set in your .env file as VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(apiKey)

/**
 * Sends a message to the Gemini API, including full multi-turn conversation history.
 * Uses generateContent directly with a contents array to avoid startChat history constraints.
 * @param {string} prompt - The current user message.
 * @param {string} systemInstruction - Instruction defining model behavior.
 * @param {Array<{role: string, content: string}>} history - Previous messages (role: 'user'|'model').
 */
export async function askGemini(prompt, systemInstruction = '', history = []) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      ...(systemInstruction ? { systemInstruction } : {})
    })

    // Build the full contents array: prior history + new user message
    const contents = []

    for (const msg of history) {
      // Only include user/model turns; skip any that don't map cleanly
      const role = msg.role === 'user' ? 'user' : 'model'
      contents.push({ role, parts: [{ text: msg.content }] })
    }

    // Append the current user prompt
    contents.push({ role: 'user', parts: [{ text: prompt }] })

    const result = await model.generateContent({ contents })
    return result.response.text()

  } catch (error) {
    console.error('Error in askGemini:', error)
    throw error
  }
}
