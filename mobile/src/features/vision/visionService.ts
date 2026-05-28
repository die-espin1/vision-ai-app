import apiClient from "../../infrastructure/apiClient"

export async function describeImage(
  imageUri: string,
  question?: string,
  context?: string
): Promise<string> {
  const formData = new FormData()

  formData.append("image", {
    uri: imageUri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any)

  if (question) {
    formData.append("question", question)
  }

  if (context) {
    formData.append("context", context)
  }

  if (__DEV__) {
    console.log("[visionService] POST /vision/describe", {
      hasQuestion: Boolean(question?.trim()),
      hasContext: Boolean(context?.trim()),
    })
  }

  const { data } = await apiClient.post("/vision/describe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  if (!data.description) {
    throw new Error("Sin descripción en respuesta")
  }

  return data.description
}
