<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['planId'])

const services = ref([])
const loading = ref(false)
const saving = ref(false)

// Map of serviceId -> { enabled: bool, id: capabilityId, permissions: {}, categories: [], facilities: [] }
const capabilities = ref({})
const expandedServices = ref([])

const fetchServices = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')
    services.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch services:', err)
  }
}

const fetchCapabilities = async () => {
  if (!props.planId) return

  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/plan-capabilities/', {
      params: { plan: props.planId }
    })
    const caps = res.data.results || res.data || []
    
    // Reset map
    capabilities.value = {}
    
    caps.forEach(c => {
      const svcId = c.service?.id || c.service
      capabilities.value[svcId] = {
        enabled: true,
        id: c.id,
        permissions: c.permissions || { can_view: true, can_create: true, can_edit: true, can_delete: true },
        // Assuming backend supports these fields in permissions or separate fields
        // For now, we'll store them in permissions json if backend allows, or we might need to adjust based on actual model
        // The user request says "Use existing PlanCapability APIs". 
        // If the backend model doesn't have specific fields for categories/facilities, we might need to store them in the JSON 'permissions' field.
        categories: c.permissions?.categories || [], 
        facilities: c.permissions?.facilities || []
      }
    })
  } catch (err) {
    console.error('Failed to fetch capabilities:', err)
  } finally {
    loading.value = false
  }
}

// Fetch categories and facilities for a service when expanded
const serviceMetadata = ref({}) // serviceId -> { categories: [], facilities: [] }

const fetchServiceMetadata = async (serviceId) => {
  if (serviceMetadata.value[serviceId]) return

  try {
    const [catRes, facRes] = await Promise.all([
      superAdminApi.get('/api/superadmin/categories/', { params: { service: serviceId } }),
      superAdminApi.get('/api/superadmin/facilities/', { params: { service: serviceId } })
    ])
    serviceMetadata.value[serviceId] = {
      categories: catRes.data.results || catRes.data || [],
      facilities: facRes.data.results || facRes.data || []
    }
  } catch (err) {
    console.error(`Failed to fetch metadata for service ${serviceId}:`, err)
  }
}

const toggleService = (serviceId) => {
  if (capabilities.value[serviceId]) {
    // Disable
    delete capabilities.value[serviceId]
  } else {
    // Enable
    capabilities.value[serviceId] = {
      enabled: true,
      permissions: { can_view: true, can_create: true, can_edit: true, can_delete: true, categories: [], facilities: [] },
      categories: [],
      facilities: []
    }
    // Auto-expand
    if (!expandedServices.value.includes(serviceId)) {
      expandedServices.value.push(serviceId)
    }
    fetchServiceMetadata(serviceId)
  }
}

const save = async () => {
  if (!props.planId) return
  saving.value = true
  
  try {
    // Get current capabilities from backend to know what to delete
    const currentRes = await superAdminApi.get('/api/superadmin/plan-capabilities/', {
      params: { plan: props.planId }
    })
    const currentCaps = currentRes.data.results || currentRes.data || []
    
    // Process each service
    for (const svc of services.value) {
      const localCap = capabilities.value[svc.id]
      const remoteCap = currentCaps.find(c => (c.service?.id || c.service) === svc.id)
      
      if (localCap) {
        // Prepare payload
        // Ensure categories and facilities are stored in permissions JSON
        const permissions = {
          ...localCap.permissions,
          categories: localCap.categories,
          facilities: localCap.facilities
        }

        const payload = {
          plan: props.planId,
          service: svc.id,
          permissions: permissions
        }

        if (remoteCap) {
          await superAdminApi.put(`/api/superadmin/plan-capabilities/${remoteCap.id}/`, payload)
        } else {
          await superAdminApi.post('/api/superadmin/plan-capabilities/', payload)
        }
      } else if (remoteCap) {
        // Delete if not selected locally but exists remotely
        await superAdminApi.delete(`/api/superadmin/plan-capabilities/${remoteCap.id}/`)
      }
    }
    
    // Refresh
    await fetchCapabilities()
  } catch (err) {
    console.error('Failed to save capabilities:', err)
  } finally {
    saving.value = false
  }
}

const availableCapabilities = ref([])

const fetchAvailableCapabilities = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/capabilities/')
    availableCapabilities.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch available capabilities:', err)
  }
}

const groupedCapabilities = computed(() => {
  const groups = {}
  availableCapabilities.value.forEach(cap => {
    if (!groups[cap.group]) {
      groups[cap.group] = []
    }
    groups[cap.group].push(cap)
  })
  return groups
})

