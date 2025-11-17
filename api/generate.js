// ⭐ إجبار Vercel على العمل بـ Node.js وليس Edge Runtime
export const config = {
  runtime: "nodejs"
};

import OpenAI from "openai";

// ============================
// 🔥 الدالة الرئيسية
// ============================
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { topic, type, count } = req.body;

    // التحقق من المدخلات
    if (!topic || !type || !count) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // مفتاح OpenAI من متغيرات البيئة
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // ============================
    // 🎯 إعداد البرومبت الذكي
    // ============================
    const prompt = `
أنت خبير تربوي محترف، ومهمتك توليد أسئلة حقيقية وواضحة و عالية الجودة.
الموضوع: "${topic}"
عدد الأسئلة المطلوبة: ${count}
نوع الأسئلة: ${type}

❗ تعليمات مهمة ومُلزمة:
- إذا كان النوع "اختيار من متعدد":
    - اكتب السؤال
    - ثم 4 خيارات تحت السؤال (A - B - C - D)
    - خيار واحد منها صحيح
- إذا كان النوع "صح أو خطأ":
    - يبدأ كل سؤال بعبارة: (صح أو خطأ)
    - ثم يليه السؤال
- إذا كان النوع "أسئلة قصيرة":
    - سؤال يحتاج إجابة قصيرة من الطالب
- إذا كان النوع "أسئلة مقالية":
    - سؤال يحتاج إجابة طويلة (3–5 جمل)
- إذا كان النوع "أسئلة منوعة":
    - مزيج عشوائي من الأنواع السابقة
    - كل سؤال يظهر بالشكل الصحيح حسب نوعه

❗منع تكرار الأسئلة نهائياً.
❗الأسئلة يجب أن تعتمد على فهم حقيقي للموضوع.
❗يُمنع تكرار العنوان داخل السؤال.
❗لا تستخدم كلمات عامة مثل "أهمية – دور – فوائد" بدون سياق.
❗اجعل الأسئلة مناسبة لطلاب المدارس.

اكتب الأسئلة فقط بدون شرح إضافي أو مقدمة.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت خبير تربوي متخصص في تصميم أسئلة تعليمية عالية الجودة." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.4
    });

    const output = completion.choices[0].message.content;

    return res.status(200).json({ questions: output });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
