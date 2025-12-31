<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { themeConfig } from '@themeConfig'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'
import { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'

// =============================
// 🔹 Images
// =============================
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const router = useRouter()
const ability = useAbility()

// Dynamic theme-based image variants
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true }})

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const LOGIN_URL = `${API_BASE}/auth/api/auth/login/`
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const RESET_PIN_URL = `${API_BASE}/auth/api/auth/reset-pin/`

// OTP Login State
const form = ref({ phone_number: '' })
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// PIN Login State
const showPinLogin = ref(false)
const pinPhone = ref('')
const pin = ref('')
const pinLoading = ref(false)
const pinLength = ref(4)

// Reset PIN State
const showResetPinDialog = ref(false)
const resetPhone = ref('')
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

const sendOtp = async () => {
  if (!form.value.phone_number) {
    errorMessage.value = 'Phone number is required.'
    return
  }
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    localStorage.setItem('remember_me', rememberMe.value ? 'true' : 'false')
    localStorage.setItem('auth_phone', form.value.phone_number)
    localStorage.setItem('auth_purpose', 'login')

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })

    if (r.data?.session_id) {
      localStorage.setItem('session_id', r.data.session_id)
    }

    successMessage.value = 'OTP sent successfully!'
    setTimeout(() => router.replace('/verifyotp'), 600)
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || 'Failed to send OTP.'
  } finally {
    isLoading.value = false
  }
}

const loginWithPin = async () => {
  if (!pinPhone.value || !pin.value) {
    errorMessage.value = "Phone and PIN are required."
    return
  }

  try {
    pinLoading.value = true
    errorMessage.value = ''

    const res = await axios.post(LOGIN_URL, {
      phone_number: pinPhone.value,
      pin: pin.value,
      remember_me: rememberMe.value,
    })

    if (res.data?.accessToken) {
      handleLoginSuccess(res.data)
      return
    }

    errorMessage.value = res.data?.message || 'Login failed.'
  } catch (err) {
    const data = err.response?.data
    errorMessage.value = data?.detail || data?.message || 'PIN login failed.'
  } finally {
    pinLoading.value = false
  }
}

import { fetchAndMergePermissions } from '@/utils/permissions'

import { getPostLoginRoute } from '@/utils/routeHelpers'
import { usePermissionStore } from '@/stores/permissionStore'

// ... imports

const handleLoginSuccess = async (data) => {
  let { accessToken, userData, userAbilityRules } = data

  // 1. Set token first to allow authenticated API calls
  useCookie("accessToken").value = accessToken
  
  // 2. Fetch dynamic permissions via Store
  const permissionStore = usePermissionStore()
  try {
    await permissionStore.fetchPermissions()
  } catch (e) {
    console.error("Permission fetch failed", e)
  }

  // 3. Store updated userData
  useCookie("userData").value = userData
  useCookie("userAbilityRules").value = userAbilityRules
  useCookie("auth_user_id").value = userData.id

  ability.update(userAbilityRules)

  if (rememberMe.value) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userData', JSON.stringify(userData))
  } else {
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('userData', JSON.stringify(userData))
  }

  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Capability-based redirection
  const targetRoute = getPostLoginRoute(userData)
  router.replace(targetRoute)
}

const sendResetPinOtp = async () => {
  if (!resetPhone.value) {
    resetError.value = "Phone number is required."
    return
  }
  resetLoading.value = true
  try {
    const res = await axios.post(RESET_PIN_URL, { phone_number: resetPhone.value })
    if (res.data.session_id) {
      localStorage.setItem("session_id", res.data.session_id)
      localStorage.setItem("reset_pin_phone", resetPhone.value)
    }
    resetSuccess.value = "OTP sent for PIN reset!"
    setTimeout(() => {
      showResetPinDialog.value = false
      router.push("/verifyotp?mode=reset_pin")
    }, 600)
  } catch (err) {
    resetError.value = err.response?.data?.detail || "Failed to send reset OTP."
  } finally {
    resetLoading.value = false
  }
}

const openPinLogin = () => {
  showPinLogin.value = true
  pinPhone.value = form.value.phone_number
  errorMessage.value = ''
}

const useOtpInstead = () => {
  showPinLogin.value = false
  errorMessage.value = ''
}

