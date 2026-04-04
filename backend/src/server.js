const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env")
});

const express = require("express");

const visionRoutes = require('./routes/vision.routes');
const adsRoutes = require('./routes/ads.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use('/vision', visionRoutes);
app.use('/ads', adsRoutes);
app.use('/health', healthRoutes);

const PORT = process.env.PORT || 3000;

// 🔥 CLAVE AQUÍ
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});