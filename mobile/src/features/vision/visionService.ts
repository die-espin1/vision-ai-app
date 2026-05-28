import apiClient, { API_BASE_URL } from "../../infrastructure/apiClient"

type DescribeResponse = {
  description?: string
  status?: string
  jobId?: string
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
    console.log("[visionService] POST", `${API_BASE_URL}/vision/describe`, {
      hasQuestion: Boolean(question?.trim()),
      hasContext: Boolean(context?.trim()),
    })
  }

  const { data } = await apiClient.post<DescribeResponse>("/vision/describe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  if (data.description) {
    return data.description
  }

  if (!data.jobId) {
    throw new Error("Sin jobId en respuesta")
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await wait(2000)

    const result = await apiClient.get<DescribeResponse>(`/vision/status/${data.jobId}`)

    if (result.data.status === "completed" && result.data.description) {
      return result.data.description
    }
  }

  throw new Error("Timeout procesando imagen")
}
