const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { describeImage } = require("../services/vision.service");
const crypto = require("crypto");

const connection = new IORedis({
  host: "redis",
  port: 6379,
  maxRetriesPerRequest: null
});

// 🔥 cache Redis
const cache = new IORedis({
  host: "redis",
  port: 6379
});

// 🔹 hash imagen
function getHash(base64) {
  return crypto.createHash("md5").update(base64).digest("hex");
}

const worker = new Worker(
  "vision-queue",
  async (job) => {

    const { image } = job.data;
    const hash = getHash(image);

    console.log("Procesando imagen en worker...");

    // 🔥 1. revisar cache
    const cached = await cache.get(`vision:${hash}`);
    if (cached) {
      console.log("Respuesta desde cache (worker)");
      return { description: cached };
    }

    // 🔥 2. procesar UNA sola vez (sin reintentos)
    try {
      const description = await describeImage(image);

      // 🔥 guardar cache
      await cache.set(`vision:${hash}`, description, "EX", 600);

      return { description };

    } catch (error) {
      console.error("Error procesando imagen:", error.message);
      throw error;
    }
  },
  {
    connection,
    attempts: 1 // 🔥 clave: SIN reintentos automáticos
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completado`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} falló`, err.message);
});