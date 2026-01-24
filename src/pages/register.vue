<!--
  <script setup>
  import { ref } from 'vue'
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  import { VForm } from 'vuetify/components/VForm'
  import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
  import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
  import { themeConfig } from '@themeConfig'
  import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

  import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
  import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
  import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
  import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
  import authV2MaskDark from '@images/pages/misc-mask-dark.png'
  import authV2MaskLight from '@images/pages/misc-mask-light.png'

  const router = useRouter()

  const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
  )
  const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

  definePage({
  meta: {
  layout: 'blank',
  unauthenticatedOnly: true,
  },
  })

  // 🧾 Form data
  const form = ref({
  full_name: '',
  email: '',
  phone_number: '',
  role: 'individual', // default role
  privacyPolicies: false,
  })

  const successMessage = ref('')
  const errorMessage = ref('')
  const loading = ref(false)

  // 📤 Submit handler
  const registerUser = async () => {
  if (!form.value.privacyPolicies) {
  errorMessage.value = 'Please accept privacy policy to continue.'
  return
  }

  try {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
  phone_number: form.value.phone_number,
  full_name: form.value.full_name,
  email: form.value.email,
  role: form.value.role,
  }

  const r = await axios.post('http://localhost:8000/auth/api/auth/register/', payload)
  console.log('Registration response:', r)
  console.log('Response data:', r.data)
  if (r.data?.session_id) {
  localStorage.setItem('session_id', r.data.session_id)
  successMessage.value = 'OTP sent successfully!'
  setTimeout(async () => {
  await router.replace('/verifyotp')
  }, 1000)
  } else {
  errorMessage.value = 'Registration failed. Please try again.'
  }
  } catch (err) {
  errorMessage.value = err.response?.data?.message || 'Something went wrong. Try again!'
  } finally {
  loading.value = false
  }
  }
  </script> 
-->

<!--
  <script setup>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  import { VForm } from 'vuetify/components/VForm'
  import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
  import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
  import { themeConfig } from '@themeConfig'
  import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

  import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
  import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
  import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
  import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
  import authV2MaskDark from '@images/pages/misc-mask-dark.png'
  import authV2MaskLight from '@images/pages/misc-mask-light.png'

  const router = useRouter()

  // ============================
  // 🔹 Dynamic Theme Images
  // ============================
  const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
  )

  const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

  // ============================
  // 🔹 Page Meta
  // ============================
  definePage({
  meta: {
  layout: 'blank',
  unauthenticatedOnly: true,
  },
  })

  // ============================
  // 🔹 Form State
  // ============================
  const form = ref({
  full_name: '',
  email: '',
  phone_number: '',
  role: '',              // dynamic role ID
  privacyPolicies: false,
  })

  // ============================
  // 🔹 Role Fetching
  // ============================
  const roles = ref([])

  const fetchRoles = async () => {
  try {
  const res = await axios.get('http://127.0.0.1:8000/auth/roles/public/')

  roles.value = res.data.map(role => ({
  title: role.name.charAt(0).toUpperCase() + role.name.slice(1),
  value: role.id,           // 🔥 send ID to backend
  }))

  // Auto-select first role
  if (roles.value.length > 0) {
  form.value.role = roles.value[0].value
  }

  } catch (err) {
  console.error("❌ Failed to fetch roles:", err)
  }
  }

  // ============================
  // 🔹 Register User
  // ============================
  const successMessage = ref('')
  const errorMessage = ref('')
  const loading = ref(false)

  const registerUser = async () => {
  if (!form.value.privacyPolicies) {
  errorMessage.value = 'Please accept privacy policy to continue.'
  return
  }

  try {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  const payload = {
  phone_number: form.value.phone_number,
  full_name: form.value.full_name,
  email: form.value.email,
  role: form.value.role,          // 🔥 sending ID, correct for backend + Kafka
  }

  const r = await axios.post('http://127.0.0.1:8000/auth/api/auth/register/', payload)

  if (r.data?.session_id) {
  localStorage.setItem('session_id', r.data.session_id)
  successMessage.value = 'OTP sent successfully!'

  setTimeout(() => router.replace('/verifyotp'), 1000)
  } else {
  errorMessage.value = 'Registration failed.'
  }

  } catch (err) {
  errorMessage.value =
  err.response?.data?.detail ||
  err.response?.data?.message ||
  'Something went wrong.'
  } finally {
  loading.value = false
  }
  }

  // Load roles when page opens
  onMounted(() => {
  fetchRoles()
  })
  </script> 
