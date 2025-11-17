import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    let body = req.body;

    // معالجة الجسم إذا جاء كنص
    if (!body || typeof body !== "object") {
      try {
        body = JSON.parse(req.body || "{}");
      } catch {
        body = {};
      }
    }

    const { topic, count, qtype } = body;

    if (!topic) {
      return res.status(400).json({ error: "Missing topic" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const typeText =
      qtype === "mcq"
        ? "أسئلة اختيار من متعدد فقط"
        : qtype === "tf"
        ? "أسئلة صح أو خطأ فقط"
        : qtype === "short"
        ? "أسئلة قصيرة فقط (إجابة بجملة أو كلمتين)"
        : "مزيج من الأنواع السابقة (اختيار من متعدد، صح أو خطأ، أسئلة قصيرة)";

    const prompt = `
أنت خبير تربوي عربي محترف. المطلوب: توليد أسئلة تربوية حقيقية حول موضوع: "${topic}".

الشروط:
- عدد الأسئلة المطلوب: ${count}.
- نوع الأسئلة: ${typeText}.
- لا تذكر عنوان الموضوع نفسه داخل نص السؤال.
- الأسئلة يجب أن تكون مرتبطة بالمحتوى العلمي للموضوع، وليست أسئلة عامة.
- تجنب التكرار في معنى السؤال.
- لكل سؤال إجابة نموذجية مختصرة وواضحة.
- إذا كان السؤال اختيار من متعدد، استخدم 4 بدائل فقط.

أخرج النتيجة بصيغة JSON ككائن بهذا الشكل فقط:

{
  "questions": [
    {
      "type": "mcq" أو "tf" أو "short",
      "question": "نص السؤال هنا",
      "options": ["الخيار الأول","الثاني","الثالث","الرابع"]  (اجعلها مصفوفة فارغة [] في الأسئلة غير الاختيارية),
      "answer": "نص الإجابة النموذجية هنا"
    }
  ]
}
    `.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an expert Arabic educational question generator." },
        { role: "user", content: prompt }
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: String(err.message),
    });
  }
}
