<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useRouter, useRoute } from 'vue-router'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout

const veterinaryStore = useVeterinaryStore()
const router = useRouter()
const route = useRoute()
const petId = route.params.id

const form = ref({
  name: '',
  species: null,
  breed: '',
  sex: null,
  dob: '',
  color: '',
  weight: '',
  owner_name: '',
  owner_phone: '',
})

const sexOptions = ['Male', 'Female', 'Unknown']
const petTypes = computed(() => veterinaryStore.petTypes)
const petBreeds = computed(() => veterinaryStore.petBreeds)

const filteredBreeds = computed(() => {
  const species = form.value.species
  if (!species) return []
  
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
const fetching = ref(false)
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

  if (!speciesId) return
  
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
  fetching.value = true
  try {
    await Promise.all([
      veterinaryStore.fetchPetTypes(),
      veterinaryStore.fetchPetBreeds(),
    ])
        
    const pet = await veterinaryStore.fetchPetById(petId)
    if (pet) {
      form.value = {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        sex: pet.sex,
        dob: pet.dob,
        color: pet.color,
        weight: pet.weight,
        owner_name: pet.owner?.name || '',
        owner_phone: pet.owner?.phone || '',
      }
    }
  } catch (e) {
    console.error("Failed to load pet data:", e)
  } finally {
    fetching.value = false
  }
})

const submit = async () => {
  loading.value = true
  try {
    const payload = { ...form.value }
      
    const unwrap = val => {
      if (!val) return null
      if (typeof val === 'string') return val
      if (typeof val === 'object') return val.name || val.breed || val.id || ''
      
      return String(val)
    }

    payload.species = unwrap(payload.species)
    payload.breed = unwrap(payload.breed)
    payload.sex = unwrap(payload.sex)
    if (payload.weight) payload.weight = parseFloat(payload.weight)

    await veterinaryStore.updatePet(petId, payload)
    router.push('/veterinary/pets')
  } catch (e) {
    alert('Failed to update pet: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <component :is="currentLayout">
    <div class="edit-pet-page pa-4">
      <div
        v-if="fetching"
        class="d-flex justify-center align-center"
        style="height: 50vh;"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <template v-else>
        <div class="d-flex align-center mb-6">
          <VBtn
            icon="tabler-arrow-left"
            variant="tonal"
            to="/veterinary/pets"
            class="me-2"
            color="primary"
          />
          <div>
            <h1 class="text-h3 font-weight-bold text-primary">
              Edit Patient
            </h1>
            <div class="text-body-1 text-medium-emphasis">
              Update registration details for {{ form.name }}
            </div>
          </div>
        </div>

        <VCard
          elevation="0"
          border
        >
          <VCardText>
            <VForm @submit.prevent="submit">
              <div class="d-flex align-center gap-2 mb-4">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                >
                  <VIcon
                    icon="tabler-paw"
                    size="20"
                  />
                </VAvatar>
                <span class="text-h6 font-weight-bold">Pet Information</span>
              </div>

              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.name"
                    label="Pet Name *"
                    prepend-inner-icon="tabler-id"
                    :rules="[v => !!v || 'Name is required']"
                  />
                </VCol>
                
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppCombobox
                    v-model="form.species"
                    :items="petTypes"
                    item-title="name"
                    item-value="name"
                    label="Species"
                    prepend-inner-icon="tabler-dna"
                    :return-object="true"
                    :loading="creatingType"
                  >
                    <template #no-data>
                      <VListItem @click="createNewType(form.species)">
                        <template #prepend>
                          <VIcon
                            icon="tabler-plus"
                            color="primary"
                          />
                        </template>
                        <VListItemTitle>Create new species: "{{ form.species }}"</VListItemTitle>
                      </VListItem>
                    </template>
                  </AppCombobox>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppCombobox
                    v-model="form.breed"
                    :items="filteredBreeds"
                    item-title="breed"
                    item-value="breed"
                    label="Breed"
                    prepend-inner-icon="tabler-category"
                    :return-object="false"
                    :disabled="!form.species"
                    :loading="creatingBreed"
                  >
                    <template #no-data>
                      <VListItem @click="createNewBreed(form.breed)">
                        <template #prepend>
                          <VIcon
                            icon="tabler-plus"
                            color="primary"
                          />
                        </template>
                        <VListItemTitle>Create new breed: "{{ form.breed }}"</VListItemTitle>
                      </VListItem>
                    </template>
                  </AppCombobox>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppSelect
                    v-model="form.sex"
                    :items="sexOptions"
                    label="Sex"
                    prepend-inner-icon="tabler-gender-bigender"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="4"
                >
                  <AppTextField
                    v-model="form.dob"
                    type="date"
                    label="Date of Birth"
                    prepend-inner-icon="tabler-calendar"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="4"
                >
                  <AppTextField
                    v-model="form.color"
                    label="Color/Markings"
                    prepend-inner-icon="tabler-palette"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="4"
                >
                  <AppTextField
                    v-model="form.weight"
                    type="number"
                    label="Weight (kg)"
                    prepend-inner-icon="tabler-scale"
                  />
                </VCol>

                <VCol cols="12">
                  <VDivider class="my-2 border-dashed" />
                </VCol>

                <div class="d-flex align-center gap-2 mb-4 px-3 mt-4 w-100">
                  <VAvatar
                    color="info"
                    variant="tonal"
                    size="32"
                  >
                    <VIcon
                      icon="tabler-user"
                      size="20"
                    />
                  </VAvatar>
                  <span class="text-h6 font-weight-bold">Owner Information</span>
                </div>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.owner_name"
                    label="Owner Name *"
                    prepend-inner-icon="tabler-user"
                    :rules="[v => !!v || 'Owner name is required']"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model="form.owner_phone"
                    label="Owner Phone *"
                    prepend-inner-icon="tabler-phone"
                    :rules="[v => !!v || 'Owner phone is required']"
                  />
                </VCol>

                <VCol
                  cols="12"
                  class="d-flex justify-end gap-3 mt-4"
                >
                  <VBtn
                    variant="outlined"
                    color="secondary"
                    to="/veterinary/pets"
                    size="large"
                  >
                    Cancel
                  </VBtn>
                  <VBtn
                    type="submit"
                    color="primary"
                    :loading="loading"
                    size="large"
                    prepend-icon="tabler-check"
                  >
                    Save Changes
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </template>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
