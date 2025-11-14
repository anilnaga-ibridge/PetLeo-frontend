<!-- <script setup>
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
</script> -->
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


<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">{{ themeConfig.app.title }}</h1>
    </div>
  </RouterLink>

  <VRow no-gutters class="auth-wrapper bg-surface">
    <!-- Left side image -->
    <VCol md="8" class="d-none d-md-flex">
      <div class="position-relative bg-background w-100 me-0">
        <div class="d-flex align-center justify-center w-100 h-180" style="padding-inline: 100px;">
          <VImg max-width="500" :src="imageVariant" class="auth-illustration mt-16 mb-2" />
        </div>

        <img class="auth-footer-mask" :src="authThemeMask" alt="auth-footer-mask" height="280" width="100" />
      </div>
    </VCol>

    <!-- Right side card -->
    <VCol cols="12" md="4" class="auth-card-v2 d-flex align-center justify-center" style="background-color: rgb(var(--v-theme-surface));">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-4">
        <VCardText>
          <h2 class="text-h3 mb-1   ">Register here... </h2>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="registerUser">
            <VRow>
             <!-- Full Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.full_name"
                  label="Full Name"
                  placeholder="John Doe"
                  :rules="[requiredValidator]"
                  prepend-inner-icon="tabler-user"
                  class="custom-input"
                />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  label="Email"
                  placeholder="john@example.com"
                  type="email"
                  :rules="[requiredValidator, emailValidator]"
                  prepend-inner-icon="tabler-mail"
                  class="custom-input"
                />
              </VCol>

              <!-- Phone Number -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.phone_number"
                  label="Phone Number"
                  placeholder="9739453229"
                  :rules="[requiredValidator]"
                  prepend-inner-icon="tabler-phone"
                  class="custom-input"
                />
              </VCol>

              
             <VCol cols="12">
                <label class="text-body-1 font-weight-medium mb-2 d-block">
                  Select Role
                </label>

                <div class="d-flex gap-4">

                  <!-- Individual Card -->
                  <VCard
                    class="pa-4 role-card"
                    :elevation="form.role === 6 ? 6 : 1"
                    :class="{ 'active-role': form.role === 6 }"
                    @click="form.role = 6"
                  >
                    <div class="text-center">
                      <VIcon icon="tabler-user" size="22" class="mb-2" />
                      <div class="font-weight-medium">Individual</div>
                    </div>
                  </VCard>

                  <!-- Organization Card -->
                  <VCard
                    class="pa-4 role-card"
                    :elevation="form.role === 5 ? 6 : 1"
                    :class="{ 'active-role': form.role === 5 }"
                    @click="form.role = 5"
                  >
                    <div class="text-center">
                      <VIcon icon="tabler-building" size="22" class="mb-2" />
                      <div class="font-weight-medium">Organization</div>
                    </div>
                  </VCard>

                </div>
              </VCol>


              <!-- Privacy Policy -->
              <VCol cols="12">
                <div class="d-flex align-center my-6">
                  <VCheckbox id="privacy-policy" v-model="form.privacyPolicies" inline />
                  <VLabel for="privacy-policy" style="opacity: 1;">
                    <span class="me-1 text-high-emphasis">I agree to</span>
                    <a href="javascript:void(0)" class="text-primary">privacy policy & terms</a>
                  </VLabel>
                </div>
              </VCol>

              <!-- Submit Button -->
              <VCol cols="12">
                <VBtn block type="submit" :loading="loading">
                  Sign Up
                </VBtn>
              </VCol>

              <!-- Success & Error Messages -->
              <VCol cols="12" v-if="successMessage">
                <p class="text-success text-center mt-2">{{ successMessage }}</p>
              </VCol>
              <VCol cols="12" v-if="errorMessage">
                <p class="text-error text-center mt-2">{{ errorMessage }}</p>
              </VCol>

              <!-- Already have an account -->
              <VCol cols="12" class="text-center text-base">
                <span>Already have an account?</span>
                <RouterLink class="text-primary ms-1" :to="{ name: 'login' }">Sign in instead</RouterLink>
              </VCol>

              <VCol cols="12" class="d-flex align-center">
                <VDivider />
                <span class="mx-4">or</span>
                <VDivider />
              </VCol>

              <!-- Social login (optional) -->
              <VCol cols="12" class="text-center">
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
.text-success {
  color: green;
}
.text-error {
  color: red;
}
.role-card {
  width: 100%;
  max-width: 130px;
  cursor: pointer;
  border-radius: 18px;
  transition: all 0.25s ease;
  border: 2px solid transparent;

}

.role-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.15);
  color: #4f46e5;
}

.active-role {
  border: 2px solid #4f46e5 !important;
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.25) !important;
}
.custom-input .v-icon {
  color: #4f46e5 !important;
}
.custom-input .v-input__control {
  border-radius: 12px !important;
}
.text-h3 {
  font-weight: 550;
  font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  color:#4f46e5;
}
.text-h3:hover {
 
  transition: color 0.3s ease;
}
</style>
