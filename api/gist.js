export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(200).json({ result: "ERROR: API_KEY_MISSING" });

  // 3.0から安定の 1.5 Flash に変更
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `[STRICT: RAW DATA ONLY / ALL CAPS / NO SENTENCES] ${type === 'summary' ? 'SUMMARY' : 'COMMAND'}: ${text}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });

    const data = await response.json();

    // エラーハンドリング
    if (data.error) {
      return res.status(200).json({ result: `ENGINE_BUSY: ${data.error.message}` });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "DATA_EMPTY";
    res.status(200).json({ result: aiText.trim().toUpperCase() });

  } catch (error) {
    res.status(200).json({ result: "SYSTEM_ERROR: RETRY_LATER" });
  }
}
