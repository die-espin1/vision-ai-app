const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const visionController = require("../controllers/vision.controller");

router.post("/describe", upload.single("image"), visionController.describeImage);
// GET /status/:jobId eliminado: ya no hay cola ni jobs.

module.exports = router;
