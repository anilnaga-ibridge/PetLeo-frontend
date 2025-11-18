<!-- <script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { useCookieStore } from '@/stores/cookieStore'   // ✅ IMPORT FIXED

// Images
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'

// Dynamic assets
const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const route = useRoute()
const router = useRouter()
const ability = useAbility()

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})



const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const VERIFY_OTP_URL = `${API_BASE}/auth/api/auth/verify-otp/`

const otp = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const verifyOtp = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      errorMessage.value = 'Session expired or missing. Please resend OTP.'
      console.error('verifyOtp: session_id missing')
      isLoading.value = false
      return
    }

    const res = await axios.post(VERIFY_OTP_URL, {
      session_id: sessionId,
      otp: otp.value,
    })

    console.log('OTP Verification Response:', res)
    console.log('OTP Verification data:', res.data)
    const { accessToken, userData, userAbilityRules } = res.data

    useCookie('userAbilityRules').value = userAbilityRules
    ability.update(userAbilityRules)
    useCookie('userData').value = userData
    useCookie('accessToken').value = accessToken
    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })

  } catch (err) {
    console.error('OTP Verification Error:', err)
    const backendMsg = err?.response?.data?.message || err?.response?.data?.detail
    errorMessage.value = backendMsg || 'Invalid OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script> -->
<!-- <script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookieStore } from '@/stores/cookieStore'   // ✅ Using Pinia cookie store
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// Images
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
import { useCookie } from '@/@core/composable/useCookie'

const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const router = useRouter()
const route = useRoute()
const ability = useAbility()
const cookieStore = useCookieStore()   // ✅ Access store instance

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const VERIFY_OTP_URL = `${API_BASE}/auth/api/auth/verify-otp/`

const otp = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const verifyOtp = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      errorMessage.value = 'Session expired. Please resend OTP.'
      return
    }

    const res = await axios.post(VERIFY_OTP_URL, {
      session_id: sessionId,
      otp: otp.value,
    })
    console.log('res', res);

    if (res.data?.accessToken) {
    const { accessToken, userData, userAbilityRules } = res.data
    // useCookie('userAbilityRules').value = userAbilityRules;
    // ability.update(userAbilityRules)

    // useCookie('userData').value = userData
    // useCookie('accessToken').value = accessToken


    // await nextTick(() => {
    //   router.replace(route.query.to ? String(route.query.to) : '/')
    // })

    useCookie('userAbilityRules').value = userAbilityRules

    ability.update(userAbilityRules)
    useCookie('userData').value = userData
    useCookie('accessToken').value = accessToken
    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })
    } else {
       successMessage.value = res.data?.message || 'OTP verified successfully!'
       setTimeout(() => {
         router.replace({ name: 'login' })  // Make sure your login route name is correct
        }, 1500)
    }

  } catch (err) {
    console.error('OTP Verification Error:', err)
    const backendMsg = err?.response?.data?.message || err?.response?.data?.detail
    errorMessage.value = backendMsg || 'Invalid OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script> -->

<!-- <script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookieStore } from '@/stores/cookieStore'   // ✅ Using Pinia cookie store
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

// Images
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
import { useCookie } from '@/@core/composable/useCookie'

const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const router = useRouter()
const route = useRoute()
const ability = useAbility()
const cookieStore = useCookieStore()   // ✅ Access store instance

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const VERIFY_OTP_URL = `${API_BASE}/auth/api/auth/verify-otp/`

