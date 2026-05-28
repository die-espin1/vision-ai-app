const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { describeImage } = require("../services/vision.service");

const connection = new IORedis({
  host: "redis",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "vision-queue",
  async (job) => {
    const { image, question = null, context = null } = job.data;

    console.log("Procesando imagen en worker...");

    // describeImage maneja su propio cache internamente
    const description = await describeImage(image, question, context);

    return { description };
  },
  {
    connection,
    concurrency: 2,
    attempts: 1,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completado`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} falló:`, err.message);
});