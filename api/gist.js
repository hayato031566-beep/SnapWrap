// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "ERROR: KEY_MISSING" });

  // 君が指定した最強エンジン：Gemini 3 Flash Preview
  const model = "gemini-3-flash-preview";

  // indx.com風の指示をプロンプトの先頭に固定
  const prompt = `
[SYSTEM: RAW DATA ENGINE / GEMINI 3.0 / NO SENTENCES / NO FLUFF / ALL CAPS]

TASK: ${type === 'summary' ? 'EXTRACT 3-5 CORE FACTS' : 'GIVE ONE URGENT COMMAND'}
INPUT: ${text}

OUTPUT:`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 300,
        }
      })
    });

    const data = await response.json();

    // APIエラーのハンドリング
    if (data.error) {
      return res.status(500).json({ result: `API_ERROR: ${data.error.message}` });
    }

    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ result: "ERROR: EMPTY_RESPONSE" });
    }

    const result = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: result.trim().toUpperCase() });

  } catch (error) {
    res.status(500).json({ result: "FETCH_FAILURE" });
  }
}
