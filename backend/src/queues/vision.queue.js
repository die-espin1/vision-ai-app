const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// Conexión única a Redis (Docker → "redis")
const connection = new IORedis({
  host: "redis",
  port: 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    console.log("Reintentando conexión a Redis...", times);
    return Math.min(times * 1000, 5000);
  }
});

// Cola de visión
const visionQueue = new Queue("vision-queue", {
  connection
});

module.exports = visionQueue;