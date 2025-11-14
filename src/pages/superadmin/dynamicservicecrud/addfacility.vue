<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { useServiceStore } from '@/stores/servicestore'

const API_URL = 'http://127.0.0.1:8003/api/superadmin/facilities/'
const serviceStore = useServiceStore()

onMounted(serviceStore.fetchServices)

const facility = ref({
  service: null,
  name: '',
  description: '',
  price: '',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const addFacility = async () => {
  const token = useCookie('accessToken').value
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await axios.post(API_URL, facility.value, {
      headers: { Authorization: `Bearer ${token}` }
    })

    successMessage.value = '✅ Facility added successfully!'
    console.log(response.data)

    facility.value = { service: null, name: '', description: '', price: '', is_active: true }

  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to add facility.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VCard class="pa-4" max-width="600">
    <h3 class="mb-4">Add Facility</h3>

    <VAlert v-if="successMessage" type="success" variant="tonal">{{ successMessage }}</VAlert>
    <VAlert v-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</VAlert>

    <VForm @submit.prevent="addFacility">

      <VSelect
        label="Select Service"
        :items="serviceStore.services"
        item-title="display_name"
        item-value="id"
        v-model="facility.service"
        required
      />

      <AppTextField label="Facility Name" v-model="facility.name" class="mt-3" required />
      <AppTextField label="Description" v-model="facility.description" class="mt-3" textarea rows="3" />

      <AppTextField label="Price" v-model="facility.price" type="number" class="mt-3" required />

      <VCheckbox label="Active" v-model="facility.is_active" class="mt-3" />

      <VBtn type="submit" class="mt-4" :loading="loading">Save Facility</VBtn>
    </VForm>
  </VCard>
</template>
