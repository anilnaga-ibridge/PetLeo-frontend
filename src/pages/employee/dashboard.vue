<script setup>
import EmployeeLayout from '@/layouts/EmployeeLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { ref, onMounted } from 'vue'
import { api } from '@/plugins/axios'

definePage({
  meta: {
    layout: 'blank',
  },
})

const userData = useCookie('userData')
const userName = userData.value?.full_name || 'Employee'
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
        <VCard class="mb-6">
          <VCardItem>
            <VCardTitle class="text-h4 mb-2 d-flex align-center">
              Welcome back, {{ userName }}! 👋
              <VChip color="primary" size="small" class="ms-4" variant="elevated">V2.0 ENHANCED</VChip>
            </VCardTitle>
            <VCardSubtitle>
              Here is your daily overview.
            </VCardSubtitle>
          </VCardItem>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard>
          <VCardItem>
            <VCardTitle>Assigned Services</VCardTitle>
            <div class="text-h3 font-weight-bold text-primary mt-4">
              {{ loading ? '-' : services.length }}
            </div>
            <VCardSubtitle class="mt-2">Services you can manage</VCardSubtitle>
          </VCardItem>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard>
          <VCardItem>
            <VCardTitle>Upcoming Bookings</VCardTitle>
            <div class="text-h3 font-weight-bold text-info mt-4">0</div>
            <VCardSubtitle class="mt-2">Scheduled appointments</VCardSubtitle>
          </VCardItem>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard>
          <VCardItem>
            <VCardTitle>Performance</VCardTitle>
            <div class="text-h3 font-weight-bold text-success mt-4">100%</div>
            <VCardSubtitle class="mt-2">Customer rating</VCardSubtitle>
          </VCardItem>
        </VCard>
      </VCol>
      
      <!-- Assigned Services List -->
      <VCol cols="12">
        <h2 class="text-h5 mb-4">Your Services</h2>
      </VCol>
      
      <VCol v-if="loading" cols="12" class="text-center">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
      
      <VCol v-else-if="services.length === 0" cols="12" class="text-center">
        <p class="text-h6 text-medium-emphasis">No services assigned yet.</p>
      </VCol>
      
      <VCol 
        v-for="service in services" 
        :key="service.service_id" 
        cols="12" 
        md="4" 
        sm="6"
      >
        <VCard class="service-card h-100 d-flex flex-column" elevation="2">
          <!-- Card Header with Gradient/Image placeholder -->
          <div class="service-header position-relative pa-6 d-flex justify-center align-center bg-grey-lighten-4">
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
              Service ID: {{ service.service_id }}
            </VCardSubtitle>
            
            <!-- Categories & Facilities -->
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
                  <div v-else class="ms-6 text-caption text-disabled font-italic">
                    No facilities
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-caption text-disabled mt-4">
              No categories configured
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
  overflow: visible; /* Allow avatar to overlap */
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
  transform: translateY(40%); /* Push avatar down to overlap content */
}

.status-chip {
  backdrop-filter: blur(4px);
}
</style>
