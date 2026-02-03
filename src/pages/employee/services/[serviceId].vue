<script setup>
import LockedFeature from '@/components/LockedFeature.vue'
import ProviderFacilitiesManager from '@/pages/provider/components/ProviderFacilitiesManager.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'

const route = useRoute()
const permissionStore = usePermissionStore()
const serviceId = computed(() => route.params.serviceId)

console.log('🚀 [serviceId.vue] Loaded with param:', route.params.serviceId)

const serviceName = ref('')
const canView = ref(false)
// Permissions for this service
const canCreate = ref(false)
const canEdit = ref(false)
const canDelete = ref(false)
const activeTab = ref('overview')

const currentServicePermissions = computed(() => {
  if (!serviceId.value) return {}
  return permissionStore.permissions.find(p => 
    (p.service_id || '').toLowerCase() === (serviceId.value || '').toLowerCase() ||
    (p.service_key || '').toLowerCase() === (serviceId.value || '').toLowerCase()
  ) || {}
})

const checkPermissions = () => {
  console.log('🔍 [serviceId.vue] Route Param:', serviceId.value)
  if (!serviceId.value) return

  const hasAccess = permissionStore.hasCapability(serviceId.value)
  
  if (hasAccess) {
    const service = permissionStore.permissions.find(
        p => (p.service_key?.toLowerCase() === serviceId.value.toLowerCase()) ||
             (p.service_name?.toLowerCase() === serviceId.value.toLowerCase()) ||
             (p.service_id?.toLowerCase() === serviceId.value.toLowerCase())
      )

    serviceName.value = service?.service_name || serviceId.value
    canView.value = true
    
    if (service) {
        canCreate.value = !!service.can_create
    }
  } else {
    canView.value = false
    console.warn('❌ [serviceId.vue] Access Denied for:', serviceId.value)
    console.log('🔍 [serviceId.vue] Available Permissions:', permissionStore.permissions.map(p => p.service_key))
  }
}

watch(serviceId, () => {
  checkPermissions()
}, { immediate: true })

onMounted(async () => {
  if (!permissionStore.isPermissionsLoaded) {
    await permissionStore.fetchPermissions()
  }
  checkPermissions()
})

const analytics = [
  { title: 'Total Bookings', value: '0', change: '0%', icon: 'tabler-calendar-stats', color: 'primary' },
  { title: 'Active Plans', value: '0', change: '0%', icon: 'tabler-clipboard-check', color: 'success' },
  { title: 'Pending Tasks', value: '0', change: '0%', icon: 'tabler-clock', color: 'warning' },
]

</script>

<template>
  <div class="service-details-page pa-4">
    <LockedFeature 
      v-if="!canView" 
      title="Service Access Restricted"
      message="You do not have permission to view this service module."
    />

    <div v-else class="service-details-page pa-4">
      <div class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-8 gap-4">
        <div class="d-flex align-center">
          <VAvatar color="primary" variant="tonal" size="64" class="me-4 rounded-lg">
            <VIcon icon="tabler-box" size="32" />
          </VAvatar>
          <div>
            <h1 class="text-h3 font-weight-bold text-primary">
              {{ serviceName || 'Service Module' }}
            </h1>
            <div class="d-flex align-center gap-2 mt-1">
              <VChip color="success" size="small" variant="flat" class="font-weight-bold">Active</VChip>
              <span class="text-body-2 text-medium-emphasis">Employee Workspace</span>
            </div>
          </div>
        </div>
        
        <div class="d-flex gap-2">
            <VBtn variant="outlined" color="secondary" to="/employee/dashboard" prepend-icon="tabler-arrow-left">
                Back to Dashboard
            </VBtn>
        </div>
      </div>

      <VTabs v-model="activeTab" class="mb-6 border-b">
        <VTab value="overview">Overview</VTab>
        <VTab value="categories"><VIcon icon="tabler-category" class="me-2" />Categories</VTab>
        <VTab value="facilities"><VIcon icon="tabler-building-hospital" class="me-2" />Facilities</VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <VWindowItem value="overview">
            <VRow>
              <VCol v-for="stat in analytics" :key="stat.title" cols="12" sm="6" md="4">
                <VCard elevation="0" class="border">
                  <VCardText>
                    <div class="d-flex justify-space-between align-start mb-4">
                      <VAvatar :color="stat.color" variant="tonal" rounded><VIcon :icon="stat.icon" /></VAvatar>
                    </div>
                    <div class="text-h4 font-weight-bold mb-1">{{ stat.value }}</div>
                    <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
                  </VCardText>
                </VCard>
              </VCol>
              
              <VCol cols="12">
                <VCard title="Recent Activity" class="border" elevation="0">
                  <VCardText class="text-center py-8 text-medium-emphasis">
                     <VIcon icon="tabler-activity" size="48" class="mb-2 opacity-50" />
                     <p>No recent activity recorded for this service.</p>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
        </VWindowItem>

        <VWindowItem value="categories">
           <ProviderFacilitiesManager :service-id="serviceId" mode="categories" :permissions="currentServicePermissions" />
        </VWindowItem>

        <VWindowItem value="facilities">
           <ProviderFacilitiesManager :service-id="serviceId" mode="facilities" :permissions="currentServicePermissions" />
        </VWindowItem>
      </VWindow>
    </div>
  </div>
</template>

<route lang="yaml">
path: /employee/services/:serviceId
meta:
  layout: default
  action: read
  subject: Auth
</route>
