
<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const allowedServices = ref([])
const providerServices = ref([])
const loading = ref(false)
const saving = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const [allowedRes, providerRes] = await Promise.all([
      providerApi.get('/api/provider/allowed-services/'),
      providerApi.get('/api/provider/my-services/'),
    ])

    allowedServices.value = allowedRes.data
    providerServices.value = providerRes.data
  } catch (err) {
    console.error('Failed to fetch services', err)
  } finally {
    loading.value = false
  }
}

const getProviderService = serviceId => {
  return providerServices.value.find(s => s.template_service_id === serviceId) || {
    template_service_id: serviceId,
    custom_description: '',
    starting_price: 0,
    is_active: false,
  }
}

const toggleService = async (serviceId, active) => {
  saving.value = true

  const s = getProviderService(serviceId)

  s.is_active = active
    
  try {
    if (s.id) {
      await providerApi.patch(`/api/provider/my-services/${s.id}/`, s)
    } else {
      const res = await providerApi.post('/api/provider/my-services/', s)

      providerServices.value.push(res.data)
    }
  } catch (err) {
    console.error('Failed to toggle service', err)
  } finally {
    saving.value = false
  }
}

const saveServiceUpdate = async s => {
  saving.value = true
  try {
    if (s.id) {
      await providerApi.patch(`/api/provider/my-services/${s.id}/`, s)
    } else {
      const res = await providerApi.post('/api/provider/my-services/', s)

      providerServices.value.push(res.data)
    }
  } catch (err) {
    console.error('Failed to save service update', err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <VCard
    title="My Services"
    subtitle="Configure which services appear on your public profile and customize their details."
  >
    <VCardText
      v-if="loading"
      class="text-center pa-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </VCardText>
    
    <VCardText v-else>
      <VList
        lines="two"
        class="service-list"
      >
        <template
          v-for="service in allowedServices"
          :key="service.service_id"
        >
          <VListItem>
            <template #prepend>
              <VAvatar
                color="primary"
                variant="tonal"
                rounded
              >
                <VIcon :icon="service.icon" />
              </VAvatar>
            </template>
            
            <VListItemTitle class="font-weight-bold">
              {{ service.name }}
            </VListItemTitle>
            
            <template #append>
              <VSwitch 
                :model-value="getProviderService(service.service_id).is_active"
                color="primary"
                density="compact"
                @update:model-value="(val) => toggleService(service.service_id, val)"
              />
            </template>
            
            <VExpandTransition>
              <div
                v-if="getProviderService(service.service_id).is_active"
                class="mt-4 border rounded pa-4 bg-slate-50"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="8"
                  >
                    <AppTextarea 
                      v-model="getProviderService(service.service_id).custom_description"
                      label="Service Description"
                      placeholder="Detail what's included in this service..."
                      rows="2"
                      density="compact"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <AppTextField 
                      v-model="getProviderService(service.service_id).starting_price"
                      label="Starting Price"
                      type="number"
                      prefix="$"
                      density="compact"
                    />
                    <VBtn 
                      size="small" 
                      color="primary" 
                      class="mt-2 w-100" 
                      :loading="saving"
                      @click="saveServiceUpdate(getProviderService(service.service_id))"
                    >
                      Update Details
                    </VBtn>
                  </VCol>
                </VRow>
              </div>
            </VExpandTransition>
          </VListItem>
          <VDivider />
        </template>
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped>
.service-list :deep(.v-list-item) {
  padding-inline: 0 !important;
}
</style>
