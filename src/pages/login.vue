<script setup>
import axios from 'axios'
import { ref, onMounted, watch } from 'vue'
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
import authAnimal1 from '@images/pages/login-bg-animal-1.jpg'
import authAnimal2 from '@images/pages/login-bg-animal-2.jpg'
import authAnimal3 from '@images/pages/login-bg-animal-3.jpg'
import authAnimal4 from '@images/pages/login-bg-animal-4.jpg'

const authBackgrounds = [
  authAnimal1,
  authAnimal2,
  authAnimal3,
  authAnimal4,
]

const router = useRouter()
const ability = useAbility()

// Dynamic theme-based image variants
const imageVariant = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({ meta: { layout: 'blank', unauthenticatedOnly: true } })

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
const fetchingPinLength = ref(false)

// Watch pinPhone and fetch PIN length dynamically
watch(pinPhone, async (newPhone) => {
  // Reset to default if phone is cleared
  if (!newPhone || newPhone.length < 10) {
    pinLength.value = 4
    return
  }

  // Fetch PIN length for this phone number
  try {
    fetchingPinLength.value = true
    const res = await axios.get(`${API_BASE}/auth/api/auth/check-pin-length/`, {
      params: { phone_number: newPhone }
    })
    
    if (res.data?.pin_length) {
      pinLength.value = res.data.pin_length
      pin.value = '' // Reset PIN when length changes
    } else {
      pinLength.value = 4
    }
  } catch (err) {
    // If endpoint doesn't exist or user not found, default to 4
    console.log('PIN length check failed, defaulting to 4:', err.message)
    pinLength.value = 4
  } finally {
    fetchingPinLength.value = false
  }
})

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
import { useIdleTimer } from '@/composables/useIdleTimer'

// ... imports

