<script setup>
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { authApi } from '@/plugins/axios'

// State for PIN lengths
const newPinLength = ref(4) // Default to 4 digits for new PIN
const currentPinLength = ref(4) // Default to 4 digits for current PIN

// State for PIN digits (arrays)
const oldPinDigits = ref(Array(4).fill(''))
const newPinDigits = ref(Array(4).fill(''))
const confirmPinDigits = ref(Array(4).fill(''))

// Fetch user data on mount to get pin_length
onMounted(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    if (userData.pin_length) {
        currentPinLength.value = userData.pin_length
        oldPinDigits.value = Array(userData.pin_length).fill('')
    }
})

// Visibility toggles
const isOldPinVisible = ref(false)
const isNewPinVisible = ref(false)
const isConfirmPinVisible = ref(false)

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Forgot PIN state
const showForgotPinDialog = ref(false)
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

const smsVerificationNumber = ref('+1(968) 819-2547')
const isTwoFactorDialogOpen = ref(false)

// Watchers
watch(newPinLength, (newLen) => {
  newPinDigits.value = Array(newLen).fill('')
  confirmPinDigits.value = Array(newLen).fill('')
})

watch(currentPinLength, (newLen) => {
    oldPinDigits.value = Array(newLen).fill('')
})


// Focus management for digit inputs
const focusNext = (event, index, type) => {
  const target = event.target
  const val = target.value
  
  if (val && !isNaN(val)) {
    // Determine which array to use
    let digitsArray
    if (type === 'old') digitsArray = oldPinDigits
    else if (type === 'new') digitsArray = newPinDigits
    else if (type === 'confirm') digitsArray = confirmPinDigits

    // Update value manualy to ensure it's just one digit (in case of paste)
    if (val.length > 1) {
      digitsArray.value[index] = val.slice(-1)
    } else {
      digitsArray.value[index] = val
    }

    // Move focus
    if (index < digitsArray.value.length - 1) {
      const nextInput = document.getElementById(`${type}-pin-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  } else {
    // clear invalid input
    if (type === 'old') oldPinDigits.value[index] = ''
    else if (type === 'new') newPinDigits.value[index] = ''
    else if (type === 'confirm') confirmPinDigits.value[index] = ''
  }
}

const handleBackspace = (event, index, type) => {
  if (event.key === 'Backspace') {
    let digitsArray
    if (type === 'old') digitsArray = oldPinDigits
    else if (type === 'new') digitsArray = newPinDigits
    else if (type === 'confirm') digitsArray = confirmPinDigits

    // If current is empty, move back
    if (!digitsArray.value[index] && index > 0) {
      const prevInput = document.getElementById(`${type}-pin-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
        // Optional: clear previous on move back? Standard is usually yes or just move
      }
    } else {
      // just clear current
      digitsArray.value[index] = ''
    }
  }
}

const handlePaste = (event, type) => {
  event.preventDefault()
  const pasteData = event.clipboardData.getData('text')
  if (!/^\d+$/.test(pasteData)) return // only digits

  let digitsArray
  if (type === 'old') digitsArray = oldPinDigits
  else if (type === 'new') digitsArray = newPinDigits
  else if (type === 'confirm') digitsArray = confirmPinDigits

  const maxLength = digitsArray.value.length
  const digits = pasteData.slice(0, maxLength).split('')
  
  digits.forEach((digit, i) => {
     digitsArray.value[i] = digit
  })
  
  // Focus last filled
  const lastIndex = Math.min(digits.length, maxLength) - 1
  if (lastIndex >= 0) {
     const lastInput = document.getElementById(`${type}-pin-${lastIndex}`)
     if (lastInput) lastInput.focus()
  }
}

