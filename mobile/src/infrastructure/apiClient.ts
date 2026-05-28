import axios from "axios"

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.7:3000"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.error("[apiClient]", error?.response?.status, error?.message)
    }
    return Promise.reject(error)
  }
)

export default apiClient
