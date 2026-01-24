<!--
  <script setup>
  import axios from 'axios'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAbility } from '@casl/vue'
  import { useCookie } from '@/@core/composable/useCookie'

  const router = useRouter()
  const ability = useAbility()
  const cookie = useCookie()

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  const LOGIN_PIN_URL = `${API_BASE}/auth/api/auth/login-with-pin/`

  const phone = ref('')
  const pin = ref('')
  const rememberMe = ref(false)
  const loading = ref(false)
  const errorMessage = ref('')

  const loginWithPin = async () => {
  if (!phone.value || !pin.value) { errorMessage.value = 'Phone and PIN are required.'; return }
  try {
  loading.value = true
  const res = await axios.post(LOGIN_PIN_URL, {
  phone_number: phone.value,
  pin: pin.value,
  remember_me: rememberMe.value
  })

  // backend returns same shape as OTP login
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
  errorMessage.value = err.response?.data?.detail || err.response?.data?.message || 'PIN login failed.'
  } finally {
  loading.value = false
  }
  }
  </script>

  <template>
  <VRow class="auth-wrapper justify-center align-center" style="height:100vh;">
  <VCol cols="12" md="4">
  <VCard class="pa-6">
  <h3>Login with PIN</h3>
  <VTextField v-model="phone" label="Phone Number" />
  <VTextField v-model="pin" label="PIN" type="password" />
  <VCheckbox v-model="rememberMe" label="Remember me" />
  <VBtn block @click="loginWithPin" :loading="loading">Login</VBtn>

  <div class="mt-3 text-center">
  <RouterLink :to="{ name: 'reset-pin' }">Forgot PIN?</RouterLink>
  <span class="mx-2">·</span>
  <RouterLink :to="{ name: 'login' }">Use OTP instead</RouterLink>
  </div>

  <VAlert v-if="errorMessage" type="error" class="mt-3">{{ errorMessage }}</VAlert>
  </VCard>
  </VCol>
  </VRow>
  </template> 
-->

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'

const router = useRouter()
const ability = useAbility()
const cookie = useCookie()

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const LOGIN_PIN_URL = `${API_BASE}/auth/api/auth/login-with-pin/`

const phone = ref('')
const pin = ref('')
const pinLength = ref(4)
const rememberMe = ref(false)
const loading = ref(false)
const errorMessage = ref('')

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

      // Optional: If server returns has_pin false for some reason, show hint
      // but normally PIN login shouldn't be allowed unless pin exists.
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
          <label
            class="v-label mb-1"
            for="pin-input"
          >PIN</label>
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
