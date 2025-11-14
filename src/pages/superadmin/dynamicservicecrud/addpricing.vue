<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { useServiceStore } from '@/stores/servicestore'
import { useCategoryStore } from '@/stores/categorystore'
import { useFacilityStore } from '@/stores/facilitystore'

const API_URL = 'http://127.0.0.1:8003/api/superadmin/pricing/'

// ✅ Load required dropdown data
const serviceStore = useServiceStore()
const categoryStore = useCategoryStore()
const facilityStore = useFacilityStore()

onMounted(() => {
  serviceStore.fetchServices()
  categoryStore.fetchCategories()
  facilityStore.fetchFacilities()
})

// ✅ Form Data
const pricing = ref({
  service: null,
  category: null,
  facility: null,
  price: '',
  duration: '',
  discount: '',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// ✅ Submit Handler
const addPricing = async () => {
  const token = useCookie('accessToken').value

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const res = await axios.post(API_URL, pricing.value, {
      headers: { Authorization: `Bearer ${token}` }
    })

    successMessage.value = '✅ Pricing added successfully!'
    console.log(res.data)

    pricing.value = { service: null, category: null, facility: null, price: '', duration: '', discount: '', is_active: true }

  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to add pricing.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VCard max-width="650" class="pa-5">
    <h3 class="mb-4">Add Pricing</h3>

    <VAlert v-if="successMessage" type="success" variant="tonal">{{ successMessage }}</VAlert>
    <VAlert v-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</VAlert>

    <VForm @submit.prevent="addPricing">
      
      <VSelect
        label="Select Service"
        :items="serviceStore.services"
        item-title="display_name"
        item-value="id"
        v-model="pricing.service"
        required
      />

      <VSelect
        class="mt-3"
        label="Select Category"
        :items="categoryStore.categories"
        item-title="display_name"
        item-value="id"
        v-model="pricing.category"
        required
      />

      <VSelect
        class="mt-3"
        label="Select Facility"
        :items="facilityStore.facilities"
        item-title="name"
        item-value="id"
        v-model="pricing.facility"
        required
      />

      <AppTextField class="mt-3" label="Price" type="number" v-model="pricing.price" required />

      <VSelect
        class="mt-3"
        label="Duration"
        :items="['per_hour', 'per_day', 'per_week', 'per_month']"
        v-model="pricing.duration"
        required
      />

      <AppTextField class="mt-3" label="Discount (%)" type="number" v-model="pricing.discount" />

      <VCheckbox class="mt-3" label="Active" v-model="pricing.is_active" />

      <VBtn type="submit" class="mt-4" :loading="loading">
        Save Pricing
      </VBtn>
    </VForm>
  </VCard>
</template>
