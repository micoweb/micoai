import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3001);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.NODE_ENV === "production" ? false : true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please send a message first." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI API key එක තවම සකස් කරලා නැහැ. Project එකේ .env ගොනුවට OPENAI_API_KEY එක එක් කරන්න."
      });
    }
    const safeMessages = messages.slice(-16).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 6000)
    }));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: `You are MICO AI, a friendly and patient study buddy for students. Help students understand concepts instead of merely memorizing. Explain step by step, use clear examples, and adapt to the student's level. Reply in Sinhala when the student writes Sinhala or Singlish; otherwise use the language they use. For homework, teach the method and encourage the learner. Be accurate; if uncertain, say so. Keep answers readable with short paragraphs and lists.`
        },
        ...safeMessages
      ]
    });
    const answer = completion.choices?.[0]?.message?.content?.trim();
    res.json({ answer: answer || "මට ඒකට පිළිතුරක් සකස් කරගන්න බැරි වුණා. නැවත උත්සාහ කරමු." });
  } catch (error) {
    console.error("Chat API error:", error?.message || error);
    res.status(500).json({
      error: "AI සේවාවට සම්බන්ධ වෙන්න බැරි වුණා. API key, internet connection සහ server logs පරීක්ෂා කරන්න."
    });
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(port, () => {
  console.log(`MICO AI server running on http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY) console.warn("OPENAI_API_KEY is missing. Copy .env.example to .env and add your key.");
});