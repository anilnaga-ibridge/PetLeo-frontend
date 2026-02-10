

<script setup>
import axios from 'axios'
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'
import { getPostLoginRoute } from '@/utils/routeHelpers'
import { usePermissionStore } from '@/stores/permissionStore'
import { useIdleTimer } from '@/composables/useIdleTimer'

import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

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
import authV2VerifyEmailIllustrationLight from '@images/pages/auth-v2-verify-email-illustration-light.png'
import authV2VerifyEmailIllustrationDark from '@images/pages/auth-v2-verify-email-illustration-dark.png'

const authThemeImg = useGenerateImageVariant(authV2VerifyEmailIllustrationLight, authV2VerifyEmailIllustrationDark)

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
    localStorage.setItem('lock_screen_phone', userData.phone_number || userData.phoneNumber || '')
  } else {
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('userData', JSON.stringify(userData))
    sessionStorage.setItem('lock_screen_phone', userData.phone_number || userData.phoneNumber || '')
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

  // Clear any existing lock state initially
  const { isLocked } = useIdleTimer()
  isLocked.value = false

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
      remember_me: rememberMe,
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
        pin_set_today,
      } = res.data

      console.log('🔐 DAILY PIN FLOW DEBUG:')
      console.log('  pin_set_today:', pin_set_today)

      storeSession(accessToken, userData, userAbilityRules, rememberMe)
      localStorage.removeItem('session_id')

      // [UX FIX] If user needs to set PIN, navigate to dedicated setpin page
      // Don't show popup on top of OTP page - that's confusing!
      // DAILY PIN LOGIC:
      // Case 1: PIN unset or not set TODAY -> Show SET PIN screen
      if (!pin_set_today) {
        console.log('⚠️ PIN not set TODAY -> Navigating to PIN setup...')
        // We do NOT lock screen here. We redirect to setup.
        isLocked.value = false 
        
        successMessage.value = "Verification successful! Please set your daily PIN."
        await new Promise(resolve => setTimeout(resolve, 800))
        await router.replace('/setpin')
        isLoading.value = false
        
        return
      }
      
      // Case 2: PIN already set TODAY -> Go directly to Dashboard
      console.log('✅ PIN already set for today -> Going to dashboard')
      isLocked.value = false

      // 2. Fetch dynamic permissions via Store
      const permissionStore = usePermissionStore()
      try {
        await permissionStore.fetchPermissions()
      } catch (e) {
        console.error("Permission fetch failed", e)
      }

      // Capability-based redirection
      const targetRoute = getPostLoginRoute(userData)

      await nextTick(() => router.replace(targetRoute))
      
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
      purpose: purpose,
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
      { headers: { Authorization: `Bearer ${token}` } },
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
  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <!-- Left Illustration -->
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

    <!-- Right Auth Card -->
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
          <!-- Icon -->
          <div class="mb-6 d-flex justify-center">
            <div class="icon-circle elevation-3">
              <VIcon
                icon="tabler-lock-check"
                size="42"
                color="primary"
              />
            </div>
          </div>

          <h4 class="text-h4 font-weight-bold mb-1 text-center">
            Two-Step Verification
          </h4>
          <p class="text-body-1 mb-6 text-center">
            We sent a verification code to your mobile. Enter the code from the mobile in the field below.
          </p>

          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-6 rounded-lg border-success"
            icon="tabler-check"
            closable
          >
            {{ successMessage }}
          </VAlert>
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-6 rounded-lg border-error"
            icon="tabler-alert-circle"
            closable
          >
            {{ errorMessage }}
          </VAlert>

          <VForm @submit.prevent="verifyOtp">
            <div class="mb-6">
              <label class="v-label mb-2 d-block text-body-2 font-weight-medium text-high-emphasis">
                Type your 6 digit security code
              </label>
              <MultiBoxPinInput
                v-model="otp"
                :length="6"
                :error="!!errorMessage"
                class="justify-center"
              />
            </div>

            <VBtn
              block
              type="submit"
              :loading="isLoading"
              color="primary"
              size="large"
              class="mb-6 font-weight-bold"
            >
              Verify my account
            </VBtn>
          </VForm>

          <!-- Resend Section -->
          <div class="d-flex flex-column align-center">
            <div
              v-if="timeLeft > 0"
              class="d-flex align-center gap-2"
            >
              <span class="text-body-2 text-medium-emphasis">
                Resend code in <span class="text-primary font-weight-bold">{{ timeLeft }}s</span>
              </span>
            </div>

            <div
              v-else
              class="text-center fade-in"
            >
              <span class="text-body-2 text-medium-emphasis">Didn't get the code?</span>
              <VBtn
                variant="text"
                color="primary"
                class="px-2 font-weight-bold text-body-2"
                :loading="resendLoading"
                :ripple="false"
                @click="resendOtp"
              >
                Resend
              </VBtn>
            </div>
          </div>

          <!-- Resend Alerts -->
          <div class="mt-4">
            <VAlert
              v-if="resendSuccess"
              type="success"
              variant="tonal"
              density="compact"
              class="rounded-lg mb-2 text-caption"
            >
              {{ resendSuccess }}
            </VAlert>
            <VAlert
              v-if="resendError"
              type="error"
              variant="tonal"
              density="compact"
              class="rounded-lg text-caption"
            >
              {{ resendError }}
            </VAlert>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- PIN Drawer (unchanged) -->
    <VDialog
      v-model="showSetPinDrawer"
      persistent
      max-width="440"
      transition="dialog-bottom-transition"
    >
      <VCard
        class="rounded-xl overflow-hidden pin-card"
        elevation="24"
      >
        <!-- Decorative Header -->
        <div class="d-flex justify-center pt-8 pb-6 bg-surface-variant-lighten-1 position-relative overflow-hidden">
          <div class="decorative-circle" />
          <div class="rounded-circle bg-white pa-4 elevation-3 z-index-1">
            <VIcon
              icon="tabler-lock-check"
              size="42"
              color="primary"
            />
          </div>
        </div>

        <VCardItem class="text-center pt-2 pb-2">
          <VCardTitle class="text-h5 font-weight-bold text-high-emphasis">
            Secure Your Account
          </VCardTitle>
          <VCardSubtitle class="text-body-1 text-medium-emphasis mt-1">
            Create a 4-6 digit PIN for quick access
          </VCardSubtitle>
        </VCardItem>

        <VCardText class="px-6 pt-2">
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
        </VCardText>

        <VCardActions class="px-6 pb-8 pt-4 d-flex flex-column gap-y-3">
          <VBtn
            block
            color="primary"
            size="x-large"
            variant="flat"
            class="rounded-lg font-weight-bold letter-spacing-1 shadow-primary"
            :loading="pinLoading"
            @click="submitPin"
          >
            Set PIN
          </VBtn>
          
          <VBtn
            block
            variant="text"
            color="secondary"
            size="small"
            class="text-caption text-medium-emphasis"
            @click="skipSetPin"
          >
            Skip for now
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
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

/* CARD HOVER EFFECT - MATCHING SET PIN */
.auth-card-hover {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.auth-card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(var(--v-theme-primary), 0.2);
}

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
