const { GoogleGenerativeAI } = require("@google/generative-ai");
const { compressImage } = require("../utils/image.utils");
const visionQueue = require("../queues/vision.queue");

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// 🔹 Enviar a cola (modo async)
async function sendToQueue(base64Image) {
  console.log("Enviando imagen a la cola...");
  
  return await visionQueue.add("analyze-image", {
    image: base64Image
  });
}

// 🔹 Procesamiento principal (modo sync)
async function describeImage(base64Image) {

  if (!base64Image) {
    throw new Error("Imagen inválida");
  }

  console.log("Comprimiendo imagen...");
  const compressedImage = await compressImage(base64Image);

  for (let attempt = 1; attempt <= 3; attempt++) {

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
          "Describe detalladamente esta imagen para una persona ciega. Explica objetos, personas, colores, posiciones y contexto."
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini")), 5000)
        )
      ]);

      const response = await result.response;
      const text = response.text();

      console.log("Descripción generada correctamente");

      return text;

    } catch (error) {

      console.error(`Error en intento ${attempt}:`, error.message);

      if (attempt === 3) {
        console.error("Falló definitivamente Gemini");
        throw error;
      }

      console.log("Reintentando...");
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

module.exports = {
  describeImage,
  sendToQueue
};