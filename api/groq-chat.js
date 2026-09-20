export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY is not configured on the server" })
    return
  }

  const { userMessage, userData } = req.body || {}
  if (!userMessage) {
    res.status(400).json({ error: "userMessage is required" })
    return
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: `You are a helpful financial assistant for a student finance management application.
                        Provide concise and relevant advice based on the user's questions and their financial data.
                        Here's the user's current financial information:
                        ${JSON.stringify(userData, null, 2)}`,
          },
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!groqResponse.ok) {
      const text = await groqResponse.text()
      res.status(groqResponse.status).json({ error: `Groq API error: ${groqResponse.status}`, details: text })
      return
    }

    const data = await groqResponse.json()
    res.status(200).json({ reply: data.choices[0].message.content })
  } catch (error) {
    res.status(500).json({ error: "Failed to reach Groq API", details: error.message })
  }
}
