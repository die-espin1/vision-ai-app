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
async function sendToQueue(base64Image, question = null, context = null) {
  console.log("Enviando imagen a la cola...");

  return await visionQueue.add("analyze-image", {
    image: base64Image,
    question,
    context
  });
}

// 🔹 procesamiento principal
async function describeImage(base64Image, question = null, context = null) {

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
    ? `
Estás analizando una imagen. Ya generaste esta descripción de ella:
"${context}"

Basándote en la imagen y en esa descripción, responde en español esta pregunta de forma precisa y específica:
"${question}"

Ve directo a la respuesta. Sin frases introductorias.
`
    : `
Eres un asistente de visión para personas ciegas. Describe esta imagen de forma completa y detallada en español.

Estructura la descripción en párrafos, en este orden:

1. ESCENA GENERAL: Qué tipo de lugar o situación es. Qué ocupa el centro o elemento principal.
2. OBJETOS Y PERSONAS: Describe cada elemento visible — qué es, dónde está (izquierda, derecha, centro, fondo, primer plano), color, tamaño aproximado, estado.
3. TEXTO VISIBLE: Si hay carteles, etiquetas, pantallas, papeles o cualquier texto — léelo literalmente y di dónde está.
4. DETALLES RELEVANTES: Colores dominantes, materiales, cantidades, marcas si se leen.
5. SEGURIDAD O NAVEGACIÓN: Escaleras, puertas, obstáculos, semáforos, bordes, desniveles — solo si aplica.

Reglas:
- Sin límite de palabras — sé tan detallado como la imagen lo permita
- Habla directo: "Hay una...", "A la izquierda...", "Se lee...", "En el fondo..."
- No uses frases como "Esta imagen muestra" o "En esta imagen se puede ver"
- Si algo no se distingue bien, dilo: "parece ser", "posiblemente"
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
          setTimeout(() => reject(new Error("Timeout Gemini")), 20000)
        )
      ]);

      const response = await result.response;
      let text = response.text().trim();

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