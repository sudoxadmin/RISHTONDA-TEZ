const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.json({
    app: "VOXIA",
    status: "online",
    message: "VOXIA AI server ishlayapti 🚀"
  });
});

app.post("/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Matn va til kerak"
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions:
        "You are VOXIA, a professional movie translation assistant. " +
        "Translate dialogue naturally while preserving names, meaning, emotion and context.",
      input:
        "Translate this movie dialogue into " +
        targetLanguage +
        ". Return only the translated text.\n\n" +
        text
    });

    res.json({
      success: true,
      language: targetLanguage,
      translation: response.output_text
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "AI bilan bog‘lanishda xatolik yuz berdi"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`VOXIA server ${PORT}-portda ishga tushdi`);
});
