<script setup>
import axios from 'axios'
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

definePage({
  meta: { 
    layout: 'blank',
    public: true, // Allow access for both authenticated users and reset PIN flow
  },
})

const router = useRouter()
const cookie = useCookie()

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SET_PIN_URL = `${API_BASE}/auth/api/auth/set-pin/`

/* ---- Your existing logic ---- */
const loading = ref(false)
const pin = ref('')
const confirmPin = ref('')
const successMessage = ref('')
const errorMessage = ref('')

// PIN Length Selection
const pinLength = ref(4) // Default to 4

// Watch pinLength to reset PIN inputs when changed
watch(pinLength, () => {
  pin.value = ''
  confirmPin.value = ''
})

/* ---- Auto-skip timer logic ---- */
const countdown = ref(15)
let timerId = null

const skipPin = () => {
  if (timerId) clearInterval(timerId)
  router.replace('/')
}

onMounted(() => {
  timerId = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      skipPin()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
// Images
import authV2TwoStepIllustrationLight from '@images/pages/auth-v2-two-step-illustration-light.png'
import authV2TwoStepIllustrationDark from '@images/pages/auth-v2-two-step-illustration-dark.png'

const authThemeImg = useGenerateImageVariant(authV2TwoStepIllustrationLight, authV2TwoStepIllustrationDark)

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
  if (timerId) clearInterval(timerId) // Stop redirect if user tries to set PIN

  const pinValue = pin.value
  const confirmPinValue = confirmPin.value

  if (pinValue.length !== pinLength.value) {
    errorMessage.value = `PIN must be ${pinLength.value} digits.`
    
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
    
    // Update storage with new PIN length (check both local and session)
    if (localStorage.getItem('userData')) {
        const userData = JSON.parse(localStorage.getItem('userData'))
        userData.pin_length = pinLength.value
        localStorage.setItem('userData', JSON.stringify(userData))
    }
    
    if (sessionStorage.getItem('userData')) {
        const userData = JSON.parse(sessionStorage.getItem('userData'))
        userData.pin_length = pinLength.value
        sessionStorage.setItem('userData', JSON.stringify(userData))
    }
    
    // Also update cookie if used
    const cookieUserData = useCookie('userData')
    if (cookieUserData.value) {
      cookieUserData.value.pin_length = pinLength.value
    }
    
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
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background rounded-lg w-100 ma-8 me-0">
        <div class="d-flex align-center justify-center w-100 h-100 px-10">
          <VImg
            max-width="500"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4 auth-card-hover"
      >
        <VCardText>
          <div class="mb-6 d-flex justify-center">
            <div class="icon-circle elevation-3">
              <VIcon
                icon="tabler-shield-lock"
                size="42"
                color="primary"
              />
            </div>
          </div>
          
          <h4 class="text-h4 font-weight-bold mb-1 text-center">
            Secure Your Access
          </h4>
          <p class="text-body-1 mb-6 text-center">
            Set your temporary daily PIN for quick and secure access.
          </p>

          <!-- PIN Length Selector -->
          <div class="mb-4 d-flex justify-center align-center gap-2">
            <span class="text-body-2 text-medium-emphasis">PIN Length:</span>
            <div class="pin-length-selector">
              <div 
                class="length-option" 
                :class="{ active: pinLength === 4 }"
                @click="pinLength = 4"
              >
                4 Digits
              </div>
              <div 
                class="length-option" 
                :class="{ active: pinLength === 6 }"
                @click="pinLength = 6"
              >
                6 Digits
              </div>
            </div>
          </div>

          <!-- New PIN Input -->
          <div class="mb-6">
            <label class="v-label mb-2 d-block text-body-2 font-weight-medium text-high-emphasis">
              Enter New PIN
            </label>
            <MultiBoxPinInput
              v-model="pin"
              :length="pinLength"
              :error="!!errorMessage"
              class="justify-center"
            />
          </div>

          <!-- Confirm PIN Input -->
          <div class="mb-6">
            <label class="v-label mb-2 d-block text-body-2 font-weight-medium text-high-emphasis">
              Confirm PIN
            </label>
            <MultiBoxPinInput
              v-model="confirmPin"
              :length="pinLength"
              :error="!!errorMessage"
              class="justify-center"
            />
          </div>

          <VBtn
            block
            size="large"
            color="primary"
            :loading="loading"
            class="mb-6"
            @click="submitPin"
          >
            Set Daily PIN
          </VBtn>

          <!-- Messages -->
          <VExpandTransition>
            <div v-if="successMessage || errorMessage">
              <VAlert
                v-if="successMessage"
                type="success"
                variant="tonal"
                class="mb-4 text-start"
                density="compact"
                icon="tabler-check"
              >
                {{ successMessage }}
              </VAlert>
              <VAlert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4 text-start"
                density="compact"
                icon="tabler-alert-circle"
              >
                {{ errorMessage }}
              </VAlert>
            </div>
          </VExpandTransition>

          <div class="d-flex flex-column gap-2 text-center">
            <VBtn
              variant="text"
              color="secondary"
              class="text-body-2"
              @click="skipPin"
            >
              Skip for today ({{ countdown }}s)
            </VBtn>
            
            <VDivider class="my-3 opacity-50" />
            
            <RouterLink
              to="/login"
              class="text-caption text-primary text-decoration-none font-weight-bold"
            >
              Back to Login
            </RouterLink>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>

<style scoped>
/* ICON CIRCLE */
.icon-circle {
  width: 80px;
  height: 80px;
  background: rgb(var(--v-theme-surface));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

/* PIN LENGTH SELECTOR */
.pin-length-selector {
  display: flex;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}

.length-option {
  padding: 6px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.length-option.active {
  background: rgb(var(--v-theme-primary));
  color: white;
  box-shadow: 0 2px 4px rgba(var(--v-theme-primary), 0.3);
}

.length-option:hover:not(.active) {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

/* CARD HOVER EFFECT */
.auth-card-hover {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.auth-card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(var(--v-theme-primary), 0.2);
}
</style>
