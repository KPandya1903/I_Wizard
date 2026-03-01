const API_URL = 'https://api.featherless.ai/v1/chat/completions'
const API_KEY = import.meta.env.VITE_FEATHERLESS_API_KEY
const MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct'

export async function chat(messages) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  })
  if (!res.ok) {
    throw new Error(`Featherless API error: ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}
