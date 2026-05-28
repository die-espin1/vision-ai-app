const visionService = require("../services/vision.service");
const visionQueue = require("../queues/vision.queue");

// POST /vision/describe
async function describeImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió imagen" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const question = req.body.question || null;
    const context = req.body.context || null;
    console.log("[controller] question recibida:", question);
    console.log("[controller] context recibido:", context);

    const job = await visionService.sendToQueue(base64Image, question, context);

    return res.json({
      status: "processing",
      jobId: job.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando imagen" });
  }
}

// GET /vision/status/:jobId
async function getJobStatus(req, res) {
  try {
    const { jobId } = req.params;

    const job = await visionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job no encontrado" });
    }

    const state = await job.getState();

    if (state === "completed") {
      return res.json({
        status: "completed",
        description: job.returnvalue.description
      });
    }

    return res.json({ status: state });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error consultando job" });
  }
}

module.exports = {
  describeImage,
  getJobStatus
};