<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { onMounted } from 'vue'

const permissionStore = usePermissionStore()

onMounted(async () => {
  await permissionStore.fetchPermissions()
})
</script>

<template>
  <ProviderLayout>
    <VRow>
      <!-- PLAN OVERVIEW -->
      <VCol cols="12">
        <VCard color="primary" variant="tonal">
          <VCardItem>
            <template #prepend>
              <VAvatar color="primary" variant="elevated" size="large">
                <VIcon icon="tabler-crown" color="white" size="32" />
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
                <div class="text-caption">Expires On</div>
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
        <h3 class="text-h5 mb-4 mt-2">Enabled Services</h3>
        <VRow>
          <VCol 
            v-for="service in permissionStore.enabledServices" 
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
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <VChip v-if="service.can_view" size="x-small" color="success">VIEW</VChip>
                  <VChip v-if="service.can_create" size="x-small" color="primary">CREATE</VChip>
                  <VChip v-if="service.can_edit" size="x-small" color="info">EDIT</VChip>
                  <VChip v-if="service.can_delete" size="x-small" color="error">DELETE</VChip>
                </div>
                
                <div class="mt-4 text-caption text-medium-emphasis">
                  {{ service.categories?.length || 0 }} Categories Enabled
                </div>
              </VCardText>
            </VCard>
          </VCol>
          
          <VCol v-if="permissionStore.enabledServices.length === 0" cols="12">
            <VAlert type="warning" variant="tonal">
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