const otp = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const verifyOtp = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const sessionId = localStorage.getItem('session_id')
    const rememberMeValue = localStorage.getItem('remember_me') === 'true'

    if (!sessionId) {
      errorMessage.value = 'Session expired. Please resend OTP.'
      return
    }

    const res = await axios.post(VERIFY_OTP_URL, {
      session_id: sessionId,
      otp: otp.value,
      remember_me: rememberMeValue,
    })
    console.log('res', res);

    if (res.data?.accessToken) {
    const { accessToken, userData, userAbilityRules } = res.data
    // useCookie('userAbilityRules').value = userAbilityRules;
    // ability.update(userAbilityRules)

    // useCookie('userData').value = userData
    // useCookie('accessToken').value = accessToken


    // await nextTick(() => {
    //   router.replace(route.query.to ? String(route.query.to) : '/')
    // })

    useCookie('userAbilityRules').value = userAbilityRules

    ability.update(userAbilityRules)
    useCookie('userData').value = userData
    useCookie('accessToken').value = accessToken

    if (rememberMeValue) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }

      localStorage.removeItem('session_id')
      localStorage.removeItem('remember_me')
    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })
    } else {
       successMessage.value = res.data?.message || 'OTP verified successfully!'
        localStorage.removeItem('session_id')
        localStorage.removeItem('remember_me')

       setTimeout(() => {
         router.replace({ name: 'login' })  // Make sure your login route name is correct
        }, 1500)
    }

  } catch (err) {
    console.error('OTP Verification Error:', err)
    const backendMsg = err?.response?.data?.message || err?.response?.data?.detail
    errorMessage.value = backendMsg || 'Invalid OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script> -->
<!-- 
<script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'

const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const router = useRouter()
const route = useRoute()
const ability = useAbility()
const cookie = useCookie()

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true } })

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const VERIFY_OTP_URL = `${API_BASE}/auth/api/auth/verify-otp/`

