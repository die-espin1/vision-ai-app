import axios from "axios"
import { Platform } from "react-native"

const LOCAL_API_URL = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
})

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL

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
