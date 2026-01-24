import { api } from "./api"
import axios from "axios"
import { fullLogout } from "@/utils/logout"

// 🔥 Refresh access token silently
export async function refreshAccessIfExpired() {
  const refresh = localStorage.getItem("refresh")
  if (!refresh) return null

  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/auth/api/auth/refresh-token/",
      { refresh },
    )

    const newAccess = res.data.access

    localStorage.setItem("accessToken", newAccess)

    return newAccess

  } catch (error) {
    console.error("❌ Refresh token invalid or expired")

    localStorage.removeItem("refresh")
    localStorage.removeItem("accessToken")

    return null
  }
}

export const authService = {
  sendOtp(phone) {
    return api.post("/auth/api/auth/send-otp/", {
      phone_number: phone,
      purpose: "login",
    })
  },

  verifyOtp(session_id, otp) {
    return api.post("/auth/api/auth/verify-otp/", {
      session_id,
      otp,
    })
  },

  registerUser(payload) {
    return api.post("/auth/api/auth/register/", payload)
  },

  logout(router) {
    fullLogout(router)
  },
}
