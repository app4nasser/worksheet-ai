import OpenAI from "openai";

export default async function handler(req, res) {
  // السماح بالوصول من Netlify (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // السماح لطلبات OPTIONS (مهم جداً)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let body = req.body;

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

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const typeText =
      qtype === "mcq"
        ? "أسئلة اختيار من متعدد فقط"
        : qtype === "tf"
        ? "أسئلة صح أو خطأ فقط"
        : qtype === "short"
        ? "أسئلة قصيرة فقط"
        : "مزيج من الأنواع السابقة";

    const prompt = `
أنت خبير تربوي عربي محترف.
المطلوب إنشاء ${count} سؤالاً حول موضوع "${topic}"، من نوع: ${typeText}.
لا تستخدم عنوان الموضوع داخل الأسئلة.
اكتب كل سؤال مع الإجابة بشكل دقيق وتربوي.
صيغة JSON فقط كالتالي:

{
 "questions":[
   {
     "type":"نوع السؤال",
     "question":"النص",
     "options":["","","",""],
     "answer":"الإجابة"
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
      details: err.message
    });
  }
}
