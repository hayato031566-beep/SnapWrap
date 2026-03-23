export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "ERROR: KEY_MISSING" });

  // お前が選んだ「3.0」の正体
  const model = "gemini-3-flash-preview";

  // 「不自然な言葉」を物理的に出力させない極限の指示
  const systemPrompt = `
    - ROLE: RAW DATA EXTRACTION ENGINE.
    - NO SENTENCES. NO "IN SUMMARY". NO "THE NEXT STEP IS".
    - NO PUNCTUATION AT THE END OF LINES.
    - STYLE: BRUTALIST, DIRECT, COLD.
    - OUTPUT: LABELS AND FACTS ONLY.`;

  const userPrompt = type === 'summary' 
    ? `${systemPrompt}\n\nEXTRACT 3-5 CORE FACTS FROM THIS TEXT. 5 WORDS MAX PER LINE:\n\n${text}`
    : `${systemPrompt}\n\nONE URGENT COMMAND FROM THIS TEXT. 5 WORDS MAX. VERB FIRST:\n\n${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0, // 遊びを排除して3.0の知能を正確に叩き出す
          maxOutputTokens: 256,
        }
      })
    });

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      throw new Error("EMPTY_DATA");
    }

    const result = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: result.trim().toUpperCase() }); // 全て大文字で返す

  } catch (error) {
    res.status(500).json({ result: "ENGINE_ERROR_3.0" });
  }
}
