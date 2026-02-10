<script setup>
import axios from 'axios'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const LOGIN_PIN_URL = `${API_BASE}/auth/api/auth/login-with-pin/`
const USER_INFO_URL = `${API_BASE}/auth/api/auth/user-info/` // Endpoint to get user info by phone

const phone = ref('')
const pin = ref('')
const pinLength = ref(4) // Default to 4
const rememberMe = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const fetchingPinLength = ref(false)

// Watch phone number and fetch PIN length when valid
watch(phone, async (newPhone) => {
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
      // User doesn't have a PIN set, default to 4
      pinLength.value = 4
    }
  } catch (err) {
    // If endpoint doesn't exist or user not found, default to 4
    pinLength.value = 4
  } finally {
    fetchingPinLength.value = false
  }
})

const togglePinLength = () => {
  pinLength.value = pinLength.value === 4 ? 6 : 4
  pin.value = '' // Reset PIN when toggling
}

const loginWithPin = async () => {
  if (!phone.value || !pin.value) { errorMessage.value = 'Phone and PIN are required.' 

    return }
  try {
    loading.value = true
    errorMessage.value = ''

    const res = await axios.post(LOGIN_PIN_URL, {
      phone_number: phone.value,
      pin: pin.value,
      remember_me: rememberMe.value,
    })

    if (res.data?.accessToken) {
      const { accessToken, userData, userAbilityRules } = res.data

      useCookie('userAbilityRules').value = userAbilityRules
      ability.update(userAbilityRules)
      useCookie('userData').value = userData
      useCookie('accessToken').value = accessToken

      if (rememberMe.value) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('userData', JSON.stringify(userData))
      } else {
        sessionStorage.setItem('accessToken', accessToken)
        sessionStorage.setItem('userData', JSON.stringify(userData))
      }

      router.replace('/')
    } else {
      errorMessage.value = res.data?.message || 'Login failed.'
    }
  } catch (err) {
    console.error('PIN login error', err)
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || 'PIN login failed.'
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
      <VCard class="pa-6">
        <h3>Login with PIN</h3>

        <VTextField
          v-model="phone"
          label="Phone Number"
          placeholder="+91 9876543210"
        />
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-1">
            <label
              class="v-label"
              for="pin-input"
            >PIN</label>
            <span 
              class="text-xs text-primary cursor-pointer font-weight-medium"
              @click="togglePinLength"
            >
              {{ pinLength === 4 ? 'Have a 6-digit PIN?' : 'Use 4-digit PIN' }}
            </span>
          </div>
          <MultiBoxPinInput
            id="pin-input"
            v-model="pin"
            :length="pinLength"
            :error="!!errorMessage"
          />
        </div>
        <VCheckbox
          v-model="rememberMe"
          label="Remember me"
        />
        <VBtn
          block
          :loading="loading"
          @click="loginWithPin"
        >
          Login
        </VBtn>

        <div class="mt-3 text-center">
          <RouterLink :to="{ name: 'reset-pin' }">
            Forgot PIN?
          </RouterLink>
          <span class="mx-2">·</span>
          <RouterLink :to="{ name: 'login' }">
            Use OTP instead
          </RouterLink>
        </div>

        <VAlert
          v-if="errorMessage"
          type="error"
          class="mt-3"
        >
          {{ errorMessage }}
        </VAlert>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  user-select: none;
}

.text-xs {
  font-size: 0.75rem;
}
</style>
