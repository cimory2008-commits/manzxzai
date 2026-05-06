export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const HF_TOKEN = process.env.HF_TOKEN;

    if (!HF_TOKEN) {
      return res.status(500).json({
        error: "HF_TOKEN tidak ditemukan di environment Vercel",
      });
    }

    const MODEL = "swiss-ai/Apertus-8B-Instruct-2509:publicai";

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const messages = body?.messages || [];

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
}