onMounted(() => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('userAbilityRules')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userData')
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null
  delete axios.defaults.headers.common["Authorization"]
})
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface h-screen">

    <!-- LEFT PANEL -->
    <VCol md="6" class="d-none d-md-flex align-center justify-center bg-background">
      <div class="text-center px-6">
        <VImg :src="imageVariant" max-width="340" class="auth-illustration mb-4" />
        <img :src="authThemeMask" height="140" width="150%" />
      </div>
    </VCol>

    <!-- RIGHT PANEL -->
    <VCol cols="12" md="6" class="d-flex justify-center align-start pt-12">
      <VCard flat class="pa-8 w-100 rounded-xl glass-login-card" style="max-width:450px;">

        <!-- ======================
             OTP LOGIN
        ======================= -->
        <template v-if="!showPinLogin">
          <div class="text-center mb-6">
            <VAvatar color="primary" variant="tonal" size="64" class="mb-4">
              <VIcon icon="tabler-login" size="32" />
            </VAvatar>
            <h4 class="text-h4 font-weight-bold text-primary mb-2">
              Welcome Back! 👋
            </h4>
            <p class="text-body-1 text-medium-emphasis">
              Please sign-in to your account
            </p>
          </div>

          <VAlert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-6">
            {{ errorMessage }}
          </VAlert>

          <AppTextField 
            v-model.trim="form.phone_number" 
            label="Phone Number" 
            placeholder="Enter your mobile number"
            prepend-inner-icon="tabler-phone" 
            class="mb-4"
          />

          <div class="d-flex align-center justify-space-between mb-6">
            <VCheckbox v-model="rememberMe" label="Remember me" density="compact" hide-details />
          </div>

          <VBtn block size="large" :loading="isLoading" class="mb-6 btn-gradient font-weight-bold" @click="sendOtp">
            Send OTP
          </VBtn>

          <div class="text-center">
            <span class="text-body-2 text-medium-emphasis">Or sign in with</span>
            <div class="mt-3 d-flex justify-center gap-4 align-center">
              <VBtn variant="text" color="primary" @click="openPinLogin" class="font-weight-bold">
                <VIcon start icon="tabler-lock" />
                PIN Code
              </VBtn>
              <span class="text-disabled">|</span>
              <VBtn variant="text" color="secondary" @click="showResetPinDialog = true" class="font-weight-bold">
                Forgot PIN?
              </VBtn>
            </div>
          </div>
        </template>


        <!-- ======================
             PIN LOGIN
        ======================= -->
        <template v-else>
          <div class="text-center mb-6">
            <VAvatar color="primary" variant="tonal" size="64" class="mb-4">
              <VIcon icon="tabler-lock-open" size="32" />
            </VAvatar>
            <h4 class="text-h4 font-weight-bold text-primary mb-2">
              Login with PIN
            </h4>
            <p class="text-body-1 text-medium-emphasis">
              Enter your credentials to access
            </p>
          </div>

          <VAlert v-if="errorMessage" type="error" variant="tonal" density="comfortable" class="mb-6">
            {{ errorMessage }}
          </VAlert>

          <AppTextField 
            v-model.trim="pinPhone" 
            label="Phone Number" 
            placeholder="Enter your mobile number"
            prepend-inner-icon="tabler-phone"
            class="mb-6"
          />
          
          <div class="mb-6">
            <div class="d-flex justify-space-between align-center mb-2">
              <label class="v-label text-body-2 font-weight-medium text-high-emphasis">Enter PIN</label>
            </div>
            <div class="d-flex justify-center">
              <MultiBoxPinInput
                id="pin-input"
                v-model="pin"
                :length="pinLength"
                :error="!!errorMessage"
              />
            </div>
          </div>

          <div class="d-flex align-center justify-space-between mb-6">
            <VCheckbox v-model="rememberMe" label="Remember me" density="compact" hide-details />
            <a href="#" @click.prevent="showResetPinDialog = true" class="text-caption text-primary font-weight-bold">
              Forgot PIN?
            </a>
          </div>

          <VBtn block size="large" :loading="pinLoading" class="mb-6 btn-gradient font-weight-bold" @click="loginWithPin">
            Unlock & Login
          </VBtn>

          <div class="text-center">
            <VBtn variant="text" color="secondary" @click="useOtpInstead" class="font-weight-medium">
              <VIcon start icon="tabler-arrow-left" />
              Back to OTP Login
            </VBtn>
          </div>
        </template>


        <VDivider class="my-6" />

        <div class="text-center text-body-2">
          New on our platform?
          <RouterLink class="text-primary font-weight-bold ms-1 text-decoration-none" :to="{ name: 'register' }">
            Create an account
          </RouterLink>
        </div>

      </VCard>
    </VCol>
  </VRow>


  <!-- ======================
       RESET PIN POPUP
  ======================= -->
<VDialog v-model="showResetPinDialog" persistent max-width="420px">
  <VCard class="pa-6 rounded-xl">

    <!-- Title Section -->
    <div class="text-center mb-4">
      <div class="text-h5 font-weight-medium">Reset PIN</div>
      <p class="text-body-2 text-medium-emphasis mt-1">
        Enter your phone number to receive an OTP and reset your PIN.
      </p>
    </div>

    <!-- Input -->
    <VTextField
      v-model="resetPhone"
      label="Phone Number"
      variant="outlined"
      density="comfortable"
      class="mb-2"
    />

    <!-- Alerts -->
    <VAlert
      v-if="resetError"
      type="error"
      variant="tonal"
      density="comfortable"
      class="mb-2"
    >
      {{ resetError }}
    </VAlert>

    <VAlert
      v-if="resetSuccess"
      type="success"
      variant="tonal"
      density="comfortable"
      class="mb-2"
    >
      {{ resetSuccess }}
    </VAlert>

    <!-- Actions -->
    <div class="d-flex justify-end gap-3 mt-4">
      <VBtn
        variant="text"
        class="text-medium-emphasis"
        @click="showResetPinDialog = false"
      >
        Cancel
      </VBtn>

      <VBtn
        color="primary"
        :loading="resetLoading"
        @click="sendResetPinOtp"
      >
        Send OTP
      </VBtn>
    </div>

  </VCard>
</VDialog>



</template>

<style scoped>
.glass-login-card {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.v-theme--dark .glass-login-card {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3) !important;
}

.glass-login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.2) !important;
}

/* Gradient Button */
.btn-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  color: white !important;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
  filter: brightness(1.1);
}

.gap-4 {
  gap: 16px;
}
</style>
