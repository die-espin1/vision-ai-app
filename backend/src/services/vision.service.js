const { GoogleGenerativeAI } = require("@google/generative-ai");
const { compressImage } = require("../utils/image.utils");
const visionQueue = require("../queues/vision.queue");
const crypto = require("crypto");
const IORedis = require("ioredis");

// 🔌 Redis para cache
const redis = new IORedis({
  host: "redis",
  port: 6379
});

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// 🔹 generar hash de imagen
function getImageHash(base64) {
  return crypto.createHash("md5").update(base64).digest("hex");
}

// 🔹 limitar texto
function limitText(text, maxWords = 60) {
  if (!text) return "";
  return text.split(" ").slice(0, maxWords).join(" ");
}

// 🔹 enviar a cola
async function sendToQueue(base64Image) {
  console.log("Enviando imagen a la cola...");
  
  return await visionQueue.add("analyze-image", {
    image: base64Image
  });
}

// 🔹 procesamiento principal
async function describeImage(base64Image) {

  if (!base64Image) {
    throw new Error("Imagen inválida");
  }

  const hash = getImageHash(base64Image);

  // 🔥 1. Revisar cache
  const cached = await redis.get(`vision:${hash}`);
  if (cached) {
    console.log("Respuesta desde cache");
    return cached;
  }

  console.log("Comprimiendo imagen...");
  const compressedImage = await compressImage(base64Image);

  const prompt = `
Describe esta imagen para una persona ciega en máximo 50 palabras.
Sé claro, directo y breve. Máximo 20 segundos de audio.
`;

  for (let attempt = 1; attempt <= 2; attempt++) {

    try {

      console.log(`Procesando con Gemini (intento ${attempt})...`);

      const result = await Promise.race([
        model.generateContent([
          {
            inlineData: {
              data: compressedImage,
              mimeType: "image/jpeg"
            }
          },
          prompt
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini")), 10000)
        )
      ]);

      const response = await result.response;
      let text = limitText(response.text(), 60);

      // 🔥 2. Guardar en cache (10 minutos)
      await redis.set(`vision:${hash}`, text, "EX", 600);

      console.log("Descripción generada correctamente");

      return text;

    } catch (error) {

      console.error(`Error en intento ${attempt}:`, error.message);

      if (attempt === 2) {
        throw error;
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }
}

module.exports = {
  describeImage,
  sendToQueue
};