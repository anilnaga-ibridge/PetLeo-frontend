<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref, onMounted } from 'vue'

import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useRouter } from 'vue-router'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout

const veterinaryStore = useVeterinaryStore()
const router = useRouter()

const form = ref({
  name: '',
  species: null,
  breed: '',
  sex: null,
  dob: '',
  color: '',
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  owner_address: '',
  country_code: '+91',
})

const countryCodes = ['+91', '+1', '+44', '+61', '+81', '+49', '+33', '+86']
const sexOptions = ['Male', 'Female', 'Unknown']

const petTypes = computed(() => veterinaryStore.petTypes)
const petBreeds = computed(() => veterinaryStore.petBreeds)

const filteredBreeds = computed(() => {
  const species = form.value.species
  if (!species) return []
  
  // Get species ID from object or find by name in petTypes
  let speciesId = null
  if (typeof species === 'object' && species?.id) {
    speciesId = species.id
  } else if (typeof species === 'string') {
    const found = petTypes.value.find(t => t.name.toLowerCase() === species.toLowerCase())
    if (found) speciesId = found.id
  }

  if (!speciesId) return []

  return petBreeds.value.filter(breed => {
    const breedTypeId = (typeof breed.petType === 'object' && breed.petType) ? breed.petType.id : breed.petType
    
    return breedTypeId === speciesId
  })
})

const loading = ref(false)
const creatingType = ref(false)
const creatingBreed = ref(false)

const createNewType = async name => {
  if (!name || creatingType.value) return
  creatingType.value = true
  try {
    const newType = await veterinaryStore.createPetType(name)
    form.value.species = newType
  } catch (err) {
    console.error('Failed to create type:', err)
  } finally {
    creatingType.value = false
  }
}

const createNewBreed = async breedName => {
  if (!breedName || creatingBreed.value) return
  
  const species = form.value.species
  let speciesId = null
  if (typeof species === 'object') speciesId = species.id
  else {
    const found = petTypes.value.find(t => t.name.toLowerCase() === species.toLowerCase())
    if (found) speciesId = found.id
  }

  if (!speciesId) {
    alert('Please select or create a valid species first.')
    return
  }

  creatingBreed.value = true
  try {
    const newBreed = await veterinaryStore.createPetBreed(speciesId, breedName)
    form.value.breed = newBreed.breed
  } catch (err) {
    console.error('Failed to create breed:', err)
  } finally {
    creatingBreed.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    veterinaryStore.fetchPetTypes(),
    veterinaryStore.fetchPetBreeds(),
  ])
})

