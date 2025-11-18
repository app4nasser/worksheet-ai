// api/generate.js
export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { topic, count, type } = req.body || {};

    if (!topic || !count || !type) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const maxQuestions = Math.min(Math.max(parseInt(count, 10) || 5, 3), 20);

    const prompt = `
أنت خبير تربوي محترف في إعداد أسئلة مدرسية عالية الجودة.

المطلوب:
- توليد ${maxQuestions} أسئلة حول الموضوع: "${topic}"
- نوع الأسئلة المطلوب: "${type}"

التعليمات:

1) إذا كان النوع "mcq" (اختيار من متعدد):
   - اكتب سؤالاً واضحاً يعتمد على المحتوى العلمي الحقيقي للموضوع.
   - أضف 4 خيارات (A,B,C,D) في الحقل options.
   - اجعل خياراً واحداً فقط صحيحاً، واذكره في حقل answer (بنص الخيار نفسه).

2) إذا كان النوع "tf" (صح أو خطأ):
   - اكتب جمل قابلة للحكم صح أو خطأ.
   - ضع في answer إما "صح" أو "خطأ".
   - لا تكرر نفس الصياغات.

3) إذا كان النوع "short" (أسئلة قصيرة):
   - أسئلة جوابها قصير (كلمة أو جملة قصيرة).
   - ضع الإجابة النموذجية في answer.

4) إذا كان النوع "mixed" (أسئلة منوعة):
   - امزج بين الأنواع الثلاثة السابقة.
   - لكل سؤال حدد type المناسب (mcq أو tf أو short).

5) ممنوع:
   - تكرار نفس السؤال بصياغة سطحية.
   - إدخال عنوان الورقة داخل كل سؤال بطريقة يمكن استبدالها بأي عنوان.
   - أسئلة عامة جداً لا ترتبط بالمحتوى مثل "ما أهمية هذا الموضوع؟" بدون سياق واضح.

المخرجات يجب أن تكون بصيغة JSON فقط، بالشكل التالي تماماً:

{
  "questions": [
    {
      "type": "mcq" | "tf" | "short",
      "question": "نص السؤال هنا...",
      "options": ["اختيار 1","اختيار 2","اختيار 3","اختيار 4"], // فقط مع mcq
      "answer": "الإجابة النموذجية هنا"
    }
  ]
}

لا تكتب أي نص خارج JSON.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "أنت خبير تربوي في تصميم أسئلة تعليمية عالية الجودة." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1400,
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error("JSON parse error:", e);
      return res.status(500).json({ error: "Failed to parse questions JSON." });
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      return res.status(500).json({ error: "Invalid questions format." });
    }

    return res.status(200).json({ questions: parsed.questions });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
