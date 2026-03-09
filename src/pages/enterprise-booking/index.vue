<script setup>
import { ref, computed } from 'vue'
import { usePermissionStore } from '@/stores/permissionStore'
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import OperationsCommandCenter from '@/modules/calendar/components/OperationsCommandCenter.vue'
import MultiServiceCart from '@/modules/booking/components/MultiServiceCart.vue'
import ResourceCapacityDashboard from '@/modules/admin/resource/ResourceCapacityDashboard.vue'
import EmployeeWorkloadDashboard from '@/modules/admin/employee/EmployeeWorkloadDashboard.vue'

const permissionStore = usePermissionStore()

const activeTab = ref('operations')

const role = computed(() => {
  const userData = permissionStore.userData || {}
  
  return (userData.role?.name || userData.role || 'Receptionist').toLowerCase()
})

// Role-based access logic for tabs
const availableTabs = computed(() => {
  const tabs = []
    
  // Everyone sees Operations (filtered by permission in backend/store)
  tabs.push({ id: 'operations', title: 'Command Center', icon: 'tabler-layout-dashboard' })
    
  // Receptionists and Admins see Booking
  if (['receptionist', 'admin', 'organization'].includes(role.value)) {
    tabs.push({ id: 'booking', title: 'New Booking', icon: 'tabler-plus' })
  }
    
  // Admins only see Resource/Employee dashboards
  if (['admin', 'organization'].includes(role.value)) {
    tabs.push({ id: 'resources', title: 'Resource Hub', icon: 'tabler-building-hospital' })
    tabs.push({ id: 'employees', title: 'Workload Hub', icon: 'tabler-users-group' })
  }
    
  return tabs
})
</script>

<template>
  <VeterinaryLayout>
    <div class="saas-enterprise-dashboard pa-6">
      <!-- Top Global Stats / Navigation Bar -->
      <VCard class="mb-6 elevation-1 border-0 rounded-lg">
        <VCardText class="pa-4 d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center me-6">
            <VAvatar
              color="primary"
              variant="tonal"
              class="me-3"
              rounded="lg"
            >
              <VIcon icon="tabler-building-hospital" />
            </VAvatar>
            <div>
              <h5 class="text-h5 font-weight-bold mb-0">
                PetLeo Enterprise Hub
              </h5>
              <div class="text-caption text-muted">
                Organization: PetLeo Mumbai South
              </div>
            </div>
          </div>

          <VTabs
            v-model="activeTab"
            color="primary"
            align-tabs="start"
          >
            <VTab
              v-for="tab in availableTabs"
              :key="tab.id"
              :value="tab.id"
            >
              <VIcon
                :icon="tab.icon"
                class="me-2"
                size="18"
              />
              {{ tab.title }}
            </VTab>
          </VTabs>

          <div class="d-flex align-center gap-3 ms-auto">
            <VBtn
              icon="tabler-bell"
              variant="text"
              color="secondary"
              density="comfortable"
            />
            <VBtn
              icon="tabler-settings"
              variant="text"
              color="secondary"
              density="comfortable"
            />
            <VDivider
              vertical
              class="mx-2"
            />
            <div class="d-flex align-center">
              <VAvatar
                size="32"
                color="primary"
                variant="tonal"
                class="me-2"
              >
                {{ role[0].toUpperCase() }}
              </VAvatar>
              <div class="d-none d-sm-block">
                <div class="text-body-2 font-weight-bold line-height-1">
                  Enterprise User
                </div>
                <div class="text-caption text-uppercase">
                  {{ role }}
                </div>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Tab Content -->
      <VWindow v-model="activeTab">
        <VWindowItem value="operations">
          <OperationsCommandCenter />
        </VWindowItem>

        <VWindowItem value="booking">
          <MultiServiceCart />
        </VWindowItem>

        <VWindowItem value="resources">
          <ResourceCapacityDashboard />
        </VWindowItem>

        <VWindowItem value="employees">
          <EmployeeWorkloadDashboard />
        </VWindowItem>
      </VWindow>
    </div>
  </VeterinaryLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>

<style lang="scss">
.saas-enterprise-dashboard {
    .v-tab {
        text-transform: none;
        letter-spacing: 0;
        font-weight: 500;
    }
}
</style>
