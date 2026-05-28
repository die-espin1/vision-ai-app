import axios from "axios"
import Constants from "expo-constants"

const SUPABASE_URL = "https://yubekdiflmnmfizaqvnt.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YmVrZGlmbG1ubWZpemFxdm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjI1NDMsImV4cCI6MjA5NDg5ODU0M30.NOD-O9qoavGrY5ViixGl589LdJLRMOOOoihFBgCcuyA"

const apiClient = axios.create({
  baseURL: `${SUPABASE_URL}/functions/v1`,
  timeout: 30000,
  headers: {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  },
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
