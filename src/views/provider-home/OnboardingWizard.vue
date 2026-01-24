<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { api } from '@/plugins/axios'
import { useCookie } from '@/@core/composable/useCookie'

// Components
import { VStepper, VStepperItem, VStepperWindow, VStepperWindowItem } from 'vuetify/components'

const emit = defineEmits(['complete', 'close'])

// ----------------------------------------------------------------------
//  CONFIG & STATE
// ----------------------------------------------------------------------
const step = ref(1)
const loading = ref(false)
const submitting = ref(false)

// API Endpoints
const PROVIDER_BASE_URL = 'http://127.0.0.1:8002'
const PROFILE_API = '/api/provider/profile/'
const SUBMIT_API = '/api/provider/submit/'

// User Data
const userData = useCookie('userData').value || JSON.parse(localStorage.getItem('userData') || '{}')
const userId = userData.id
const dynamicTarget = userData.provider_type || 'individual'

// Data Containers
const profileFields = ref([])
const requestedDocuments = ref([])
const uploadedDocuments = ref([])

// Form Data
const formData = reactive({})
const fileMetadata = reactive({}) // For profile files
const requestedFiles = reactive({}) // For document uploads
const existingRequestedByDefinition = reactive({})
const errors = reactive({})

// Messages
const successMessage = ref('')
const errorMessage = ref('')

// ----------------------------------------------------------------------
//  HELPER FUNCTIONS
// ----------------------------------------------------------------------
const fieldKey = id => String(id)

const isImage = url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url)

const formatBytes = bytes => {
  if (!bytes) return '0 KB'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

// ----------------------------------------------------------------------
//  FETCH DATA (Profile + Documents)
// ----------------------------------------------------------------------
const fetchData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get(PROFILE_API, {
      baseURL: PROVIDER_BASE_URL,
      params: { user: userId, target: dynamicTarget },
    })

    // 1. Profile Fields
    profileFields.value = res.data.fields || []
    
    // Initialize Profile Form Data
    profileFields.value.forEach(f => {
      const k = fieldKey(f.id)
      if (f.field_type === 'multiselect') {
        formData[k] = Array.isArray(f.value) ? f.value : []
      } else if (f.field_type === 'file') {
        if (f.metadata?.file_url) {
          fileMetadata[k] = {
            name: f.metadata.name,
            size: f.metadata.size,
            type: f.metadata.content_type,
            file_url: f.metadata.file_url,
          }
          formData[k] = f.metadata.name
        } else {
          formData[k] = ''
        }
      } else {
        formData[k] = f.value || ''
      }
    })

    // 2. Documents
    requestedDocuments.value = res.data.requested_documents || []
    uploadedDocuments.value = res.data.uploaded_documents || res.data.uploaded_files || []

    // Map existing documents
    Object.keys(existingRequestedByDefinition).forEach(k => delete existingRequestedByDefinition[k])
    uploadedDocuments.value.forEach(d => {
      const defId = d.definition_id || d.definitionId
      if (defId) {
        if (!existingRequestedByDefinition[defId]) existingRequestedByDefinition[defId] = []
        existingRequestedByDefinition[defId].push(d)
      }
    })

  } catch (err) {
    console.error('Fetch Error:', err)
    errorMessage.value = 'Failed to load profile data.'
  } finally {
    loading.value = false
  }
}

// ----------------------------------------------------------------------
//  FILE HANDLERS
// ----------------------------------------------------------------------
const onProfileFileChange = (fieldId, event) => {
  const file = event.target.files[0]
  const k = fieldKey(fieldId)
  if (!file) return

  const url = URL.createObjectURL(file)

  fileMetadata[k] = {
    name: file.name,
    size: file.size,
    type: file.type,
    file: file,
    objectUrl: url,
  }
  formData[k] = file.name
}

const onDocumentFileChange = (defId, event) => {
  const file = event.target.files[0]
  if (!file) return

  const url = URL.createObjectURL(file)

  requestedFiles[defId] = [{
    name: file.name,
    size: file.size,
    type: file.type,
    file: file,
    objectUrl: url,
  }]
}

