<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { onMounted } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'

const permissionStore = usePermissionStore()
const userData = useCookie('userData')

onMounted(async () => {
  console.log('👷 Service Employee Dashboard: Mounting...')
  await permissionStore.fetchPermissions()
})

const getServiceRoute = (service) => {
  // Same logic as provider dashboard but strictly for service details
  return { 
    name: 'provider-service-details', 
    params: { serviceId: service.service_id } 
  }
}
</script>

<template>
  <ProviderLayout>
    <VContainer class="py-6">
      <!-- HEADER -->
      <div class="mb-6">
        <h1 class="text-h3 font-weight-bold text-primary mb-2">
          My Workspace
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Welcome back, {{ userData?.full_name || userData?.username || 'Employee' }}. 
          Select a service to manage your tasks.
        </p>
      </div>

      <!-- SERVICE TILES -->
      <VRow>
        <VCol 
          v-for="service in permissionStore.enabledServices" 
          :key="service.service_id"
          cols="12" 
          md="6" 
          lg="4"
        >
          <VCard
            :to="getServiceRoute(service)"
            elevation="2"
            class="service-card h-100"
          >
            <VCardItem class="pa-6">
              <template #prepend>
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="64"
                  class="rounded-lg mb-4"
                >
                  <VIcon 
                    :icon="service.icon || 'tabler-box'" 
                    size="32"
                  />
                </VAvatar>
              </template>
              <VCardTitle class="text-h5 font-weight-bold mb-2">
                {{ service.service_name }}
              </VCardTitle>
              <VCardSubtitle>
                {{ service.categories?.length || 0 }} Categories Enabled
              </VCardSubtitle>
            </VCardItem>
            
            <VCardText class="pb-6">
               <div class="d-flex gap-2">
                 <VChip size="small" color="primary" variant="flat">Manage</VChip>
               </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- EMPTY STATE -->
        <VCol
          v-if="permissionStore.enabledServices.length === 0"
          cols="12"
        >
          <VAlert
            type="info"
            variant="tonal"
            icon="tabler-info-circle"
            title="No Services Assigned"
            text="You currently have no services assigned. Please contact your administrator."
          />
        </VCol>
      </VRow>
    </VContainer>
  </ProviderLayout>
</template>

<style scoped>
.service-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -10px rgba(var(--v-theme-primary), 0.2) !important;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