-->


<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { themeConfig } from '@themeConfig'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const router = useRouter()

// ==============================
// 🔹 Image Variant Fix
// ==============================
const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

// ==============================
// 🔹 Page Meta
// ==============================
definePage({
  meta: { layout: 'blank', unauthenticatedOnly: true },
})

// ==============================
// 🔹 Form State
// ==============================
const form = ref({
  full_name: '',
  email: '',
  phone_number: '',
  role: null,
  privacyPolicies: false,
})

// ==============================
// 🔹 Roles Dynamic from Backend
// ==============================
const roles = ref([])

const fetchRoles = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8000/auth/roles/public/')

    roles.value = res.data.map(role => ({
      title: role.name.charAt(0).toUpperCase() + role.name.slice(1),
      name: role.name.toLowerCase(),
      value: role.id,
    }))

    if (roles.value.length > 0) {
      form.value.role = roles.value[0].value
    }
  } catch (err) {
    console.error("❌ Failed to fetch roles:", err)
  }
}

// ==============================
// 🔹 Register User
// ==============================
const successMessage = ref('')
const errorMessage = ref('')
const loading = ref(false)

const registerUser = async () => {
  if (!form.value.privacyPolicies) {
    errorMessage.value = 'Please accept privacy policy to continue.'
    
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const payload = {
      phone_number: form.value.phone_number,
      full_name: form.value.full_name,
      email: form.value.email,
      role: form.value.role, // Role ID dynamic
    }

    const r = await axios.post('http://127.0.0.1:8000/auth/api/auth/register/', payload)

    if (r.data?.session_id) {
      localStorage.setItem('session_id', r.data.session_id)
      successMessage.value = 'Registration successful! Please login.'
      setTimeout(() => router.replace('/login'), 3000)
    } else {
      errorMessage.value = 'Registration failed.'
    }

  } catch (err) {
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRoles)
</script>



<template>
  <VRow
    no-gutters
    class="auth-wrapper bg-surface h-screen"
  >
    <!-- LEFT SIDE IMAGE Section -->
    <VCol
      md="6"
      class="d-none d-md-flex align-center justify-center bg-background"
    >
      <div class="text-center px-6">
        <VImg
          :src="imageVariant"
          max-width="500"
          class="auth-illustration mb-4"
        />
        <img
          :src="authThemeMask"
          height="140"
          width="150%"
        >
      </div>
    </VCol>

    <!-- RIGHT CARD FORM Section -->
    <VCol
      cols="12"
      md="6"
      class="d-flex justify-center align-center"
    >
      <VCard
        flat
        class="pa-8 w-100 rounded-xl glass-login-card"
        style="max-width:480px;"
      >
        <div class="text-center mb-6">
          <VAvatar
            color="primary"
            variant="tonal"
            size="64"
            class="mb-4"
          >
            <VIcon
              icon="tabler-user-plus"
              size="32"
            />
          </VAvatar>
          <h4 class="text-h4 font-weight-bold text-primary mb-2">
            Register here... 🚀
          </h4>
          <p class="text-body-1 text-medium-emphasis">
            Create an account to get started
          </p>
        </div>

        <VForm @submit.prevent="registerUser">
          <VRow>
            <!-- Full Name -->
            <VCol
              cols="12"
              class="stagger-item"
              style="--delay: 0.1s"
            >
              <AppTextField
                v-model="form.full_name"
                label="Full Name"
                placeholder="John Doe"
                prepend-inner-icon="tabler-user"
                :rules="[requiredValidator]"
                class="premium-input"
              />
            </VCol>

            <!-- Email -->
            <VCol
              cols="12"
              class="stagger-item"
              style="--delay: 0.2s"
            >
              <AppTextField
                v-model="form.email"
                label="Email"
                type="email"
                placeholder="john@example.com"
                prepend-inner-icon="tabler-mail"
                :rules="[requiredValidator, emailValidator]"
                class="premium-input"
              />
            </VCol>

            <!-- Phone -->
            <VCol
              cols="12"
              class="stagger-item"
              style="--delay: 0.3s"
            >
              <AppTextField
                v-model="form.phone_number"
                label="Phone Number"
                placeholder="+1 234 567 890"
                prepend-inner-icon="tabler-phone"
                :rules="[requiredValidator]"
                class="premium-input"
              />
            </VCol>

            <!-- Dynamic Role Selection Cards -->
            <VCol
              cols="12"
              class="stagger-item"
              style="--delay: 0.4s"
            >
              <label class="text-body-2 font-weight-medium mb-2 d-block text-high-emphasis">Select Role</label>

              <div class="d-flex gap-4">
                <div
                  v-for="r in roles"
                  :key="r.value"
                  class="role-card flex-grow-1 pa-3 d-flex flex-column align-center justify-center rounded-lg"
                  :class="{ 'active-role': form.role === r.value }"
                  @click="form.role = r.value"
                >
                  <VIcon
                    :icon="r.name === 'individual' ? 'tabler-user' : 'tabler-building'"
                    size="24"
                    class="mb-2"
                    :color="form.role === r.value ? 'primary' : 'medium-emphasis'"
                  />
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="form.role === r.value ? 'text-primary' : 'text-medium-emphasis'"
                  >
                    {{ r.title }}
                  </span>
                  <VIcon 
                    v-if="form.role === r.value"
                    icon="tabler-circle-check-filled" 
                    color="primary" 
                    size="20" 
                    class="position-absolute top-0 right-0 mt-2 mr-2"
                  />
                </div>
              </div>
            </VCol>

            <!-- Privacy Policy -->
            <VCol
              cols="12"
              class="stagger-item"
              style="--delay: 0.5s"
            >
              <div class="d-flex align-center my-2">
                <VCheckbox
                  id="privacy-policy"
                  v-model="form.privacyPolicies"
                  inline
                  density="compact"
                  hide-details
                />
                <VLabel
                  for="privacy-policy"
                  class="ms-2"
                  style="opacity: 1;"
                >
                  <span class="text-body-2 text-medium-emphasis">I agree to</span>
                  <a
                    class="text-primary text-body-2 font-weight-bold ms-1 text-decoration-none"
                    href="#"
                  >privacy policy & terms</a>
                </VLabel>
              </div>
            </VCol>

            <!-- Submit -->
            <VCol
              cols="12"
              class="stagger-item"
              style="--delay: 0.6s"
            >
              <VBtn
                block
                size="large"
                type="submit"
                :loading="loading"
                class="btn-gradient font-weight-bold"
              >
                Sign Up
              </VBtn>
            </VCol>

            <!-- Success / Error Messages -->
            <VCol
              v-if="successMessage || errorMessage"
              cols="12"
              class="stagger-item"
              style="--delay: 0.7s"
            >
              <VAlert
                v-if="successMessage"
                type="success"
                variant="tonal"
                density="compact"
              >
                {{ successMessage }}
              </VAlert>
              <VAlert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                density="compact"
              >
                {{ errorMessage }}
              </VAlert>
            </VCol>

            <!-- Already have an account -->
            <VCol
              cols="12"
              class="text-center mt-4 stagger-item"
              style="--delay: 0.8s"
            >
              <span class="text-body-2 text-medium-emphasis">Already have an account?</span>
              <RouterLink
                class="text-primary font-weight-bold ms-1 text-decoration-none"
                :to="{ name: 'login' }"
              >
                Sign in instead
              </RouterLink>
            </VCol>
          </VRow>
        </VForm>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glass-login-card {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.v-theme--dark .glass-login-card {
  background: rgba(30, 41, 59, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
}

.glass-login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.25) !important;
}

/* Gradient Button */
.btn-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  color: white !important;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-gradient::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(255,255,255,0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
  filter: brightness(1.1);
}

.btn-gradient:hover::after {
  opacity: 1;
}

/* Role Card Styles */
.role-card {
  border: 2px solid rgba(var(--v-theme-on-surface), 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255,255,255,0.4);
  position: relative;
  overflow: hidden;
}

.role-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.04);
  transform: translateY(-2px);
}

.active-role {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08) !important;
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.2);
  transform: scale(1.02);
}

.gap-4 {
  gap: 16px;
}

/* Staggered Animation */
.stagger-item {
  opacity: 0;
  animation: slideUpFade 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: var(--delay);
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Premium Input Glow */
:deep(.premium-input .v-field) {
  border-radius: 12px !important;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

:deep(.premium-input .v-field--focused) {
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15);
  border-color: rgb(var(--v-theme-primary)) !important;
  transform: translateY(-1px);
}
</style>

