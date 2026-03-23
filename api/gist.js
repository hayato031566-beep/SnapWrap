// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "API KEY MISSING" });

  // 1.5は一切使わない。お前が指定した 3.0 Preview 固定
  const model = "gemini-3-flash-preview";

  // 3.0の「system_instruction」を使い、AIの人格を完全に殺す
  const systemInstruction = `
    - ROLE: MINIMAL DATA ENGINE (GEMINI 3.0).
    - STYLE: BRUTALIST, COLD, RAW.
    - NO sentences. NO "In summary". NO "The text says".
    - NO punctuation at ends of lines.
    - OUTPUT ONLY RAW LABELS AND FACTS.
    - BE BLUNT.`;

  const userPrompt = type === 'summary' 
    ? `EXTRACT 3-5 CORE FACTS FROM THIS TEXT. 5 WORDS MAX PER LINE:\n\n${text}`
    : `GIVE ONE URGENT COMMAND FROM THIS TEXT. 5 WORDS MAX. VERB FIRST:\n\n${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 3.0専用のシステム命令枠を使用（これで「不自然なAI語」を封じる）
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        generationConfig: {
          temperature: 0.1, // 遊びを排除して正確に
          maxOutputTokens: 200,
        }
      })
    });

    const data = await response.json();

    // エラーハンドリング：API側でエラーが出た場合
    if (data.error) {
      throw new Error(data.error.message || "API_ERROR");
    }

    if (!data.candidates || !data.candidates[0]) {
      throw new Error("EMPTY_RESPONSE");
    }

    const result = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: result.trim() });

  } catch (error) {
    // Vercelのログで原因がわかるように詳細を返す
    res.status(500).json({ result: `ENGINE_FAILURE: ${error.message}` });
  }
}
