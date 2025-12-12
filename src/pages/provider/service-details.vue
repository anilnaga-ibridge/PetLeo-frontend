<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/plugins/axios'

const route = useRoute()
const serviceId = computed(() => route.params.serviceId)
const serviceDetails = ref(null)
const loading = ref(false)

const fetchServiceDetails = async () => {
  if (!serviceId.value) return
  loading.value = true
  try {
    // In a real app, we might fetch specific details for this service
    // For now, we'll simulate it or fetch from allowed services again if needed
    // But let's assume we want to show operations for this service
    
    // We can fetch the service name/icon from the allowed-services list locally or via API
    const res = await api.get('http://127.0.0.1:8002/api/provider/allowed-services/')
    const service = res.data.find(s => s.service_id === serviceId.value)
    serviceDetails.value = service
  } catch (err) {
    console.error('Failed to fetch service details:', err)
  } finally {
    loading.value = false
  }
}

watch(serviceId, () => {
  fetchServiceDetails()
})

onMounted(() => {
  fetchServiceDetails()
})
</script>

<template>
  <ProviderLayout>
    <VRow v-if="loading">
      <VCol cols="12" class="text-center">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
    </VRow>

    <VRow v-else-if="serviceDetails">
      <VCol cols="12">
        <div class="d-flex align-center mb-6">
          <VAvatar color="primary" variant="tonal" size="52" class="me-4">
            <VIcon :icon="serviceDetails.icon" size="28" />
          </VAvatar>
          <div>
            <h2 class="text-h4">{{ serviceDetails.name }} Management</h2>
            <p class="mb-0 text-medium-emphasis">Manage settings and operations for {{ serviceDetails.name }}</p>
          </div>
        </div>
      </VCol>

      <VCol cols="12">
        <VCard title="Operations">
          <VCardText>
            <p>Here you can perform operations specific to <strong>{{ serviceDetails.name }}</strong>.</p>
            <VAlert type="info" variant="tonal" class="mt-4">
              Dynamic operations table coming soon...
            </VAlert>
          </VCardText>
          <VCardActions>
            <VBtn color="primary">Configure {{ serviceDetails.name }}</VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <VRow v-else>
      <VCol cols="12">
        <VAlert type="error">Service not found or access denied.</VAlert>
      </VCol>
    </VRow>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
