
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const profileData = ref({
  about_text: '',
  years_of_experience: 0,
  specializations: '',
  clinic_name: '',
  tagline: '',
})

const loading = ref(false)
const saving = ref(false)
const success = ref(false)
const error = ref('')

const taglineSuggestions = [
  'Compassionate care for every pet.',
  'Your trusted partner in pet health.',
  'Expert veterinary services with a personal touch.',
  'Where every pet is family.',
  'Quality care you can count on.',
]

const popularSpecializations = [
  'General Medicine',
  'Surgery',
  'Dental Care',
  'Grooming', 
  'Training',
  'Nutrition',
  'Emergency Care',
  'Vaccinations',
]

const generateBio = () => {
  const name = profileData.value.clinic_name || 'our practice'
  const exp = profileData.value.years_of_experience || 'many'
  const specs = profileData.value.specializations ? ` ${profileData.value.specializations}` : ''
  
  profileData.value.about_text = `Welcome to ${name}! With ${exp} years of professional experience, we are dedicated to providing the highest quality care for your beloved pets. Our expert team specializes in${specs}, ensuring every patient receives the individual attention they deserve. We look forward to meeting you and your furry family members!`
}

const toggleSpecialization = spec => {
  let current = profileData.value.specializations ? profileData.value.specializations.split(',').map(s => s.trim()) : []
  if (current.includes(spec)) {
    current = current.filter(s => s !== spec)
  } else {
    current.push(spec)
  }
  profileData.value.specializations = current.join(', ')
}

const isSpecSelected = spec => {
  if (!profileData.value.specializations) return false
  
  return profileData.value.specializations.split(',').map(s => s.trim()).includes(spec)
}

const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/my-profile-detailed/')


    // Since it's a list in ViewSet but we ensure 1-to-1 in backend, it returns the object
    profileData.value = res.data
  } catch (err) {
    console.error('Failed to fetch detailed profile', err)
    error.value = 'Failed to load profile data.'
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  success.value = false
  error.value = ''
  try {
    // Use PATCH for partial updates since get_object_or_create handles initial existence
    await providerApi.patch(`/api/provider/my-profile-detailed/${profileData.value.id}/`, profileData.value)
    success.value = true
  } catch (err) {
    console.error('Failed to save profile', err)
    error.value = 'Failed to save changes.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchProfile)
</script>

<template>
  <VCard
    title="About & Experience"
    subtitle="Tell your customers about who you are and what makes you unique."
  >
    <VCardText
      v-if="loading"
      class="text-center pa-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </VCardText>
    
    <VCardText v-else>
      <VForm @submit.prevent="saveProfile">
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="profileData.tagline"
              label="Tagline / Short Headline"
              placeholder="e.g. Expert care for your furry friends"
              hint="A catchy one-liner for your profile header."
              persistent-hint
            />
            <div class="mt-2 d-flex flex-wrap gap-2">
              <VChip 
                v-for="sug in taglineSuggestions" 
                :key="sug" 
                size="x-small" 
                variant="tonal"
                class="cursor-pointer"
                @click="profileData.tagline = sug"
              >
                {{ sug }}
              </VChip>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="8"
          >
            <AppTextField
              v-model="profileData.clinic_name"
              label="Clinic/Business Name (Optional)"
              placeholder="e.g. Happy Paws Clinic"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <AppTextField
              v-model="profileData.years_of_experience"
              type="number"
              label="Years of Experience"
              placeholder="10"
            />
          </VCol>

          <VCol cols="12">
            <div class="d-flex justify-space-between align-center mb-1">
              <label class="v-label">About Us</label>
              <VBtn 
                variant="text" 
                size="x-small" 
                prepend-icon="tabler-wand" 
                color="primary"
                @click="generateBio"
              >
                Generate Bio
              </VBtn>
            </div>
            <AppTextarea
              v-model="profileData.about_text"
              placeholder="Describe your history, mission, and what pet owners can expect..."
              rows="5"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="profileData.specializations"
              label="Specializations"
              placeholder="e.g. Surgery, Dental Care (Select below or type)"
            />
            <div class="mt-2 d-flex flex-wrap gap-2">
              <VChip 
                v-for="spec in popularSpecializations" 
                :key="spec" 
                size="x-small" 
                :color="isSpecSelected(spec) ? 'primary' : 'default'"
                :variant="isSpecSelected(spec) ? 'elevated' : 'tonal'"
                class="cursor-pointer"
                @click="toggleSpecialization(spec)"
              >
                {{ spec }}
              </VChip>
            </div>
          </VCol>

          <VCol
            cols="12"
            class="d-flex gap-4"
          >
            <VBtn
              type="submit"
              :loading="saving"
              color="primary"
            >
              Save Profile
            </VBtn>
            
            <VAlert
              v-if="success"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-0 flex-grow-1"
            >
              Profile updated successfully!
            </VAlert>
            
            <VAlert
              v-if="error"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-0 flex-grow-1"
            >
              {{ error }}
            </VAlert>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>