const changePin = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  
  const oldPinStr = oldPinDigits.value.join('')
  const newPinStr = newPinDigits.value.join('')
  const confirmPinStr = confirmPinDigits.value.join('')

  if (oldPinStr.length !== currentPinLength.value) {
      errorMessage.value = `Current PIN must be ${currentPinLength.value} digits`
      return
  }

  if (newPinStr.length !== newPinLength.value || confirmPinStr.length !== newPinLength.value) {
    errorMessage.value = `New PIN must be ${newPinLength.value} digits`
    return
  }

  if (newPinStr !== confirmPinStr) {
    errorMessage.value = "New PINs do not match"
    return
  }

  loading.value = true
  try {
    const response = await authApi.post('/api/auth/change-pin/', {
      old_pin: oldPinStr,
      new_pin: newPinStr,
      confirm_new_pin: confirmPinStr,
    })

    successMessage.value = response.data.message || "PIN changed successfully!"
    
    // Update storages with new PIN length
    if (localStorage.getItem('userData')) {
        const userData = JSON.parse(localStorage.getItem('userData'))
        userData.pin_length = newPinLength.value
        localStorage.setItem('userData', JSON.stringify(userData))
    }
    
    if (sessionStorage.getItem('userData')) {
        const userData = JSON.parse(sessionStorage.getItem('userData'))
        userData.pin_length = newPinLength.value
        sessionStorage.setItem('userData', JSON.stringify(userData))
    }
    
    // Also update cookie if used
    const cookieUserData = useCookie('userData')
    if (cookieUserData.value) {
      cookieUserData.value.pin_length = newPinLength.value
    }
    
    // Reset fields
    oldPinDigits.value = Array(currentPinLength.value).fill('')
    newPinDigits.value = Array(newPinLength.value).fill('')
    confirmPinDigits.value = Array(newPinLength.value).fill('')
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)

  } catch (err) {
    console.error("Change PIN Exception:", err)
    errorMessage.value = err.response?.data?.detail || "Failed to change PIN"
  } finally {
    loading.value = false
  }
}

// Forgot PIN - Send OTP to reset PIN
const sendResetPinOtp = async () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}')
  const phone = userData.phone_number
  
  if (!phone) {
    resetError.value = "Phone number not found. Please log in again."
    return
  }
  
  resetLoading.value = true
  resetError.value = ''
  resetSuccess.value = ''
  
  try {
    const res = await authApi.post('/auth/api/auth/reset-pin/', { 
      phone_number: phone 
    })
    
    if (res.data.session_id) {
      localStorage.setItem("session_id", res.data.session_id)
      localStorage.setItem("reset_pin_phone", phone)
    }
    
    resetSuccess.value = "OTP sent! Redirecting to verification..."
    
    setTimeout(() => {
      showForgotPinDialog.value = false
      // Redirect to OTP verification page with reset_pin mode
      window.location.href = "/verifyotp?mode=reset_pin"
    }, 1500)
  } catch (err) {
    resetError.value = err.response?.data?.detail || "Failed to send reset OTP."
  } finally {
    resetLoading.value = false
  }
}

const toggleCurrentPinLength = () => {
    currentPinLength.value = currentPinLength.value === 4 ? 6 : 4
}


// Data for Recent Devices (unchanged)
const recentDeviceHeader = [
  { title: 'BROWSER', key: 'browser' },
  { title: 'DEVICE', key: 'device' },
  { title: 'LOCATION', key: 'location' },
  { title: 'RECENT ACTIVITY', key: 'activity' },
]

