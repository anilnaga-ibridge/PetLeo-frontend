<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  serviceId: {
    type: String,
    required: true
  },
  permissions: {
    type: Object,
    default: () => ({
      can_create: false,
      can_edit: false,
      can_delete: false
    })
  },
  mode: {
    type: String,
    default: 'facilities', // 'categories', 'facilities', 'summary'
    validator: v => ['categories', 'facilities', 'summary'].includes(v)
  }
})

const categories = ref([])
const pricingRules = ref([])
const loading = ref(false)
const submitting = ref(false)
const viewMode = ref('card') // 'card' or 'table'
const searchQuery = ref('')
const showPermissionDialog = ref(false)
const showPermissions = ref(false)
const permissionDeniedAction = ref('')

const normalizedPerms = computed(() => ({
  can_create: props.permissions.can_create ?? props.permissions.canCreate ?? false,
  can_edit: props.permissions.can_edit ?? props.permissions.canEdit ?? false,
  can_delete: props.permissions.can_delete ?? props.permissions.canDelete ?? false,
  can_view: props.permissions.can_view ?? props.permissions.canView ?? true
}))

const permissionMatrix = computed(() => [
  { entity: 'Category', create: normalizedPerms.value.can_create, edit: normalizedPerms.value.can_edit, delete: normalizedPerms.value.can_delete },
  { entity: 'Facility', create: normalizedPerms.value.can_create, edit: normalizedPerms.value.can_edit, delete: normalizedPerms.value.can_delete },
  { entity: 'Price',    create: normalizedPerms.value.can_create, edit: normalizedPerms.value.can_edit, delete: normalizedPerms.value.can_delete },
])

const handleRestrictedAction = (action) => {
  permissionDeniedAction.value = action
  showPermissionDialog.value = true
}

// Drawers State
const categoryDrawerOpen = ref(false)
const facilityDrawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

// Forms
const categoryForm = ref({
  name: '',
  description: '',
  service: props.serviceId,
  is_active: true
})

const facilityForm = ref({
  name: '',
  description: '',
  service: props.serviceId,
  category: null,
  base_price: 0,
  duration_minutes: null,
  billing_unit: 'PER_SESSION',
  is_active: true
})

const billingUnitOptions = [
  { label: 'Per Session', value: 'PER_SESSION' },
  { label: 'Per Hour', value: 'HOURLY' },
  { label: 'Per Day', value: 'DAILY' },
  { label: 'Per Week', value: 'WEEKLY' },
  { label: 'One Time', value: 'ONE_TIME' },
]

