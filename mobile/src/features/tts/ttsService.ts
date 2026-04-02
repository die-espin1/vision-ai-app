import apiClient from "../../infrastructure/apiClient"

export const describeImage = async (imageBase64: string) => {

  const response = await apiClient.post("/vision/describe", {
    image: imageBase64
  })

  return response.data.description
}