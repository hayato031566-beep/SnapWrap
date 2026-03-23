export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "KEY_MISSING" });

  // 3.0 Preview モデル
  const model = "gemini-3-flash-preview";

  const prompt = `
[RULE: RAW DATA ONLY / NO SENTENCES / ALL CAPS / BE BLUNT]
TASK: ${type === 'summary' ? 'EXTRACT 3-5 CORE FACTS' : 'GIVE ONE COMMAND (VERB FIRST)'}
INPUT: ${text}
OUTPUT:`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      return res.status(500).json({ error: "EMPTY_RESULT" });
    }

    res.status(200).json({ result: result.trim().toUpperCase() });

  } catch (error) {
    res.status(500).json({ error: "SERVER_CRASH" });
  }
}
