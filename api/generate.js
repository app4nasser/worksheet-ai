import OpenAI from "openai";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {

  // ⚠️ مهم جداً: معالجة طلب OPTIONS لتفعيل CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { topic, count, qtype } = await req.json();

    if (!topic || !count || !qtype) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
أنت خبير تربوي متقدم.
أريد منك إنشاء أسئلة تعليمية عالية الجودة حول الموضوع: "${topic}"

عدد الأسئلة المطلوبة: ${count}
نوع الأسئلة: ${qtype}

🔵 تعليمات توليد الأسئلة حسب النوع:

إذا كان النوع **mcq** (اختيار من متعدد):
- اكتب سؤالًا واضحًا ومباشرًا
- أضف 4 خيارات فقط
- اجعل خيارًا واحدًا صحيحًا
- لا تستخدم أسئلة عامة قابلة للتطبيق على أي موضوع
- اجعل السؤال متعلقًا مباشر بالموضوع فقط

الصيغة المطلوبة:
{
 "type": "mcq",
 "question": "نص السؤال",
 "options": ["خيار 1","خيار 2","خيار 3","خيار 4"],
 "answer": "الخيار الصحيح"
}

إذا كان النوع **tf** (صح أو خطأ):
- أنشئ جملًا حقيقية أو خاطئة متعلقة تمامًا بالموضوع
- إجابة واحدة (صح أو خطأ)

الصيغة:
{
 "type": "tf",
 "question": "صح أو خطأ: نص الجملة",
 "answer": "صح" أو "خطأ"
}

إذا كان النوع **short** (سؤال قصير):
{
 "type": "short",
 "question": "سؤال مباشر متعلق بالموضوع",
 "answer": "إجابة قصيرة دقيقة"
}

إذا كان النوع **mixed** (منوّعة):
- وزع الأسئلة بين الأنواع الثلاثة بالتساوي قدر الإمكان
- كل سؤال يجب أن يتبع مقاييس النوع الخاص به

⚠️ مهم جداً:
- أعد لي النتيجة بصيغة JSON فقط
- لا تكتب أي شرح خارجي
- الصيغة النهائية يجب أن تكون:

{
 "questions": [
   {...},
   {...}
 ]
}
    `;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const output = response.output_text();

    return new Response(output, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Server error",
      details: err.message
    }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  }
}
