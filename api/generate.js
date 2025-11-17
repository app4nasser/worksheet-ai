import OpenAI from "openai";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  // معالجة طلب OPTIONS (مهم لـ CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { topic, count, qtype } = await req.json();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
أنت خبير تربوي…
(هنا نفس الـ prompt الذي أعطيتك إياه سابقاً بدون تعديل)
    `;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const text = response.output_text();

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
