import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Generic LLM Query Function (uses AIML API)
async function queryLLM(prompt) {
  try {
    const response = await fetch(
      "https://api.aimlapi.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIML_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-3-4b-it",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("LLM API Error:", data);
      return "Sorry, I couldn't get a response from the LLM right now.";
    }

    const message = data?.choices?.[0]?.message?.content;
    return message?.toString().trim() || "Sorry, I didn't get any answer.";
  } catch (err) {
    console.error("Unexpected error calling AIML API:", err);
    return "Oops! Something went wrong talking to the LLM.";
  }
}

// Endpoint required by challenge
app.post("/chat", async (req, res) => {
  const { chat } = req.body;

  if (!chat || typeof chat !== "string") {
    return res.status(400).json({
      response: 'Invalid input — please send { "chat": "your message" }',
    });
  }

  const responseText = await queryLLM(chat);

  console.log("\n--- Incoming Chat ---");
  console.log("Prompt:", chat);
  console.log("LLM Response:", responseText);
  console.log("--------------------\n");

  // Always return a proper JSON object with a string
  res.json({ response: responseText });
});

// Health check
app.get("/", (req, res) => res.send("LLM API server is running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
