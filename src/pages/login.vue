<!-- <script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// Images
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

// Dynamic images based on theme
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

// Page meta
definePage({
  meta: { layout: 'blank', unauthenticatedOnly: true },
})

// Router
const router = useRouter()

// Base URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`

// Form and state
const refVForm = ref()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = ref({
  phone_number: '',
  
})
const rememberMe = ref(false)
// Send OTP
const sendOtp = async () => {
  if (!form.value.phone_number) {
    errorMessage.value = 'Phone number is required.'
    return
  }
  // if (!form.value.privacyPolicies) {
  //   errorMessage.value = 'Please agree to privacy policy before continuing.'
  //   return
  // }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })
     
    console.log('OTP sent response:', r)
    console.log('Response data:', r.data)
    
    if (r.data?.session_id) localStorage.setItem('session_id', r.data.session_id)
    // Save session/token based on Remember Me
    const token = r.data?.session_id
    if (token) {
      if (rememberMe.value) {
        localStorage.setItem('authToken', token)
      } else {
        sessionStorage.setItem('authToken', token)
      }
    }

    successMessage.value = 'OTP sent successfully!'

    setTimeout(async () => {
      await router.replace('/verifyotp');
    }, 1000);
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message ||
      err.response?.data?.detail ||
      'Failed to send OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) sendOtp()
  })
}
</script> -->




<!-- 
<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// =============================
// 🔹 Images
// =============================
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

// Dynamic theme-based image variants
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

// =============================
// 🔹 Page Config
// =============================
definePage({
  meta: { layout: 'blank', unauthenticatedOnly: true },
})

// Router
const router = useRouter()

// =============================
// 🔹 API URLs
// =============================
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const RESEND_OTP_URL = `${API_BASE}/auth/api/auth/resend-otp/`

// =============================
// 🔹 Reactive States
// =============================
const refVForm = ref()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = ref({ phone_number: '' })
const rememberMe = ref(false)

// For verify/resend section
const showVerifyPrompt = ref(false)
const resendMessage = ref('')
const resendCountdown = ref(0)
let timer = null

// =============================
// 🔹 Send OTP (Login Attempt)
// =============================
const sendOtp = async () => {
  if (!form.value.phone_number) {
    errorMessage.value = '📱 Phone number is required.'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    showVerifyPrompt.value = false

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })

    console.log('✅ OTP sent response:', r.data)

    if (r.data?.session_id)
      localStorage.setItem('session_id', r.data.session_id)

    successMessage.value = 'OTP sent successfully!'

    setTimeout(async () => {
      await router.replace('/verifyotp')
    }, 1000)
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.detail ||
      'Failed to send OTP. Please try again.'

    console.error('❌ Login Error:', msg)
    errorMessage.value = msg

    // 🟡 If backend says user not verified → show verification section
    if (
      msg.toLowerCase().includes('not verified') ||
      msg.toLowerCase().includes('please verify your phone number')
    ) {
      showVerifyPrompt.value = true
    }
  } finally {
    isLoading.value = false
  }
}

// =============================
// 🔁 Resend OTP (For Unverified Users)
// =============================
const resendVerificationOtp = async () => {
  try {
    const phone = form.value.phone_number
    if (!phone) {
      errorMessage.value = '⚠️ Missing phone number.'
      return
    }

    const res = await axios.post(RESEND_OTP_URL, { phone_number: phone })

    resendMessage.value =
      '📩 OTP resent successfully! Please verify your number.'
    startCountdown()

    // Navigate to OTP verification page
    localStorage.setItem('session_id', res.data.session_id)
    setTimeout(() => router.push('/verifyotp'), 800)
  } catch (err) {
    resendMessage.value =
      err.response?.data?.detail ||
      '❌ Failed to resend OTP. Please try again.'
  }
}

const startCountdown = () => {
  clearInterval(timer)
  resendCountdown.value = 30
  timer = setInterval(() => {
    if (resendCountdown.value > 0) resendCountdown.value--
    else clearInterval(timer)
  }, 1000)
}

// =============================
// 🔹 Form Submit
// =============================
const onSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) sendOtp()
  })
}
</script> -->




<script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// Images (keep as-is)
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

// Dynamic image variant
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({
  meta: { layout: 'blank', unauthenticatedOnly: true },
})

const router = useRouter()

// API
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const RESEND_OTP_URL = `${API_BASE}/auth/api/auth/resend-otp/`

// State
const refVForm = ref()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = ref({ phone_number: '' })
const rememberMe = ref(false)

// Unverified UX
const showVerifyPrompt = ref(false)
const resendMessage = ref('')
const resendCountdown = ref(0)
let timer = null

// Send OTP (login attempt)
const sendOtp = async () => {
  if (!form.value.phone_number) {
    errorMessage.value = '📱 Phone number is required.'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''
    showVerifyPrompt.value = false

    // Save the remember_me choice temporarily (used later on verify)
    localStorage.setItem('remember_me', rememberMe.value ? 'true' : 'false')

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })

    console.log('✅ OTP sent response:', r.data)

    if (r.data?.session_id) {
      // Save session id (verify page reads it)
      localStorage.setItem('session_id', r.data.session_id)
    }

    successMessage.value = 'OTP sent successfully!'
    setTimeout(async () => {
      await router.replace('/verifyotp')
    }, 800)
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.detail ||
      'Failed to send OTP. Please try again.'

    console.error('❌ Login Error:', msg)
    errorMessage.value = msg

    // show verification UI if backend indicates not verified
    if (
      msg.toLowerCase().includes('not verified') ||
      msg.toLowerCase().includes('please verify your phone number')
    ) {
      showVerifyPrompt.value = true
    }
  } finally {
    isLoading.value = false
  }
}

