<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { api } from '@/plugins/axios'
import { onMounted, ref } from 'vue'

const permissionStore = usePermissionStore()
const allowedServices = ref([])
const loading = ref(false)

const fetchAllowedServices = async () => {
  loading.value = true
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/allowed-services/')
    allowedServices.value = res.data
  } catch (err) {
    console.error('Failed to fetch allowed services:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllowedServices()
})
</script>

<template>
  <ProviderLayout>
    <VRow>
      <VCol cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h4 mb-4">My Services</h2>
          <p>Manage the services you offer.</p>
        </div>
        <VBtn 
          v-if="permissionStore.hasPermission('create_service')"
          color="primary"
          prepend-icon="tabler-plus"
        >
          Add New Service
        </VBtn>
      </VCol>

      <VCol cols="12" v-if="loading">
        <div class="d-flex justify-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </div>
      </VCol>

      <VCol cols="12" v-else-if="allowedServices.length === 0">
        <VAlert type="info" variant="tonal" class="mb-4">
          You don't have any active services. Purchase a plan to enable services.
        </VAlert>
      </VCol>

      <VCol 
        v-else 
        v-for="service in allowedServices" 
        :key="service.service_id" 
        cols="12" 
        md="4"
      >
        <VCard>
          <VCardItem>
            <template #prepend>
              <VAvatar color="primary" variant="tonal" size="48" class="me-4">
                <VIcon :icon="service.icon" size="24" />
              </VAvatar>
            </template>
            <VCardTitle>{{ service.name }}</VCardTitle>
            <VCardSubtitle>Active</VCardSubtitle>
          </VCardItem>
          
          <VCardText>
            Manage your {{ service.name }} offerings, pricing, and availability.
          </VCardText>
          
          <VCardActions>
            <VBtn variant="outlined" color="primary" block>
              Manage
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
  permission: create_service
</route>
