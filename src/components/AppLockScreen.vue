<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { useIdleTimer } from '@/composables/useIdleTimer'
import { useRouter } from 'vue-router'

const { isLocked } = useIdleTimer()
const router = useRouter()
const pin = ref('')
const loading = ref(false)
const error = ref('')

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const userData = useCookie('userData')
const user = computed(() => userData.value || {})

const unlock = async () => {
  if (pin.value.length < 4) return
  
  loading.value = true
  error.value = ''
  
  try {
    console.log("🔓 Unlocking with:", { pin: pin.value, action: 'reverify' })

    // Send PIN and action. Backend identifies user via Token.
    await axios.post(`${API_BASE}/auth/login-with-pin/`, {
      pin: pin.value,
      action: 'reverify'
    }, {
      headers: { Authorization: `Bearer ${useCookie('accessToken').value}` }
    })
    
    // Unlock success
    isLocked.value = false
    pin.value = ''
    
  } catch (err) {
    console.error("🔓 Unlock Error:", err)
    if (err.response) {
      error.value = err.response.data.detail || "Invalid PIN"
    } else {
      error.value = "Backend not responding"
    }
    pin.value = ''
  } finally {
    loading.value = false
  }
}

const logout = () => {
  isLocked.value = false
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  router.replace('/login')
}
</script>

<template>
  <div v-if="isLocked" class="lock-overlay">
    <div class="lock-content">
      <div class="text-center mb-6">
        <VAvatar color="primary" size="80" class="mb-4 elevation-5">
          <VIcon icon="tabler-lock" size="40" color="white" />
        </VAvatar>
        <h2 class="text-h4 font-weight-bold text-white mb-2">Welcome Back</h2>
        <p class="text-white text-opacity-80">
          {{ user.full_name || 'User' }}
        </p>
      </div>

      <VCard width="360" class="pa-6 rounded-xl elevation-10 glass-card">
        <p class="text-center text-body-2 mb-4 text-medium-emphasis">
          Enter your PIN to unlock screen
        </p>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ error }}
        </VAlert>

        <VTextField
          v-model="pin"
          type="password"
          label="Enter PIN"
          variant="outlined"
          rounded="lg"
          maxlength="6"
          class="mb-4 text-center pin-input"
          autofocus
          @keyup.enter="unlock"
        />

        <VBtn
          block
          color="primary"
          size="large"
          rounded="lg"
          :loading="loading"
          @click="unlock"
        >
          Unlock
        </VBtn>

        <div class="text-center mt-4">
          <VBtn
            variant="text"
            color="error"
            size="small"
            @click="logout"
          >
            Forgot PIN? / Logout
          </VBtn>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.lock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUp 0.3s ease-out;
}

.glass-card {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hide number spinner */
:deep(input::-webkit-outer-spin-button),
:deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>
