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



<!-- 
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
</script> -->


<!-- 
<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const router = useRouter()
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
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const RESEND_OTP_URL = `${API_BASE}/auth/api/auth/resend-otp/`

const refVForm = ref()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = ref({ phone_number: '' })
const rememberMe = ref(false)

const showVerifyPrompt = ref(false)
const resendMessage = ref('')
const resendCountdown = ref(0)
let timer = null

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

    localStorage.setItem('remember_me', rememberMe.value ? 'true' : 'false')

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })

    if (r.data?.session_id) {
      localStorage.setItem('session_id', r.data.session_id)
      localStorage.setItem('auth_phone', form.value.phone_number)
      localStorage.setItem('auth_purpose', 'login')
    }

    successMessage.value = 'OTP sent successfully!'
    setTimeout(() => router.replace('/verifyotp'), 600)
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to send OTP.'
    errorMessage.value = msg
    if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('please verify')) {
      // backend used to block — with our new backend it should auto-switch to auto_verify_login,
      // but keep UX just in case: show verify prompt and offer resend.
      showVerifyPrompt.value = true
    }
  } finally {
    isLoading.value = false
  }
}

const resendVerificationOtp = async () => {
  try {
    const phone = form.value.phone_number
    if (!phone) { errorMessage.value = '⚠️ Missing phone number.'; return }
    const res = await axios.post(RESEND_OTP_URL, { phone_number: phone })
    resendMessage.value = '📩 OTP resent successfully! Please verify your number.'
    startCountdown()
    if (res.data?.session_id) localStorage.setItem('session_id', res.data.session_id)
    setTimeout(() => router.push('/verifyotp'), 600)
  } catch (err) {
    resendMessage.value = err.response?.data?.detail || '❌ Failed to resend OTP.'
  }
}

const startCountdown = () => {
  clearInterval(timer)
  resendCountdown.value = 30
  timer = setInterval(() => {
    if (resendCountdown.value > 0) resendCountdown.value-- ; else clearInterval(timer)
  }, 1000)
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => { if (valid) sendOtp() })
}
</script> -->

<!-- 
<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'

import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

// UI images
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true }})

// API URLs
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const RESEND_OTP_URL = `${API_BASE}/auth/api/auth/resend-otp/`
const LOGIN_PIN_URL = `${API_BASE}/auth/login-with-pin/`

// ----------------------
// STATES FOR OTP LOGIN
// ----------------------
const refVForm = ref()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = ref({ phone_number: '' })
const rememberMe = ref(false)
const showVerifyPrompt = ref(false)
const resendMessage = ref('')
const resendCountdown = ref(0)
let timer = null

// ----------------------
// STATE FOR PIN LOGIN UI
// ----------------------
const showPinLogin = ref(false)     // toggle between OTP and PIN UI
const phone = ref('')               // phone for PIN login
const pin = ref('')                 // pin for PIN login
const loading = ref(false)          // loading for PIN login

// ================
// SEND OTP
// ================
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

    localStorage.setItem('remember_me', rememberMe.value ? 'true' : 'false')

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })
console.log('✅ OTP sent response:', r.data)
    if (r.data?.session_id) localStorage.setItem('session_id', r.data.session_id)

    successMessage.value = 'OTP sent successfully!'
    setTimeout(() => router.replace('/verifyotp'), 600)
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to send OTP.'
    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}