// Fetch Data
const fetchData = async () => {
  if (!props.serviceId) return
  loading.value = true
  try {
    const [catRes, priceRes] = await Promise.all([
      providerApi.get(`/api/provider/categories/?service=${props.serviceId}`),
      providerApi.get(`/api/provider/pricing/?service=${props.serviceId}`)
    ])

    categories.value = catRes.data.results || catRes.data || []
    pricingRules.value = priceRes.data.results || priceRes.data || []
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
}

// Hierarchy Logic
const hierarchy = computed(() => {
  let filteredCats = categories.value
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filteredCats = categories.value.filter(c => c.name.toLowerCase().includes(q))
  }

  // Helper to safely get category ID from a rule
  const getCategoryId = (rule) => {
    if (rule.category_id) return rule.category_id
    if (!rule.category) return null
    return typeof rule.category === 'object' ? rule.category.id : rule.category
  }

  const processedRuleIds = new Set()

  const menu = filteredCats.map(cat => {
    const rules = pricingRules.value.filter(rule => {
       const ruleCatId = getCategoryId(rule)
       
       const isMatch = ruleCatId === cat.id && rule.facility
       if (isMatch) processedRuleIds.add(rule.id)
       return isMatch
    })
    
    return {
      ...cat,
      items: rules.map(rule => ({
        // Backend returns facility as ID (string) and facility_name (string)
        // Check if it's an object (legacy) or just ID
        id: (typeof rule.facility === 'object' && rule.facility) ? rule.facility.id : rule.facility,
        ruleId: rule.id, // Keep track of rule ID for pricing updates
        name: rule.facility_name || (typeof rule.facility === 'object' ? rule.facility.name : 'Unknown Facility'),
        description: rule.facility_description || (typeof rule.facility === 'object' ? rule.facility.description : ''),
        price: rule.price, // Backend sends 'price', not 'base_price'
        duration: null, // Backend schema lacks separate duration_minutes, skipping for now
        billing_unit: rule.duration, // Backend 'duration' field holds the Billing Unit (e.g. PER_SESSION)
        is_active: rule.is_active,
        // Helper for permission checks if per-item permission needed
        can_edit: rule.can_edit, 
        can_delete: rule.can_delete
      }))
    }
  })

  // Add Uncategorized AND Orphaned rules (rules with category ID that wasn't found in fetched categories)
  const leftoverRules = pricingRules.value.filter(rule => 
      !processedRuleIds.has(rule.id) && rule.facility
  )

  if (leftoverRules.length > 0 && !searchQuery.value) {
    menu.push({
      id: 'uncategorized',
      name: 'Uncategorized', 
      is_system: true,
      items: leftoverRules.map(rule => ({
        id: (typeof rule.facility === 'object' && rule.facility) ? rule.facility.id : rule.facility,
        ruleId: rule.id,
        name: rule.facility_name || (typeof rule.facility === 'object' ? rule.facility.name : 'Unknown Facility'),
        description: rule.facility_description || (typeof rule.facility === 'object' ? rule.facility.description : ''),
        price: rule.price,
        duration: null,
        billing_unit: rule.duration,
        is_active: rule.is_active,
        can_edit: rule.can_edit,
        can_delete: rule.can_delete
      }))
    })
  }

  return menu
})

// --- Category Actions ---
const openCategoryDrawer = (category = null) => {
  if (category) {
    isEdit.value = true
    editId.value = category.id
    categoryForm.value = {
      name: category.name,
      description: category.description,
      service_id: props.serviceId,
      is_active: category.is_active
    }
  } else {
    isEdit.value = false
    categoryForm.value = {
      name: '',
      description: '',
      service_id: props.serviceId,
      is_active: true
    }
  }
  categoryDrawerOpen.value = true
}

const submitCategory = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await providerApi.put(`/api/provider/categories/${editId.value}/`, categoryForm.value)
    } else {
      await providerApi.post('/api/provider/categories/', categoryForm.value)
    }
    categoryDrawerOpen.value = false
    fetchData()
  } catch (err) {
    console.error('Failed to save category:', err)
  } finally {
    submitting.value = false
  }
}

const deleteCategory = async (id) => {
  if (!confirm('Delete this category and all its facilities?')) return
  try {
    await providerApi.delete(`/api/provider/categories/${id}/`)
    fetchData()
  } catch (err) {
    console.error('Failed to delete category:', err)
  }
}

const toggleCategoryStatus = async (category) => {
  try {
    await providerApi.patch(`/api/provider/categories/${category.id}/`, {
      is_active: category.is_active
    })
  } catch (err) {
    // Revert on failure
    category.is_active = !category.is_active
  }
}

// --- Facility Actions ---
const openFacilityDrawer = (category, item = null) => {
  if (item) {
    isEdit.value = true
    editId.value = item.id // Facility ID
    facilityForm.value = {
      name: item.name,
      description: item.description,
      service: props.serviceId,
      category: category.id === 'uncategorized' ? null : category.id,
      base_price: item.price,
      duration_minutes: item.duration,
      billing_unit: item.billing_unit,
      is_active: item.is_active,
      // Store rule ID for update
      ruleId: item.ruleId
    }
  } else {
    isEdit.value = false
    facilityForm.value = {
      name: '',
      description: '',
      service: props.serviceId,
      category: category.id === 'uncategorized' ? null : category.id,
      base_price: 0,
      duration_minutes: null,
      billing_unit: 'PER_SESSION',
      is_active: true
    }
  }
  facilityDrawerOpen.value = true
}

