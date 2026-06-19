/**
 * Sends a message to the server-side Gemini proxy.
 * @param {string} prompt - The user prompt/message.
 * @param {string} systemInstruction - Instruction defining model behavior.
 * @param {Array<{role: string, content: string}>} history - Previous messages.
 */
export async function askGemini(prompt, systemInstruction = '', history = []) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt, systemInstruction, history })
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Gemini request failed')
  }

  return data.text
}
