<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/plugins/axios'
import EmployeeLayout from '@/layouts/EmployeeLayout.vue'

definePage({
  meta: {
    layout: 'blank',
  },
})

const services = ref([])
const loading = ref(true)

const fetchServices = async () => {
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/permissions/')
    services.value = (res.data.permissions || []).filter(s => s.can_view)
  } catch (err) {
    console.error('Failed to fetch services', err)
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  fetchServices()
})
</script>

<template>
  <EmployeeLayout>
    <VRow>
      <VCol cols="12">
        <div class="d-flex align-center mb-6">
          <VAvatar color="primary" variant="tonal" rounded size="48" class="me-4">
            <VIcon icon="tabler-list-check" size="28" />
          </VAvatar>
          <div>
            <h1 class="text-h3 mb-1">My Assigned Services</h1>
            <p class="text-body-1 text-medium-emphasis mb-0">Manage services you have been assigned to.</p>
          </div>
        </div>
      </VCol>
      
      <VCol v-if="loading" cols="12" class="text-center py-12">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
        <p class="mt-4 text-body-1 text-medium-emphasis">Loading your services...</p>
      </VCol>
      
      <VCol v-else-if="services.length === 0" cols="12" class="text-center py-12">
        <VIcon icon="tabler-box-off" size="64" color="disabled" class="mb-4" />
        <p class="text-h5 text-medium-emphasis">No services assigned yet.</p>
        <p class="text-body-1 text-disabled">Contact your administrator to get access to services.</p>
      </VCol>
      
      <VCol 
        v-for="service in services" 
        :key="service.service_id" 
        cols="12" 
        md="4" 
        sm="6"
      >
        <VCard class="service-card h-100 d-flex flex-column" elevation="2">
          <div class="service-header position-relative pa-6 d-flex justify-center align-center">
            <div class="service-icon-wrapper">
              <VAvatar color="white" size="80" class="elevation-3">
                <VIcon :icon="service.icon || 'tabler-box'" size="40" color="primary" />
              </VAvatar>
            </div>
            <VChip 
              class="status-chip position-absolute top-0 right-0 ma-4"
              color="success"
              size="small"
              variant="flat"
            >
              Active
            </VChip>
          </div>

          <VCardItem class="text-center pt-12 flex-grow-1">
            <VCardTitle class="text-h5 font-weight-bold mb-1">
              {{ service.service_name || service.name }}
            </VCardTitle>
            <VCardSubtitle class="mb-4">
              ID: {{ service.service_id }}
            </VCardSubtitle>
            
            <div v-if="service.categories && service.categories.length > 0" class="text-start mt-4">
              <p class="text-caption font-weight-bold text-medium-emphasis mb-2 text-uppercase">Categories & Facilities</p>
              <div class="d-flex flex-column gap-2">
                <div v-for="category in service.categories" :key="category.id" class="bg-grey-lighten-5 pa-2 rounded">
                  <div class="d-flex align-center mb-1">
                    <VIcon icon="tabler-category" size="16" class="me-2 text-primary" />
                    <span class="text-body-2 font-weight-medium">{{ category.name }}</span>
                  </div>
                  
                  <div v-if="category.facilities && category.facilities.length > 0" class="d-flex flex-wrap gap-1 ms-6">
                    <VChip 
                      v-for="facility in category.facilities" 
                      :key="facility.id"
                      size="x-small"
                      variant="tonal"
                      color="secondary"
                    >
                      {{ facility.name }}
                    </VChip>
                  </div>
                </div>
              </div>
            </div>
          </VCardItem>

          <VDivider />

          <VCardActions class="pa-4">
            <VBtn 
              block 
              color="primary" 
              variant="flat"
              :to="{ name: 'provider-service-details', params: { serviceId: service.service_id } }"
            >
              Manage Service
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </EmployeeLayout>
</template>

<style scoped>
.service-card {
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: visible;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
}

.service-header {
  border-radius: 16px 16px 0 0;
  height: 120px;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0.05) 100%);
}

.service-icon-wrapper {
  transform: translateY(40%);
}

.status-chip {
  backdrop-filter: blur(4px);
}
</style>