const handleLoginSuccess = async data => {
  let { accessToken, userData, userAbilityRules } = data

  // 1. Set credentials and basic user data IMMEDIATELY
  // This ensures permissionStore.fetchPermissions() has access to valid currentData
  useCookie("accessToken").value = accessToken
  useCookie("userData").value = userData
  useCookie("userAbilityRules").value = userAbilityRules
  useCookie("auth_user_id").value = userData.id

  if (rememberMe.value) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userData', JSON.stringify(userData))
    localStorage.setItem('lock_screen_phone', userData.phone_number || userData.phoneNumber || '')
  } else {
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('userData', JSON.stringify(userData))
    sessionStorage.setItem('lock_screen_phone', userData.phone_number || userData.phoneNumber || '')
  }

  // 2. Update Ability for CASL
  ability.update(userAbilityRules)

  // 3. Fetch dynamic permissions via Store
  const permissionStore = usePermissionStore()
  
  // Sync store's reactive state manually to be safe
  permissionStore.userData = userData

  try {
    await permissionStore.fetchPermissions()
  } catch (e) {
    console.error("Permission fetch failed", e)
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
  // Clear all auth data
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('userAbilityRules')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userData')
  sessionStorage.removeItem('userAbilityRules')
  
  // Clear cookies
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null
  useCookie('auth_user_id').value = null
  
  // Reset axios headers
  delete axios.defaults.headers.common["Authorization"]
  
  // Reset permission store if initialized
  const permissionStore = usePermissionStore()

  permissionStore.$reset()
  
  // Clear lock state for fresh login
  const { isLocked } = useIdleTimer()
  isLocked.value = false
})
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper bg-surface h-screen"
  >
    <!-- LEFT PANEL (Cinematic) -->
    <VCol
      md="8"
      class="d-none d-md-flex align-center justify-center position-relative pa-0"
    >
      <VCarousel
        cycle
        interval="3000"
        height="100%"
        hide-delimiters
        :show-arrows="false"
        class="h-100 w-100 carousel-fade"
      >
        <VCarouselItem
          v-for="(item, i) in authBackgrounds"
          :key="i"
          :src="item"
          cover
        />
      </VCarousel>

      <!-- Static Overlay -->
      <div class="position-absolute top-0 left-0 h-100 w-100 d-flex align-end pa-12" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); z-index: 2; pointer-events: none;">
        <div class="text-white">
          <h1 class="text-h2 font-weight-bold mb-4">Welcome to PetLeo</h1>
          <p class="text-h5 font-weight-regular">Premium Veterinary & Pet Care Management</p>
        </div>
      </div>
    </VCol>


    <!-- RIGHT PANEL -->
    <VCol
      cols="12"
      md="4"
      class="d-flex justify-center align-center bg-surface"
    >
      <VCard
        flat
        class="pa-8 w-100 rounded-xl auth-card-hover"
        max-width="480"
      >
        <!--
          ======================
          OTP LOGIN
          ======================= 
        -->
        <template v-if="!showPinLogin">
          <div class="text-center mb-6">
            <VAvatar
              color="primary"
              variant="tonal"
              size="64"
              class="mb-4"
            >
              <VIcon
                icon="tabler-login"
                size="32"
              />
            </VAvatar>
            <h4 class="text-h4 font-weight-bold text-primary mb-2">
              Welcome Back! 👋
            </h4>
            <p class="text-body-1 text-medium-emphasis">
              Please sign-in to your account
            </p>
          </div>

          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-6"
          >
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
            <VCheckbox
              v-model="rememberMe"
              label="Remember me"
              density="compact"
              hide-details
            />
          </div>

          <VBtn
            block
            size="large"
            :loading="isLoading"
            class="mb-6 btn-gradient font-weight-bold"
            @click="sendOtp"
          >
            Send OTP
          </VBtn>

          <div class="text-center">
            <span class="text-body-2 text-medium-emphasis">Or sign in with</span>
            <div class="mt-3 d-flex justify-center gap-4 align-center">
              <VBtn
                variant="text"
                color="primary"
                class="font-weight-bold"
                @click="openPinLogin"
              >
                <VIcon
                  start
                  icon="tabler-lock"
                />
                PIN Code
              </VBtn>
              <span class="text-disabled">|</span>
              <VBtn
                variant="text"
                color="secondary"
                class="font-weight-bold"
                @click="showResetPinDialog = true"
              >
                Forgot PIN?
              </VBtn>
            </div>
          </div>
        </template>


        <!--
          ======================
          PIN LOGIN
          ======================= 
        -->
        <template v-else>
          <div class="text-center mb-6">
            <VAvatar
              color="primary"
              variant="tonal"
              size="64"
              class="mb-4"
            >
              <VIcon
                icon="tabler-lock-open"
                size="32"
              />
            </VAvatar>
            <h4 class="text-h4 font-weight-bold text-primary mb-2">
              Login with PIN
            </h4>
            <p class="text-body-1 text-medium-emphasis">
              Enter your credentials to access
            </p>
          </div>

          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-6"
          >
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
            <VCheckbox
              v-model="rememberMe"
              label="Remember me"
              density="compact"
              hide-details
            />
            <a
              href="#"
              class="text-caption text-primary font-weight-bold"
              @click.prevent="showResetPinDialog = true"
            >
              Forgot PIN?
            </a>
          </div>

          <VBtn
            block
            size="large"
            :loading="pinLoading"
            class="mb-6 btn-gradient font-weight-bold"
            @click="loginWithPin"
          >
            Unlock & Login
          </VBtn>

          <div class="text-center">
            <VBtn
              variant="text"
              color="secondary"
              class="font-weight-medium"
              @click="useOtpInstead"
            >
              <VIcon
                start
                icon="tabler-arrow-left"
              />
              Back to OTP Login
            </VBtn>
          </div>
        </template>


        <VDivider class="my-6" />

        <div class="text-center text-body-2">
          New on our platform?
          <RouterLink
            class="text-primary font-weight-bold ms-1 text-decoration-none"
            :to="{ name: 'register' }"
          >
            Create an account
          </RouterLink>
        </div>
      </VCard>
    </VCol>
  </VRow>


  <!--
    ======================
    RESET PIN POPUP
    ======================= 
  -->
  <VDialog
    v-model="showResetPinDialog"
    persistent
    max-width="420px"
  >
    <VCard class="pa-6 rounded-xl">
      <!-- Title Section -->
      <div class="text-center mb-4">
        <div class="text-h5 font-weight-medium">
          Reset PIN
        </div>
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
