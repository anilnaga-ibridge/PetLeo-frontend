<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { customerApi, superAdminApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  pet: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'close'])

const loading = ref(false)
const photoFile = ref(null)
const photoPreview = ref(null)
const currentStep = ref(1)

const form = ref({
  name: '',
  species: '',
  breed: '',
  gender: '',
  date_of_birth: '',
  color: '',
})

const speciesList = ref([])
const breedList = ref([])
const loadingBreeds = ref(false)

const fetchSpecies = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/pet-types/')
    speciesList.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch species:', err)
  }
}

const fetchBreeds = async (speciesId) => {
  if (!speciesId) {
    breedList.value = []
    return
  }
  loadingBreeds.value = true
  try {
    const res = await superAdminApi.get(`/api/superadmin/pet-breeds/?petType=${speciesId}`)
    breedList.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch breeds:', err)
  } finally {
    loadingBreeds.value = false
  }
}

watch(() => form.value.species, (newSpecies) => {
  if (!props.pet || form.value.species !== props.pet.species) {
    form.value.breed = ''
  }
  fetchBreeds(newSpecies)
})

onMounted(fetchSpecies)

const genderOptions = [
  { title: 'Male', value: 'MALE' },
  { title: 'Female', value: 'FEMALE' }
]

// Validation rules
const rules = {
  required: v => !!v || 'This field is required'
}

const resetForm = () => {
  form.value = {
    name: '',
    species: '',
    breed: '',
    gender: '',
    date_of_birth: '',
    color: '',
  }
  photoFile.value = null
  photoPreview.value = null
}

