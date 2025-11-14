// src/api/authService.js
import axios from 'axios'

// Base configuration
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/', // 🔹 only base URL here
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authService = {
  // Step 1: Send OTP
  sendOtp: async (phone_number, purpose = 'login') => {
    const res = await API.post('/auth/api/auth/send-otp/', { phone_number, purpose })
    return res.data
  },

  // Step 2: Verify OTP
  verifyOtp: async (session_id, otp) => {
    const res = await API.post('/auth/api/auth/verify-otp/', { session_id, otp })
    return res.data
  },
}
