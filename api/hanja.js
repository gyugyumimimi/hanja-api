export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { character } = req.body;

  try {
const prompt = `한자 ${character}에 대해 아래 JSON 형식으로 설명해줘:

{
  "pinyin": "",
  "meaning_ko": "",
  "composition": "",
  "words": [
    {"word": "", "pinyin": "", "meaning": ""}
  ],
  "examples": [
    {"sentence": "", "pinyin": ""}
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.3",
        input: prompt
      }),
    });

    const data = await response.json();
    const text = data.output?.[0]?.content?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: "API 실패" });
  }
}
