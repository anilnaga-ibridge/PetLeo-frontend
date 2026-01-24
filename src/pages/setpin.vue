<!--
  <script setup>
  import axios from 'axios'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useCookie } from '@/@core/composable/useCookie'

  definePage({
  meta: {
  layout: 'blank',
  unauthenticatedOnly: true,
  }
  })

  const router = useRouter()
  const cookie = useCookie()

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  const SET_PIN_URL = `${API_BASE}/auth/api/auth/set-pin/`

  const pin = ref('')
  const confirmPin = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  /* Get stored auth token if available */
  const getAuthToken = () => {
  return (
  localStorage.getItem('accessToken') ||
  sessionStorage.getItem('accessToken') ||
  useCookie('accessToken')?.value ||
  null
  )
  }

  /* SUBMIT PIN */
  const submitPin = async () => {
  if (!/^\d{4,6}$/.test(pin.value)) {
  errorMessage.value = "PIN must be 4 or 6 digits."
  return
  }
  if (pin.value !== confirmPin.value) {
  errorMessage.value = "PINs do not match."
  return
  }

  loading.value = true
  errorMessage.value = ''

  try {
  const authToken = getAuthToken()
  const resetToken = localStorage.getItem("reset_token")

  const headers = {}

  if (authToken) {
  headers["Authorization"] = `Bearer ${authToken}`
  } else if (resetToken) {
  headers["X-Reset-Token"] = resetToken
  }

  const res = await axios.post(
  SET_PIN_URL,
  { pin: pin.value },
  { headers }
  )

  successMessage.value = res.data.message

  localStorage.removeItem("reset_token")

  setTimeout(() => {
  if (authToken) router.replace('/')
  else router.replace('/login')
  }, 800)

  } catch (err) {
  errorMessage.value = err.response?.data?.detail || "Failed to set PIN."
  } finally {
  loading.value = false
  }
  }
  </script> 
-->

<script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'

definePage({
  meta: { layout: 'blank', unauthenticatedOnly: true },
})

const router = useRouter()
const cookie = useCookie()

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SET_PIN_URL = `${API_BASE}/auth/api/auth/set-pin/`

/* ---- Your existing logic ---- */
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/* ---- UI logic ---- */
const pin = ref('')
const confirmPin = ref('')

/* Keep your token logic same */
const getAuthToken = () => {
  return (
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken') ||
    useCookie('accessToken')?.value ||
    null
  )
}

/* Your submit API logic stays EXACTLY same */
const submitPin = async () => {
  const pinValue = pin.value
  const confirmPinValue = confirmPin.value

  if (!/^\d{4,6}$/.test(pinValue)) {
    errorMessage.value = "PIN must be 4 or 6 digits."
    
    return
  }
  if (pinValue !== confirmPinValue) {
    errorMessage.value = "PINs do not match."
    
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const authToken = getAuthToken()
    const resetToken = localStorage.getItem("reset_token")

    const headers = {}
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`
    else if (resetToken) headers["X-Reset-Token"] = resetToken

    const res = await axios.post(
      SET_PIN_URL,
      { pin: pinValue },
      { headers },
    )

    successMessage.value = res.data.message
    localStorage.removeItem("reset_token")

    setTimeout(() => {
      if (authToken) router.replace('/')
      else router.replace('/login')
    }, 800)

  } catch (err) {
    errorMessage.value = err.response?.data?.detail || "Failed to set PIN."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VRow
    class="auth-wrapper justify-center align-center"
    style="height:100vh;"
  >
    <VCol
      cols="12"
      md="4"
    >
      <VCard
        class="pa-6"
        style="border-radius:18px"
      >
        <h3 class="text-center">
          Set Your PIN
        </h3>
        <p class="text-center mb-4">
          Enter a 4–6 digit PIN
        </p>

        <!-- PIN  -->
        <div class="mb-4">
          <label class="v-label mb-1 d-block text-center">New PIN</label>
          <MultiBoxPinInput
            v-model="pin"
            :length="4"
            :error="!!errorMessage"
          />
        </div>

        <p class="mt-4 mb-1 text-center">
          Confirm PIN
        </p>

        <!-- CONFIRM PIN -->
        <div class="mb-4">
          <MultiBoxPinInput
            v-model="confirmPin"
            :length="4"
            :error="!!errorMessage"
          />
        </div>

        <VBtn
          block
          class="mt-6"
          :loading="loading"
          color="primary"
          @click="submitPin"
        >
          Set PIN
        </VBtn>

        <VAlert
          v-if="successMessage"
          type="success"
          class="mt-3"
        >
          {{ successMessage }}
        </VAlert>
        <VAlert
          v-if="errorMessage"
          type="error"
          class="mt-3"
        >
          {{ errorMessage }}
        </VAlert>

        <div class="mt-4 text-center">
          <RouterLink to="/login">
            Back to Login
          </RouterLink>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>


<style scoped>
/* Row for each group (PIN / Confirm PIN) */
.pin-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  position: relative;
}

/* Container holding boxes */
.pin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

/* Box */
.pin-box {
  width: 50px;
  height: 55px;
  background: #eef1ff;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Input inside box */
.pin-input {
  width: 100%;
  height: 100%;
  font-size: 26px;
  text-align: center;
  border: none;
  background: transparent;
  font-weight: bold;
  outline: none;
}

/* Eye icon perfectly aligned */
.eye-icon {
  cursor: pointer;
  font-size: 26px;
  color: #3949ab;
  transition: 0.2s ease;
}

.eye-icon:hover {
  color: #1a237e;
}
</style>
