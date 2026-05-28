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
  model: "gemini-2.0-flash"
});

// 🔹 generar hash de imagen
function getImageHash(base64) {
  return crypto.createHash("md5").update(base64).digest("hex");
}

// 🔹 limitar texto
function limitText(text, maxWords = 100) {
  if (!text) return "";
  return text.split(" ").slice(0, maxWords).join(" ");
}

// 🔹 enviar a cola
async function sendToQueue(base64Image, question = null) {
  console.log("Enviando imagen a la cola...");

  return await visionQueue.add("analyze-image", {
    image: base64Image,
    question
  });
}

// 🔹 procesamiento principal
async function describeImage(base64Image, question = null) {

  if (!base64Image) {
    throw new Error("Imagen inválida");
  }

  // Cache key incluye la pregunta para no mezclar respuestas
  const imageHash = getImageHash(base64Image);
  const cacheKey = question
    ? `vision:${imageHash}:q:${getImageHash(question)}`
    : `vision:${imageHash}`;

  // 🔥 1. Revisar cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("Respuesta desde cache");
    return cached;
  }

  console.log("Comprimiendo imagen...");
  const compressedImage = await compressImage(base64Image);

  const prompt = question
    ? `Sobre esta imagen, responde concisamente en español: "${question}". Máximo 60 palabras. Ve directo a la respuesta sin frases introductorias.`
    : `
Eres un asistente de visión para personas ciegas. Describe esta imagen con precisión y estructura.

Incluye en orden de importancia:
1. Qué es la escena principal (interior, exterior, objeto, persona, documento, comida, etc.)
2. Qué objetos o personas hay y dónde están ubicados (izquierda, centro, derecha, cerca, lejos)
3. Colores dominantes, cantidades y detalles relevantes
4. Texto visible en la imagen (carteles, etiquetas, pantallas) — léelo literalmente
5. Si hay algo importante para la seguridad o navegación (escaleras, puertas, obstáculos, semáforos)

Reglas:
- Máximo 80 palabras
- Habla en español neutro, segunda persona: "Hay una...", "A tu izquierda...", "Se lee..."
- No uses frases introductorias como "Esta imagen muestra..." — ve directo al contenido
- Si hay texto en la imagen, siempre inclúyelo aunque sea largo
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
      let text = limitText(response.text(), question ? 70 : 100);

      // 🔥 2. Guardar en cache (10 minutos)
      await redis.set(cacheKey, text, "EX", 600);

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