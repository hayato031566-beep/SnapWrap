// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('METHOD_NOT_ALLOWED');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ result: "ERROR: KEY_MISSING" });

  // お前が指定した「3.0」のIDを直書き
  const model = "gemini-3-flash-preview";

  // indxスタイル：AIの喋りを物理的に殺すための最終命令
  const brutalistPrompt = `
    ### SYSTEM_INSTRUCTION:
    - YOU ARE A RAW DATA ENGINE.
    - NO SENTENCES. NO "IN SUMMARY". NO "THE NEXT STEP IS".
    - STYLE: BRUTALIST, DIRECT, COLD.
    - OUTPUT: RAW LABELS AND FACTS ONLY.
    - MAX 5 WORDS PER LINE.
    - ALL CAPS.

    ### TASK:
    ${type === 'summary' ? 'EXTRACT 3-5 CORE FACTS' : 'GIVE ONE URGENT COMMAND (VERB FIRST)'}

    ### INPUT_DATA:
    ${text}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: brutalistPrompt }]
        }],
        generationConfig: {
          temperature: 0.1, // 3.0の知能を正確に引き出す
          maxOutputTokens: 300,
        }
      })
    });

    const data = await response.json();

    // API側からエラーが返ってきた場合の詳細表示
    if (data.error) {
      return res.status(500).json({ result: `API_ERROR: ${data.error.message}` });
    }

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ result: "ERROR: EMPTY_CANDIDATES" });
    }

    const result = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: result.trim() });

  } catch (error) {
    // 通信エラーなどの場合
    res.status(500).json({ result: `FETCH_ERROR: ${error.message}` });
  }
}
