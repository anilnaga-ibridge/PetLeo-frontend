<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref } from 'vue'

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
  age: '',
  owner_name: '',
  owner_phone: ''
})

const speciesList = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']

const loading = ref(false)

const submit = async () => {
  loading.value = true
  try {
      await veterinaryStore.createPet(form.value)
      // alert('Pet Registered Successfully')
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
      <div class="d-flex align-center mb-6">
        <VBtn icon="tabler-arrow-left" variant="text" to="/veterinary/dashboard" class="me-2" />
        <h1 class="text-h3 font-weight-bold text-primary">Register New Pet</h1>
      </div>

      <VCard>
        <VCardText>
          <VForm @submit.prevent="submit">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.name"
                  label="Pet Name"
                  placeholder="e.g. Max"
                />
              </VCol>
              
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="form.species"
                  :items="speciesList"
                  label="Species"
                  placeholder="Select species"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.breed"
                  label="Breed"
                  placeholder="e.g. Golden Retriever"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.age"
                  label="Age"
                  placeholder="e.g. 2 years"
                />
              </VCol>

              <VDivider class="my-4" />

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.owner_name"
                  label="Owner Name"
                  placeholder="Full Name"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.owner_phone"
                  label="Owner Phone"
                  placeholder="+1 234 567 890"
                />
              </VCol>

              <VCol cols="12" class="d-flex justify-end gap-2">
                <VBtn variant="tonal" color="secondary" to="/veterinary/dashboard">Cancel</VBtn>
                <VBtn type="submit" color="primary" :loading="loading">Register Pet</VBtn>
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
