import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Generic LLM Query Function (uses AIML API)
async function queryLLM(prompt) {
  const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIML_API_KEY}`, // ✅ key from .env
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemma-3-4b-it", // AIML API supports OpenAI-like models
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  // Handle errors from API gracefully
  if (!data.choices || data.choices.length === 0) {
    console.error("LLM API Error:", data);
    return "Sorry, I couldn't get a response from the LLM.";
  }

  return data.choices[0].message.content;
}

// Endpoint required by challenge
app.post("/ask", async (req, res) => {
  try {
    const { chat } = req.body;
    if (!chat) return res.status(400).json({ error: "Chat message required" });

    const responseText = await queryLLM(chat);
    console.log("-----REs-----\n");
    console.log(responseText);
    console.log("-----REs-----\n");
    res.json({ response: responseText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "LLM request failed" });
  }
});

// Health check
app.get("/", (req, res) => res.send("LLM API server is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
