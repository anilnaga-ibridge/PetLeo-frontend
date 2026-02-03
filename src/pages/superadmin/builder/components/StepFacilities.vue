<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'
import FacilityForm from './FacilityForm.vue'

const props = defineProps(['state', 'hideNavigation'])
const emit = defineEmits(['next', 'prev', 'update:state'])

const facilities = ref([])
const categories = ref([])
const pricingRules = ref([])
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const usesFacilities = ref(true)
const viewMode = ref('card')
const searchQuery = ref('')

const form = ref({
  name: '',
  description: '',
  service: props.state.selectedServiceId,
  category: props.state.selectedCategoryId || null,
  base_price: 0,
  duration_minutes: null,
  billing_unit: 'PER_SESSION',
  is_active: true,
})

const services = ref([])

const fetchServices = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')
    services.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch services:', err)
  }
}

const fetchCategories = async () => {
  if (!props.state.selectedServiceId) return
  try {
    const res = await superAdminApi.get('/api/superadmin/categories/', {
      params: { service: props.state.selectedServiceId }
    })
    categories.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

const fetchFacilities = async () => {
  if (!props.state.selectedServiceId) return
  loading.value = true
  try {
    // Fetch both facilities and pricing rules to build the hierarchy
    const [facRes, priceRes] = await Promise.all([
      superAdminApi.get('/api/superadmin/facilities/', {
        params: { service: props.state.selectedServiceId },
      }),
      superAdminApi.get('/api/superadmin/pricing-rules/', {
        params: { service: props.state.selectedServiceId },
      })
    ])

    facilities.value = facRes.data.results || facRes.data || []
    pricingRules.value = priceRes.data.results || priceRes.data || []
    
    if (facilities.value.length > 0) {
      usesFacilities.value = true
    }
  } catch (err) {
    console.error('Failed to fetch facilities:', err)
  } finally {
    loading.value = false
  }
}

// Group facilities by Category using Pricing Rules as the link
const categorizedMenu = computed(() => {
  const menu = categories.value.map(cat => {
    const rules = pricingRules.value.filter(rule => rule.category?.id === cat.id && rule.facility)
    return {
      ...cat,
      items: rules.map(rule => ({
        id: rule.facility.id,
        ruleId: rule.id,
        name: rule.facility.name,
        description: rule.facility.description,
        price: rule.base_price,
        duration: rule.duration_minutes,
        billing_unit: rule.billing_unit,
        is_active: rule.is_active
      }))
    }
  })

  // Add "Global/Uncategorized" if any exist (though we want to discourage this)
  const uncategorizedRules = pricingRules.value.filter(rule => !rule.category && rule.facility)
  if (uncategorizedRules.length > 0) {
    menu.push({
      id: 'uncategorized',
      name: 'Global / Unassigned',
      is_active: true,
      items: uncategorizedRules.map(rule => ({
        id: rule.facility.id,
        ruleId: rule.id,
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

const openAddDrawer = (preselectedCat = null) => {
  isEdit.value = false
  form.value = {
    name: '',
    description: '',
    service: props.state.selectedServiceId,
    category: preselectedCat?.id || props.state.selectedCategoryId || null,
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
    duration_minutes: item.duration,
    billing_unit: item.billing_unit
  }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    if (isEdit.value) {
      // 1. Update Facility Name/Desc/Category
      await superAdminApi.put(`/api/superadmin/facilities/${editId.value}/`, {
        name: form.value.name,
        description: form.value.description,
        service: form.value.service,
        category: form.value.category
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
        service: form.value.service,
        category: form.value.category
      })
      
      // 2. Create Pricing Rule (The actual link)
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
    fetchFacilities()
  } catch (err) {
    console.error('Failed to save facility menu item:', err)
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

const selectFacility = facilityId => {
  emit('update:state', { ...props.state, selectedFacilityId: facilityId })
}

const skipStep = () => {
  emit('update:state', { ...props.state, selectedFacilityId: null })
  emit('next') // This will move to the next service
}

const isDurationShown = computed(() => ['PER_SESSION', 'HOURLY'].includes(form.value.billing_unit))

const deleteDialog = ref(false)
const deleteItem = ref(null)

const openDeleteDialog = item => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteFacility = async () => {
  try {
    // Delete the Rule first
    const rule = pricingRules.value.find(r => r.facility?.id === deleteItem.value.id)
    if (rule) {
      await superAdminApi.delete(`/api/superadmin/pricing-rules/${rule.id}/`)
    }
    
    // Optionally delete facility if shared? For now let's just delete the rule which defines the item in the category
    // await superAdminApi.delete(`/api/superadmin/facilities/${deleteItem.value.id}/`)
    
    deleteDialog.value = false
    fetchFacilities()
  } catch (err) {
    console.error('Failed to delete menu item:', err)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchServices(),
    fetchCategories(),
    fetchFacilities()
  ])
})

watch(() => props.state.selectedServiceId, async () => {
  await Promise.all([
    fetchCategories(),
    fetchFacilities()
  ])
})
</script>

<template>
  <div class="h-100 position-relative">
    <!-- Consolidated Toolbar -->
    <div class="d-flex flex-wrap align-center gap-4 mb-6">
      <div style="min-width: 250px; flex: 1;">
        <AppTextField
          v-model="searchQuery"
          placeholder="Filter facilities..."
          prepend-inner-icon="tabler-search"
          density="comfortable"
          hide-details
          class="premium-search-v2"
        />
      </div>
      
      <div class="d-flex align-center gap-3">
        <VSwitch
          v-model="usesFacilities"
          label="Enable Module"
          color="primary"
          hide-details
          inset
          density="compact"
          class="me-4 premium-switch"
        />

        <VDivider
          vertical
          class="mx-2"
        />

        <VBtnToggle
          v-model="viewMode"
          mandatory
          density="compact"
          color="primary"
          variant="tonal"
          class="premium-toggle-v2 rounded-lg"
        >
          <VBtn
            value="card"
            icon="tabler-layout-grid"
            size="small"
          />
          <VBtn
            value="table"
            icon="tabler-list"
            size="small"
          />
        </VBtnToggle>

        <VDivider
          vertical
          class="mx-2"
        />

        <VBtn 
          variant="tonal" 
          color="secondary" 
          rounded="lg"
          class="text-none"
          @click="skipStep"
        >
          Skip
        </VBtn>
        <VBtn 
          color="primary" 
          prepend-icon="tabler-plus" 
          rounded="lg"
          class="premium-btn shadow-v2"
          :disabled="!usesFacilities"
          @click="openAddDrawer"
        >
          Add Facility
        </VBtn>
      </div>
    </div>

    <VExpandTransition>
      <div v-if="usesFacilities">
        <VRow v-if="loading">
          <VCol v-for="i in 3" :key="i" cols="12" sm="6" md="4">
            <VSkeletonLoader type="card" class="rounded-lg" />
          </VCol>
        </VRow>

        <template v-else>
          <!-- NESTED MENU VIEW -->
          <div v-for="category in categorizedMenu" :key="category.id" class="mb-12">
            <!-- CATEGORY HEADER -->
            <div class="d-flex align-center justify-space-between mb-6 border-b pb-4">
              <div class="d-flex align-center gap-4">
                <VAvatar color="primary" variant="tonal" rounded="xl">
                  <VIcon icon="tabler-category" />
                </VAvatar>
                <div>
                  <h2 class="text-h4 font-weight-bold gradient-text mb-0">{{ category.name }} Facilities</h2>
                  <p class="text-caption text-medium-emphasis mb-0">Define facilities and prices for {{ category.name }}</p>
                </div>
              </div>
              
              <VBtn 
                color="primary" 
                variant="tonal" 
                prepend-icon="tabler-plus" 
                rounded="lg"
                class="text-none"
                @click="openAddDrawer(category)"
              >
                Add {{ category.name }} Facility & Price
              </VBtn>
            </div>

            <!-- FACILITIES UNDER THIS CATEGORY -->
            <div v-if="category.items.length > 0">
              
              <!-- TABLE VIEW -->
              <VTable v-if="viewMode === 'table'" density="comfortable" class="bg-transparent mb-4">
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
                            icon="tabler-edit" 
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
                  :key="item.ruleId"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <VCard 
                    class="premium-card-v2 h-100"
                    :class="[{ 'is-selected': props.state.selectedFacilityId === item.id }]"
                    @click="selectFacility(item.id)"
                  >
                    <VCardText class="pa-6 d-flex flex-column h-100">
                      <!-- Price Tag -->
                      <div class="d-flex justify-space-between align-start mb-4">
                        <div class="price-badge pa-2 px-3 rounded-lg bg-primary-lighten-5 text-primary font-weight-bold">
                          ₹{{ item.price }} <span class="text-caption font-weight-medium">/ {{ item.billing_unit.toLowerCase().replace('_', ' ') }}</span>
                        </div>

                        <div v-if="item.duration" class="pa-2 px-3 rounded-lg bg-warning-lighten-5 text-warning font-weight-bold d-flex align-center gap-1">
                          <VIcon icon="tabler-clock" size="14" />
                          <span class="text-caption">{{ item.duration }}m</span>
                        </div>
                      
                        <div class="d-flex gap-1 action-buttons">
                          <VBtn 
                            icon="tabler-edit" 
                            size="x-small" 
                            variant="tonal" 
                            color="primary"
                            rounded="lg"
                            @click.stop="openEditDrawer(item, category)"
                          />
                          <VBtn 
                            icon="tabler-trash" 
                            size="x-small" 
                            variant="tonal" 
                            color="error"
                            rounded="lg"
                            @click.stop="openDeleteDialog(item)"
                          />
                        </div>
                      </div>
                    
                      <div class="mb-4">
                        <h3 class="text-h6 font-weight-bold text-truncate mb-1">
                          {{ item.name }}
                        </h3>
                        <p 
                          v-if="item.description" 
                          class="text-body-2 text-medium-emphasis line-clamp-2 mb-0"
                        >
                          {{ item.description }}
                        </p>
                        <p v-else class="text-caption text-disabled font-italic mb-0">
                          No description provided
                        </p>
                      </div>

                      <!-- Footer -->
                      <div class="mt-auto pt-4 border-t d-flex align-center justify-space-between">
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

            <!-- EMPTY STATE FOR CATEGORY -->
            <div v-else class="text-center py-10 bg-light rounded-xl border-dashed">
              <VIcon icon="tabler-building-hospital" size="40" color="disabled" class="mb-2" />
              <p class="text-body-2 text-disabled mb-4">No items defined for this category yet.</p>
              <VBtn variant="text" color="primary" rounded="lg" @click="openAddDrawer(category)">
                Create First Item
              </VBtn>
            </div>
          </div>
        </template>
      </div>
    </VExpandTransition>

    <div
      v-if="!usesFacilities"
      class="text-center py-12 bg-light rounded-lg border-dashed"
    >
      <VIcon icon="tabler-info-circle" size="48" color="medium-emphasis" class="mb-4" />
      <h3 class="text-h6 font-weight-bold mb-2">Facilities Disabled</h3>
      <p class="text-body-2 text-medium-emphasis">Toggle the switch above if this service requires specific facilities.</p>
    </div>

    <div v-if="!hideNavigation" class="d-flex justify-space-between mt-8">
      <VBtn variant="text" prepend-icon="tabler-arrow-left" @click="emit('prev')">
        Back
      </VBtn>
      <VBtn color="primary" append-icon="tabler-arrow-right" @click="emit('next')">
        Next Step
      </VBtn>
    </div>

    <!-- DELETE CONFIRMATION -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>
          <h2 class="text-h6 font-weight-bold text-high-emphasis">Delete Menu Item?</h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Remove <strong class="text-primary">{{ deleteItem?.name }}</strong> and its pricing from this category?
          </p>
        </div>
        <VDivider class="my-3" />
        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="red" prepend-icon="tabler-trash" @click="deleteFacility">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>

    <!-- Add/Edit Drawer (Implemented as Dialog to avoid recursion) -->
    <VDialog
      v-model="drawerOpen"
      fullscreen
      transition="slide-x-reverse-transition"
      class="sidebar-dialog"
      :scrim="true"
    >
      <div class="d-flex w-100 h-100">
        <!-- Overlay/Scrim click area -->
        <div class="flex-grow-1" style="background: rgba(0,0,0,0.3); cursor: pointer;" @click="drawerOpen = false"></div>
        
        <!-- Sidebar Content -->
        <VCard
          width="500"
          max-width="100%"
          class="h-100 rounded-0 border-s d-flex flex-column"
          elevation="10"
          @click.stop
        >
          <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header">
            <h3 class="text-h6 font-weight-bold">
              {{ isEdit ? 'Edit Facility & Price' : 'Add Facility & Price' }}
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
        </VCard>
      </div>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
/* ... existing scoped styles ... */
.premium-card-v2 {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: rgba(var(--v-theme-surface), 0.7) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-border-color), 0.1) !important;
  border-radius: 24px !important;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 15px 35px rgba(var(--v-theme-primary), 0.12) !important;
    background: rgba(var(--v-theme-surface), 0.9) !important;

    .action-buttons {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.is-selected {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 0.05) !important;
    box-shadow: 0 8px 25px rgba(var(--v-theme-primary), 0.15) !important;
    
    &::after {
      content: '';
      position: absolute;
      top: 12px;
      right: 12px;
      width: 12px;
      height: 12px;
      background: rgb(var(--v-theme-primary));
      border-radius: 50%;
      box-shadow: 0 0 10px rgb(var(--v-theme-primary));
    }
  }
}

.action-buttons {
  opacity: 0;
  transform: translateY(-5px);
  transition: all 0.3s ease;
}

.premium-search-v2 {
  :deep(.v-field) {
    border-radius: 12px !important;
    background: rgba(var(--v-theme-surface), 0.8) !important;
    transition: all 0.3s ease;
    
    &.v-field--focused {
      background: rgb(var(--v-theme-surface)) !important;
      box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.1) !important;
    }
  }
}

.premium-switch {
  :deep(.v-selection-control) {
    min-height: 48px;
    padding: 0 12px;
    border-radius: 12px;
    background: rgba(var(--v-theme-primary), 0.04);
  }
}

.facility-row {
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.02) !important;
  }
}

/* Animations */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.5s ease;
}

.list-fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.list-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
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

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

/* Sidebar Dialog Override */
:deep(.sidebar-dialog) {
  .v-overlay__content {
    margin: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
  }
}
</style>