onMounted(() => {
  fetchServices()
  fetchAvailableCapabilities()
  if (props.planId) {
    fetchCapabilities()
  }
})

watch(() => props.planId, () => {
  if (props.planId) {
    fetchCapabilities()
  } else {
    capabilities.value = {}
    expandedServices.value = []
  }
})

const handleExpand = (val) => {
  // val is array of expanded panel values (serviceIds)
  val.forEach(id => fetchServiceMetadata(id))
}
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div v-if="!props.planId" class="d-flex flex-column align-center justify-center h-100 text-center pa-12">
      <VIcon icon="tabler-arrow-left" size="48" color="medium-emphasis" class="mb-4" />
      <h3 class="text-h5 font-weight-bold mb-2">Select a Plan</h3>
      <p class="text-body-1 text-medium-emphasis">
        Please create or select a plan to configure its services.
      </p>
    </div>

    <template v-else>
      <div class="pa-6 flex-grow-1 overflow-y-auto">
        <div class="text-h6 font-weight-bold mb-4">Included Services</div>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Select the services included in this plan and configure their specific limitations.
        </p>

        <VExpansionPanels
          v-model="expandedServices"
          multiple
          variant="accordion"
          @update:model-value="handleExpand"
        >
          <VExpansionPanel
            v-for="service in services"
            :key="service.id"
            :value="service.id"
            elevation="0"
            class="border mb-2 rounded-lg"
          >
            <VExpansionPanelTitle>
              <div class="d-flex align-center gap-3 w-100">
                <VCheckbox
                  :model-value="!!capabilities[service.id]"
                  @click.stop="toggleService(service.id)"
                  hide-details
                  density="compact"
                  class="flex-grow-0"
                />
                <VAvatar color="primary" variant="tonal" size="32">
                  <VIcon :icon="service.icon || 'tabler-paw'" size="20" />
                </VAvatar>
                <div class="d-flex flex-column">
                  <span class="font-weight-bold">{{ service.display_name }}</span>
                  <span class="text-caption text-medium-emphasis">{{ service.description }}</span>
                </div>
              </div>
            </VExpansionPanelTitle>

            <VExpansionPanelText v-if="capabilities[service.id]">
              <div class="pt-4">
                <!-- Categories -->
                <div v-if="serviceMetadata[service.id]?.categories?.length" class="mb-6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Allowed Types/Categories</div>
                  <VRow dense>
                    <VCol
                      v-for="cat in serviceMetadata[service.id].categories"
                      :key="cat.id"
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <VCheckbox
                        v-model="capabilities[service.id].categories"
                        :label="cat.name"
                        :value="cat.id"
                        density="compact"
                        hide-details
                      />
                    </VCol>
                  </VRow>
                </div>

                <!-- Facilities -->
                <div v-if="serviceMetadata[service.id]?.facilities?.length" class="mb-6">
                  <div class="text-subtitle-2 font-weight-bold mb-2">Allowed Facilities</div>
                  <VRow dense>
                    <VCol
                      v-for="fac in serviceMetadata[service.id].facilities"
                      :key="fac.id"
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <VCheckbox
                        v-model="capabilities[service.id].facilities"
                        :label="fac.name"
                        :value="fac.id"
                        density="compact"
                        hide-details
                      />
                    </VCol>
                  </VRow>
                </div>

                <!-- Capabilities -->
                <div class="mb-2">
                  <div class="text-subtitle-2 font-weight-bold mb-4">Capabilities Granted</div>
                  
                  <div v-for="(caps, group) in groupedCapabilities" :key="group" class="mb-6">
                    <div class="text-caption font-weight-bold text-uppercase text-primary mb-3">{{ group }}</div>
                    <div class="d-flex flex-wrap gap-x-8 gap-y-4">
                      <VCheckbox
                        v-for="cap in caps"
                        :key="cap.key"
                        v-model="capabilities[service.id].permissions[cap.key]"
                        density="compact"
                        hide-details
                        class="capability-checkbox"
                        style="min-width: 280px;"
                      >
                        <template #label>
                          <div class="d-flex flex-column ms-2">
                            <span class="text-body-2 font-weight-medium">{{ cap.label }}</span>
                            <span class="text-caption text-medium-emphasis">{{ cap.description }}</span>
                          </div>
                        </template>
                      </VCheckbox>
                    </div>
                  </div>
                </div>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>

      <div class="pa-4 border-t bg-surface d-flex justify-end">
        <VBtn
          color="primary"
          :loading="saving"
          prepend-icon="tabler-device-floppy"
          @click="save"
        >
          Save Changes
        </VBtn>
      </div>
    </template>
  </div>
</template>