// ----------------------------------------------------------------------
//  VALIDATION
// ----------------------------------------------------------------------
const validateProfile = () => {
  Object.keys(errors).forEach(k => delete errors[k])
  let isValid = true

  profileFields.value.forEach(f => {
    const k = fieldKey(f.id)
    const val = formData[k]
    if (f.is_required) {
      if (!val || (Array.isArray(val) && !val.length)) {
        errors[k] = `${f.label} is required`
        isValid = false
      }
    }
  })
  
  return isValid
}

// Computed property to check if profile step is valid
const isProfileValid = computed(() => {
  if (!profileFields.value || profileFields.value.length === 0) return false
  
  return profileFields.value.every(field => {
    if (!field.is_required) return true
    const val = formData[fieldKey(field.id)]
    if (Array.isArray(val)) return val.length > 0
    
    return val && String(val).trim().length > 0
  })
})

const goToStep2 = async () => {
  // Validate all fields
  let isValid = true

  // Reset errors
  Object.keys(errors).forEach(key => delete errors[key])
  
  profileFields.value.forEach(field => {
    if (field.is_required) {
      const val = formData[fieldKey(field.id)]
      if (!val || (Array.isArray(val) && val.length === 0) || (!Array.isArray(val) && String(val).trim() === '')) {
        errors[fieldKey(field.id)] = `${field.label} is required`
        isValid = false
      }
    }
  })
  
  if (isValid) {
    step.value = 2
    errorMessage.value = ''
  } else {
    errorMessage.value = 'Please fill in all required fields to proceed.'
  }
}

