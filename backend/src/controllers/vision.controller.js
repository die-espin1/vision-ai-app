const visionService = require("../services/vision.service");

async function describeImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió imagen" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const question = req.body.question || null;
    const context = req.body.context || null;

    console.log("[vision.controller] fields:", {
      hasQuestion: Boolean(question),
      hasContext: Boolean(context),
    });

    const description = await visionService.describeImage(base64Image, question, context);

    return res.json({ description });

  } catch (error) {
    console.error("[vision.controller] error:", error.message);
    res.status(500).json({ error: "Error procesando imagen" });
  }
}

module.exports = { describeImage };
