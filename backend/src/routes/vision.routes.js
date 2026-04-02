const express = require("express")
const router = express.Router()

const upload = require("../middlewares/upload.middleware")
const visionQueue = require("../queues/vision.queue")

router.post("/describe", upload.single("image"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({ error: "No se envió imagen" })
    }

    const base64Image = req.file.buffer.toString("base64")

    const job = await visionQueue.add("analyze-image", {
      image: base64Image
    })

    res.json({
      jobId: job.id,
      status: "processing"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error enviando imagen a procesamiento"
    })

  }

})

module.exports = router