const submitFacility = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    if (isEdit.value) {
      // 1. Update Facility
      await providerApi.put(`/api/provider/facilities/${editId.value}/`, {
        name: facilityForm.value.name,
        description: facilityForm.value.description,
        service: facilityForm.value.service,
        category: facilityForm.value.category
      })
      
      // 2. Update Pricing Rule
      if (facilityForm.value.ruleId) {
        await providerApi.put(`/api/provider/pricing/${facilityForm.value.ruleId}/`, {
          service_id: facilityForm.value.service,
          category_id: facilityForm.value.category,
          facility: editId.value,
          price: facilityForm.value.base_price,
          duration: facilityForm.value.billing_unit,
          is_active: facilityForm.value.is_active,
          description: facilityForm.value.description
        })
      }
    } else {
      // 1. Create Facility
      const facRes = await providerApi.post('/api/provider/facilities/', {
        name: facilityForm.value.name,
        description: facilityForm.value.description,
        service: facilityForm.value.service,
        category: facilityForm.value.category
      })
      
      // 2. Create Pricing Rule
      const pricingPayload = {
        service_id: facilityForm.value.service,
        category_id: facilityForm.value.category,
        facility: facRes.data.id,
        price: facilityForm.value.base_price,
        duration: facilityForm.value.billing_unit,
        is_active: facilityForm.value.is_active,
        description: facilityForm.value.description
      }

      await providerApi.post('/api/provider/pricing/', pricingPayload)
    }
    facilityDrawerOpen.value = false
    fetchData()
  } catch (err) {
    console.error('Failed to save facility:', err)
  } finally {
    submitting.value = false
  }
}

const deleteFacility = async (item) => {
  if (!confirm('Delete this facility?')) return
  try {
    // Delete the Rule first (or just facility, backend might cascade)
    // Best practice: Delete pricing rule, then facility if strictly coupled
    if (item.ruleId) {
       await providerApi.delete(`/api/provider/pricing/${item.ruleId}/`)
    }
    // Attempt deleting facility (might fail if shared, but here assumed 1:1 context)
    // await providerApi.delete(`/api/provider/facilities/${item.id}/`)

    fetchData()
  } catch (err) {
    console.error('Failed to delete item:', err)
  }
}

const toggleFacilityStatus = async (item) => {
  try {
    if (item.ruleId) {
       await providerApi.patch(`/api/provider/pricing/${item.ruleId}/`, {
         is_active: item.is_active
       })
    }
  } catch (err) {
    item.is_active = !item.is_active
  }
}

onMounted(fetchData)
watch(() => props.serviceId, fetchData)
</script>

