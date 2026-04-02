import axios from "axios"

const apiClient = axios.create({
  baseURL: "http://192.168.1.19:5000",
  timeout: 10000,
})

export default apiClient