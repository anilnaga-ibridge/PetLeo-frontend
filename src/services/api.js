import axios from "axios"
import { refreshAccessIfExpired } from "./authService"

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
})

// 🔥 Interceptor: auto-refresh token
api.interceptors.request.use(async config => {
  let accessToken = localStorage.getItem("accessToken")
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  // Try refreshing token silently
  const newToken = await refreshAccessIfExpired()
  if (newToken) {
    config.headers.Authorization = `Bearer ${newToken}`
  }

  return config
})
