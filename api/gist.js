// api/gist.js
export default async function handler(req, res) {
  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = type === 'summary' 
    ? `Extract and summarize the key points of this text in bullet points: ${text}`
    : `Read this text and provide exactly ONE concrete 'Next Action' the user should take: ${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from Gemini" });
  }
}
