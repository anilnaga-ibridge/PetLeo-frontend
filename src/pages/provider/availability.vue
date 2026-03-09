<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permissionStore'
import ProviderLayout from '@/components/ProviderLayout.vue'
import AvailabilitySettings from './components/AvailabilitySettings.vue'
import ConsultationTypeSettings from './components/ConsultationTypeSettings.vue'

const router = useRouter()
const permissionStore = usePermissionStore()
const activeTab = ref('general')

onMounted(() => {
  const role = (permissionStore.userData?.role?.name || permissionStore.userData?.role || '').toUpperCase()
  const isProviderOrOrg = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(role)
  
  if (!isProviderOrOrg) {
    console.log('🚫 Access Denied: Redirecting employee to their schedule page')
    router.replace('/employee/schedule')
  }
})
</script>

<template>
  <ProviderLayout>
    <div class="pa-6">
      <div class="mb-6">
        <h1 class="text-h3 font-weight-black text-slate-800 tracking-tight mb-1">
          Schedule & Availability
        </h1>
        <p class="text-subtitle-1 text-slate-500 font-weight-medium">
          Configure your working hours and consultation types.
        </p>
      </div>

      <VTabs
        v-model="activeTab"
        bg-color="transparent"
        color="primary"
        class="mb-8 lux-tabs"
      >
        <VTab
          value="general"
          prepend-icon="tabler-clock-2"
        >
          General Schedule
        </VTab>
        <VTab
          value="consultation"
          prepend-icon="tabler-stethoscope"
        >
          Consultation Types & Fees
        </VTab>
      </VTabs>
      
      <VWindow v-model="activeTab">
        <VWindowItem value="general">
          <AvailabilitySettings />
        </VWindowItem>
        <VWindowItem value="consultation">
          <ConsultationTypeSettings />
        </VWindowItem>
      </VWindow>
    </div>
  </ProviderLayout>
</template>

<style scoped>
.lux-tabs {
  border-bottom: 1px solid #f1f5f9;
}

:deep(.v-tab) {
  text-transform: none;
  font-weight: 800;
  letter-spacing: -0.5px;
  font-size: 1rem;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
