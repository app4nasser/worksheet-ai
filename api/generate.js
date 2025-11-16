import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { topic, count, level } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Missing topic" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `...`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a professional Arabic educational question generator." },
        { role: "user", content: prompt }
      ],
    });

    const json = response.choices[0].message.content;

    res.status(200).json(JSON.parse(json));
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