<template>
  <div class="h-100 d-flex flex-column position-relative">
    <!-- Permission Summary Card -->
    <VCard class="mb-6 border" elevation="0" v-if="mode === 'categories'">
      <div @click="showPermissions = !showPermissions" class="cursor-pointer py-2 px-4">
        <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
                <VAvatar color="primary" variant="tonal" size="40" class="me-3">
                    <VIcon icon="tabler-lock-access" size="24" />
                </VAvatar>
                <div class="d-flex flex-wrap align-center gap-x-2">
                    <h3 class="text-h6 font-weight-bold mb-0">Your Plan Permissions</h3>
                    <div class="text-caption text-medium-emphasis mb-0">Access level based on your current subscription</div>
                </div>
                <VIcon :icon="showPermissions ? 'tabler-chevron-up' : 'tabler-chevron-down'" class="ms-2 text-medium-emphasis" />
            </div>
            <VBtn variant="text" size="small" color="primary" append-icon="tabler-external-link" :to="{ name: 'provider-providerhome', hash: '#plans' }" @click.stop>
                Upgrade Plan
            </VBtn>
        </div>
      </div>
      <VExpandTransition>
        <div v-show="showPermissions">
            <VDivider />
            <div class="d-flex flex-wrap pa-4 gap-4">
        <div v-for="row in permissionMatrix" :key="row.entity" class="flex-grow-1 border rounded pa-3 bg-surface">
             <div class="text-subtitle-2 font-weight-bold mb-2">{{ row.entity }}</div>
             <div class="d-flex gap-3">
                 <div class="d-flex align-center text-caption" :class="row.create ? 'text-success' : 'text-disabled'">
                     <VIcon :icon="row.create ? 'tabler-check' : 'tabler-lock'" size="16" class="me-1" /> Create
                 </div>
                 <div class="d-flex align-center text-caption" :class="row.edit ? 'text-success' : 'text-disabled'">
                     <VIcon :icon="row.edit ? 'tabler-check' : 'tabler-lock'" size="16" class="me-1" /> Update
                 </div>
                 <div class="d-flex align-center text-caption" :class="row.delete ? 'text-success' : 'text-disabled'">
                     <VIcon :icon="row.delete ? 'tabler-check' : 'tabler-lock'" size="16" class="me-1" /> Delete
                 </div>
             </div>
        </div>
        </div>
      </div>
      </VExpandTransition>
    </VCard>



    <!-- Toolbar -->
    <div class="d-flex flex-wrap align-center gap-4 mb-6">
       <div style="min-width: 250px; flex: 1;">
        <AppTextField
          v-model="searchQuery"
          placeholder="Search categories & facilities..."
          prepend-inner-icon="tabler-search"
          density="comfortable"
          hide-details
          class="premium-search-v2"
        />
      </div>

      <div class="d-flex align-center gap-3">
        <VBtnToggle
          v-if="mode !== 'categories'"
          v-model="viewMode"
          mandatory
          density="compact"
          color="primary"
          variant="tonal"
          class="premium-toggle-v2 rounded-lg"
        >
          <VBtn value="card" icon="tabler-layout-grid" size="small" />
          <VBtn value="table" icon="tabler-list" size="small" />
        </VBtnToggle>

        <VDivider vertical class="mx-2" />



        <div v-if="mode === 'categories'">
            <VTooltip v-if="!normalizedPerms.can_create" location="top" text="Not allowed in your current plan">
                <template #activator="{ props }">
                    <div v-bind="props" class="d-inline-block">
                        <VBtn
                          disabled
                          color="medium-emphasis"
                          prepend-icon="tabler-lock"
                          rounded="lg"
                          class="premium-btn shadow-v2"
                        >
                          Add Category
                        </VBtn>
                    </div>
                </template>
            </VTooltip>
            
            <VBtn
              v-else
              color="primary"
              prepend-icon="tabler-plus"
              rounded="lg"
              class="premium-btn shadow-v2"
              @click="openCategoryDrawer()"
            >
              Add Category
            </VBtn>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="d-flex justify-center align-center py-12">
       <VProgressCircular indeterminate color="primary" size="64" />
    </div>

    <template v-else-if="hierarchy.length > 0">
       <!-- CATEGORIES MODE: GRID VIEW -->
       <div v-if="mode === 'categories'">
         <VRow>
            <VCol v-for="category in hierarchy" :key="category.id" cols="12" sm="6" md="4">
              <VCard class="premium-card-v2 h-100">
                <VCardText class="pa-5 d-flex flex-column h-100">
                  <div class="d-flex justify-space-between align-start mb-4">
                     <VAvatar color="primary" variant="tonal" rounded="lg" size="48">
                        <VIcon icon="tabler-category" size="24" />
                     </VAvatar>
                     
                     <div class="d-flex gap-1 action-buttons-card">
                      <div class="d-flex gap-1 action-buttons-card">
                        <!-- Edit Button -->
                        <div v-if="!category.is_system">
                             <VBtn
                                v-if="normalizedPerms.can_edit"
                                icon="tabler-pencil"
                                size="x-small"
                                variant="tonal"
                                color="primary"
                                rounded="lg"
                                @click="openCategoryDrawer(category)"
                            />
                            <VBtn 
                                v-else
                                icon="tabler-lock"
                                size="x-small"
                                variant="tonal"
                                color="medium-emphasis"
                                rounded="lg"
                                disabled
                                v-bind="props"
                                @click="handleRestrictedAction('Update Category')"
                            />
                        </div>

                        <!-- Delete Button -->
                        <div v-if="!category.is_system">
                            <VBtn
                                v-if="normalizedPerms.can_delete"
                                icon="tabler-trash"
                                size="x-small"
                                variant="tonal"
                                color="error"
                                rounded="lg"
                                @click="deleteCategory(category.id)"
                            />
                            <VBtn
                                v-else
                                icon="tabler-lock"
                                size="x-small"
                                variant="tonal"
                                color="medium-emphasis"
                                rounded="lg"
                                disabled
                                @click="handleRestrictedAction('Delete Category')"
                            />
                        </div>
                       </div>
                  </div>
               </div>

                  <div class="mb-4">
                     <h3 class="text-h6 font-weight-bold mb-1">{{ category.name }}</h3>
                     <p v-if="category.description" class="text-body-2 text-medium-emphasis mb-0 line-clamp-2">{{ category.description }}</p>
                  </div>

                  <div class="mt-auto pt-3 border-t d-flex align-center justify-space-between">
                     <VChip 
                        size="x-small" 
                        :color="category.is_active ? 'success' : 'secondary'" 
                        variant="tonal"
                        label
                     >
                        {{ category.is_active ? 'ENABLED' : 'DISABLED' }}
                     </VChip>
                     
                      <VSwitch
                          v-if="normalizedPerms.can_edit"
                          v-model="category.is_active"
                          density="compact"
                          hide-details
                          color="success"
                          @click.stop
                          @update:model-value="toggleCategoryStatus(category)"
                        />
                        <VIcon v-else icon="tabler-lock" size="18" color="disabled" />
                  </div>
                </VCardText>
              </VCard>
            </VCol>
         </VRow>
       </div>

       <!-- FACILITIES & SUMMARY MODES -->
       <div v-else class="d-flex flex-column gap-6">
          <div v-for="category in hierarchy" :key="category.id" class="category-section">
             <!-- Category Header -->
             <div class="category-header d-flex align-center gap-4 mb-4 pb-2 border-b">
                 <div class="d-flex align-center gap-3">
                    <VIcon icon="tabler-category" size="24" color="primary" />
                    <div>
                       <h3 class="text-h6 font-weight-bold">{{ category.name }}</h3>
                       <p v-if="category.description" class="text-caption text-medium-emphasis mb-0">{{ category.description }}</p>
                    </div>
                 </div>
                 <div class="ml-auto" v-if="mode === 'facilities'">
                     <VTooltip v-if="!normalizedPerms.can_create" location="top" text="Not allowed in your current plan">
                        <template #activator="{ props }">
                            <div v-bind="props">
                                <VBtn variant="tonal" size="small" prepend-icon="tabler-lock" disabled>Add Item</VBtn>
                            </div>
                        </template>
                     </VTooltip>
                    <VBtn 
                      v-else
                      variant="tonal" 
                      size="small" 
                      prepend-icon="tabler-plus"
                      @click="openFacilityDrawer(category)"
                    >
                      Add Item
                    </VBtn>
                 </div>
             </div>

             <!-- Facilities List (Always Cards) -->
             <div v-if="category.items && category.items.length > 0">
                 <VRow>
                    <VCol v-for="item in category.items" :key="item.id" cols="12" sm="6" md="4" lg="3">
                       <VCard class="facility-card h-100 border" elevation="0">
                          <VCardText class="pa-4 d-flex flex-column h-100">
                             
                             <!-- Title & Status -->
                             <div class="d-flex justify-space-between align-start mb-2">
                                <h4 class="text-subtitle-1 font-weight-bold text-high-emphasis text-truncate">{{ item.name }}</h4>
                                <VChip 
                                   size="x-small" 
                                   :color="item.is_active ? 'success' : 'error'" 
                                   variant="tonal"
                                   label
                                   class="font-weight-bold"
                                >
                                   {{ item.is_active ? 'Enabled' : 'Disabled' }}
                                </VChip>
                             </div>

                             <!-- Price Info -->
                             <div class="price-info mb-3">
                                 <div class="d-flex align-center gap-2 text-body-2 font-weight-medium text-primary bg-primary-lighten-5 pa-2 rounded-lg" style="width: fit-content;">
                                    <span>₹{{ item.price }}</span>
                                    <span class="text-disabled">•</span>
                                    <span v-if="item.duration">{{ item.duration }} min</span>
                                    <span v-if="item.duration" class="text-disabled">•</span>
                                    <span class="text-capitalize">{{ (item.billing_unit || '').toLowerCase().replace('_', ' ') }}</span>
                                 </div>
                             </div>

                             <!-- Description -->
                             <p v-if="item.description" class="text-caption text-medium-emphasis line-clamp-2 mb-4 flex-grow-1">
                                {{ item.description }}
                             </p>
                             <div v-else class="flex-grow-1"></div>

                             <!-- Actions -->
                             <div class="d-flex gap-2 pt-3 border-t mt-auto" v-if="mode === 'facilities'">
                                <template v-if="normalizedPerms.can_edit">
                                    <VBtn
                                       block
                                       variant="tonal"
                                       color="primary"
                                       size="small"
                                       prepend-icon="tabler-pencil"
                                       @click="openFacilityDrawer(category, item)"
                                    >
                                       Edit
                                    </VBtn>
                                </template>
                                <template v-else>
                                    <VBtn block variant="tonal" color="medium-emphasis" size="small" prepend-icon="tabler-lock" disabled>Edit</VBtn>
                                </template>

                                <template v-if="normalizedPerms.can_delete">
                                    <VBtn
                                       icon="tabler-trash"
                                       variant="text"
                                       color="error"
                                       size="small"
                                       class="ml-auto"
                                       @click="deleteFacility(item)"
                                    />
                                </template>
                                <template v-else>
                                    <VBtn icon="tabler-lock" variant="text" color="medium-emphasis" size="small" class="ml-auto" disabled />
                                </template>
                             </div>
                          </VCardText>
                       </VCard>
                    </VCol>
                 </VRow>
             </div>
                          <div v-else class="text-center py-6 bg-surface-variant-light rounded-lg border-dashed">
                  <p class="text-caption text-disabled font-italic mb-2">No facilities in this category</p>
                  
                  <div v-if="mode === 'facilities'">
                      <VBtn v-if="normalizedPerms.can_create" variant="text" size="small" color="primary" @click="openFacilityDrawer(category)">
                        + Add Item
                      </VBtn>
                      <VBtn v-else variant="text" size="small" color="medium-emphasis" prepend-icon="tabler-lock" disabled>
                         Add Item
                      </VBtn>
                  </div>
              </div>
          </div>
       </div>
    </template>
    
    <div v-else class="text-center py-12 bg-light rounded-lg border-dashed">
       <VIcon icon="tabler-category" size="48" color="medium-emphasis" class="mb-4" />
       <h3 class="text-h6 font-weight-bold mb-2">Service Structure Empty</h3>
       <p class="text-body-2 text-medium-emphasis mb-6">Start by adding a category to organize your facilities.</p>
       <VBtn v-if="permissions.canCreate" variant="tonal" color="primary" @click="openCategoryDrawer()">
          Create First Category
       </VBtn>
    </div>

    <!-- Category Drawer -->
    <VNavigationDrawer
       v-model="categoryDrawerOpen"
       location="end"
       temporary
       width="400"
       class="builder-drawer"
    >
       <div class="drawer-container">
          <div class="drawer-header bg-surface">
             <h3 class="text-h6 font-weight-bold">{{ isEdit ? 'Edit Category' : 'New Category' }}</h3>
             <VBtn icon="tabler-x" variant="text" @click="categoryDrawerOpen = false" />
          </div>
          <div class="drawer-body">
             <VForm @submit.prevent="submitCategory">
                <AppTextField
                  v-model="categoryForm.name"
                  label="Category Name *"
                  placeholder="e.g. Grooming"
                  class="mb-4"
                  required
                />
                <AppTextarea
                  v-model="categoryForm.description"
                  label="Description"
                  rows="3"
                  class="mb-4"
                />
                <VSwitch
                  v-model="categoryForm.is_active"
                  label="Active"
                  color="success"
                />
                <VBtn block color="primary" type="submit" class="mt-6" :loading="submitting">
                   {{ isEdit ? 'Update Category' : 'Create Category' }}
                </VBtn>
             </VForm>
          </div>
       </div>
    </VNavigationDrawer>

    <!-- Facility Drawer -->
    <VNavigationDrawer
       v-model="facilityDrawerOpen"
       location="end"
       temporary
       width="450"
       class="builder-drawer"
    >
       <div class="drawer-container">
          <div class="drawer-header bg-surface">
             <h3 class="text-h6 font-weight-bold">{{ isEdit ? 'Edit Item' : 'New Item' }}</h3>
             <VBtn icon="tabler-x" variant="text" @click="facilityDrawerOpen = false" />
          </div>
          <div class="drawer-body">
             <VForm @submit.prevent="submitFacility">
                <VCard variant="tonal" color="primary" class="pa-4 mb-4 border-0">
                   <h4 class="text-subtitle-2 font-weight-bold mb-3">Facility Details</h4>
                   <AppTextField
                     v-model="facilityForm.name"
                     label="Name *"
                     placeholder="e.g. Deluxe Suite"
                     class="mb-3"
                     required
                   />
                   <AppTextarea
                     v-model="facilityForm.description"
                     label="Description"
                     rows="2"
                     placeholder="Brief description..."
                   />
                </VCard>

                <VCard variant="tonal" color="secondary" class="pa-4 mb-4 border-0">
                   <h4 class="text-subtitle-2 font-weight-bold mb-3">Pricing</h4>
                   <VSelect
                     v-model="facilityForm.billing_unit"
                     :items="billingUnitOptions"
                     item-title="label"
                     item-value="value"
                     label="Billing Type *"
                     class="mb-3"
                   />
                   <div class="d-flex gap-3">
                      <AppTextField
                        v-model.number="facilityForm.base_price"
                        label="Price ($) *"
                        type="number"
                        class="flex-grow-1"
                        required
                      />
                      <AppTextField
                        v-if="['PER_SESSION', 'HOURLY'].includes(facilityForm.billing_unit)"
                        v-model.number="facilityForm.duration_minutes"
                        label="Duration (min)"
                        type="number"
                        class="flex-grow-1"
                      />
                   </div>
                </VCard>

                <VSwitch
                  v-model="facilityForm.is_active"
                  label="Active Status"
                  color="success"
                  class="mb-4"
                />

                <VBtn block color="primary" type="submit" :loading="submitting">
                   {{ isEdit ? 'Update Item' : 'Create Item' }}
                </VBtn>
             </VForm>
          </div>
       </div>
    </VNavigationDrawer>


     <!-- Permission Denied Dialog -->
    <VDialog v-model="showPermissionDialog" max-width="450">
        <VCard>
            <VCardText class="text-center pa-8">
                <VAvatar color="error" variant="tonal" size="64" class="mb-4">
                    <VIcon icon="tabler-lock" size="32" />
                </VAvatar>
                <h3 class="text-h5 font-weight-bold mb-2">Permission Denied</h3>
                <p class="text-body-1 text-medium-emphasis mb-6">
                    Your current plan does not allow you to <strong>{{ permissionDeniedAction }}</strong>.
                    <br>Only <strong>View</strong> and <strong>Create</strong> (Category) actions are allowed in your tier.
                </p>
                <div class="d-flex justify-center gap-3">
                    <VBtn variant="text" color="secondary" @click="showPermissionDialog = false">Close</VBtn>
                    <VBtn color="primary" :to="{ name: 'provider-providerhome', hash: '#plans' }">Upgrade Plan</VBtn>
                </div>
            </VCardText>
        </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.premium-search-v2 {
  :deep(.v-field) {
    border-radius: 12px;
    background: rgba(var(--v-theme-surface), 0.8);
    transition: all 0.3s;
  }
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

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-switch {
  :deep(.v-selection-control) {
    min-height: 24px !important;
  }
}

.drawer-container {
  display: flex !important;
  flex-direction: column !important;
  height: 100vh !important;
}

.drawer-header {
  flex-shrink: 0;
  padding: 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-body {
  flex: 1;
  overflow-y: auto !important;
  padding: 24px;
  /* Ensure padding bottom exists so contents aren't flush with edge */
  padding-bottom: 40px; 
}
</style>
