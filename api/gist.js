export default async function handler(req, res) {
  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(200).json({ result: "ERROR: APIキーがVercelに設定されてないぞ。" });

  const model = "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // indxスタイル：大文字、剥き出しのデータ
  const prompt = `[RAW_DATA_ONLY/ALL_CAPS] ${type === 'summary' ? 'SUMMARY' : 'ACTION'}: ${text}`;

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

    // 階層を慎重に辿り、データがあればそれを、なければエラー理由を "result" に入れる
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text 
                || data.error?.message 
                || "UNKNOWN_ERROR";

    res.status(200).json({ result: aiText.trim().toUpperCase() });

  } catch (error) {
    res.status(200).json({ result: "FETCH_ERROR: 通信失敗。" });
  }
}
