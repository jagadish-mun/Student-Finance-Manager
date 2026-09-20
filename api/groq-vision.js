export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const apiKey = process.env.GROQ_VISION_API_KEY || process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_VISION_API_KEY is not configured on the server" })
    return
  }

  const { base64Image } = req.body || {}
  if (!base64Image) {
    res.status(400).json({ error: "base64Image is required" })
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
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are a financial assistant. Extract the amount, date, and category from this check image. Respond with a JSON object with fields: amount (number), date (YYYY-MM-DD), and category (string, default to 'Check Deposit').",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 150,
        top_p: 1,
        stream: false,
      }),
    })

    if (!groqResponse.ok) {
      const text = await groqResponse.text()
      res.status(groqResponse.status).json({ error: `Groq API error: ${groqResponse.status}`, details: text })
      return
    }

    const data = await groqResponse.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: "Failed to reach Groq Vision API", details: error.message })
  }
}
