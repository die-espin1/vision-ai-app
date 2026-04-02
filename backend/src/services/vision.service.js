const { GoogleGenerativeAI } = require("@google/generative-ai")
const { compressImage } = require("../utils/image.utils")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
})

async function describeImage(base64Image) {

  const compressedImage = await compressImage(base64Image)

  for (let attempt = 1; attempt <= 3; attempt++) {

    try {

      const result = await model.generateContent([
        {
          inlineData: {
            data: compressedImage,
            mimeType: "image/jpeg"
          }
        },
        "Describe detalladamente esta imagen para una persona ciega. Explica objetos, personas, colores, posiciones y contexto."
      ])

      const response = await result.response
      return response.text()

    } catch (error) {

      if (attempt === 3) throw error

      console.log(`Retry Gemini attempt ${attempt}`)

      await new Promise(r => setTimeout(r, 1000))
    }

  }

}

module.exports = { describeImage }