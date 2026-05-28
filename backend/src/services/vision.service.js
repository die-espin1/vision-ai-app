const { GoogleGenerativeAI } = require("@google/generative-ai");
const { compressImage } = require("../utils/image.utils");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function describeImage(base64Image, question = null, context = null) {
  if (!base64Image) throw new Error("Imagen inválida");

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
2. OBJETOS Y PERSONAS: Describe cada elemento visible - qué es, dónde está (izquierda, derecha, centro, fondo, primer plano), color, tamaño aproximado, estado.
3. TEXTO VISIBLE: Si hay carteles, etiquetas, pantallas, papeles o cualquier texto - léelo literalmente y di dónde está.
4. DETALLES RELEVANTES: Colores dominantes, materiales, cantidades, marcas si se leen.
5. SEGURIDAD O NAVEGACIÓN: Escaleras, puertas, obstáculos, semáforos, bordes, desniveles - solo si aplica.

Reglas:
- Sin límite de palabras - sé tan detallado como la imagen lo permita
- Habla directo: "Hay una...", "A la izquierda...", "Se lee...", "En el fondo..."
- No uses frases como "Esta imagen muestra" o "En esta imagen se puede ver"
- Si algo no se distingue bien, dilo: "parece ser", "posiblemente"
`;

  const result = await Promise.race([
    model.generateContent([
      { inlineData: { data: compressedImage, mimeType: "image/jpeg" } },
      prompt
    ]),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout Gemini")), 25000)
    )
  ]);

  return result.response.text().trim();
}

module.exports = { describeImage };
