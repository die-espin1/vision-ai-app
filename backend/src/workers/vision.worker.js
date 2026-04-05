const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { describeImage } = require("../services/vision.service");

const connection = new IORedis({
  host: "redis",
  port: 6379,
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "vision-queue",
  async (job) => {

    const { image } = job.data;

    console.log("Procesando imagen en worker...");

    const description = await describeImage(image);

    return { description };

  },
  {
    connection,
    attempts: 2, // 🔥 máximo 2 intentos (antes 3+ duplicados)
    backoff: {
      type: "exponential",
      delay: 2000
    }
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completado`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} falló`, err.message);
});