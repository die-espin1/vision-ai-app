const sharp = require("sharp")

async function compressImage(base64Image) {

  const buffer = Buffer.from(base64Image, "base64")

  const compressedBuffer = await sharp(buffer)
    .resize({ width: 800 })   // reduce resolución
    .jpeg({ quality: 70 })    // reduce calidad
    .toBuffer()

  return compressedBuffer.toString("base64")
}

module.exports = { compressImage }