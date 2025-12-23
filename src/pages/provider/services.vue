<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { api } from '@/plugins/axios'
import { onMounted, ref, computed } from 'vue'

const permissionStore = usePermissionStore()
const allowedServices = ref([])
const loading = ref(false)
const debugInfo = ref(null)

const fetchAllowedServices = async () => {
  loading.value = true
  try {
    // Explicitly targeting the Service Provider Service on port 8002
    const res = await api.get('http://127.0.0.1:8002/api/provider/allowed-services/')
    
    let data = res.data
    
    // Robust parsing: Handle stringified JSON if necessary
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error("Failed to parse response data:", e)
        data = []
      }
    }
    
    // Ensure data is an array
    if (Array.isArray(data)) {
      allowedServices.value = data
    } else {
      console.warn("API returned non-array data:", data)
      allowedServices.value = []
    }

    debugInfo.value = {
      status: res.status,
      dataIsArray: Array.isArray(data),
      dataLength: data?.length,
      rawData: data
    }

    console.log("Allowed Services Loaded:", allowedServices.value)

  } catch (err) {
    console.error('Failed to fetch allowed services:', err)
    debugInfo.value = { error: err.message }
  } finally {
    loading.value = false
  }
}

const stats = computed(() => [
  {
    title: 'Total Services',
    value: allowedServices.value.length,
    icon: 'tabler-layout-grid',
    color: 'primary',
  },
  {
    title: 'Active Services',
    value: allowedServices.value.filter(s => s.is_active !== false).length,
    icon: 'tabler-check',
    color: 'success',
  },
  {
    title: 'Pending Review',
    value: 0,
    icon: 'tabler-clock',
    color: 'warning',
  },
])

onMounted(() => {
  fetchAllowedServices()
})
</script>

<template>
  <ProviderLayout>
    <VContainer fluid class="pa-0">
      <!-- HEADER & STATS -->
      <div class="mb-8">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h3 font-weight-bold text-primary">Service Dashboard</h1>
            <p class="text-body-1 text-medium-emphasis">Manage your service offerings and performance</p>
          </div>
          <VBtn 
            v-if="permissionStore.hasPermission('create_service')"
            color="primary"
            size="large"
            elevation="2"
            prepend-icon="tabler-plus"
          >
            Add New Service
          </VBtn>
        </div>

        <VRow>
          <VCol v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="4">
            <VCard elevation="0" class="stat-card border" :class="`border-${stat.color}`">
              <VCardText class="d-flex align-center">
                <VAvatar :color="stat.color" variant="tonal" size="48" class="me-4 rounded-lg">
                  <VIcon :icon="stat.icon" size="28" />
                </VAvatar>
                <div>
                  <div class="text-overline font-weight-bold text-medium-emphasis">{{ stat.title }}</div>
                  <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading" class="d-flex justify-center py-12">
        <VProgressCircular indeterminate color="primary" size="64" />
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="allowedServices.length === 0" class="text-center py-16">
        <VAvatar color="primary" variant="tonal" size="80" class="mb-4">
          <VIcon icon="tabler-box-off" size="40" />
        </VAvatar>
        <h3 class="text-h5 font-weight-bold mb-2">No Services Found</h3>
        <p class="text-body-1 text-medium-emphasis mb-6">
          You haven't added any services yet. Purchase a plan to get started.
        </p>
        <div class="bg-grey-lighten-4 pa-4 rounded text-left mb-4" style="max-width: 600px; margin: 0 auto; overflow: auto;">
            <p class="text-caption font-weight-bold">DEBUG INFO:</p>
            <pre>{{ debugInfo }}</pre>
        </div>
        <VBtn color="primary" :to="{ name: 'provider-home' }">View Plans</VBtn>
      </div>

      <!-- SERVICE GRID -->
      <VRow v-else>
        <VCol 
          v-for="service in allowedServices" 
          :key="service.service_id" 
          cols="12" 
          md="4"
          lg="3"
        >
          <VCard class="service-card h-100 d-flex flex-column" elevation="2">
            <!-- Card Header with Gradient/Image placeholder -->
            <div class="service-header position-relative pa-6 d-flex justify-center align-center bg-grey-lighten-4">
              <div class="service-icon-wrapper">
                <VAvatar color="white" size="80" class="elevation-3">
                  <VIcon :icon="service.icon" size="40" color="primary" />
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
                {{ service.name }}
              </VCardTitle>
              <VCardSubtitle class="mb-4">
                Service ID: {{ service.service_id }}
              </VCardSubtitle>
              
              <div class="d-flex justify-center gap-4 mb-4">
                <div class="text-center">
                  <div class="text-h6 font-weight-bold">--</div>
                  <div class="text-caption text-medium-emphasis">Bookings</div>
                </div>
                <VDivider vertical />
                <div class="text-center">
                  <div class="text-h6 font-weight-bold">--</div>
                  <div class="text-caption text-medium-emphasis">Revenue</div>
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
    </VContainer>
  </ProviderLayout>
</template>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}

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

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
  permission: create_service
</route>