// Resend OTP for unverified users (unchanged except using same API)
const resendVerificationOtp = async () => {
  try {
    const phone = form.value.phone_number
    if (!phone) {
      errorMessage.value = '⚠️ Missing phone number.'
      return
    }

    const res = await axios.post(RESEND_OTP_URL, { phone_number: phone })

    resendMessage.value = '📩 OTP resent successfully! Please verify your number.'
    startCountdown()

    if (res.data?.session_id) {
      localStorage.setItem('session_id', res.data.session_id)
    }

    setTimeout(() => router.push('/verifyotp'), 800)
  } catch (err) {
    resendMessage.value =
      err.response?.data?.detail ||
      '❌ Failed to resend OTP. Please try again.'
  }
}

const startCountdown = () => {
  clearInterval(timer)
  resendCountdown.value = 30
  timer = setInterval(() => {
    if (resendCountdown.value > 0) resendCountdown.value--
    else clearInterval(timer)
  }, 1000)
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid) sendOtp()
  })
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3 mb-4 ">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">{{ themeConfig.app.title }}</h1>
    </div>
  </RouterLink>

<VRow no-gutters class="auth-wrapper bg-surface h-screen">
  <!-- Illustration -->
  <VCol
    md="6"
    class="d-none d-md-flex align-center justify-center bg-background"
    style="height: 100vh;"
  >
    <div class="text-center px-6">
      <VImg
        max-width="340"
        :src="imageVariant"
        class="auth-illustration mb-4"
        style="filter: drop-shadow(0 3px 8px rgba(0,0,0,0.1));"
      />
      <img
        class="auth-footer-mask"
        :src="authThemeMask"
        alt="mask"
        height="140"
        width="150%"
        style="object-fit: cover;"
      />
    </div>
  </VCol>

  
  <!-- Login Form -->
<VCol
  cols="12"
  md="6"
  class="d-flex justify-center"
  style="height: 100vh; background: linear-gradient(180deg, #ffffff, #fafaff); align-items: flex-start; padding-top: 5vh;"
>
  <VCard
    flat
    class="pa-8 w-100 mx-auto rounded-xl shadow-md"
    style="max-width: 420px; background-color: white;"
  >
    <VCardTitle class="text-h5 mb-2 text-primary font-weight-bold text-center">
      🔑 Login via OTP
    </VCardTitle>

    <VCardSubtitle
      class="mb-4 text-medium-emphasis text-center"
      style="font-size: 0.95rem;"
    >
      Enter your phone number to receive a one-time password.
    </VCardSubtitle>

    <!-- Alerts -->
    <VAlert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-3 text-center"
    >
      {{ successMessage }}
    </VAlert>
    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-3 text-center"
    >
      {{ errorMessage }}
    </VAlert>

    <!-- Form -->
    <VForm ref="refVForm" @submit.prevent="onSubmit">
      <AppTextField
        v-model="form.phone_number"
        label="Phone Number"
        placeholder="+91 9876543210"
        prepend-inner-icon="tabler-phone"
        variant="outlined"
        class="rounded-xl"
      />

      <VCheckbox v-model="rememberMe" label="Remember me" class="mt-3" />

      <VBtn
        block
        type="submit"
        color="primary"
        class="mt-4 rounded-lg font-weight-semibold elevation-2"
        :loading="isLoading"
      >
        Send OTP
      </VBtn>
    </VForm>

    <!-- 🟡 Unverified User Section -->
    <div
      v-if="showVerifyPrompt"
      class="mt-6 pa-4 rounded-lg bg-amber-lighten-5 border border-amber-darken-2"
    >
      <div class="d-flex align-center mb-2">
        <VIcon icon="tabler-alert-triangle" color="amber-darken-2" class="mr-2" />
        <span class="text-amber-darken-3 font-weight-medium">
          Your account is not verified yet.
        </span>
      </div>

      <VBtn
        color="success"
        variant="flat"
        block
        class="rounded-lg font-weight-semibold"
        :disabled="resendCountdown > 0"
        @click="resendVerificationOtp"
      >
        <template v-if="resendCountdown > 0">
          <VIcon icon="tabler-clock" size="18" class="mr-1" />
          Resend in {{ resendCountdown }}s
        </template>
        <template v-else>
          <VIcon icon="tabler-send" size="18" class="mr-1" />
          Verify Now
        </template>
      </VBtn>

      <div v-if="resendMessage" class="text-success text-caption mt-2 text-center">
        {{ resendMessage }}
      </div>
    </div>

    <!-- Footer -->
    <VDivider class="my-6" />
    <div class="text-center">
      <span>New on our platform?</span>
      <RouterLink class="text-primary ms-1" :to="{ name: 'register' }">
        Create an account
      </RouterLink>
    </div>
  </VCard>
</VCol>

</VRow>

</template>

<style lang="scss" scoped>
.auth-wrapper {
  padding: 2rem 1rem;
}
.auth-illustration {
  max-width: 100%;
  height: auto;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.auth-wrapper {
  height: 100vh;
  overflow: hidden;
}

</style>
