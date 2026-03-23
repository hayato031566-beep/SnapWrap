// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "Vercelの環境変数 GEMINI_API_KEY が未設定だぞ。" });

  // Gemini 3 Flash の知能を活かすプロンプト
  const prompt = type === 'summary' 
    ? `Gemini 3 reasoning: Extract key points of this text in bullet points. Be concise and accurate: ${text}`
    : `Gemini 3 reasoning: Based on this text, provide exactly ONE concrete 'Next Action' for the user: ${text}`;

  try {
    // モデル名を 'gemini-3-flash-preview' に変更
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2, // 精度重視（3.0の知能を活かす）
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();

    // 階層を正確に指定して undefined を防止
    if (!data.candidates || !data.candidates[0]) {
        throw new Error("Gemini 3 からの応答が空だ。APIキーかクォータを確認しろ。");
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: aiResponse });

  } catch (error) {
    res.status(500).json({ result: "AI 3.0 Error: " + error.message });
  }
}
