const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  dest: "/tmp/voxia-uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

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

app.post("/translate", upload.single("video"), async (req, res) => {
  let filePath = null;

  try {
    const targetLanguage = req.body.targetLanguage;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Video fayl yuborilmadi"
      });
    }

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Tarjima tili tanlanmagan"
      });
    }

    filePath = req.file.path;

    console.log("Video qabul qilindi:", req.file.originalname);
    console.log("Tarjima tili:", targetLanguage);

    /*
      Video faylni OpenAI transkripsiya xizmatiga yuboramiz.
      Natijada videodagi nutq matnga aylantiriladi.
    */

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-mini-transcribe"
    });

    const originalText = transcription.text || "";

    if (!originalText.trim()) {
      throw new Error("Videodan nutq aniqlanmadi");
    }

    /*
      Transkripsiyani tanlangan tilga tarjima qilamiz.
    */

    const translationResponse = await openai.responses.create({
      model: "gpt-5.6",
      instructions:
        "You are VOXIA, a professional video translation assistant. " +
        "Translate the supplied spoken dialogue naturally into the requested language. " +
        "Preserve names, meaning, emotion and context. " +
        "Return only the translated text.",
      input:
        `Translate the following dialogue into ${targetLanguage}:\n\n${originalText}`
    });

    const translation = translationResponse.output_text || "";

    res.json({
      success: true,
      language: targetLanguage,
      originalText,
      translation
    });

  } catch (error) {
    console.error("VOXIA ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message || "AI bilan bog‘lanishda xatolik yuz berdi"
    });

  } finally {
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Temporary file o‘chirilmadi:", e.message);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`VOXIA server ${PORT}-portda ishga tushdi`);
});
