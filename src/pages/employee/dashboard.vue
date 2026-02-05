<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { veterinaryApi } from '@/api/veterinary'
import { onMounted, computed, ref } from 'vue'

const permissionStore = usePermissionStore()
const metrics = ref({
  total_visits: 0,
  pending: 0,
  in_progress: 0,
  completed: 0
})
const loadingMetrics = ref(false)

onMounted(async () => {
  await permissionStore.fetchPermissions()
  fetchMetrics()
})

const fetchMetrics = async () => {
    loadingMetrics.value = true
    try {
        const res = await veterinaryApi.getSummary()
        const todayData = res.data?.today || {}
        metrics.value = {
            total_visits: todayData.visits || 0,
            pending: todayData.waiting || 0,
            in_progress: todayData.in_progress || 0,
            completed: todayData.completed || 0
        }
    } catch (e) {
        console.error("Failed to fetch analytics", e)
    } finally {
        loadingMetrics.value = false
    }
}

const getCrudVariant = (can) => can ? 'tonal' : 'outlined'
const getCrudColor = (can) => can ? 'success' : 'medium-emphasis'
const getCrudOpacity = (can) => can ? 1 : 0.5

const allEnabled = computed(() => permissionStore.enabledServices || [])

// 1. Business Services (Non-Veterinary)
const businessServices = computed(() => {
  return allEnabled.value.filter(service => {
    const sName = (service.service_name || '').toLowerCase()
    const sKey = (service.service_key || '').toUpperCase()
    
    // Strict Filter: Exclude ANY key starting with VETERINARY_ or name containing veterinary
    return !sName.includes('veterinary') && !sKey.startsWith('VETERINARY_')
  })
})

// 2. Clinical Services (Veterinary)
const veterinaryServices = computed(() => {
  return allEnabled.value.filter(service => {
    const sName = (service.service_name || '').toLowerCase()
    const sKey = (service.service_key || '').toUpperCase()
    return sName.includes('veterinary') || sKey.startsWith('VETERINARY_')
  })
})

// Service Routing Map
const getServiceRoute = (service) => {
  const key = (service.service_key || '').toUpperCase()
  
  if (key === 'VETERINARY_VISITS') return { name: 'veterinary-visits' }
  if (key === 'VETERINARY_VITALS') return { name: 'veterinary-vitals' } 
  if (key === 'VETERINARY_PRESCRIPTIONS') return { name: 'veterinary-prescriptions' }
  // Add other granular routes as needed, fall back to dashboard
  
  return { name: 'veterinary-dashboard' }
}

const hasAnyAccess = computed(() => businessServices.value.length > 0 || veterinaryServices.value.length > 0)
</script>

