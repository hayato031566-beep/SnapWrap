// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "API KEY MISSING" });

  // 1.5ではなく、お前が指定した「3.0（Gemini 3 Flash Preview）」
  const model = "gemini-3-flash-preview";

  // indx.com風：文章を禁止し、剥き出しのデータだけを出力させる
  const systemPrompt = `
    - You are a minimalist data extraction engine (Gemini 3.0).
    - NO sentences. NO intro/outro. NO "In summary" or "Next step".
    - Raw, cold facts only.
    - Style: Brutalist, direct, no-fluff.
    - Format: Raw labels.`;

  const userPrompt = type === 'summary' 
    ? `${systemPrompt}\n\nExtract the core 3-5 facts from this text. Max 5 words per line. Be blunt: ${text}`
    : `${systemPrompt}\n\nGive me ONE urgent command from this text. Max 5 words. Verb first. Be a boss: ${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1, // 3.0の知能を無駄遣いせず、正確に。
          maxOutputTokens: 500,
        }
      })
    });

    const data = await response.json();
    
    // 3.0のレスポンス階層。ここでundefinedが出ないようチェック
    if (!data.candidates || !data.candidates[0]) {
      throw new Error("EMPTY_RESPONSE_FROM_3.0");
    }

    const result = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: result.trim() });

  } catch (error) {
    res.status(500).json({ result: "ENGINE_ERROR_3.0" });
  }
}
