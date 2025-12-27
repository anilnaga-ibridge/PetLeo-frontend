

<script setup>
import axios from 'axios'
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'

import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true } })

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

/* API URLs */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const VERIFY_OTP_URL = `${API_BASE}/auth/api/auth/verify-otp/`
const RESEND_OTP_URL = `${API_BASE}/auth/api/auth/resend-otp/`

/* State */
const otp = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

/* Resend OTP */
const resendLoading = ref(false)
const resendSuccess = ref('')
const resendError = ref('')
const timeLeft = ref(60)
const timer = ref(null)

const startTimer = () => {
  clearInterval(timer.value)
  timeLeft.value = 60
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer.value)
    }
  }, 1000)
}

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  clearInterval(timer.value)
})

/* PIN Drawer */
const showSetPinDrawer = ref(false)
const newPin = ref('')
const confirmPin = ref('')
const pinError = ref('')
const pinLoading = ref(false)

/* Images */
const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

/* Store session */
const storeSession = (accessToken, userData, abilityRules, rememberMeValue) => {
  useCookie('accessToken').value = accessToken
  useCookie('userData').value = userData
  useCookie('userAbilityRules').value = abilityRules
  useCookie('auth_user_id').value = userData.id 
  ability.update(abilityRules)

  if (rememberMeValue) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userData', JSON.stringify(userData))
  } else {
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('userData', JSON.stringify(userData))
  }
}

/* ======================================================
   VERIFY OTP
====================================================== */
const verifyOtp = async () => {
  if (isLoading.value) return
  isLoading.value = true

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const sessionId = localStorage.getItem('session_id')
    const rememberMe = localStorage.getItem('remember_me') === 'true'

    if (!sessionId) {
      errorMessage.value = "Session expired. Please resend OTP."
      isLoading.value = false
      return
    }

    const res = await axios.post(VERIFY_OTP_URL, {
      session_id: sessionId,
      otp: otp.value,
      remember_me: rememberMe
    })

    console.log("VERIFY OTP:", res.data)

    /* ===============================
       RESET PIN FLOW
    ================================ */
    if (res.data.reset_pin === true) {
      localStorage.setItem("reset_token", res.data.reset_token)
      localStorage.setItem("reset_pin_phone", res.data.phone_number)

      successMessage.value = res.data.message
      localStorage.removeItem('session_id')

      setTimeout(() => router.replace('/setpin'), 500)
      return
    }

    /* ===============================
       LOGIN FLOW
    ================================ */
    if (res.data.accessToken) {
      const {
        accessToken,
        userData,
        userAbilityRules,
        has_pin,
        require_set_pin
      } = res.data

      storeSession(accessToken, userData, userAbilityRules, rememberMe)

      localStorage.removeItem('session_id')

      if (require_set_pin || !has_pin) {
        showSetPinDrawer.value = true
        isLoading.value = false
        return
      }

      // Explicit redirection based on role
      const role = (userData.role?.name || userData.role || '').toLowerCase()
      if (role === 'employee') {
        await nextTick(() => router.replace('/employee/dashboard'))
      } else if (role === 'organization' || role === 'individual') {
        await nextTick(() => router.replace('/provider/providerhome'))
      } else {
        await nextTick(() => router.replace('/'))
      }
      
      isLoading.value = false
      return
    }

    /* ===============================
       REGISTRATION VERIFIED
    ================================ */
    successMessage.value = res.data.message
    localStorage.removeItem('session_id')

    setTimeout(() => router.replace('/login'), 700)

  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Invalid OTP."
  } finally {
    isLoading.value = false
  }
}