const recentDevices = [
  { browser: ' Chrome on Windows', icon: 'tabler-brand-windows', color: 'info', device: 'HP Spectre 360', location: 'Switzerland', activity: '10, July 2021 20:07' },
  { browser: 'Chrome on Android', icon: 'tabler-brand-android', color: 'success', device: 'Oneplus 9 Pro', location: 'Dubai', activity: '14, July 2021 15:15' },
  { browser: 'Chrome on macOS', icon: 'tabler-brand-apple', color: 'secondary', device: 'Apple iMac', location: 'India', activity: '16, July 2021 16:17' },
  { browser: 'Chrome on iPhone', icon: 'tabler-device-mobile', color: 'error', device: 'iPhone 12x', location: 'Australia', activity: '13, July 2021 10:10' },
]
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Change PIN -->
      <VCard class="security-card overflow-hidden" elevation="4" border="0">
        <!-- Compact Header -->
        <div class="card-header-gradient px-4 py-3 d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-3">
             <div class="header-icon-box">
                <VIcon icon="tabler-shield-lock" size="20" color="primary" />
             </div>
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-high-emphasis mb-0 leading-tight">
                Security PIN
              </h3>
            </div>
          </div>
          
           <!-- New PIN Choice Compact -->
          <div class="d-flex align-center">
             <span class="text-caption text-medium-emphasis me-2">New PIN:</span>
             <div class="compact-toggle">
                <div 
                    class="toggle-option" 
                    :class="{ active: newPinLength === 4 }"
                    @click="newPinLength = 4"
                >4</div>
                <div 
                    class="toggle-option" 
                    :class="{ active: newPinLength === 6 }"
                    @click="newPinLength = 6"
                >6</div>
             </div>
          </div>
        </div>

        <VCardText class="pa-4 pt-4">
          <VForm @submit.prevent="changePin">
            
            <VExpandTransition>
              <div v-if="successMessage" class="mb-3">
                <VAlert density="compact" type="success" variant="tonal" closable class="py-2" @click:close="successMessage = ''">
                  {{ successMessage }}
                </VAlert>
              </div>
            </VExpandTransition>
            
            <VExpandTransition>
              <div v-if="errorMessage" class="mb-3">
                <VAlert density="compact" type="error" variant="tonal" closable class="py-2" @click:close="errorMessage = ''">
                  {{ errorMessage }}
                </VAlert>
              </div>
            </VExpandTransition>

            <div class="pin-inputs-container">
              
              <!-- Current PIN Row -->
               <div class="pin-row">
                 <div class="pin-label-col">
                    <div class="d-flex align-center gap-2">
                        <span class="text-body-2 font-weight-semibold text-high-emphasis">Current PIN</span>
                        <VIcon 
                            :icon="isOldPinVisible ? 'tabler-eye-off' : 'tabler-eye'" 
                            size="16" 
                            class="cursor-pointer text-disabled hover-text-primary transition"
                            @click="isOldPinVisible = !isOldPinVisible"
                        />
                    </div>
                     <span 
                        class="text-xs text-primary cursor-pointer font-weight-medium select-none mt-1 d-block opacity-70 hover-opacity-100 transition"
                        @click="toggleCurrentPinLength"
                    >
                        {{ currentPinLength === 4 ? 'Switch to 6-digits' : 'Switch to 4-digits' }}
                    </span>
                 </div>
                 <div class="pin-fields-col">
                    <div class="d-flex gap-2">
                        <template v-for="(digit, index) in oldPinDigits" :key="'old-'+index">
                            <input
                            :id="'old-pin-' + index"
                            v-model="oldPinDigits[index]"
                            :type="isOldPinVisible ? 'text' : 'password'"
                            inputmode="numeric"
                            maxlength="1"
                            class="pin-digit-box compact"
                            :style="{ animationDelay: index * 30 + 'ms' }"
                            placeholder="·"
                            @input="focusNext($event, index, 'old')"
                            @keydown="handleBackspace($event, index, 'old')"
                            @paste="handlePaste($event, 'old')"
                            />
                        </template>
                    </div>
                 </div>
               </div>

               <!-- New PIN Row -->
               <div class="pin-row mt-3">
                 <div class="pin-label-col">
                    <div class="d-flex align-center gap-2">
                        <span class="text-body-2 font-weight-semibold text-high-emphasis">New PIN</span>
                        <VIcon 
                             :icon="isNewPinVisible ? 'tabler-eye-off' : 'tabler-eye'" 
                            size="16" 
                            class="cursor-pointer text-disabled hover-text-primary transition"
                            @click="isNewPinVisible = !isNewPinVisible"
                        />
                    </div>
                 </div>
                 <div class="pin-fields-col">
                    <div class="d-flex gap-2">
                        <template v-for="(digit, index) in newPinDigits" :key="'new-'+index">
                            <input
                            :id="'new-pin-' + index"
                            v-model="newPinDigits[index]"
                            :type="isNewPinVisible ? 'text' : 'password'"
                            inputmode="numeric"
                            maxlength="1"
                            class="pin-digit-box compact"
                            :style="{ animationDelay: (index + 4) * 30 + 'ms' }"
                            @input="focusNext($event, index, 'new')"
                            @keydown="handleBackspace($event, index, 'new')"
                            @paste="handlePaste($event, 'new')"
                            />
                        </template>
                    </div>
                 </div>
               </div>

                <!-- Confirm PIN Row -->
               <div class="pin-row mt-3">
                 <div class="pin-label-col">
                    <div class="d-flex align-center gap-2">
                        <span class="text-body-2 font-weight-semibold text-high-emphasis">Confirm PIN</span>
                        <VIcon 
                             :icon="isConfirmPinVisible ? 'tabler-eye-off' : 'tabler-eye'" 
                            size="16" 
                            class="cursor-pointer text-disabled hover-text-primary transition"
                            @click="isConfirmPinVisible = !isConfirmPinVisible"
                        />
                    </div>
                 </div>
                 <div class="pin-fields-col">
                    <div class="d-flex gap-2">
                        <template v-for="(digit, index) in confirmPinDigits" :key="'confirm-'+index">
                            <input
                            :id="'confirm-pin-' + index"
                            v-model="confirmPinDigits[index]"
                            :type="isConfirmPinVisible ? 'text' : 'password'"
                            inputmode="numeric"
                            maxlength="1"
                            class="pin-digit-box compact"
                            :style="{ animationDelay: (index + 8) * 30 + 'ms' }"
                            @input="focusNext($event, index, 'confirm')"
                            @keydown="handleBackspace($event, index, 'confirm')"
                            @paste="handlePaste($event, 'confirm')"
                            />
                        </template>
                    </div>
                 </div>
               </div>

            </div>

             <div class="d-flex justify-end mt-4 pt-2 border-top-light">
                <VBtn
                  type="submit"
                  :loading="loading"
                  color="primary"
                  size="default"
                  class="px-6 rounded-pill shadow-primary-sm"
                  height="36"
                >
                  <VIcon icon="tabler-check" size="16" class="me-2" />
                  Update
                </VBtn>
            </div>

          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Two step verification (Condensed) -->
       <VCard border="0" elevation="2" class="mb-6 overflow-hidden">
        <div class="px-4 py-3 bg-var-surface-light border-bottom d-flex align-center">
             <VIcon icon="tabler-scan" size="20" class="me-3 text-medium-emphasis" />
             <h3 class="text-subtitle-1 font-weight-bold">Two-step verification</h3>
        </div>
        <VCardText class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
                 <div class="text-body-2 font-weight-medium mb-1">SMS Verification</div>
                 <div class="text-caption text-medium-emphasis">Protection with +1(968) 819-2547</div>
            </div>
             <IconBtn color="primary" variant="tonal" density="comfortable" class="rounded"><VIcon icon="tabler-edit" size="18"/></IconBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Recent Devices (Condensed) -->
      <VCard border="0" elevation="2" class="overflow-hidden">
         <div class="px-4 py-3 bg-var-surface-light border-bottom d-flex align-center">
             <VIcon icon="tabler-devices" size="20" class="me-3 text-medium-emphasis" />
             <h3 class="text-subtitle-1 font-weight-bold">Recent devices</h3>
        </div>
        <VDataTable :items="recentDevices" :headers="recentDeviceHeader" hide-default-footer class="text-no-wrap compact-table" density="compact">
          <template #item.browser="{ item }">
            <div class="d-flex align-center gap-x-2 py-1">
              <VIcon :icon="item.icon" :color="item.color" :size="18" />
              <div class="text-body-2 text-high-emphasis font-weight-medium">{{ item.browser }}</div>
            </div>
          </template>
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>
    <!-- 👉 Enable One Time Password Dialog -->
  <TwoFactorAuthDialog
    v-model:is-dialog-visible="isTwoFactorDialogOpen"
    :sms-code="smsVerificationNumber"
  />
