const express = require("express")
const router = express.Router()

const upload = require("../middlewares/upload.middleware")
const visionService = require("../services/vision.service")
const visionController = require("../controllers/vision.controller")

// 📸 Procesar imagen (sync + fallback async)
router.post("/describe", upload.single("image"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({ error: "No se envió imagen" })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "API key no configurada" })
    }

    const base64Image = req.file.buffer.toString("base64")

    try {

      // 🔥 intento síncrono (rápido)
      const description = await Promise.race([
        visionService.describeImage(base64Image),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000)
        )
      ])

      return res.json({
        status: "completed",
        description
      })

    } catch (error) {

      console.log("Fallback a procesamiento en cola...")

      // 🔁 fallback a cola
      const job = await visionService.sendToQueue(base64Image)

      return res.json({
        status: "processing",
        jobId: job.id
      })
    }

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error procesando imagen"
    })

  }

})

// 📊 Consultar estado del procesamiento
router.get("/status/:jobId", visionController.getJobStatus)

module.exports = router