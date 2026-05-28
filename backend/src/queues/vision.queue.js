const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const redisConfig = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDISPASSWORD || undefined,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    console.log("Reintentando conexion a Redis...", times);
    return Math.min(times * 1000, 5000);
  }
};

const connection = new IORedis(redisConfig);

const visionQueue = new Queue("vision-queue", {
  connection
});

module.exports = visionQueue;
