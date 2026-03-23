export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Vercelの環境変数に GEMINI_API_KEY が入っていないぞ。" });

  const model = "gemini-3-flash-preview";
  // 3.0の知能を縛り付け、AI語を殺すプロンプト
  const prompt = `[SYSTEM: RAW DATA ONLY / NO SENTENCES / ALL CAPS]\n\nTASK: ${type === 'summary' ? 'EXTRACT 3 CORE FACTS' : 'GIVE ONE COMMAND'}\nINPUT: ${text}\nOUTPUT:`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      })
    });

    const data = await response.json();

    // 原因1: API側からの拒否（キー間違い等）をキャッチ
    if (data.error) {
      return res.status(500).json({ error: `GOOGLE_API_ERROR: ${data.error.message}` });
    }

    // 原因2: レスポンス階層の安全な取得
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      // 安全に「何が起きたか」を返す
      return res.status(500).json({ error: "AIからの返答が空だ。安全フィルターに引っかかった可能性がある。" });
    }

    res.status(200).json({ result: result.trim().toUpperCase() });

  } catch (error) {
    res.status(500).json({ error: `FETCH_FAILURE: ${error.message}` });
  }
}
