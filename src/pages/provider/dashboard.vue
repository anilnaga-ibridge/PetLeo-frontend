<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { onMounted, computed } from 'vue'

const permissionStore = usePermissionStore()

onMounted(async () => {
  await permissionStore.fetchPermissions()
})

const canViewBilling = computed(() => {
  if (permissionStore.hasCapability('BILLING') || permissionStore.hasCapability('MANAGE_PLAN')) return true
  const role = (permissionStore.userData?.role?.name || permissionStore.userData?.role || '').toUpperCase()
  return ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(role)
})

const hasServices = computed(() => permissionStore.enabledServices && permissionStore.enabledServices.length > 0)

const getServiceRoute = (service) => {
  if (service.service_name.toLowerCase().includes('veterinary') || service.service_key === 'VETERINARY_CORE') {
    return { name: 'veterinary-dashboard' }
  }
  return { name: 'provider-service-details', params: { serviceId: service.service_id } }
}
</script>

<template>
  <ProviderLayout>
    <div class="pa-4">
      <VRow>
        <!-- EXPIRY ALERT -->
        <VCol
          v-if="canViewBilling && permissionStore.planDetails?.is_expiring_soon"
          cols="12"
        >
          <VAlert
            type="warning"
            variant="flat"
            closable
            class="mb-4"
          >
            <template #prepend>
              <VIcon icon="tabler-alert-triangle" />
            </template>
            Your plan is expiring in <strong>{{ permissionStore.planDetails.days_left }} days</strong>. Please renew your subscription to avoid any interruption.
            <template #append>
              <VBtn
                size="small"
                color="white"
                variant="flat"
                class="text-warning font-weight-bold"
                :to="{ name: 'provider-subscription' }"
              >
                Manage Subscription
              </VBtn>
            </template>
          </VAlert>
        </VCol>

        <!-- PLAN OVERVIEW -->
        <VCol cols="12" v-if="canViewBilling">
          <VCard
            color="primary"
            variant="tonal"
          >
            <VCardItem>
              <template #prepend>
                <VAvatar
                  color="primary"
                  variant="elevated"
                  size="large"
                >
                  <VIcon
                    icon="tabler-crown"
                    color="white"
                    size="32"
                  />
                </VAvatar>
              </template>
              <VCardTitle class="text-h4">
                {{ permissionStore.planDetails?.title || 'No Active Plan' }}
              </VCardTitle>
              <VCardSubtitle class="text-h6 mt-1">
                {{ permissionStore.planDetails?.subtitle || 'Please purchase a plan to get started' }}
              </VCardSubtitle>
              <template #append>
                <div class="text-end">
                  <div class="text-caption">
                    Expires On
                  </div>
                  <div class="font-weight-bold">
                    {{ permissionStore.planDetails?.end_date ? new Date(permissionStore.planDetails.end_date).toLocaleDateString() : 'N/A' }}
                  </div>
                </div>
              </template>
            </VCardItem>
          </VCard>
        </VCol>

        <!-- ENABLED SERVICES -->
        <VCol cols="12">
          <h3 class="text-h5 mb-4 mt-2">
            Enabled Services
          </h3>
          <VRow>
            <!-- Service Cards Loop -->
            <VCol 
              v-for="service in permissionStore.enabledServices" 
              :key="service.service_id"
              cols="12" 
              md="6" 
              lg="4"
            >
              <VCard :to="getServiceRoute(service)">
                <VCardItem>
                  <template #prepend>
                    <VAvatar
                      color="secondary"
                      variant="tonal"
                      class="rounded"
                    >
                      <VIcon :icon="service.icon || 'tabler-box'" />
                    </VAvatar>
                  </template>
                  <VCardTitle>{{ service.service_name }}</VCardTitle>
                </VCardItem>
                
                <VCardText>
                  <div class="d-flex flex-wrap gap-2 mt-2">
                    <VChip v-if="service.can_view" size="x-small" color="success">VIEW</VChip>
                    <VChip v-if="service.can_create" size="x-small" color="primary">CREATE</VChip>
                    <VChip v-if="service.can_edit" size="x-small" color="info">EDIT</VChip>
                    <VChip v-if="service.can_delete" size="x-small" color="error">DELETE</VChip>
                  </div>
                  
                  <div v-if="service.categories?.length" class="mt-4 text-caption text-medium-emphasis">
                    {{ service.categories.length }} Categories Enabled
                  </div>
                  <div v-else class="mt-4 text-caption text-medium-emphasis">
                    Core Access Enabled
                  </div>
                </VCardText>
              </VCard>
            </VCol>
            
            <!-- Empty State -->
            <VCol v-if="!hasServices" cols="12">
              <VAlert type="info" variant="tonal">
                You have no active services assigned. Please contact your administrator to assign permissions.
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
