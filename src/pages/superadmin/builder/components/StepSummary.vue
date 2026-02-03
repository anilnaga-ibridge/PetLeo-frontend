<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'
import FacilityForm from './FacilityForm.vue'

const props = defineProps(['state'])
const emit = defineEmits(['prev'])

const loading = ref(false)
const viewMode = ref('table') // 'table' or 'card'
const service = ref(null)
const categories = ref([])
const pricingRules = ref([])

const fetchServiceDetails = async () => {
  if (!props.state.selectedServiceId) return
  loading.value = true
  try {
    const [serviceRes, catRes, priceRes] = await Promise.all([
      superAdminApi.get(`/api/superadmin/services/${props.state.selectedServiceId}/`),
      superAdminApi.get('/api/superadmin/categories/', {
        params: { service: props.state.selectedServiceId }
      }),
      superAdminApi.get('/api/superadmin/pricing-rules/', {
        params: { service: props.state.selectedServiceId }
      })
    ])

    service.value = serviceRes.data
    categories.value = catRes.data.results || catRes.data || []
    pricingRules.value = priceRes.data.results || priceRes.data || []
  } catch (err) {
    console.error('Failed to fetch summary data:', err)
  } finally {
    loading.value = false
  }
}

const hierarchy = computed(() => {
  if (!service.value) return []
  
  const menu = categories.value.map(cat => {
    const rules = pricingRules.value.filter(rule => rule.category?.id === cat.id && rule.facility)
    return {
      ...cat,
      items: rules.map(rule => ({
        id: rule.facility.id,
        name: rule.facility.name,
        description: rule.facility.description,
        price: rule.base_price,
        duration: rule.duration_minutes,
        billing_unit: rule.billing_unit,
        is_active: rule.is_active
      }))
    }
  })

  // Add uncategorized if any
  const uncategorizedRules = pricingRules.value.filter(rule => !rule.category && rule.facility)
  if (uncategorizedRules.length > 0) {
    menu.push({
      id: 'uncategorized',
      name: 'Global / Unassigned',
      is_system: true,
      items: uncategorizedRules.map(rule => ({
        id: rule.facility.id,
        name: rule.facility.name,
        description: rule.facility.description,
        price: rule.base_price,
        duration: rule.duration_minutes,
        billing_unit: rule.billing_unit,
        is_active: rule.is_active
      }))
    })
  }

  return menu
})

onMounted(fetchServiceDetails)

watch(() => props.state.selectedServiceId, fetchServiceDetails)

// CRUD Logic
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = ref({
  name: '',
  description: '',
  service: props.state.selectedServiceId,
  category: null,
  base_price: 0,
  duration_minutes: null,
  billing_unit: 'PER_SESSION',
  is_active: true,
})

const openAddDrawer = (category) => {
  isEdit.value = false
  form.value = {
    name: '',
    description: '',
    service: props.state.selectedServiceId,
    category: category.id === 'uncategorized' ? null : category.id,
    base_price: 0,
    duration_minutes: null,
    billing_unit: 'PER_SESSION',
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = (item, category) => {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    ...item,
    service: props.state.selectedServiceId,
    category: category.id === 'uncategorized' ? null : category.id,
    base_price: item.price,
    duration: item.duration_minutes,
    billing_unit: item.billing_unit
  }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    if (isEdit.value) {
      // 1. Update Facility Name/Desc
      await superAdminApi.put(`/api/superadmin/facilities/${editId.value}/`, {
        name: form.value.name,
        description: form.value.description,
        service: form.value.service
      })
      
      // 2. Update Pricing Rule
      const rule = pricingRules.value.find(r => r.facility?.id === editId.value && (r.category?.id === form.value.category || (!r.category && !form.value.category)))
      if (rule) {
        await superAdminApi.put(`/api/superadmin/pricing-rules/${rule.id}/`, {
          service: form.value.service,
          category: form.value.category,
          facility: editId.value,
          base_price: form.value.base_price,
          duration_minutes: form.value.duration_minutes,
          billing_unit: form.value.billing_unit,
          is_active: form.value.is_active
        })
      }
    } else {
      // 1. Create Facility
      const facRes = await superAdminApi.post('/api/superadmin/facilities/', {
        name: form.value.name,
        description: form.value.description,
        service: form.value.service
      })
      
      // 2. Create Pricing Rule
      await superAdminApi.post('/api/superadmin/pricing-rules/', {
        service: form.value.service,
        category: form.value.category,
        facility: facRes.data.id,
        base_price: form.value.base_price,
        duration_minutes: form.value.duration_minutes,
        billing_unit: form.value.billing_unit,
        is_active: form.value.is_active
      })
    }
    drawerOpen.value = false
    fetchServiceDetails()
  } catch (err) {
    console.error('Failed to save item:', err)
  }
}

