import axios from "axios"

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

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
