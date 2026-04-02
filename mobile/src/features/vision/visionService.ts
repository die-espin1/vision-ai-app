import apiClient from "../../infrastructure/apiClient"

export const describeImage = async (imageBase64: string) => {

  // 1. Enviar imagen
  const { data } = await apiClient.post("/vision/describe", {
    image: imageBase64
  })

  const jobId = data.jobId

  // 2. Polling
  let result = null

  for (let i = 0; i < 10; i++) {

    await new Promise(r => setTimeout(r, 2000))

    const res = await apiClient.get(`/vision/result/${jobId}`)

    if (res.data.status === "completed") {
      result = res.data.result
      break
    }

  }

  if (!result) {
    throw new Error("Timeout procesando imagen")
  }

  return result.description
}