// Watch for pet changes (edit mode)
watch(() => props.pet, (newPet) => {
  if (newPet) {
    form.value = {
      name: newPet.name || '',
      species: newPet.species || '',
      breed: newPet.breed || '',
      gender: newPet.gender || '',
      date_of_birth: newPet.date_of_birth || '',
      color: newPet.color || '',
    }
    
    if (newPet.photo) {
      photoPreview.value = newPet.photo.startsWith('http') ? newPet.photo : `http://localhost:8005${newPet.photo}`
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    photoFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const errorSnackbar = ref(false)
const errorMessage = ref('')
const showValidationErrors = ref(false)

const handleSave = async () => {
  showValidationErrors.value = true
  
  if (!isValid.value) {
    errorMessage.value = 'Please fill in all required fields (*)'
    errorSnackbar.value = true
    return
  }

  loading.value = true
  try {
    const formData = new FormData()
    
    // Add basic fields
    Object.keys(form.value).forEach(key => {
      let value = form.value[key]
      
      // If species or breed, send the name instead of ID for better UI display
      if (key === 'species') {
        const found = speciesList.value.find(s => s.id === value)
        if (found) value = found.name
      } else if (key === 'breed') {
        const found = breedList.value.find(b => b.id === value)
        if (found) value = found.breed
      }

      if (value !== null && value !== undefined) {
        formData.append(key, value)
      }
    })
    
    // Add photo if selected
    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    }
    
    if (props.pet) {
      // Update existing pet
      await customerApi.patch(`/api/pet-owner/pets/pets/${props.pet.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      emit('saved', 'Family member updated successfully! ✨')
    } else {
      // Create new pet
      await customerApi.post('/api/pet-owner/pets/pets/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      emit('saved', 'New family member added successfully! ✨')
    }
    
    emit('update:modelValue', false)
    resetForm()
  } catch (err) {
    console.error('Failed to save pet:', err)
    errorMessage.value = err.response?.data?.error || err.response?.data?.message || 'Failed to save pet. Please check your connection.'
    
    // Check for specific field errors (e.g., date_of_birth)
    if (err.response?.data) {
      const fieldErrors = Object.entries(err.response.data)
        .filter(([key]) => key !== 'error' && key !== 'message')
        .map(([key, msg]) => `${key}: ${msg}`)
        .join(', ')
      
      if (fieldErrors) {
        errorMessage.value += ` (${fieldErrors})`
      }
    }
    
    errorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
  resetForm()
}

const isValid = computed(() => {
  return !!(form.value.name && form.value.species && form.value.gender && form.value.date_of_birth)
})

const dialogTitle = computed(() => props.pet ? 'Edit Pet Profile' : 'Add New Family Member')
</script>

<template>
  <VNavigationDrawer
    :model-value="modelValue"
    location="right"
    width="550"
    temporary
    persistent
    class="premium-wizard-drawer"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <div class="glass-wizard-wrapper h-100 d-flex flex-column">
      <!-- Dynamic Mesh Gradient Background -->
      <div class="mesh-gradient"></div>
      
      <!-- Luxury Frosted Header -->
      <div class="pa-8 pb-6 glass-header flex-shrink-0">
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <h2 class="text-h2 font-weight-black text-slate-900 tracking-tighter dialog-title">
              {{ dialogTitle }}
            </h2>
            <div class="title-underline"></div>
          </div>
          <VBtn 
            icon="tabler-x" 
            variant="tonal" 
            color="slate-400" 
            size="small" 
            class="rounded-2xl luxury-close-btn" 
            @click="handleClose" 
          />
        </div>
        <p class="text-h6 text-slate-500 font-weight-medium opacity-80 mt-2">
          {{ props.pet ? 'Refining excellence for your family member. ✨' : 'Add New Family Member' }}
        </p>
        <p v-if="!props.pet" class="text-caption text-slate-400 mt-1">Embark on a new journey together. 🦴</p>
      </div>

      <VCardText class="pa-8 pt-4 scrollable-content-luxury flex-grow-1">
        <!-- Photo Experience: Luxury Lense -->
        <div class="text-center mb-10 animate-luxury-pop">
          <div class="photo-lense-container mx-auto">
            <div class="lense-ring primary-glow">
              <VAvatar size="150" color="white" class="elevation-24 border-8 border-white overflow-hidden">
                <div v-if="!photoPreview" class="shimmer-loading"></div>
                <VImg v-if="photoPreview" :src="photoPreview" cover class="pet-photo-prime" />
                <VIcon v-else icon="tabler-camera-bolt" size="60" color="primary-lighten-4" class="opacity-50" />
              </VAvatar>
            </div>
            <VBtn
              icon="tabler-plus"
              color="primary"
              size="small"
              class="lense-action-btn shadow-primary-xl"
              @click="$refs.photoInput.click()"
            />
            <input
              ref="photoInput"
              type="file"
              hidden
              accept="image/*"
              @change="handlePhotoChange"
            >
          </div>
        </div>

        <VRow>
          <!-- Pet Name -->
          <VCol cols="12" class="luxury-row delay-1">
            <div class="luxury-input-group">
              <label class="luxury-label">Pet Name *</label>
              <VTextField
                v-model="form.name"
                label="e.g. Max"
                variant="outlined"
                class="luxury-input-field"
                persistent-placeholder
                :error="showValidationErrors && !form.name"
                :rules="[rules.required]"
              />
            </div>
          </VCol>
          
          <!-- Species Selection -->
          <VCol cols="12" md="6" class="luxury-row delay-2">
            <div class="luxury-input-group">
              <label class="luxury-label">Species</label>
              <VSelect
                v-model="form.species"
                :items="speciesList"
                item-title="name"
                item-value="id"
                label="Dog, Cat..."
                variant="outlined"
                class="luxury-input-field"
                :error="showValidationErrors && !form.species"
                :rules="[rules.required]"
              />
            </div>
          </VCol>

          <!-- Breed Selection -->
          <VCol cols="12" md="6" class="luxury-row delay-2">
            <div class="luxury-input-group">
              <label class="luxury-label">Breed</label>
              <VSelect
                v-model="form.breed"
                :items="breedList"
                item-title="breed"
                item-value="id"
                label="Search breeds..."
                variant="outlined"
                class="luxury-input-field"
                :loading="loadingBreeds"
                no-data-text="Select species first"
              />
            </div>
          </VCol>

          <!-- Sex Selection -->
          <VCol cols="12" md="6" class="luxury-row delay-3">
            <div class="luxury-input-group">
              <label class="luxury-label">Sex</label>
              <VSelect
                v-model="form.gender"
                :items="genderOptions"
                label="Select Sex"
                variant="outlined"
                class="luxury-input-field"
                :error="showValidationErrors && !form.gender"
                :rules="[rules.required]"
              />
            </div>
          </VCol>

          <!-- Date of Birth -->
          <VCol cols="12" md="6" class="luxury-row delay-3">
            <div class="luxury-input-group">
              <label class="luxury-label">Date of Birth</label>
              <VTextField
                v-model="form.date_of_birth"
                placeholder="dd/mm/yyyy"
                type="date"
                variant="outlined"
                class="luxury-input-field"
                :error="showValidationErrors && !form.date_of_birth"
                :rules="[rules.required]"
              />
            </div>
          </VCol>

          <!-- Color / Markings -->
          <VCol cols="12" class="luxury-row delay-4">
            <div class="luxury-input-group">
              <label class="luxury-label">Color / Markings</label>
              <VTextField
                v-model="form.color"
                label="Describe their appearance"
                variant="outlined"
                class="luxury-input-field"
              />
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <!-- Luxury Footer -->
      <div class="pa-8 glass-footer flex-shrink-0">
        <VBtn
          color="primary"
          height="64"
          class="rounded-3xl luxury-submit-btn font-weight-black text-h5"
          :loading="loading"
          @click="handleSave"
        >
          <VIcon icon="tabler-sparkles" class="me-2" />
          {{ props.pet ? 'Update Profile' : 'Complete Identity' }}
        </VBtn>
      </div>
    </div>

    <!-- Snackbar for Errors -->
    <VSnackbar
      v-model="errorSnackbar"
      color="error"
      location="top"
      :timeout="5000"
    >
      <div class="d-flex align-center">
        <VIcon icon="tabler-alert-circle" class="me-2" />
        {{ errorMessage }}
      </div>
      <template #actions>
        <VBtn variant="text" size="small" @click="errorSnackbar = false">Close</VBtn>
      </template>
    </VSnackbar>
  </VNavigationDrawer>
</template>

<style scoped>
/* LUXURY DRAWER DESIGN SYSTEM */
.premium-wizard-drawer :deep(.v-navigation-drawer__content) {
  overflow: hidden !important;
}

.premium-wizard-drawer {
  border-radius: 40px 0 0 40px !important;
  box-shadow: -20px 0 60px rgba(0,0,0,0.1) !important;
  border: none !important;
}

.glass-wizard-wrapper {
  position: relative;
  background: white;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
}

/* Mesh Gradient Animation */
.mesh-gradient {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.4;
  background: 
    radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
    radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
    radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%), 
    radial-gradient(at 0% 50%, hsla(253,16%,7%,1) 0, transparent 50%), 
    radial-gradient(at 50% 50%, rgba(var(--v-theme-primary), 0.2) 0, transparent 50%), 
    radial-gradient(at 100% 50%, hsla(339,49%,30%,1) 0, transparent 50%), 
    radial-gradient(at 0% 100%, hsla(253,16%,7%,1) 0, transparent 50%), 
    radial-gradient(at 50% 100%, hsla(225,39%,30%,1) 0, transparent 50%), 
    radial-gradient(at 100% 100%, hsla(339,49%,30%,1) 0, transparent 50%);
  filter: blur(80px);
  animation: mesh-float 20s infinite alternate;
}

@keyframes mesh-float {
  0% { transform: scale(1); }
  100% { transform: scale(1.2) rotate(5deg); }
}

.luxury-wizard-card {
  z-index: 1;
  height: 100%;
  background: transparent !important;
}

.glass-header {
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: rgba(255,255,255,0.4);
}

.title-underline {
  width: 40px;
  height: 6px;
  background: var(--v-theme-primary);
  border-radius: 10px;
  margin-top: 4px;
}

.luxury-close-btn {
  background: rgba(0,0,0,0.05) !important;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.luxury-close-btn:hover {
  background: rgba(0,0,0,0.1) !important;
  transform: rotate(90deg);
}

/* Photo Lense */
.photo-lense-container {
  position: relative;
  width: 200px;
}

.lense-ring {
  padding: 10px;
  border-radius: 50%;
  background: white;
  position: relative;
  transition: all 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.primary-glow {
  box-shadow: 0 0 40px rgba(var(--v-theme-primary), 0.15);
}

.lense-action-btn {
  position: absolute;
  bottom: 0;
  right: 15px;
  border: 6px solid white !important;
  border-radius: 24px !important;
  transform: scale(1.1);
}

.shimmer-loading {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}

/* Luxury Input Controls */
.luxury-row {
  opacity: 0;
  transform: translateY(20px);
  animation: luxury-entry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes luxury-entry {
  to { opacity: 1; transform: translateY(0); }
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }

.luxury-label {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 800;
  color: #64748b;
  margin-bottom: 8px;
  display: block;
}

.luxury-input-field :deep(.v-field) {
  border-radius: 20px !important;
  background: white !important;
  border: 1px solid rgba(0,0,0,0.05) !important;
  transition: all 0.3s ease;
}

.luxury-input-field :deep(.v-field--focused) {
  box-shadow: 0 10px 30px rgba(var(--v-theme-primary), 0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

/* Species Card Luxury */
.species-card-luxury {
  min-width: 90px;
  height: 100px;
  background: white;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1.5px solid rgba(0,0,0,0.03);
  transition: all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.species-card-luxury .icon-circle {
  width: 44px;
  height: 44px;
  background: #f8fafc;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.species-card-luxury.active {
  background: var(--v-theme-primary);
  color: white;
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(var(--v-theme-primary), 0.2);
}

.species-card-luxury.active .icon-circle {
  background: rgba(255,255,255,0.2);
  color: white;
}

/* Luxury Segmented Control */
.luxury-segmented-control {
  display: flex;
  background: #f1f5f9;
  padding: 6px;
  border-radius: 20px;
  gap: 4px;
}

.segment-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
}

.segment-item.active {
  background: white;
  color: var(--v-theme-primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* Footer & Submit */
.glass-footer {
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(10px);
}

.luxury-submit-btn {
  width: 100%;
  letter-spacing: 0.5px;
  transition: all 0.4s ease;
}

.luxury-submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 40px rgba(var(--v-theme-primary), 0.4) !important;
}

.scrollable-content-luxury {
  max-height: 60vh;
  overflow-y: auto !important;
}

.scrollable-content-luxury::-webkit-scrollbar {
  width: 4px;
}

.scrollable-content-luxury::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 10px;
}
</style>
