<script setup>
console.log('🚀 dashboard.vue: Script Setup Start')
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { onMounted } from 'vue'

const permissionStore = usePermissionStore()

onMounted(async () => {
  console.log('📊 Provider Dashboard: Mounting...')
  await permissionStore.fetchPermissions()
  console.log('📊 Provider Dashboard: Permissions loaded:', permissionStore.permissions.length)
})
</script>

<template>
  <ProviderLayout>
    <VRow>
      <!-- EXPIRY ALERT -->
      <VCol
        v-if="permissionStore.planDetails?.is_expiring_soon"
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
      <VCol cols="12">
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
          <VCol 
            v-for="service in permissionStore.enabledServices" 
            :key="service.service_id"
            cols="12" 
            md="6" 
            lg="4"
          >
            <VCard
              :to="(service.service_name.toLowerCase().includes('veterinary') || service.service_key === 'VETERINARY_CORE') 
                ? { name: 'veterinary-dashboard' } 
                : { name: 'provider-service-details', params: { serviceId: service.service_id } }"
            >
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
                  <VChip
                    v-if="service.can_view"
                    size="x-small"
                    color="success"
                  >
                    VIEW
                  </VChip>
                  <VChip
                    v-if="service.can_create"
                    size="x-small"
                    color="primary"
                  >
                    CREATE
                  </VChip>
                  <VChip
                    v-if="service.can_edit"
                    size="x-small"
                    color="info"
                  >
                    EDIT
                  </VChip>
                  <VChip
                    v-if="service.can_delete"
                    size="x-small"
                    color="error"
                  >
                    DELETE
                  </VChip>
                </div>
                
                <div
                  v-if="service.categories?.length"
                  class="mt-4 text-caption text-medium-emphasis"
                >
                  {{ service.categories.length }} Categories Enabled
                </div>
                <div
                  v-else
                  class="mt-4 text-caption text-medium-emphasis"
                >
                  Core Access Enabled
                </div>
              </VCardText>
            </VCard>
          </VCol>
          
          <VCol
            v-if="permissionStore.enabledServices.length === 0"
            cols="12"
          >
            <VAlert
              type="warning"
              variant="tonal"
            >
              No services enabled. Please upgrade your plan to access services.
            </VAlert>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