const otp = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const verifyOtp = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const sessionId = localStorage.getItem('session_id')
    const rememberMeValue = localStorage.getItem('remember_me') === 'true'

    if (!sessionId) { errorMessage.value = 'Session expired. Please resend OTP.'; isLoading.value=false; return }

    const res = await axios.post(VERIFY_OTP_URL, {
      session_id: sessionId,
      otp: otp.value,
      remember_me: rememberMeValue,
    })

    // If backend returned accessToken => login (PIN or OTP login)
    if (res.data?.accessToken) {
      const { accessToken, userData, userAbilityRules } = res.data

      // update ability & cookies
      useCookie('userAbilityRules').value = userAbilityRules
      ability.update(userAbilityRules)
      useCookie('userData').value = userData
      useCookie('accessToken').value = accessToken

      // persist token based on remember_me
      if (rememberMeValue) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }

      // Clean up session keys
      localStorage.removeItem('session_id')
      localStorage.removeItem('remember_me')

      // If backend tells it's first time and wants set-pin, it could return a message.
      // We'll route normally to root. If you want to force set-pin for first-time users,
      // backend should return a flag like "require_set_pin": true. For now, check message:
      const msg = (res.data?.message || '').toLowerCase()
      if (msg.includes('pin') || msg.includes('set pin') || msg.includes('account verified and logged in')) {
        // If you prefer to force set-pin after first login, you can change condition
      }

      await nextTick(() => {
        router.replace(route.query.to ? String(route.query.to) : '/')
      })
      return
    }

    // If no accessToken -> likely registration verification: show message and redirect to login
    successMessage.value = res.data?.message || 'OTP verified successfully!'
    // Clean up
    localStorage.removeItem('session_id')
    localStorage.removeItem('remember_me')

    // After registration verify we redirect to login (user should login to receive tokens then set PIN)
    setTimeout(() => router.replace({ name: 'login' }), 1000)

  } catch (err) {
    console.error('OTP Verification Error:', err)
    const backendMsg = err?.response?.data?.message || err?.response?.data?.detail
    errorMessage.value = backendMsg || 'Invalid OTP. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script> -->

<!-- <script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'

/* Initialize */
definePage({ meta: { layout: 'blank', unauthenticatedOnly: true } })

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

/* API URLs */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const VERIFY_OTP_URL = `${API_BASE}/auth/api/auth/verify-otp/`

/* State */
const otp = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

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

/* Store session for logged in user */
const storeSession = (accessToken, userData, abilityRules, rememberMeValue) => {
  useCookie('accessToken').value = accessToken
  useCookie('userData').value = userData
  useCookie('userAbilityRules').value = abilityRules
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

      // Save reset token for /setpin
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

      // If PIN must be set → Open drawer
      if (require_set_pin || !has_pin) {
        showSetPinDrawer.value = true
        isLoading.value = false
        return
      }

      // Normal login
      await nextTick(() => router.replace('/'))
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
    const res = await axios.post(
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
</script> -->

<script setup>
import axios from 'axios'
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

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

      await nextTick(() => router.replace('/'))
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

    const res = await axios.post(RESEND_OTP_URL, { session_id: sessionId })

    resendSuccess.value = res.data.message || "OTP resent successfully."
console.log("RESEND OTP:", res.data)
    if (res.data.session_id) {
      localStorage.setItem('session_id', res.data.session_id)
    }

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
        <VImg max-width="320" :src="imageVariant" class="mt-10 mb-4" />
        <img class="auth-footer-mask" :src="authThemeMask" height="150" width="100" />
      </div>
    </VCol>

    <!-- Right Auth Card -->
    <VCol cols="12" md="4" class="d-flex align-center justify-center px-4">
      <VCard flat max-width="460" class="pa-6 elevation-1 rounded-lg">

        <VCardText class="text-center mb-4">
          <h3 class="text-h5 font-weight-medium mb-1">Verify OTP</h3>
          <p class="text-body-2 text-medium-emphasis">
            Enter the 6-digit code sent to your mobile number
          </p>
        </VCardText>

        <VCardText>
          <VAlert v-if="successMessage" type="success" class="mb-4 rounded-lg">
            {{ successMessage }}
          </VAlert>
          <VAlert v-if="errorMessage" type="error" class="mb-4 rounded-lg">
            {{ errorMessage }}
          </VAlert>

          <VForm @submit.prevent="verifyOtp">
            <AppTextField
              v-model="otp"
              label="Enter OTP"
              maxlength="6"
              class="mb-4"
              hide-details="auto"
            />

            <VBtn
              block
              type="submit"
              :loading="isLoading"
              rounded="lg"
              class="py-3 text-body-1"
            >
              Verify OTP
            </VBtn>
          </VForm>
        </VCardText>

        <!-- Resend Section -->
        <div class="text-center mt-4">
          <span class="text-medium-emphasis">Didn't receive the code?</span>

          <VBtn
            variant="text"
            color="primary"
            size="small"
            class="ml-1 text-decoration-underline"
            :loading="resendLoading"
            @click="resendOtp"
          >
            Resend OTP
          </VBtn>
        </div>

        <!-- Resend Alerts -->
        <div class="mt-2 px-4">
          <VAlert v-if="resendSuccess" type="success" class="rounded-lg mb-2" variant="tonal">
            {{ resendSuccess }}
          </VAlert>
          <VAlert v-if="resendError" type="error" class="rounded-lg" variant="tonal">
            {{ resendError }}
          </VAlert>
        </div>

      </VCard>
    </VCol>

    <!-- PIN Drawer -->
    <v-dialog v-model="showSetPinDrawer" persistent max-width="520">
      <v-card class="pa-6 rounded-xl" elevation="12" style="backdrop-filter: blur(24px);">

        <v-card-title class="text-h5 font-weight-semibold text-center mb-1">
          🔐 Set Your PIN
        </v-card-title>

        <p class="text-body-2 text-medium-emphasis text-center mb-4">
          Create your secure PIN to enable quick login
        </p>

        <VAlert v-if="pinError" type="error" class="mb-4 rounded-lg" variant="tonal">
          {{ pinError }}
        </VAlert>

        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="newPin"
              type="password"
              label="Enter New PIN"
              maxlength="6"
              variant="outlined"
              rounded="lg"
              density="comfortable"
              prepend-inner-icon="tabler-lock"
              append-inner-icon="tabler-eye"
              class="modern-input mb-4"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              v-model="confirmPin"
              type="password"
              label="Confirm PIN"
              maxlength="6"
              variant="outlined"
              rounded="lg"
              density="comfortable"
              prepend-inner-icon="tabler-lock-check"
              append-inner-icon="tabler-eye"
              class="modern-input"
              hide-details="auto"
            />
          </v-col>
        </v-row>

        <v-card-actions class="mt-4 d-flex justify-space-between">
          <v-btn variant="text" class="text-body-2 text-medium-emphasis" @click="skipSetPin">
            Skip for now
          </v-btn>

          <v-btn
            color="primary"
            rounded="lg"
            size="large"
            elevation="4"
            class="px-8"
            :loading="pinLoading"
            @click="submitPin"
          >
            Save PIN
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

.v-card {
  background: rgba(245, 247, 255, 0.7) !important;
  border: 1px solid rgba(220, 225, 255, 0.45);
}

.v-dialog__content {
  backdrop-filter: blur(24px);
}
</style>
