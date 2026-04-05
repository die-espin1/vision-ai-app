const { GoogleGenerativeAI } = require("@google/generative-ai");
const { compressImage } = require("../utils/image.utils");
const visionQueue = require("../queues/vision.queue");

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// 🔹 Limitar texto (backup de seguridad)
function limitText(text, maxWords = 60) {
  if (!text) return "";
  const words = text.split(" ");
  return words.slice(0, maxWords).join(" ");
}

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

  // 🎯 Prompt optimizado (máx 20 segundos de audio)
  const prompt = `
Describe esta imagen para una persona ciega en máximo 50 palabras.

Reglas:
- Sé claro y directo
- Menciona solo lo más importante
- Evita detalles innecesarios
- Usa frases cortas
- Máximo 2-3 oraciones

Objetivo: que la descripción se pueda escuchar en menos de 20 segundos.
`;

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
          prompt
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout Gemini")), 15000)
        )
      ]);

      const response = await result.response;
      let text = response.text();

      // 🔒 Aplicar límite adicional
      text = limitText(text, 60);

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