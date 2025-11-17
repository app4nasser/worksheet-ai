import OpenAI from "openai";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { topic, count, qtype } = await req.json();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
أنت خبير تربوي. أريد منك إنشاء أسئلة تعليمية حول الموضوع: "${topic}"
عدد الأسئلة: ${count}
نوع السؤال: ${qtype}

أعد الإجابات بشكل JSON فقط بدون شرح.

الشروط:

إذا كان النوع "mcq":
- أنشئ سؤال اختيار من متعدد
- يحتوي كل سؤال على 4 خيارات
- خيار واحد صحيح
- الصيغة:
{
 "type": "mcq",
 "question": "نص السؤال",
 "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
 "answer": "الخيار الصحيح"
}

إذا كان النوع "tf":
{
 "type": "tf",
 "question": "صح أو خطأ: نص السؤال",
 "answer": "صح" أو "خطأ"
}

إذا كان النوع "short":
{
 "type": "short",
 "question": "نص السؤال القصير",
 "answer": "إجابة قصيرة"
}

إذا كان النوع "mixed":
- وزّع الأنواع الثلاثة عشوائياً  (mcq – tf – short)

أعد كل شيء في مصفوفة بهذا الشكل:
{ "questions": [ ... ] }
`;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const text = response.output_text();
    return new Response(text, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "خطأ في الخادم", details: err.message }),
      { status: 500 }
    );
  }
}
