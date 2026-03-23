// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "API Key is missing" });

  // Gemini 3 Flash 向けの高度な指示
  const prompt = type === 'summary' 
    ? `Analyze this text with Gemini 3 reasoning and extract key points in bullet points. Focus on accuracy and speed: ${text}`
    : `Using Gemini 3 logic, provide exactly ONE concrete 'Next Action' for the user based on this content: ${text}`;

  try {
    // モデルIDを 'gemini-3-flash' に変更
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // 3.0の性能を引き出す設定
        generationConfig: {
          temperature: 0.2, // 精度重視
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    // 階層を正確に指定（3.0でも基本構造は同じ）
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    res.status(200).json({ result: aiResponse });
  } catch (error) {
    res.status(500).json({ result: "AI 3.0 Error. Check API Key or Vercel Settings." });
  }
}