<template>
  <ProviderLayout>
    <div class="pa-4">
      <VRow>
        <VCol cols="12">
          
           <!-- SECTION: Analytics & Insights -->
           <div v-if="veterinaryServices.length > 0" class="mb-6">
              <h3 class="text-h5 mb-4 d-flex align-center">
                 <VIcon icon="tabler-chart-bar" class="me-2" />
                 Today's Overview
              </h3>
              <VRow>
                  <!-- Total Visits -->
                  <VCol cols="12" sm="6" md="3">
                      <VCard elevation="0" border class="h-100">
                          <VCardItem>
                              <template #prepend>
                                  <VAvatar color="primary" variant="tonal" rounded>
                                      <VIcon icon="tabler-users" />
                                  </VAvatar>
                              </template>
                              <VCardTitle class="text-h4 font-weight-bold">
                                  {{ metrics.total_visits || 0 }}
                              </VCardTitle>
                              <VCardSubtitle>Total Appointments</VCardSubtitle>
                          </VCardItem>
                      </VCard>
                  </VCol>

                  <!-- Waiting/Queue -->
                  <VCol cols="12" sm="6" md="3">
                      <VCard elevation="0" border class="h-100">
                          <VCardItem>
                              <template #prepend>
                                  <VAvatar color="warning" variant="tonal" rounded>
                                      <VIcon icon="tabler-clock" />
                                  </VAvatar>
                              </template>
                              <VCardTitle class="text-h4 font-weight-bold">
                                  {{ metrics.pending || 0 }}
                              </VCardTitle>
                              <VCardSubtitle>Waiting in Queue</VCardSubtitle>
                          </VCardItem>
                      </VCard>
                  </VCol>

                  <!-- In Progress -->
                  <VCol cols="12" sm="6" md="3">
                      <VCard elevation="0" border class="h-100">
                          <VCardItem>
                              <template #prepend>
                                  <VAvatar color="info" variant="tonal" rounded>
                                      <VIcon icon="tabler-activity" />
                                  </VAvatar>
                              </template>
                              <VCardTitle class="text-h4 font-weight-bold">
                                  {{ metrics.in_progress || 0 }}
                              </VCardTitle>
                              <VCardSubtitle>In Consultation</VCardSubtitle>
                          </VCardItem>
                      </VCard>
                  </VCol>

                   <!-- Completed -->
                  <VCol cols="12" sm="6" md="3">
                      <VCard elevation="0" border class="h-100">
                          <VCardItem>
                              <template #prepend>
                                  <VAvatar color="success" variant="tonal" rounded>
                                      <VIcon icon="tabler-checks" />
                                  </VAvatar>
                              </template>
                              <VCardTitle class="text-h4 font-weight-bold">
                                  {{ metrics.completed || 0 }}
                              </VCardTitle>
                              <VCardSubtitle>Completed Visits</VCardSubtitle>
                          </VCardItem>
                      </VCard>
                  </VCol>
              </VRow>
           </div>
          
          <!-- SECTION: Clinical Module (Dynamic) -->
          <template v-if="veterinaryServices.length > 0">
             <h3 class="text-h5 mb-4 mt-2 d-flex align-center">
               <VIcon icon="tabler-building-hospital" class="me-2" />
               Clinic Module
             </h3>
             <VRow class="mb-6">
               <VCol 
                 v-for="vetService in veterinaryServices"
                 :key="vetService.service_id"
                 cols="12" md="6" lg="4"
               >
                 <!-- Use Dynamic Route Mapping Here -->
                 <VCard :to="getServiceRoute(vetService)" border color="primary" variant="tonal">
                   <VCardItem>
                     <template #prepend>
                       <VAvatar color="primary" variant="elevated" class="rounded">
                         <VIcon icon="tabler-stethoscope" color="white" />
                       </VAvatar>
                     </template>
                     <VCardTitle>{{ vetService.service_name }}</VCardTitle>
                     <!-- Dynamic Subtitle based on active categories -->
                     <VCardSubtitle v-if="vetService.categories?.length">
                       {{ vetService.categories.filter(c => c.can_view).length }} Active Modules
                     </VCardSubtitle>
                   </VCardItem>
                   
                   <VCardText>
                     <!-- Granular Category Permissions -->
                     <div v-if="vetService.categories?.length" class="d-flex flex-column gap-3 mt-3">
                        <div 
                          v-for="cat in vetService.categories.filter(c => c.can_view)" 
                          :key="cat.name"
                          class="d-flex flex-column"
                        >
                          <div class="text-caption font-weight-bold text-uppercase mb-1">
                            {{ cat.name }}
                          </div>
                          <div class="d-flex flex-wrap gap-2">
                            <VChip v-if="cat.can_view" size="x-small" color="success" variant="tonal">VIEW</VChip>
                            <VChip v-if="cat.can_create" size="x-small" color="primary" variant="tonal">CREATE</VChip>
                            <VChip v-if="cat.can_edit" size="x-small" color="info" variant="tonal">EDIT</VChip>
                            <VChip v-if="cat.can_delete" size="x-small" color="error" variant="tonal">DELETE</VChip>
                          </div>
                        </div>
                     </div>

                     <!-- Fallback: Service Level Permissions if no categories -->
                     <div v-else class="d-flex flex-wrap gap-2 mt-2">
                        <VChip v-if="vetService.can_view" size="x-small" color="success">VIEW</VChip>
                        <VChip v-if="vetService.can_create" size="x-small" color="primary">CREATE</VChip>
                        <VChip v-if="vetService.can_edit" size="x-small" color="info">EDIT</VChip>
                        <VChip v-if="vetService.can_delete" size="x-small" color="error">DELETE</VChip>
                     </div>
                   </VCardText>
                 </VCard>
               </VCol>
             </VRow>
          </template>

          <!-- SECTION: Business Services -->
          <template v-if="businessServices.length > 0">
            <h3 class="text-h5 mb-4 mt-2 d-flex align-center">
              <VIcon icon="tabler-package" class="me-2" />
              My Services
            </h3>
            <VRow>
              <VCol 
                v-for="service in businessServices" 
                :key="service.service_id"
                cols="12" 
                md="6" 
                lg="4"
              >
                <VCard :to="{ name: 'provider-service-details', params: { serviceId: service.service_id } }">
                  <VCardItem>
                    <template #prepend>
                      <VAvatar color="secondary" variant="tonal" class="rounded">
                        <VIcon :icon="service.icon || 'tabler-box'" />
                      </VAvatar>
                    </template>
                    <VCardTitle>{{ service.service_name }}</VCardTitle>
                  </VCardItem>
                  
                  <VCardText>
                    <!-- Check for Categories first (Granular) -->
                     <div v-if="service.categories?.length" class="d-flex flex-column gap-3 mt-3">
                        <div 
                          v-for="cat in service.categories.filter(c => c.can_view)" 
                          :key="cat.name"
                          class="d-flex flex-column"
                        >
                          <div class="text-caption font-weight-bold text-uppercase mb-1">
                            {{ cat.name }}
                          </div>
                           <div class="d-flex flex-wrap gap-2">
                              <VChip v-if="cat.can_view" size="x-small" color="success" variant="tonal">VIEW</VChip>
                              <VChip v-if="cat.can_create" size="x-small" color="primary" variant="tonal">CREATE</VChip>
                              <VChip v-if="cat.can_edit" size="x-small" color="info" variant="tonal">EDIT</VChip>
                              <VChip v-if="cat.can_delete" size="x-small" color="error" variant="tonal">DELETE</VChip>
                           </div>
                        </div>
                     </div>

                    <!-- Fallback: Service Level Flags -->
                    <div v-else class="d-flex flex-wrap gap-2 mt-2">
                       <VChip v-if="service.can_view" size="x-small" color="success" variant="tonal">VIEW</VChip>
                       <VChip v-if="service.can_create" size="x-small" color="primary" variant="tonal">CREATE</VChip>
                       <VChip v-if="service.can_edit" size="x-small" color="info" variant="tonal">EDIT</VChip>
                       <VChip v-if="service.can_delete" size="x-small" color="error" variant="tonal">DELETE</VChip>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </template>
            
          <!-- Empty State -->
          <VRow v-if="!hasAnyAccess">
            <VCol cols="12">
              <VAlert type="info" variant="tonal">
                You have no active services or clinical access assigned. Please contact your administrator.
              </VAlert>
            </VCol>
          </VRow>

        </VCol>
      </VRow>
    </div>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
