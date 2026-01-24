<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useRouter } from 'vue-router'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout

const veterinaryStore = useVeterinaryStore()
const router = useRouter()

const form = ref({
  pet_id: null,
  visit_type: 'OFFLINE',
  reason: '',
  date: new Date().toISOString().substr(0, 10),
})

const pets = computed(() => veterinaryStore.pets)
const loading = computed(() => veterinaryStore.loading)

onMounted(async () => {
  await Promise.all([
    veterinaryStore.fetchPets(),
    veterinaryStore.fetchPetTypes(),
    veterinaryStore.fetchPetBreeds(),
  ])
})

const visitTypes = [
  { title: 'Offline', value: 'OFFLINE' },
  { title: 'Online', value: 'ONLINE' },
]

const submit = async () => {
  if (!form.value.pet_id) {
    alert('Please select a pet')
    
    return
  }

  try {
    // For demo, we need a clinic_id. 
    // We'll fetch the first available clinic or use a default.
    const clinicsResponse = await veterinaryStore.fetchClinics()
    if (!clinicsResponse || clinicsResponse.length === 0) {
      alert('No clinic found for this provider')
      
      return
    }
    
    const clinicId = clinicsResponse[0].id
    
    await veterinaryStore.createVisit({
      ...form.value,
      clinic: clinicId,
    })
    
    alert('Visit Created Successfully!')
    router.push('/veterinary/dashboard')
  } catch (err) {
    alert('Failed to create visit: ' + err.message)
  }
}
</script>

<template>
  <component :is="currentLayout">
    <div class="new-visit-page">
      <div class="d-flex align-center mb-6">
        <VBtn
          icon="tabler-arrow-left"
          variant="text"
          to="/veterinary/dashboard"
          class="me-2"
        />
        <h1 class="text-h3 font-weight-bold text-primary">
          New Visit
        </h1>
      </div>

      <VCard>
        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="d-flex align-center justify-space-between mb-1">
                  <VLabel>Select Pet</VLabel>
                  <VBtn
                    variant="text"
                    color="primary"
                    size="small"
                    to="/veterinary/pets/new"
                    prepend-icon="tabler-plus"
                  >
                    New Pet
                  </VBtn>
                </div>
                <AppSelect
                  v-model="form.pet_id"
                  :items="pets"
                  item-title="name"
                  item-value="id"
                  placeholder="Search for a pet..."
                  prepend-inner-icon="tabler-paw"
                />
              </VCol>
              
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="form.visit_type"
                  :items="visitTypes"
                  item-title="title"
                  item-value="value"
                  label="Visit Type"
                  placeholder="Select visit type"
                  prepend-inner-icon="tabler-stethoscope"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.reason"
                  label="Reason for Visit"
                  placeholder="Brief description of the issue"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.date"
                  type="date"
                  label="Date"
                />
              </VCol>

              <VCol
                cols="12"
                class="d-flex justify-end gap-2"
              >
                <VBtn
                  variant="tonal"
                  color="secondary"
                  to="/veterinary/dashboard"
                >
                  Cancel
                </VBtn>
                <VBtn
                  type="submit"
                  color="primary"
                  :loading="loading"
                >
                  Create Visit
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