// ================
// RESEND OTP
// ================
const resendVerificationOtp = async () => {
  try {
    const phone = form.value.phone_number
    const res = await axios.post(RESEND_OTP_URL, { phone_number: phone })
    resendMessage.value = '📩 OTP resent successfully!'
    startCountdown()
    if (res.data?.session_id) localStorage.setItem('session_id', res.data.session_id)
    setTimeout(() => router.push('/verifyotp'), 300)
  } catch (err) {
    resendMessage.value = '❌ Failed to resend OTP.'
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
  refVForm.value?.validate().then(({ valid }) => { if (valid) sendOtp() })
}
// =========================
// PIN LOGIN FUNCTION (FIXED)
// =========================
const loginWithPin = async () => {
  if (!phone.value || !pin.value) {
    errorMessage.value = 'Phone and PIN are required.'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    const res = await axios.post(LOGIN_PIN_URL, {
      phone_number: phone.value,
      pin: pin.value,
      remember_me: rememberMe.value,
    })
console.log('PIN login response:', res.data)

    if (res.data?.accessToken) {
      const { accessToken, userData, userAbilityRules } = res.data

      // -----------------------------
      // 1. Update CASL and cookies
      // -----------------------------
      useCookie('userAbilityRules').value = userAbilityRules
      ability.update(userAbilityRules)

      useCookie('userData').value = userData
      useCookie('accessToken').value = accessToken

      // -----------------------------
      // 2. Persist login (local/session)
      // -----------------------------
      if (rememberMe.value) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }

      // -----------------------------
      // 3. WAIT until cookies are ready
      // (Fixes userData undefined on first login)
      // -----------------------------
      await new Promise(resolve => setTimeout(resolve, 30))

      // -----------------------------
      // 4. Redirect to dashboard
      // -----------------------------
      router.replace('/')
      return
    }

    // If backend didn’t return token
    errorMessage.value = res.data?.message || 'Login failed.'

  } catch (err) {
    console.error('PIN login error:', err)
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'PIN login failed.'
  } finally {
    loading.value = false
  }
}

</script> -->

<!-- <script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { themeConfig } from '@themeConfig'

// Images
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true }})

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

/* UI images */
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

/* API URLs */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const LOGIN_PIN_URL = `${API_BASE}/auth/login-with-pin/`

/* ============================
   OTP LOGIN STATE
============================ */
const form = ref({ phone_number: '' })
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/* ============================
   PIN LOGIN STATE
============================ */
const showPinLogin = ref(false)
const pinPhone = ref('')
const pin = ref('')
const pinLoading = ref(false)

/* ============================
   SEND OTP
============================ */
const sendOtp = async () => {
  if (!form.value.phone_number) {
    errorMessage.value = 'Phone number is required.'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    localStorage.setItem('remember_me', rememberMe.value ? 'true' : 'false')

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })

    console.log("OTP sent:", r.data)

    if (r.data?.session_id)
      localStorage.setItem('session_id', r.data.session_id)

    router.replace('/verifyotp')

  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'Failed to send OTP.'
  } finally {
    isLoading.value = false
  }
}

/* ============================
   LOGIN WITH PIN
============================ */
const loginWithPin = async () => {
  if (!pinPhone.value || !pin.value) {
    errorMessage.value = "Phone and PIN are required."
    return
  }

  try {
    pinLoading.value = true
    errorMessage.value = ''

    const res = await axios.post(LOGIN_PIN_URL, {
      phone_number: pinPhone.value,
      pin: pin.value,
      remember_me: rememberMe.value,
    })

    console.log("PIN login response:", res.data)

    if (res.data?.accessToken) {
      const { accessToken, userData, userAbilityRules } = res.data

      useCookie("accessToken").value = accessToken
      useCookie("userData").value = userData
      useCookie("userAbilityRules").value = userAbilityRules

      ability.update(userAbilityRules)

      if (rememberMe.value) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      router.replace('/')
      return
    }

    errorMessage.value = res.data?.message || 'Login failed.'

  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'PIN login failed.'
  } finally {
    pinLoading.value = false
  }
}

/* ============================
   SWITCH VIEW → PIN LOGIN
============================ */
const openPinLogin = () => {
  showPinLogin.value = true
  pinPhone.value = form.value.phone_number  // Auto-fill phone
  errorMessage.value = ''
}

/* ============================
   SWITCH VIEW → OTP LOGIN
============================ */
const useOtpInstead = () => {
  showPinLogin.value = false
  errorMessage.value = ''
}
</script> -->



<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { themeConfig } from '@themeConfig'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'

// Images
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true }})

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

/* UI images */
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

/* API URLs */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const SEND_OTP_URL = `${API_BASE}/auth/api/auth/send-otp/`
const RESET_PIN_URL = `${API_BASE}/auth/reset-pin/`
const LOGIN_PIN_URL = `${API_BASE}/auth/login-with-pin/`

