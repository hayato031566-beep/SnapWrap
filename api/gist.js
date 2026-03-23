// api/gist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { text, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1.5 Flash（安定版）を使用
  const model = "gemini-1.5-flash";

  // 不自然な言葉（AI語）を禁止する超具体的な指示
  const systemPrompt = type === 'summary' 
    ? `
      Tell me the core points of the text below. 
      - STRICT RULES: 
        1. NO "In summary," "Here are the points," or "The text discusses..." 
        2. NO formal "AI-speak." 
        3. Use plain, everyday English. 
        4. Just state the facts directly. 
      Text: ${text}`
    : `
      Based on the text, what should I do? 
      - Give me exactly ONE concrete instruction. 
      - Maximum 10 words. 
      - NO "You should..." or "It is recommended to..." 
      - Just the verb and the object (e.g., "Call the bank" or "Ignore the hype").
      Text: ${text}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();
    const result = data.candidates[0].content.parts[0].text;
    
    // 前後の余計な空白や改行を削って返す
    res.status(200).json({ result: result.trim() });
  } catch (error) {
    res.status(500).json({ result: "Error" });
  }
}
