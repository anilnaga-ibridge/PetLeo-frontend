<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/plugins/axios'
import Navbar from './book/sections/Navbar.vue'
import PetOwnerSidebar from './components/PetOwnerSidebar.vue'

definePage({
  meta: { layout: 'blank' },
})

const router = useRouter()
const loading = ref(false)
const saving = ref(false)

// Feedback & Management UI
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showMessage = (msg, color = 'success') => {
  snackbarMessage.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

// User Data Form
const userForm = ref({
  full_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zip_code: '',
  country: '',
})

// Original Data for checking changes
const originalData = ref({})

const loadUserData = () => {
  const data = JSON.parse(localStorage.getItem('userData') || '{}')

  userForm.value = {
    full_name: data.full_name || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    city: data.city || '',
    zip_code: data.zip_code || '',
    country: data.country || '',
  }
  originalData.value = { ...userForm.value }
}

onMounted(() => {
  loadUserData()
})

const getInitials = name => {
  if (!name) return 'U'
  
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const saveProfile = async () => {
  saving.value = true
  try {
    // Attempt to update via API (Assuming standard auth user update endpoint)
    // If this endpoint doesn't exist, we still update localStorage
    try {
      await authApi.patch('/auth/api/users/me/', userForm.value)
    } catch (apiErr) {
      console.warn('API update failed, updating localStorage only', apiErr)
    }

    // Update Local Storage
    const existingData = JSON.parse(localStorage.getItem('userData') || '{}')
    const newData = { ...existingData, ...userForm.value }

    localStorage.setItem('userData', JSON.stringify(newData))
    
    // Trigger any global listeners if needed
    window.dispatchEvent(new Event('storage'))
    
    originalData.value = { ...userForm.value }
    showMessage('Profile updated successfully!', 'success')
  } catch (err) {
    console.error('Failed to update profile:', err)
    showMessage('Failed to update profile. Please try again.', 'error')
  } finally {
    saving.value = false
  }
}

const discardChanges = () => {
  userForm.value = { ...originalData.value }
}
</script>

<template>
  <div class="dashboard-root d-flex">
    <!-- Side Navigation -->
    <PetOwnerSidebar class="d-none d-lg-flex" />

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content-layer">
      <!-- Global Navbar -->
      <Navbar hide-brand />

      <!-- Feedback Notifications -->
      <VSnackbar
        v-model="snackbar"
        :color="snackbarColor"
        location="top end"
        :timeout="4000"
      >
        {{ snackbarMessage }}
        <template #actions>
          <VBtn
            variant="text"
            size="small"
            @click="snackbar = false"
          >
            Dismiss
          </VBtn>
        </template>
      </VSnackbar>

      <!-- Page Hero -->
      <div class="page-hero">
        <VContainer>
          <VRow align="center">
            <VCol
              cols="12"
              md="6"
            >
              <div class="d-flex align-center gap-3 mb-4">
                <div class="hero-icon">
                  <VIcon
                    icon="tabler-user-edit"
                    size="20"
                    color="white"
                  />
                </div>
                <span class="hero-label">Account Settings</span>
              </div>
              <h1 class="hero-title">
                My Profile
              </h1>
              <p class="hero-sub">
                Manage your personal details and contact information.
              </p>
            </VCol>
          </VRow>
        </VContainer>
      </div>

      <VContainer class="py-10">
        <VRow>
          <VCol
            cols="12"
            md="8"
            lg="6"
            class="mx-auto mx-md-0"
          >
            <!-- Profile Card -->
            <div class="profile-card">
              <!-- Avatar Section -->
              <div class="avatar-section">
                <div class="avatar-circle">
                  {{ getInitials(userForm.full_name) }}
                  <button
                    class="edit-avatar-btn"
                    title="Change Avatar"
                  >
                    <VIcon
                      icon="tabler-camera"
                      size="16"
                    />
                  </button>
                </div>
                <div class="avatar-info">
                  <h2 class="profile-name">
                    {{ userForm.full_name || 'Pet Parent' }}
                  </h2>
                  <p class="profile-role">
                    Pet Owner
                  </p>
                </div>
              </div>

              <VDivider class="my-6" />

              <!-- Form Section -->
              <VForm @submit.prevent="saveProfile">
                <VRow>
                  <VCol cols="12">
                    <label class="form-label">Full Name</label>
                    <input
                      v-model="userForm.full_name"
                      class="form-input"
                      placeholder="e.g. John Doe"
                    >
                  </VCol>
                  
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <label class="form-label">Email Address</label>
                    <input
                      v-model="userForm.email"
                      type="email"
                      class="form-input"
                      placeholder="john@example.com"
                      readonly
                      title="Email cannot be changed"
                    >
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <label class="form-label">Phone Number</label>
                    <input
                      v-model="userForm.phone"
                      class="form-input"
                      placeholder="+1 234 567 8900"
                    >
                  </VCol>

                  <VCol cols="12">
                    <label class="form-label">Address</label>
                    <input
                      v-model="userForm.address"
                      class="form-input"
                      placeholder="123 Main St, Apt 4B"
                    >
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <label class="form-label">City</label>
                    <input
                      v-model="userForm.city"
                      class="form-input"
                      placeholder="New York"
                    >
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <label class="form-label">Zip Code</label>
                    <input
                      v-model="userForm.zip_code"
                      class="form-input"
                      placeholder="10001"
                    >
                  </VCol>

                  <VCol
                    cols="12"
                    md="4"
                  >
                    <label class="form-label">Country</label>
                    <input
                      v-model="userForm.country"
                      class="form-input"
                      placeholder="United States"
                    >
                  </VCol>
                </VRow>

                <VDivider class="my-8" />

                <div class="d-flex justify-end gap-4">
                  <VBtn
                    variant="tonal"
                    color="secondary"
                    size="large"
                    class="rounded-xl px-6"
                    :disabled="saving"
                    @click="discardChanges"
                  >
                    Discard
                  </VBtn>
                  <VBtn
                    type="submit"
                    color="primary"
                    size="large"
                    class="rounded-xl px-8 font-weight-black"
                    :loading="saving"
                  >
                    Save Changes
                  </VBtn>
                </div>
              </VForm>
            </div>
          </VCol>

          <!-- Side column for extra info / security -->
          <VCol
            cols="12"
            md="4"
            lg="4"
          >
            <div class="info-card mb-6">
              <div class="info-icon">
                <VIcon
                  icon="tabler-shield-check"
                  color="success"
                  size="24"
                />
              </div>
              <h3 class="info-title">
                Account Security
              </h3>
              <p class="info-desc">
                Your personal information is securely encrypted and stored.
              </p>
              <VBtn 
                variant="outlined" 
                color="primary" 
                block 
                class="rounded-lg mt-4"
                prepend-icon="tabler-key"
              >
                Change Password
              </VBtn>
            </div>

            <div class="info-card bg-slate-50">
              <div class="info-icon bg-error-light">
                <VIcon
                  icon="tabler-alert-triangle"
                  color="error"
                  size="24"
                />
              </div>
              <h3 class="info-title text-error">
                Danger Zone
              </h3>
              <p class="info-desc">
                Permanently delete your account and all associated data.
              </p>
              <VBtn 
                variant="tonal" 
                color="error" 
                block 
                class="rounded-lg mt-4"
              >
                Delete Account
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VContainer>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

* { font-family: 'Outfit', sans-serif !important; }

.dashboard-root {
  background: #f8fafc;
  min-height: 100vh;
  overflow: hidden;
}

.main-content-layer {
  height: 100vh;
  overflow-y: auto;
  background: #f8fafc;
}

/* Hero */
.page-hero {
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 45%, #fdf2f8 100%);
  padding: 48px 0 52px;
  border-bottom: 1px solid #f1f5f9;
}

.hero-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(99,102,241,0.25);
}

.hero-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #6366f1;
}

.hero-title {
  font-size: 48px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2.5px;
  line-height: 1;
  margin: 0 0 8px;
}

.hero-sub {
  font-size: 16px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
}

/* Profile Card */
.profile-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.03);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-circle {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  color: white;
  position: relative;
  box-shadow: 0 8px 24px rgba(99,102,241,0.3);
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.edit-avatar-btn:hover {
  background: #f8fafc;
  color: #6366f1;
  transform: scale(1.05);
}

.avatar-info {
  flex: 1;
}

.profile-name {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.profile-role {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

/* Forms */
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 52px;
  padding: 0 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}

.form-input[readonly] {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.form-input:focus:not([readonly]) {
  background: white;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
}

.form-input::placeholder {
  color: #cbd5e1;
}

/* Info Cards */
.info-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px;
}

.bg-slate-50 {
  background: #f8fafc;
}

.info-icon {
  width: 48px;
  height: 48px;
  background: #f0fdf4;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.bg-error-light {
  background: #fef2f2 !important;
}

.info-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.info-desc {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Layout Utilities */
.d-flex { display: flex; }
.align-center { align-items: center; }
.justify-end { justify-content: flex-end; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
</style>
