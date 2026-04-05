const { GoogleGenerativeAI } = require("@google/generative-ai");
const { compressImage } = require("../utils/image.utils");
const visionQueue = require("../queues/vision.queue");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// 🔹 Limitar texto
function limitText(text, maxWords = 50) {
  if (!text) return "";
  return text.split(" ").slice(0, maxWords).join(" ");
}

// 🔹 SOLO enviar a cola
async function sendToQueue(base64Image) {
  console.log("Enviando imagen a la cola...");

  return await visionQueue.add("analyze-image", {
    image: base64Image
  });
}

// 🔹 Obtener job
async function getJob(jobId) {
  return await visionQueue.getJob(jobId);
}

// 🔹 PROCESAMIENTO REAL (SOLO worker usa esto)
async function describeImage(base64Image) {

  if (!base64Image) {
    throw new Error("Imagen inválida");
  }

  console.log("Comprimiendo imagen...");
  const compressedImage = await compressImage(base64Image);

  const prompt = `
Describe esta imagen en máximo 50 palabras.

Reglas:
- Claro y directo
- Objetos, colores y posiciones
- Duración < 20 segundos
`;

  try {

    console.log("Procesando con Gemini...");

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
    let text = response.text();

    text = limitText(text, 50);

    console.log("Descripción generada correctamente");

    return text;

  } catch (error) {
    console.error("Error en Gemini:", error.message);
    throw error;
  }
}

module.exports = {
  describeImage,
  sendToQueue,
  getJob
};