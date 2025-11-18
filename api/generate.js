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

    // نص يوضح ما هو نوع الأسئلة المطلوب
    let typeDescription = "";
    if (type === "mcq") {
      typeDescription = `
- نوع الأسئلة: "اختيار من متعدد" فقط.
- كل الأسئلة يجب أن تكون "اختيار من متعدد" ولا يُسمح بأي نوع آخر.
- لكل سؤال 4 خيارات فقط (A,B,C,D) في الحقل options.
- خيار واحد فقط صحيح، ويُكتب نصه في الحقل answer.`;
    } else if (type === "tf") {
      typeDescription = `
- نوع الأسئلة: "صح أو خطأ" فقط.
- كل سؤال عبارة عن جملة يمكن الحكم عليها صح أو خطأ.
- يُفضّل أن يبدأ السؤال في الحقل question بـ "صح أو خطأ:".
- في الحقل answer اكتب إما "صح" أو "خطأ" فقط.`;
    } else if (type === "short") {
      typeDescription = `
- نوع الأسئلة: "أسئلة قصيرة" فقط.
- كل سؤال جوابه قصير (كلمة أو جملة قصيرة).
- يجب أن يكون هناك تنوّع بين:
  * أسئلة مباشرة (مثل: ما تعريف ...؟ ما أهم فائدة لـ ...؟)
  * وأسئلة تفكيرية قصيرة (مثل: لماذا يُعد ... مهمًّا؟ ما أثر ... على حياتنا؟)
- لا تُستخدم خيارات؛ فقط نص السؤال في question والإجابة القصيرة في answer.`;
    } else if (type === "mixed") {
      typeDescription = `
- نوع الأسئلة: "أسئلة منوّعة".
- وزّع الأسئلة تقريبًا كالتالي:
  * حوالي 40% أسئلة "اختيار من متعدد" (mcq) مع 4 خيارات.
  * حوالي 40% أسئلة "صح أو خطأ" (tf) تبدأ بـ "صح أو خطأ:".
  * حوالي 20% أسئلة قصيرة (short) تمزج بين المباشر والتفكيري.
- تأكد أن حقل type في كل سؤال يطابق نوعه الفعلي (mcq أو tf أو short).`;
    }

    const prompt = `
أنت خبير تربوي محترف في إعداد أسئلة مدرسية عالية الجودة باللغة العربية الفصحى الواضحة.

المطلوب:
- توليد ${maxQuestions} سؤالاً حول الموضوع: "${topic}"
${typeDescription}

تعليمات عامة مهمة:

1) يجب أن تعتمد الأسئلة على معلومات حقيقية ومنطقية عن الموضوع، لا تكون عامة جداً أو يمكن استخدامها لأي عنوان.
2) ممنوع إدخال عنوان الورقة داخل السؤال بطريقة يمكن استبدالها بأي عنوان، مثل:
   "ما أهمية هذا الموضوع؟" أو "اشرح موضوع '${topic}'" بدون تفاصيل مرتبطة بالمضمون.
3) لا تكرر نفس الفكرة أكثر من مرة، وغيّر زاوية السؤال (تعريف، سبب، أثر، فائدة، مثال، مقارنة بسيطة...).
4) اللغة تربوية، واضحة، ومناسبة لطالب في المرحلة المتوسطة/الثانوية (بدون تعقيد لغوي زائد).

صيغة المخرجات (يجب أن تكون JSON فقط):

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

ملاحظات إضافية حسب النوع:
- إذا كان type = "tf" تأكد أن الحقل question يحتوي جملة واحدة يمكن أن تكون صحيحة أو خاطئة، وanswer = "صح" أو "خطأ".
- إذا كان type = "mcq" استخدم 4 خيارات فقط، أحدها صحيح، واكتب نص الخيار الصحيح في answer.
- إذا كان type = "short" اجعل الإجابة في answer قصيرة وواضحة (كلمة أو جملة واحدة تقريباً).

لا تكتب أي نص خارج JSON.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "أنت خبير تربوي في تصميم أسئلة تعليمية عالية الجودة ومنظّمة بصيغة JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1600,
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

    // فلترة بسيطة للتأكد أن type متوافق مع المطلوب عندما لا يكون mixed
    let filtered = parsed.questions;

    if (type === "mcq") {
      filtered = filtered.filter((q) => q.type === "mcq");
    } else if (type === "tf") {
      filtered = filtered.filter((q) => q.type === "tf");
    } else if (type === "short") {
      filtered = filtered.filter((q) => q.type === "short");
    }

    // لو الفلترة قللت العدد كثيراً، نرجع الأصل على مسؤوليته
    if (filtered.length < Math.floor(maxQuestions / 2)) {
      filtered = parsed.questions;
    }

    // تأكد ألا نتجاوز العدد المطلوب
    filtered = filtered.slice(0, maxQuestions);

    return res.status(200).json({ questions: filtered });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
