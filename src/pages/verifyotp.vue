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

<script setup>
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
</script>

<template >
  <!-- <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">{{ themeConfig.app.title }}</h1>
    </div>
  </RouterLink> -->

  <VRow no-gutters class="auth-wrapper bg-surface no-scrollbar">
    <VCol md="8" class="d-none d-md-flex ">
      <div class="position-relative bg-background w-100 me-0">
        <div class="d-flex align-center justify-center w-100 h-100" style="padding-inline: 100px;">
          <VImg max-width="300" :src="imageVariant" class="auth-illustration mt-16 mb-2" />
        </div>
        <img class="auth-footer-mask" :src="authThemeMask" height="150" width="100" />
      </div>
    </VCol>

    <VCol cols="12" md="4" class="d-flex align-center justify-center">
      <VCard flat :max-width="500"  class="pa-4">
        <VCardText>
          <h4 class="text-h4 mb-1">Verify OTP 🔒</h4>
          <p class="mb-0">Enter the OTP sent to your phone.</p>
        </VCardText>

        <VCardText>
          <VAlert v-if="successMessage" type="success" variant="tonal" class="mb-4">{{ successMessage }}</VAlert>
          <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</VAlert>

          <VForm @submit.prevent="verifyOtp">
            <VRow>
              <VCol cols="12">
                <!-- <AppTextField v-model="otp" label="Enter OTP" placeholder="1234" maxlength="6" /> -->
                 <AppTextField
                      v-model="otp"
                      label="Enter OTP"
                      placeholder="1234"
                      maxlength="6"
                      :rules="[v => (v?.length || 0) === 6 || 'OTP must be 6 digits']"
                    />
              </VCol>
              <VCol cols="12">
                <VBtn block type="submit" :loading="isLoading">Verify OTP</VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCol cols="12" class="text-center text-base">
                <span>Generate OTP ? </span>
                <RouterLink class="text-primary ms-1" :to="{ name: 'login' }">Sign in instead</RouterLink>
              </VCol>

      </VCard>
    </VCol>
  </VRow>
</template>