// ----------------------------------------------------------------------
//  SUBMIT
// ----------------------------------------------------------------------
const submitAll = async () => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const fd = new FormData()

  // 1. Profile Fields Payload (JSON)
  const fieldsPayload = []

  profileFields.value.forEach(f => {
    const k = fieldKey(f.id)
    const val = formData[k]
    
    // Only include if value exists
    if (val !== undefined && val !== null && val !== '') {
      fieldsPayload.push({
        field_id: f.id,
        value: val,
        metadata: fileMetadata[k] ? {
          name: fileMetadata[k].name,
          size: fileMetadata[k].size,
          content_type: fileMetadata[k].type,
        } : {},
      })
    }
  })
  
  fd.append('fields', JSON.stringify(fieldsPayload))

  // 2. Append Profile Files
  profileFields.value.forEach(f => {
    const k = fieldKey(f.id)
    if (f.field_type === 'file' && fileMetadata[k]?.file) {
      fd.append(String(f.id), fileMetadata[k].file)
    }
  })

  // 3. Append Document Files
  Object.keys(requestedFiles).forEach(defId => {
    const files = requestedFiles[defId]
    if (files && files.length > 0) {
      fd.append(String(defId), files[0].file)
    }
  })

  try {
    await api.post(`${SUBMIT_API}?user=${userId}`, fd, {
      baseURL: PROVIDER_BASE_URL,
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    // Move to completed step
    step.value = 3

    // Refresh data in background
    await fetchData()
  } catch (err) {
    console.error('Submit Error:', err)
    errorMessage.value = err.response?.data?.error || 'Submission failed.'
  } finally {
    submitting.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="wizard-wrapper d-flex justify-center align-center">
    <VCard
      class="onboarding-wizard glass-effect position-relative"
      elevation="0"
    >
      <!-- Exit Button -->
      <VBtn 
        icon 
        variant="text" 
        color="medium-emphasis" 
        class="position-absolute top-0 right-0 ma-4 z-index-10"
        @click="$emit('close')"
      >
        <VIcon
          icon="tabler-x"
          size="20"
        />
      </VBtn>

      <!-- Progress Bar -->
      <div class="progress-container">
        <div
          class="progress-bar"
          :style="{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }"
        />
      </div>

      <!-- Header Section -->
      <div class="wizard-header text-center pa-4 pa-md-6 position-relative overflow-hidden">
        <div class="header-bg-glow" />
        <VAvatar
          color="primary"
          variant="flat"
          size="64"
          class="mb-4 elevation-10 glow-icon"
        >
          <VIcon
            icon="tabler-rocket"
            size="32"
            color="white"
          />
        </VAvatar>
        <h2 class="text-h4 text-md-h3 font-weight-black text-primary mb-3 tracking-tight text-wrap">
          Provider Onboarding
        </h2>
        <p class="text-subtitle-1 text-md-h6 text-medium-emphasis font-weight-regular text-wrap">
          Complete your profile to unlock your potential
        </p>
      </div>

      <div
        v-if="loading"
        class="d-flex flex-column justify-center align-center py-20"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="80"
          width="8"
          class="mb-6"
        />
        <span class="text-h6 text-medium-emphasis animate-pulse">Loading your profile...</span>
      </div>

      <div
        v-else
        class="pa-6"
      >
        <!-- Premium Stepper -->
        <div class="d-flex justify-center mb-6 position-relative stepper-container">
          <div class="stepper-track" />
          
          <!-- Step 1 -->
          <div 
            class="step-item d-flex flex-column align-center cursor-pointer"
            :class="{ 'active': step === 1, 'completed': step > 1 }"
            @click="step > 1 && step !== 3 && (step = 1)"
          >
            <div class="step-circle mb-2 elevation-6">
              <VIcon
                icon="tabler-user"
                size="20"
              />
            </div>
            <span class="text-subtitle-2 font-weight-bold step-label">Profile</span>
          </div>

          <!-- Step 2 -->
          <div 
            class="step-item d-flex flex-column align-center ms-12"
            :class="{ 
              'active': step === 2, 
              'completed': step > 2,
              'cursor-pointer': isProfileValid && step !== 3,
              'cursor-not-allowed opacity-50': !isProfileValid || step === 3
            }"
            @click="isProfileValid && step !== 3 && (step = 2)"
          >
            <div class="step-circle mb-2 elevation-6">
              <VIcon
                icon="tabler-files"
                size="20"
              />
            </div>
            <span class="text-subtitle-2 font-weight-bold step-label">Documents</span>
          </div>

          <!-- Step 3 (Completed) -->
          <div 
            class="step-item d-flex flex-column align-center ms-12"
            :class="{ 'active': step === 3, 'completed': step === 3 }"
          >
            <div class="step-circle mb-2 elevation-6">
              <VIcon
                icon="tabler-check"
                size="20"
              />
            </div>
            <span class="text-subtitle-2 font-weight-bold step-label">Done</span>
          </div>
        </div>

        <VWindow
          v-model="step"
          class="wizard-content"
        >
          <!-- STEP 1: PROFILE -->
          <VWindowItem
            :value="1"
            transition="scroll-x-transition"
            reverse-transition="scroll-x-reverse-transition"
          >
            <VForm @submit.prevent="goToStep2">
              <div class="scrollable-content custom-scrollbar pr-4">
                <VRow>
                  <VCol 
                    v-for="field in profileFields" 
                    :key="field.id"
                    cols="12" 
                    :md="['textarea', 'file'].includes(field.field_type) ? 12 : 6"
                  >
                    <!-- Text / Number / Date -->
                    <div
                      v-if="['text', 'number', 'date'].includes(field.field_type)"
                      class="mb-5"
                    >
                      <VLabel class="mb-2 font-weight-bold text-high-emphasis text-subtitle-2">
                        {{ field.label }} <span
                          v-if="field.is_required"
                          class="text-error ms-1"
                        >*</span>
                      </VLabel>
                      <AppTextField
                        v-model="formData[fieldKey(field.id)]"
                        :type="field.field_type"
                        :placeholder="field.help_text"
                        :error-messages="errors[fieldKey(field.id)]"
                        variant="outlined"
                        density="comfortable"
                        color="primary"
                        class="premium-input bg-grey-50 rounded-lg"
                      />
                    </div>

                    <!-- Textarea -->
                    <div
                      v-else-if="field.field_type === 'textarea'"
                      class="mb-5"
                    >
                      <VLabel class="mb-2 font-weight-bold text-high-emphasis text-subtitle-2">
                        {{ field.label }} <span
                          v-if="field.is_required"
                          class="text-error ms-1"
                        >*</span>
                      </VLabel>
                      <AppTextarea
                        v-model="formData[fieldKey(field.id)]"
                        :placeholder="field.help_text"
                        :error-messages="errors[fieldKey(field.id)]"
                        rows="4"
                        variant="outlined"
                        density="comfortable"
                        color="primary"
                        class="premium-input bg-grey-50 rounded-lg"
                      />
                    </div>

                    <!-- Dropdown -->
                    <div
                      v-else-if="field.field_type === 'dropdown'"
                      class="mb-5"
                    >
                      <VLabel class="mb-2 font-weight-bold text-high-emphasis text-subtitle-2">
                        {{ field.label }} <span
                          v-if="field.is_required"
                          class="text-error ms-1"
                        >*</span>
                      </VLabel>
                      <VSelect
                        v-model="formData[fieldKey(field.id)]"
                        :items="field.options"
                        :error-messages="errors[fieldKey(field.id)]"
                        variant="outlined"
                        density="comfortable"
                        color="primary"
                        class="premium-input bg-grey-50 rounded-lg"
                      />
                    </div>

                    <!-- Multiselect -->
                    <div
                      v-else-if="field.field_type === 'multiselect'"
                      class="mb-5"
                    >
                      <VLabel class="mb-2 font-weight-bold text-high-emphasis text-subtitle-2">
                        {{ field.label }} <span
                          v-if="field.is_required"
                          class="text-error ms-1"
                        >*</span>
                      </VLabel>
                      <VSelect
                        v-model="formData[fieldKey(field.id)]"
                        :items="field.options"
                        multiple
                        chips
                        closable-chips
                        :error-messages="errors[fieldKey(field.id)]"
                        variant="outlined"
                        density="comfortable"
                        color="primary"
                        class="premium-input bg-grey-50 rounded-lg"
                      />
                    </div>

                    <!-- File Upload (Premium) -->
                    <div
                      v-else-if="field.field_type === 'file'"
                      class="mb-6"
                    >
                      <VLabel class="mb-3 font-weight-bold text-high-emphasis">
                        {{ field.label }} <span
                          v-if="field.is_required"
                          class="text-error"
                        >*</span>
                      </VLabel>
                      
                      <div
                        class="file-upload-zone pa-8 border-dashed rounded-xl text-center cursor-pointer hover-scale transition-all glass-panel"
                        @click="$refs[`fileInput_${field.id}`][0].click()"
                      >
                        <input 
                          :ref="`fileInput_${field.id}`" 
                          type="file" 
                          class="d-none" 
                          @change="e => onProfileFileChange(field.id, e)"
                        >
                        
                        <div
                          v-if="fileMetadata[fieldKey(field.id)]?.objectUrl || fileMetadata[fieldKey(field.id)]?.file_url"
                          class="position-relative"
                        >
                          <VImg
                            v-if="isImage(fileMetadata[fieldKey(field.id)]?.objectUrl || fileMetadata[fieldKey(field.id)]?.file_url)"
                            :src="fileMetadata[fieldKey(field.id)]?.objectUrl || fileMetadata[fieldKey(field.id)]?.file_url"
                            max-height="200"
                            class="mx-auto rounded-xl elevation-6 mb-4"
                            cover
                          />
                          <div class="text-subtitle-1 font-weight-bold text-primary">
                            {{ fileMetadata[fieldKey(field.id)].name }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            Click to replace
                          </div>
                        </div>
                        
                        <div v-else>
                          <div class="icon-circle mb-4 mx-auto">
                            <VIcon
                              icon="tabler-cloud-upload"
                              size="32"
                              color="primary"
                            />
                          </div>
                          <div class="text-h6 font-weight-bold mb-1">
                            Upload {{ field.label }}
                          </div>
                          <div class="text-body-2 text-medium-emphasis">
                            SVG, PNG, JPG or GIF (max. 5MB)
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="errors[fieldKey(field.id)]"
                        class="text-error text-caption mt-2 ms-2 font-weight-medium"
                      >
                        {{ errors[fieldKey(field.id)] }}
                      </div>
                    </div>
                  </VCol>
                </VRow>
              </div>

              <div class="d-flex justify-end mt-6 pt-4 border-t">
                <VBtn 
                  color="primary" 
                  size="x-large" 
                  append-icon="tabler-arrow-right" 
                  class="px-10 rounded-pill elevation-6 hover-glow"
                  @click="goToStep2"
                >
                  Next Step
                </VBtn>
              </div>
            </VForm>
          </VWindowItem>

          <!-- STEP 2: DOCUMENTS -->
          <VWindowItem
            :value="2"
            transition="scroll-x-transition"
            reverse-transition="scroll-x-reverse-transition"
          >
            <div class="scrollable-content custom-scrollbar pr-4">
              <div class="text-center mb-10">
                <h3 class="text-h4 font-weight-bold mb-3">
                  Verification Documents
                </h3>
                <p class="text-body-1 text-medium-emphasis">
                  Upload clear copies of the required documents to verify your identity.
                </p>
              </div>

              <VRow>
                <VCol
                  v-for="doc in requestedDocuments"
                  :key="doc.id"
                  cols="12"
                  md="6"
                >
                  <VCard 
                    variant="outlined" 
                    class="h-100 border-opacity-50 hover-border-primary transition-all glass-card"
                    :class="{'border-success bg-success-lighten-5': existingRequestedByDefinition[doc.id]}"
                  >
                    <VCardItem class="pa-6">
                      <template #prepend>
                        <VAvatar
                          :color="existingRequestedByDefinition[doc.id] ? 'success' : 'primary'"
                          variant="tonal"
                          size="56"
                          class="rounded-lg"
                        >
                          <VIcon
                            :icon="existingRequestedByDefinition[doc.id] ? 'tabler-check' : 'tabler-file-text'"
                            size="28"
                          />
                        </VAvatar>
                      </template>
                      <VCardTitle class="text-h6 font-weight-bold mb-1">
                        {{ doc.label }}
                      </VCardTitle>
                      <VCardSubtitle class="text-body-2">
                        {{ doc.help_text }}
                      </VCardSubtitle>
                    </VCardItem>

                    <VCardText class="px-6 pb-6">
                      <div
                        class="file-upload-mini pa-6 border-dashed rounded-lg text-center cursor-pointer hover-scale"
                        @click="$refs[`docInput_${doc.id}`][0].click()"
                      >
                        <input 
                          :ref="`docInput_${doc.id}`" 
                          type="file" 
                          class="d-none" 
                          @change="e => onDocumentFileChange(doc.id, e)"
                        >
                        
                        <div v-if="requestedFiles[doc.id]">
                          <VIcon
                            icon="tabler-file-check"
                            color="primary"
                            size="32"
                            class="mb-2"
                          />
                          <div class="text-subtitle-2 font-weight-bold text-primary text-truncate">
                            {{ requestedFiles[doc.id][0].name }}
                          </div>
                        </div>
                        
                        <div v-else-if="existingRequestedByDefinition[doc.id]">
                          <VIcon
                            icon="tabler-check-circle"
                            color="success"
                            size="32"
                            class="mb-2"
                          />
                          <div class="text-subtitle-2 font-weight-bold text-success">
                            Document Uploaded
                          </div>
                          <a
                            :href="existingRequestedByDefinition[doc.id][0].file_url"
                            target="_blank"
                            class="text-caption text-decoration-underline mt-1 d-block"
                            @click.stop
                          >View File</a>
                        </div>
                        
                        <div v-else>
                          <VIcon
                            icon="tabler-upload"
                            color="medium-emphasis"
                            size="24"
                            class="mb-2"
                          />
                          <div class="text-body-2 text-medium-emphasis font-weight-medium">
                            Click to upload
                          </div>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>

            <div class="d-flex justify-space-between align-center mt-6 pt-4 border-t">
              <VBtn
                variant="text"
                color="secondary"
                size="large"
                prepend-icon="tabler-arrow-left"
                class="px-6"
                @click="step = 1"
              >
                Back to Profile
              </VBtn>
              <VBtn 
                color="success" 
                size="x-large" 
                :loading="submitting" 
                append-icon="tabler-check" 
                class="px-10 rounded-pill elevation-6 hover-glow"
                @click="submitAll"
              >
                Submit Application
              </VBtn>
            </div>
          </VWindowItem>

          <!-- STEP 3: COMPLETED -->
          <VWindowItem
            :value="3"
            transition="scroll-x-transition"
            reverse-transition="scroll-x-reverse-transition"
          >
            <div class="text-center py-12">
              <div class="mb-8">
                <VAvatar
                  color="success"
                  size="120"
                  variant="tonal"
                  class="mb-6 elevation-4"
                >
                  <VIcon
                    icon="tabler-check"
                    size="64"
                  />
                </VAvatar>
                <h2 class="text-h3 font-weight-black text-success mb-4">
                  All Done!
                </h2>
                <p
                  class="text-h5 text-medium-emphasis mb-8"
                  style="max-width: 600px; margin: 0 auto;"
                >
                  Your profile and documents have been submitted successfully. We will review your application shortly.
                </p>
              </div>

              <VBtn 
                color="primary" 
                size="x-large" 
                append-icon="tabler-arrow-right" 
                class="px-12 rounded-pill elevation-6 hover-glow"
                @click="$emit('complete')"
              >
                Go to Dashboard
              </VBtn>
            </div>
          </VWindowItem>
        </VWindow>

        <!-- Alerts -->
        <div class="mt-8">
          <VAlert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            closable
            class="mb-4 border-error glass-alert"
          >
            <template #prepend>
              <VIcon
                icon="tabler-alert-circle"
                size="24"
              />
            </template>
            <span class="font-weight-medium">{{ errorMessage }}</span>
          </VAlert>
        </div>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.z-index-10 {
  z-index: 10;
}
.wizard-wrapper {
  min-height: 50vh;
  padding: 20px;
}

.onboarding-wizard {
  width: 100%;
  max-width: 1100px;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* Dark mode support */
:global(.v-theme--dark) .onboarding-wizard {
  background: rgba(30, 30, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.glass-effect {
  position: relative;
  z-index: 1;
}

.progress-container {
  width: 100%;
  height: 6px;
  background: rgba(var(--v-theme-primary), 0.1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-bg-glow {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.15) 0%, rgba(255,255,255,0) 70%);
  z-index: -1;
  pointer-events: none;
}

.glow-icon {
  box-shadow: 0 0 20px rgba(var(--v-theme-primary), 0.4);
}

.tracking-tight {
  letter-spacing: -0.5px;
}

/* Stepper Styles */
.stepper-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.stepper-track {
  position: absolute;
  top: 24px;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 3px;
  z-index: 0;
}

.step-item {
  z-index: 1;
  position: relative;
  opacity: 0.5;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-item.active, .step-item.completed {
  opacity: 1;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  border: 3px solid rgba(var(--v-theme-on-surface), 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.step-item.active .step-circle {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: white;
  transform: scale(1.15);
  box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.3);
}

.step-item.completed .step-circle {
  border-color: rgb(var(--v-theme-success));
  background: rgb(var(--v-theme-success));
  color: white;
}

.step-label {
  transition: all 0.3s ease;
}

.step-item.active .step-label {
  color: rgb(var(--v-theme-primary));
  transform: translateY(2px);
}

/* File Upload Styles */
.file-upload-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-surface), 0.5);
}

.file-upload-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.03);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}

.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

:global(.v-theme--dark) .glass-card {
  background: rgba(30, 30, 30, 0.6);
}

.hover-scale:hover {
  transform: scale(1.02);
}

.hover-glow:hover {
  box-shadow: 0 10px 30px rgba(var(--v-theme-primary), 0.25) !important;
  transform: translateY(-2px);
}

.ms-12 {
  margin-left: 3rem !important;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.transition-all {
  transition: all 0.3s ease;
}

.cursor-not-allowed {
  cursor: not-allowed !important;
}

.opacity-50 {
  opacity: 0.5 !important;
}

/* Scrollable Content */
.scrollable-content {
  max-height: 40vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px; /* Space for scrollbar */
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.2);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.4);
}

.border-t {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.premium-input :deep(.v-field__outline__start),
.premium-input :deep(.v-field__outline__end),
.premium-input :deep(.v-field__outline__notch) {
  border-color: rgba(var(--v-theme-on-surface), 0.12) !important;
}

.premium-input:hover :deep(.v-field__outline__start),
.premium-input:hover :deep(.v-field__outline__end),
.premium-input:hover :deep(.v-field__outline__notch) {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}

.premium-input :deep(.v-field--focused .v-field__outline__start),
.premium-input :deep(.v-field--focused .v-field__outline__end),
.premium-input :deep(.v-field--focused .v-field__outline__notch) {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1);
}

.bg-grey-50 {
  background-color: rgba(var(--v-theme-on-surface), 0.02) !important;
}
</style>
