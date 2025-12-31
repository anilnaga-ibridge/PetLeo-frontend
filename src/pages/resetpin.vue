<!-- <script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const RESET_PIN_URL = `${API_BASE}/auth/api/auth/reset-pin/`

const phone = ref('')
const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

const resetPin = async () => {
  if (!phone.value) { errorMessage.value = 'Phone number is required.'; return }
  try {
    loading.value = true
    const res = await axios.post(RESET_PIN_URL, { phone_number: phone.value })
    if (res.data?.session_id) {
      localStorage.setItem('session_id', res.data.session_id)
      // keep remember_me false by default for reset
      localStorage.setItem('remember_me', 'false')
      message.value = 'OTP sent for PIN reset. Redirecting to verify...'
      setTimeout(() => router.replace('/verifyotp'), 700)
    } else {
      errorMessage.value = res.data?.message || 'Failed to send OTP.'
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || 'Request failed.'
  } finally { loading.value = false }
}
</script>

<template>
  <VRow class="auth-wrapper justify-center align-center" style="height:100vh;">
    <VCol cols="12" md="4">
      <VCard class="pa-6">
        <h3>Reset PIN</h3>
        <p>Enter your phone number to receive OTP for PIN reset.</p>

        <VTextField v-model="phone" label="Phone Number" />
        <VBtn block :loading="loading" @click="resetPin">Send OTP</VBtn>

        <VAlert v-if="message" type="success" class="mt-3">{{ message }}</VAlert>
        <VAlert v-if="errorMessage" type="error" class="mt-3">{{ errorMessage }}</VAlert>
      </VCard>
    </VCol>
  </VRow>
</template> -->
<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const RESET_PIN_URL = `${API_BASE}/auth/api/auth/reset-pin/`

const phone = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const resetPin = async () => {
  if (!phone.value) {
    errorMessage.value = "Phone number is required."
    return
  }

  try {
    loading.value = true
    errorMessage.value = ""
    successMessage.value = ""

    const res = await axios.post(RESET_PIN_URL, {
      phone_number: phone.value
    })

    // Save session ID for verify-otp page
    localStorage.setItem("session_id", res.data.session_id)
    localStorage.setItem("remember_me", "false")  // PIN reset login should not auto-login

    successMessage.value = res.data.message || "OTP sent to reset PIN."

    // Redirect to verify OTP after 1s
    setTimeout(() => router.replace("/verifyotp"), 800)

  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Failed to send reset PIN OTP."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VRow class="auth-wrapper justify-center align-center" style="height:100vh;">
    <VCol cols="12" md="4">
      <VCard class="pa-6">
        <h3 class="mb-1">Reset PIN 🔑</h3>
        <p>Enter your phone number to receive OTP for resetting your PIN.</p>

        <VTextField
          v-model="phone"
          label="Phone Number"
          placeholder="+91 9876543210"
        />

        <VBtn block class="mt-3" :loading="loading" @click="resetPin">
          Send OTP
        </VBtn>

        <VAlert v-if="successMessage" type="success" class="mt-3">
          {{ successMessage }}
        </VAlert>
        <VAlert v-if="errorMessage" type="error" class="mt-3">
          {{ errorMessage }}
        </VAlert>

      </VCard>
    </VCol>
  </VRow>
</template>
