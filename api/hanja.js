export default async function handler(req, res) {
  // 🔥 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🔥 preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔥 POST only
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { character } = req.body;

  try {
    const prompt = `
한자 "${character}"를 분석해서 반드시 모든 값을 채워 JSON으로만 출력해.

조건:
- pinyin: 실제 발음
- meaning_ko: 한국어 뜻
- composition: 부수 + 의미 설명
- words: 최소 3개
- examples: 최소 2개
- 절대 빈 값 금지

JSON 형식:
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
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.3",
        input: prompt,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    // 🔥 안전한 텍스트 추출 (핵심)
    let text = "";

    if (data.output_text) {
      text = data.output_text;
    } else if (data.output?.[0]?.content) {
      const found = data.output[0].content.find(
        (c) => c.type === "output_text"
      );
      if (found) text = found.text;
    }

    // 🔥 fallback (디버깅용)
    if (!text) {
      console.log("⚠️ GPT RAW:", data);
      return res.status(200).json({
        pinyin: "응답 없음",
        meaning_ko: "응답 없음",
        composition: "응답 없음",
        words: [],
        examples: [],
      });
    }

    // 🔥 JSON 파싱
    let parsed;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      console.log("❌ JSON parse 실패:", text);
      parsed = {
        pinyin: "파싱 실패",
        meaning_ko: "파싱 실패",
        composition: "파싱 실패",
        words: [],
        examples: [],
      };
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("🔥 서버 에러:", error);
    return res.status(500).json({
      error: "Server error",
      detail: error.message,
    });
  }
}
