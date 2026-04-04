import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://10.57.111.164:3000",
  timeout: 10000,
})

export default apiClient