const deleteDialog = ref(false)
const deleteItem = ref(null)

const openDeleteDialog = item => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteFacility = async () => {
  try {
    const rule = pricingRules.value.find(r => r.facility?.id === deleteItem.value.id)
    if (rule) {
      await superAdminApi.delete(`/api/superadmin/pricing-rules/${rule.id}/`)
    }
    deleteDialog.value = false
    fetchServiceDetails()
  } catch (err) {
    console.error('Failed to delete item:', err)
  }
}

const toggleStatus = async (item, category) => {
  try {
    const rule = pricingRules.value.find(r => r.facility?.id === item.id && (r.category?.id === category.id || (!r.category && category.id === 'uncategorized')))
    if (rule) {
      await superAdminApi.patch(`/api/superadmin/pricing-rules/${rule.id}/`, {
        is_active: item.is_active,
      })
    }
  } catch (err) {
    console.error('Failed to toggle status:', err)
    item.is_active = !item.is_active
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div v-if="loading" class="d-flex justify-center align-center flex-grow-1">
      <VProgressCircular indeterminate color="primary" size="64" />
    </div>

    <template v-else-if="service">
      <div class="mb-6">
        <div class="d-flex justify-space-between align-start">
          <div>
            <h2 class="text-h4 font-weight-bold gradient-text mb-2">{{ service.display_name }} Overview</h2>
            <p class="text-body-1 text-medium-emphasis mb-0">{{ service.description }}</p>
          </div>
          <div class="d-flex flex-column align-end gap-3">
            <VChip size="small" :color="service.is_active ? 'success' : 'secondary'" variant="tonal" class="font-weight-bold">
              {{ service.is_active ? 'ACTIVE SERVICE' : 'INACTIVE SERVICE' }}
            </VChip>

            <div class="d-flex bg-surface-variant rounded-lg pa-1" style="height: 32px">
              <VBtn
                size="x-small"
                :variant="viewMode === 'table' ? 'elevated' : 'text'"
                :color="viewMode === 'table' ? 'primary' : 'medium-emphasis'"
                class="rounded-md px-3"
                height="100%"
                @click="viewMode = 'table'"
              >
                <VIcon icon="tabler-list" size="16" />
              </VBtn>
              <VBtn
                size="x-small"
                :variant="viewMode === 'card' ? 'elevated' : 'text'"
                :color="viewMode === 'card' ? 'primary' : 'medium-emphasis'"
                class="rounded-md px-3"
                height="100%"
                @click="viewMode = 'card'"
              >
                <VIcon icon="tabler-layout-grid" size="16" />
              </VBtn>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-grow-1 overflow-y-auto pr-2 custom-scrollbar">
        <div v-if="hierarchy.length === 0" class="text-center py-10 bg-light rounded-xl border-dashed">
          <VIcon icon="tabler-list-details" size="48" color="medium-emphasis" class="mb-4" />
          <h3 class="text-h6 font-weight-bold mb-2">Configuration Incomplete</h3>
          <p class="text-body-2 text-medium-emphasis">No categories or facilities have been defined for this service yet.</p>
        </div>

        <div v-else class="d-flex flex-column gap-6">
          <VCard v-for="category in hierarchy" :key="category.id" class="summary-card border-0 bg-surface-glass">
            <VCardText class="pa-0">
              <!-- Category Header -->
              <div class="d-flex align-center gap-4 pa-6 bg-surface-variant-light">
                <VAvatar color="primary" variant="tonal" rounded="lg" size="48">
                  <VIcon icon="tabler-category" size="24" />
                </VAvatar>
                <div>
                  <h3 class="text-h6 font-weight-bold mb-1">{{ category.name }}</h3>
                </div>

                <div class="ml-auto">
                  <VBtn 
                    variant="tonal" 
                    size="small" 
                    prepend-icon="tabler-plus"
                    @click="openAddDrawer(category)"
                  >
                    Add Item
                  </VBtn>
                </div>
              </div>

              <!-- Facilities List (Reference StepFacilities.vue logic) -->
              <div v-if="category.items && category.items.length > 0" class="px-6 py-4">
                
                <!-- TABLE VIEW -->
                <VTable v-if="viewMode === 'table'" density="comfortable" class="bg-transparent">
                  <thead>
                    <tr>
                      <th class="text-uppercase text-caption font-weight-bold text-medium-emphasis pl-0">Facility</th>
                      <th class="text-uppercase text-caption font-weight-bold text-medium-emphasis">Details</th>
                      <th class="text-uppercase text-caption font-weight-bold text-medium-emphasis text-right pr-0">Pricing</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in category.items" :key="item.id" class="facility-row">
                      <td class="pl-0 py-3">
                        <div class="d-flex align-center gap-3">
                          <VIcon icon="tabler-building-hospital" size="20" color="primary" />
                          <div>
                            <div class="text-body-2 font-weight-bold text-high-emphasis">{{ item.name }}</div>
                            <VSwitch
                              v-model="item.is_active"
                              color="success"
                              density="compact"
                              hide-details
                              label="Active"
                              class="compact-switch"
                              @click.stop
                              @update:model-value="toggleStatus(item, category)"
                            />
                          </div>
                        </div>
                      </td>
                      <td class="py-3">
                        <p class="text-body-2 text-medium-emphasis mb-0 line-clamp-1" style="max-width: 300px;">
                          {{ item.description || '-' }}
                        </p>
                      </td>
                      <td class="text-right pr-0 py-3">
                        <div class="d-flex flex-column align-end">
                          <span class="text-body-2 font-weight-bold text-primary">₹{{ item.price }}</span>
                          <div class="d-flex align-center gap-1">
                            <span class="text-caption text-medium-emphasis">{{ item.billing_unit.replace('_', ' ') }}</span>
                            <span v-if="item.duration" class="text-caption text-warning font-weight-medium"> • {{ item.duration }}m</span>
                          </div>
                          
                          <div class="d-flex gap-2 mt-2">
                             <VBtn 
                              icon="tabler-pencil" 
                              size="x-small" 
                              variant="text" 
                              color="primary"
                              @click="openEditDrawer(item, category)"
                            />
                             <VBtn 
                              icon="tabler-trash" 
                              size="x-small" 
                              variant="text" 
                              color="error"
                              @click="openDeleteDialog(item)"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </VTable>

                <!-- CARD VIEW -->
                <VRow v-else>
                  <VCol
                    v-for="item in category.items"
                    :key="item.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <VCard class="premium-card-v2 h-100">
                      <VCardText class="pa-5 d-flex flex-column h-100">
                         <!-- Price and Actions -->
                        <div class="d-flex justify-space-between align-start mb-4">
                          <div class="d-flex flex-column">
                             <div class="price-badge pa-2 px-3 rounded-lg bg-primary-lighten-5 text-primary font-weight-bold mb-1">
                              ₹{{ item.price }} <span class="text-caption font-weight-medium">/ {{ item.billing_unit.toLowerCase().replace('_', ' ') }}</span>
                            </div>
                            <div v-if="item.duration" class="d-flex align-center gap-1 text-warning font-weight-bold px-1">
                              <VIcon icon="tabler-clock" size="14" />
                              <span class="text-caption">{{ item.duration }}m</span>
                            </div>
                          </div>
                        
                          <div class="d-flex gap-1 action-buttons-card">
                            <VBtn 
                              icon="tabler-pencil" 
                              size="x-small" 
                              variant="tonal" 
                              color="primary"
                              rounded="lg"
                              @click="openEditDrawer(item, category)"
                            />
                            <VBtn 
                              icon="tabler-trash" 
                              size="x-small" 
                              variant="tonal" 
                              color="error"
                              rounded="lg"
                              @click="openDeleteDialog(item)"
                            />
                          </div>
                        </div>
                      
                        <div class="mb-4">
                          <h3 class="text-subtitle-1 font-weight-bold text-truncate mb-1">
                            {{ item.name }}
                          </h3>
                          <p 
                            v-if="item.description" 
                            class="text-caption text-medium-emphasis line-clamp-2 mb-0"
                          >
                            {{ item.description }}
                          </p>
                          <p v-else class="text-caption text-disabled font-italic mb-0">
                            No description
                          </p>
                        </div>

                         <div class="mt-auto pt-3 border-t d-flex align-center justify-space-between">
                            <VChip 
                              size="x-small" 
                              :color="item.is_active ? 'success' : 'secondary'" 
                              variant="tonal"
                              label
                              class="rounded-sm"
                            >
                              {{ item.is_active ? 'ENABLED' : 'DISABLED' }}
                            </VChip>

                            <VSwitch
                              v-model="item.is_active"
                              density="compact"
                              hide-details
                              color="success"
                              @click.stop
                              @update:model-value="toggleStatus(item, category)"
                            />
                         </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>

              </div>
              <div v-else class="px-6 py-8 text-center">
                <p class="text-caption text-disabled font-italic mb-3">No facilities configured for this category</p>
                <VBtn variant="outlined" size="small" @click="openAddDrawer(category)">
                  Add First Item
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <div class="d-flex justify-start mt-6 pt-4 border-t">
        <VBtn variant="text" prepend-icon="tabler-arrow-left" @click="emit('prev')">
          Back to Facilities
        </VBtn>
      </div>
    </template>
    
    <!-- ADD/EDIT DRAWER -->
    <Teleport to="body">
      <VNavigationDrawer
        v-model="drawerOpen"
        location="end"
        temporary
        :scrim="false"
        width="500"
        class="builder-drawer"
        style="z-index: 8888 !important; top: 0 !important; height: 100vh !important; position: fixed !important;"
      >
        <div class="d-flex flex-column h-100">
          <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header">
            <h3 class="text-h6 font-weight-bold">
              {{ isEdit ? 'Edit Item' : 'New Item' }}
            </h3>
            <VBtn icon="tabler-x" variant="text" @click="drawerOpen = false" />
          </div>

          <div class="flex-grow-1 overflow-y-auto pa-6">
            <FacilityForm
              v-model="form"
              :categories="categories"
              :is-edit="isEdit"
              :loading="loading"
              @submit="submit"
              @cancel="drawerOpen = false"
            />
          </div>
        </div>
      </VNavigationDrawer>
    </Teleport>

    <!-- DELETE DIALOG -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>
          <h2 class="text-h6 font-weight-bold text-high-emphasis">Delete Item?</h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Remove <strong class="text-primary">{{ deleteItem?.name }}</strong> from {{ service?.display_name }}?
          </p>
        </div>
        <VDivider class="my-3" />
        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="red" prepend-icon="tabler-trash" @click="deleteFacility">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.gradient-text {
  background: linear-gradient(135deg, #7367f0 0%, #ce9ffc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-light {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.bg-surface-glass {
  background: rgba(var(--v-theme-surface), 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-border-color), 0.5);
}

.bg-surface-variant-light {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.5);
}

.summary-card {
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 18px rgba(0,0,0,0.08);
    border-color: rgba(var(--v-theme-primary), 0.3);
  }
}

.facility-row {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.02) !important;
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(var(--v-theme-on-surface), 0.1);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--v-theme-on-surface), 0.2);
  }
}

.premium-card-v2 {
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-surface), 0.5) !important;
  border: 1px solid rgba(var(--v-border-color), 0.1) !important;
  border-radius: 16px !important;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.1) !important;
    background: rgba(var(--v-theme-surface), 0.8) !important;
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-switch {
  :deep(.v-selection-control) {
    min-height: 24px !important;
  }
  :deep(.v-label) {
    font-size: 12px;
  }
}
</style>