/* ============================
   OTP LOGIN STATE
============================ */
const form = ref({ phone_number: '' })
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/* ============================
   PIN LOGIN STATE
============================ */
const showPinLogin = ref(false)
const pinPhone = ref('')
const pin = ref('')
const pinLength = ref(4)
const pinLoading = ref(false)

/* ============================
   RESET PIN UI STATE
============================ */
const showResetPinDialog = ref(false)
const resetPhone = ref('')
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')


/* ============================
   SEND OTP (LOGIN)
============================ */
const sendOtp = async () => {
  if (!form.value.phone_number) {
    errorMessage.value = 'Phone number is required.'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    localStorage.setItem('remember_me', rememberMe.value ? 'true' : 'false')

    const r = await axios.post(SEND_OTP_URL, {
      phone_number: form.value.phone_number,
      purpose: 'login',
    })

    console.log("OTP sent:", r.data)

    if (r.data?.session_id) {
      localStorage.setItem('session_id', r.data.session_id)
      localStorage.setItem('auth_phone', form.value.phone_number)
      localStorage.setItem('auth_purpose', 'login')
    }

    router.replace('/verifyotp')

  } catch (err) {
    errorMessage.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'Failed to send OTP.'
  } finally {
    isLoading.value = false
  }
}


/* ============================
   RESET PIN — SEND OTP ONCE
============================ */
const sendResetPinOtp = async () => {
  if (!resetPhone.value) {
    resetError.value = "Phone number is required."
    return
  }

  resetLoading.value = true
  resetError.value = ''
  resetSuccess.value = ''

  try {
    const res = await axios.post(RESET_PIN_URL, {
      phone_number: resetPhone.value
    })

    console.log("RESET PIN OTP:", res.data)

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
    resetError.value =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Failed to send reset OTP."
  } finally {
    resetLoading.value = false
  }
}


/* ============================
   LOGIN WITH PIN
============================ */
const loginWithPin = async () => {
  if (!pinPhone.value || !pin.value) {
    errorMessage.value = "Phone and PIN are required."
    return
  }

  try {
    pinLoading.value = true
    errorMessage.value = ''

    const res = await axios.post(LOGIN_PIN_URL, {
      phone_number: pinPhone.value,
      pin: pin.value,
      remember_me: rememberMe.value,
    })

    console.log("PIN login response:", res.data)

    if (res.data?.accessToken) {
      const { accessToken, userData, userAbilityRules } = res.data

      useCookie("accessToken").value = accessToken
      useCookie("userData").value = userData
      useCookie("userAbilityRules").value = userAbilityRules

      ability.update(userAbilityRules)

      if (rememberMe.value) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Explicit redirection based on role
      const role = (userData.role?.name || userData.role || '').toLowerCase()
      if (role === 'employee') {
        router.replace('/employee/dashboard')
      } else if (role === 'organization' || role === 'individual') {
        router.replace('/provider/providerhome')
      } else {
        router.replace('/')
      }
      return
    }

    errorMessage.value = res.data?.message || 'Login failed.'

  } catch (err) {
    console.error(err)
    const data = err.response?.data
    
    if (data?.code === 'PIN_EXPIRED') {
      errorMessage.value = "PIN expired. Please login via OTP to set a new PIN."
      showPinLogin.value = false // Switch to OTP view
      // Ensure phone is set in OTP form
      if (pinPhone.value) {
        form.value.phone_number = pinPhone.value
      }
    } else {
      errorMessage.value =
        data?.detail ||
        data?.message ||
        'PIN login failed.'
    }
  } finally {
    pinLoading.value = false
  }
}


/* ============================
   SWITCH VIEW → PIN LOGIN
============================ */
const openPinLogin = () => {
  showPinLogin.value = true
  pinPhone.value = form.value.phone_number
  errorMessage.value = ''
}

/* ============================
   SWITCH → OTP LOGIN
============================ */
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
  
  // Clear global axios header to prevent sending old token
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
