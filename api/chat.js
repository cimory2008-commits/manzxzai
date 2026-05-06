export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const HF_TOKEN = "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";
  const MODEL = "swiss-ai/Apertus-8B-Instruct-2509:publicai";

  const { messages } = req.body;

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