const submit = async () => {
  loading.value = true
  try {
    const payload = { ...form.value }

    // Combine country code and phone
    if (payload.owner_phone) {
      payload.owner_phone = `${payload.country_code} ${payload.owner_phone}`
    }

    // Map frontend field to backend model field
    payload.address = payload.owner_address
      
    const unwrap = val => {
      if (!val) return null
      if (typeof val === 'string') return val
      if (typeof val === 'object') {
        return val.breed || val.name || val.title || val.label || val.id || ''
      }
      return String(val)
    }

    payload.species = unwrap(payload.species)
    payload.breed = unwrap(payload.breed)
    payload.sex = unwrap(payload.sex)

    await veterinaryStore.createPet(payload)
    router.push('/veterinary/dashboard')
  } catch (e) {
    alert('Failed to register pet: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <component :is="currentLayout">
    <div class="new-pet-page">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-6 pa-4 pb-0">
        <div class="d-flex align-center">
          <VBtn
            icon="tabler-arrow-left"
            variant="text"
            color="secondary"
            to="/veterinary/dashboard"
            class="me-2"
          />
          <div>
            <h1 class="text-h4 font-weight-bold text-primary mb-1">
              New Patient
            </h1>
            <div class="text-body-2 text-medium-emphasis">
              Register a new furry friend
            </div>
          </div>
        </div>
        <div class="d-none d-sm-flex gap-2">
           <VBtn
            variant="tonal"
            color="secondary"
            to="/veterinary/dashboard"
          >
            Cancel
          </VBtn>
           <VBtn
            color="primary"
            :loading="loading"
            @click="submit"
            prepend-icon="tabler-check"
          >
            Register Patient
          </VBtn>
        </div>
      </div>

      <VForm @submit.prevent="submit" class="pa-4">
        <VRow>
          <!-- Left Column: Pet Details -->
          <VCol cols="12" md="7" lg="8">
            <VCard class="mb-6 h-100" elevation="0" border>
              <VCardItem class="pb-0">
                <template #prepend>
                   <VAvatar
                      color="primary"
                      variant="tonal"
                      size="40"
                      class="me-2"
                    >
                      <VIcon icon="tabler-paw" size="24" />
                    </VAvatar>
                </template>
                <VCardTitle>Pet Information</VCardTitle>
                <VCardSubtitle>Basic details about the patient</VCardSubtitle>
              </VCardItem>

              <VCardText class="pt-6">
                <!-- Avatar Placeholder (Visual only for now) -->
                <div class="d-flex justify-center mb-6">
                  <div class="text-center">
                    <VAvatar
                      size="100"
                      color="secondary"
                      variant="tonal"
                      class="mb-2"
                      style="border: 2px dashed rgba(var(--v-theme-primary), 0.3)"
                    >
                      <VIcon icon="tabler-camera-plus" size="40" color="primary" />
                    </VAvatar>
                    <div class="text-caption text-disabled">Upload Photo</div>
                  </div>
                </div>

                <VRow>
                  <VCol cols="12">
                     <AppTextField
                      v-model="form.name"
                      label="Pet Name *"
                      placeholder="e.g. Max"
                      prepend-inner-icon="tabler-id"
                      :rules="[v => !!v || 'Name is required']"
                      variant="outlined"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                     <AppCombobox
                      v-model="form.species"
                      :items="petTypes"
                      item-title="name"
                      item-value="name"
                      label="Species"
                      placeholder="Dog, Cat..."
                      prepend-inner-icon="tabler-dna"
                      :return-object="true"
                      :loading="creatingType"
                    >
                      <template #no-data>
                        <VListItem @click="createNewType(form.species)">
                          <VListItemTitle>
                            Create "<span class="font-weight-bold">{{ form.species }}</span>"
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppCombobox>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppCombobox
                      v-model="form.breed"
                      :items="filteredBreeds"
                      item-title="breed"
                      item-value="breed"
                      label="Breed"
                      placeholder="Select Breed"
                      prepend-inner-icon="tabler-category"
                      :return-object="false"
                      :disabled="!form.species"
                      :loading="creatingBreed"
                    >
                      <template #no-data>
                        <VListItem @click="createNewBreed(form.breed)">
                          <VListItemTitle>
                            Create "<span class="font-weight-bold">{{ form.breed }}</span>"
                          </VListItemTitle>
                        </VListItem>
                      </template>
                    </AppCombobox>
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppSelect
                      v-model="form.sex"
                      :items="sexOptions"
                      label="Sex"
                      placeholder="Select Sex"
                      prepend-inner-icon="tabler-gender-bigender"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <AppTextField
                      v-model="form.dob"
                      type="date"
                      label="Date of Birth"
                      prepend-inner-icon="tabler-calendar"
                    />
                  </VCol>

                   <VCol cols="12">
                    <AppTextField
                      v-model="form.color"
                      label="Color / Markings"
                      placeholder="e.g. Brown with white spots"
                      prepend-inner-icon="tabler-palette"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Right Column: Owner Details -->
          <VCol cols="12" md="5" lg="4">
             <VCard class="h-100" elevation="0" border>
              <VCardItem class="pb-0">
                <template #prepend>
                   <VAvatar
                      color="info"
                      variant="tonal"
                      size="40"
                      class="me-2"
                    >
                      <VIcon icon="tabler-user" size="24" />
                    </VAvatar>
                </template>
                <VCardTitle>Owner Information</VCardTitle>
                <VCardSubtitle>Contact details</VCardSubtitle>
              </VCardItem>

              <VCardText class="pt-6">
                <VRow>
                  <VCol cols="12">
                    <AppTextField
                      v-model="form.owner_name"
                      label="Owner Name *"
                      placeholder="Full Legal Name"
                      prepend-inner-icon="tabler-user"
                      :rules="[v => !!v || 'Owner name is required']"
                    />
                  </VCol>

                  <VCol cols="12">
                    <div class="d-flex gap-2">
                       <AppSelect
                        v-model="form.country_code"
                        :items="countryCodes"
                        label="Code"
                        style="max-width: 100px;"
                      />
                      <AppTextField
                        v-model="form.owner_phone"
                        label="Phone *"
                        placeholder="9876543210"
                        :rules="[v => !!v || 'Phone is required']"
                        type="number"
                      />
                    </div>
                  </VCol>

                  <VCol cols="12">
                     <AppTextField
                      v-model="form.owner_email"
                      label="Email"
                      placeholder="owner@example.com"
                      prepend-inner-icon="tabler-mail"
                      type="email"
                    />
                  </VCol>

                  <VCol cols="12">
                    <AppTextarea
                      v-model="form.owner_address"
                      label="Current Address"
                      placeholder="Street, City, Zip Code"
                      prepend-inner-icon="tabler-map-pin"
                      rows="3"
                      auto-grow
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
        
        <!-- Mobile Actions -->
        <VRow class="d-sm-none mt-4">
           <VCol cols="12">
             <VBtn
                color="primary"
                :loading="loading"
                block
                size="large"
                @click="submit"
              >
                Register Patient
              </VBtn>
           </VCol>
        </VRow>
      </VForm>
    </div>
  </component>
</template>

<style scoped>
.new-pet-page {
  max-width: 1600px;
  margin: 0 auto;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