</template>

<style scoped>
.security-card {
  border-radius: 12px;
  background-color: rgb(var(--v-theme-surface));
}

.card-header-gradient {
  background: linear-gradient(to right, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-surface), 0.5));
  border-bottom: 1px solid rgba(var(--v-border-color), 0.6);
}

.header-icon-box {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--v-theme-primary), 0.1);
    border-radius: 8px;
}

.pin-inputs-container {
    display: flex;
    flex-direction: column;
}

.pin-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}

.pin-label-col {
    width: 140px; /* Fixed width labels for alignment */
    flex-shrink: 0;
   
}

.pin-fields-col {
    flex-grow: 1;
}

.pin-digit-box {
  width: 40px; /* Smaller width */
  height: 44px; /* Smaller height */
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  outline: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.pin-digit-box:focus {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.15);
  transform: translateY(-1px);
}

.pin-digit-box::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.15);
}

/* Compact Toggle */
.compact-toggle {
    display: flex;
    background: rgba(var(--v-theme-on-surface), 0.06);
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
}

.toggle-option {
    padding: 2px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px;
    color: rgba(var(--v-theme-on-surface), 0.6);
    transition: all 0.2s;
}

.toggle-option.active {
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-primary));
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.shadow-primary-sm {
    box-shadow: 0 4px 10px -2px rgba(var(--v-theme-primary), 0.3);
}

.border-top-light {
    border-top: 1px solid rgba(var(--v-border-color), 0.5);
}

.hover-text-primary:hover {
    color: rgb(var(--v-theme-primary)) !important;
}

.opacity-70 { opacity: 0.7; }
.hover-opacity-100:hover { opacity: 1; }

.leading-tight { line-height: 1.1; }

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-input {
  animation: slideInUp 0.3s ease-out backwards;
}

/* Mobile responsive adjustments */
@media (max-width: 600px) {
    .pin-row {
        flex-direction: column;
        align-items: flex-start;
    }
    .pin-label-col {
        width: 100%;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
    }
}
</style>