/* ======================================================
   RESEND OTP
====================================================== */
const resendOtp = async () => {
  resendLoading.value = true
  resendError.value = ''
  resendSuccess.value = ''

  try {
    const sessionId = localStorage.getItem('session_id')

    if (!sessionId) {
      resendError.value = "Session expired. Please login again."
      resendLoading.value = false
      return
    }

    const phone = localStorage.getItem('auth_phone')
    const purpose = localStorage.getItem('auth_purpose') || 'login'

    // Payload: prefer session_id, but include phone/purpose as fallback
    const payload = { 
      session_id: sessionId,
      phone_number: phone,
      purpose: purpose
    }

    const res = await axios.post(RESEND_OTP_URL, payload)

    resendSuccess.value = res.data.message || "OTP resent successfully."
    console.log("RESEND OTP:", res.data)
    
    if (res.data.session_id) {
      localStorage.setItem('session_id', res.data.session_id)
    }
    startTimer()

  } catch (err) {
    resendError.value =
      err.response?.data?.detail ||
      "Unable to resend OTP. Try again later."
  } finally {
    resendLoading.value = false
  }
}

/* ======================================================
   SUBMIT PIN (DRAWER)
====================================================== */
const submitPin = async () => {
  pinError.value = ''
  pinLoading.value = true

  if (!newPin.value || !/^\d{4,6}$/.test(newPin.value)) {
    pinError.value = "PIN must be 4-6 digits."
    pinLoading.value = false
    return
  }
  if (newPin.value !== confirmPin.value) {
    pinError.value = "PINs do not match."
    pinLoading.value = false
    return
  }

  try {
    const token = useCookie('accessToken').value
    await axios.post(
      `${API_BASE}/auth/set-pin/`,
      { pin: newPin.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    showSetPinDrawer.value = false
    router.replace('/')

  } catch (err) {
    pinError.value = err.response?.data?.detail || "Failed to set PIN."
  } finally {
    pinLoading.value = false
  }
}

const skipSetPin = () => {
  showSetPinDrawer.value = false
  router.replace('/')
}
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface no-scrollbar">
    
    <!-- Left Illustration -->
    <VCol md="8" class="d-none d-md-flex">
      <div class="position-relative bg-background w-100 h-100 d-flex align-center justify-center">
        <VImg max-width="320" :src="imageVariant" class="mt-10 mb-4 fade-in-image" />
        <img class="auth-footer-mask" :src="authThemeMask" height="150" width="100" />
      </div>
    </VCol>

    <!-- Right Auth Card -->
    <VCol cols="12" md="4" class="d-flex align-center justify-center px-4">
      <VCard flat max-width="480" class="pa-8 rounded-xl auth-card slide-up-card">

        <VCardText class="text-center mb-6">
          <h3 class="text-h4 font-weight-bold mb-2 text-high-emphasis">Verify OTP</h3>
          <p class="text-body-1 text-medium-emphasis">
            Enter the 6-digit code sent to your mobile number
          </p>
        </VCardText>

        <VCardText class="px-0">
          <VAlert v-if="successMessage" type="success" variant="tonal" class="mb-6 rounded-lg border-success">
            {{ successMessage }}
          </VAlert>
          <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-6 rounded-lg border-error">
            {{ errorMessage }}
          </VAlert>

          <VForm @submit.prevent="verifyOtp">
            <div class="mb-8 d-flex justify-center">
              <MultiBoxPinInput
                v-model="otp"
                :length="6"
                :error="!!errorMessage"
                class="otp-input-container"
              />
            </div>

            <VBtn
              block
              type="submit"
              :loading="isLoading"
              color="primary"
              size="x-large"
              variant="flat"
              class="rounded-lg font-weight-bold shadow-primary"
            >
              Verify OTP
            </VBtn>
          </VForm>
        </VCardText>

        <!-- Resend Section with Circular Timer -->
        <div class="d-flex flex-column align-center mt-8">
          
          <div v-if="timeLeft > 0" class="d-flex align-center gap-2 mb-2">
            <VProgressCircular
              :model-value="(timeLeft / 60) * 100"
              color="primary"
              size="24"
              width="3"
              class="mr-2"
            />
            <span class="text-body-2 text-medium-emphasis font-weight-medium">
              Resend code in {{ timeLeft }}s
            </span>
          </div>

          <div v-else class="text-center fade-in">
            <span class="text-body-2 text-medium-emphasis">Didn't receive the code?</span>
            <VBtn
              variant="text"
              color="primary"
              class="ml-2 px-2 font-weight-bold text-body-2"
              :loading="resendLoading"
              @click="resendOtp"
              :ripple="false"
            >
              Resend OTP
            </VBtn>
          </div>

        </div>

        <!-- Resend Alerts -->
        <div class="mt-4">
          <VAlert v-if="resendSuccess" type="success" variant="tonal" density="compact" class="rounded-lg mb-2 text-caption">
            {{ resendSuccess }}
          </VAlert>
          <VAlert v-if="resendError" type="error" variant="tonal" density="compact" class="rounded-lg text-caption">
            {{ resendError }}
          </VAlert>
        </div>

      </VCard>
    </VCol>

    <!-- PIN Drawer (unchanged) -->
    <v-dialog v-model="showSetPinDrawer" persistent max-width="440" transition="dialog-bottom-transition">
      <v-card class="rounded-xl overflow-hidden pin-card" elevation="24">
        
        <!-- Decorative Header -->
        <div class="d-flex justify-center pt-8 pb-6 bg-surface-variant-lighten-1 position-relative overflow-hidden">
          <div class="decorative-circle"></div>
          <div class="rounded-circle bg-white pa-4 elevation-3 z-index-1">
            <VIcon icon="tabler-lock-check" size="42" color="primary" />
          </div>
        </div>

        <v-card-item class="text-center pt-2 pb-2">
          <v-card-title class="text-h5 font-weight-bold text-high-emphasis">
            Secure Your Account
          </v-card-title>
          <v-card-subtitle class="text-body-1 text-medium-emphasis mt-1">
            Create a 4-6 digit PIN for quick access
          </v-card-subtitle>
        </v-card-item>

        <v-card-text class="px-6 pt-2">
          <VAlert
            v-if="pinError"
            type="error"
            variant="tonal"
            icon="tabler-alert-circle"
            class="mb-5 rounded-lg text-caption font-weight-medium"
            closable
          >
            {{ pinError }}
          </VAlert>

          <div class="d-flex flex-column gap-y-4">
            <div>
              <label class="v-label mb-1">New PIN</label>
              <MultiBoxPinInput
                v-model="newPin"
                :length="4"
                :error="!!pinError"
              />
            </div>

            <div>
              <label class="v-label mb-1">Confirm PIN</label>
              <MultiBoxPinInput
                v-model="confirmPin"
                :length="4"
                :error="!!pinError"
              />
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-8 pt-4 d-flex flex-column gap-y-3">
          <v-btn
            block
            color="primary"
            size="x-large"
            variant="flat"
            class="rounded-lg font-weight-bold letter-spacing-1 shadow-primary"
            :loading="pinLoading"
            @click="submitPin"
          >
            Set PIN
          </v-btn>
          
          <v-btn
            block
            variant="text"
            color="secondary"
            size="small"
            class="text-caption text-medium-emphasis"
            @click="skipSetPin"
          >
            Skip for now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </VRow>
</template>

<style scoped>
.modern-input {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 14px !important;
  transition: 0.25s;
}

.modern-input:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: scale(1.02);
}

/* Main Auth Card */
.auth-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.12) !important;
  transition: transform 0.3s ease;
}

/* Animations */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-up-card {
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.fade-in-image {
  animation: fadeIn 0.8s ease-out forwards;
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

.shadow-primary {
  box-shadow: 0 8px 20px -6px rgba(var(--v-theme-primary), 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.shadow-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(var(--v-theme-primary), 0.6);
}

.border-success {
  border: 1px solid rgba(var(--v-theme-success), 0.2);
}

.border-error {
  border: 1px solid rgba(var(--v-theme-error), 0.2);
}

/* Pin Card Specifics */
.pin-card {
  background: white !important;
  border: none;
}

.decorative-circle {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 200px;
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(255,255,255,0) 100%);
  border-radius: 50%;
  z-index: 0;
}

.z-index-1 {
  z-index: 1;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.v-dialog__content {
  backdrop-filter: blur(8px);
}
</style>
