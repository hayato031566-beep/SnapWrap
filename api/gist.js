export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "KEY_MISSING_IN_VERCEL" });

  // これこそが、お前の指定した 3.0 FLASH PREVIEW
  const model = "gemini-3-flash-preview";

  // indxスタイル：AIの「丁寧さ」を徹底的に排除するプロンプト
  const prompt = `
[STRICT_MODE: RAW_DATA_ONLY / ALL_CAPS / NO_FLUFF]
TASK: ${type === 'summary' ? 'EXTRACT_3_TO_5_CORE_FACTS' : 'GIVE_ONE_URGENT_COMMAND'}
INPUT: ${text}
OUTPUT:`;

  try {
    // 3.0 Previewには v1beta エンドポイントが最も安定して動く
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0, // 3.0の知能を正確に、冷徹に出力させる
          maxOutputTokens: 500
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!result) {
      return res.status(500).json({ error: "EMPTY_RESULT_FROM_3.0" });
    }

    // 全て大文字、無駄な空白を消して返す
    res.status(200).json({ result: result.trim().toUpperCase() });

  } catch (error) {
    res.status(500).json({ error: "FETCH_FAILURE" });
  }
}
