import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    // Parse body depending on method
    let body = req.body;

    if (!body || typeof body !== "object") {
      try {
        body = JSON.parse(req.body || "{}");
      } catch {
        body = {};
      }
    }

    const { topic, count } = body;

    if (!topic) {
      return res.status(400).json({ error: "Missing topic" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
أنت خبير تربوي محترف. المطلوب: توليد أسئلة تربوية حقيقية عن موضوع "${topic}".

المعايير:
- عدم استخدام العنوان داخل نص السؤال.
- يجب أن تكون الأسئلة مباشرة وغير مكررة.
- عدد الأسئلة: ${count}.
- الأنواع: اختيار – صح/خطأ – قصيرة – تحليل – تطبيق – مقارنة.
- تضمين إجابة نموذجية لكل سؤال.

أعدها بصيغة JSON فقط:
[
  {
    "type": "",
    "question": "",
    "options": [],
    "answer": ""
  }
]
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert Arabic educational question generator."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const data = JSON.parse(response.choices[0].message.content);

    return res.status(200).json(data);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: String(err.message),
    });
  }
}
