const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const visionController = require("../controllers/vision.controller");

// ✅ endpoint correcto
router.post("/describe", upload.single("image"), visionController.describeImage);

// ✅ status
router.get("/status/:jobId", visionController.getJobStatus);

// 🔥 export correcto
module.exports = router;