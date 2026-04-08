export default async function handler(req, res) {

  // 🔥 CORSㅇ
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🔥 preflight 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔥 POST만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { character } = req.body;

  try {
const prompt = `
한자 "${character}"를 분석해서 반드시 모든 값을 채워 JSON으로만 출력해.

조건:
- pinyin: 반드시 실제 발음 작성
- meaning_ko: 반드시 한국어 뜻 작성
- composition: 부수와 의미 설명 반드시 작성
- words: 최소 3개 단어 작성
- examples: 최소 2개 예문 작성

절대 빈 값 금지.
설명 없이 JSON만 출력.

형식:
{
  "pinyin": "",
  "meaning_ko": "",
  "composition": "",
  "words": [
    { "word": "", "pinyin": "", "meaning": "" }
  ],
  "examples": [
    { "sentence": "", "pinyin": "" }
  ]
}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
     body: JSON.stringify({
  model: "gpt-5.3",
  input: prompt,
  response_format: {
    type: "json_object"
  }
})
    });

    const data = await response.json();
const text =
  data.output_text ||
  data.output?.[0]?.content?.[0]?.text ||
  "";

let parsed;

try {
  const cleanText = (text || "").replace(/```json|```/g, "").trim();
  parsed = JSON.parse(cleanText);
} catch (e) {
  console.log("❌ JSON parse 실패:", text);
  parsed = {
    pinyin: "데이터 없음",
    meaning_ko: "데이터 없음",
    composition: "데이터 없음",
    words: [],
    examples: []
  };
}

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      detail: error.message
    });
  }
}
