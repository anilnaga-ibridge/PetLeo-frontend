<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { providerApi } from '@/plugins/axios'
import { useCookie } from '@/@core/composable/useCookie'

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
const showPermissions = ref(false) // Default collapsed
const permissionDeniedAction = ref('')

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())

const isAdmin = computed(() => {
  const adminRoles = ['organization', 'individual', 'organization_provider', 'organization_admin', 'super_admin', 'provider']
  
  return adminRoles.includes(userRole.value)
})

const normalizedPerms = computed(() => ({
  can_create: isAdmin.value || !!(props.permissions.can_create || props.permissions.canCreate),
  can_edit: isAdmin.value || !!(props.permissions.can_edit || props.permissions.canEdit),
  can_delete: isAdmin.value || !!(props.permissions.can_delete || props.permissions.canDelete),
  can_view: !!(props.permissions.can_view || props.permissions.canView || true),
}))

const showPermissionDialog = ref(false)

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
        id: (typeof rule.facility === 'object' && rule.facility) ? rule.facility.id : rule.facility,
        ruleId: rule.id,
        name: rule.facility_name || (typeof rule.facility === 'object' ? rule.facility.name : 'Unknown Facility'),
        description: rule.facility_description || (typeof rule.facility === 'object' ? rule.facility.description : ''),
        price: rule.price,
        duration: rule.duration,
        billing_unit: rule.billing_unit,
        is_active: rule.is_active,
        can_edit: rule.can_edit,
        can_delete: rule.can_delete
      }))
    }
  })

  // Uncategorized Rules
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
        name: rule.facility_name,
        description: rule.facility_description,
        price: rule.price,
        billing_unit: rule.billing_unit,
        duration: rule.duration,
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
  if (!confirm('Delete this category?')) return
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
    editId.value = item.id
    facilityForm.value = {
      name: item.name,
      description: item.description,
      service: props.serviceId,
      category: category.id === 'uncategorized' ? null : category.id,
      base_price: item.price,
      duration_minutes: item.duration,
      billing_unit: item.billing_unit,
      is_active: item.is_active,
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
    const payload = { ...facilityForm.value }
    
    // We update Price Rule mostly
    if (isEdit.value && payload.ruleId) {
       await providerApi.put(`/api/provider/facilities/${editId.value}/`, {
         name: payload.name, description: payload.description,
         service: payload.service, category: payload.category
       })
       await providerApi.put(`/api/provider/pricing/${payload.ruleId}/`, {
         service_id: payload.service, category_id: payload.category,
         facility: editId.value, price: payload.base_price,
         billing_unit: payload.billing_unit,
         duration: payload.duration_minutes,
         is_active: payload.is_active,
         description: payload.description
       })
    } else {
       const facRes = await providerApi.post('/api/provider/facilities/', {
         name: payload.name, description: payload.description,
         service: payload.service, category: payload.category
       })
       await providerApi.post('/api/provider/pricing/', {
         service_id: payload.service, category_id: payload.category,
         facility: facRes.data.id, price: payload.base_price,
         billing_unit: payload.billing_unit,
         duration: payload.duration_minutes,
         is_active: payload.is_active,
         description: payload.description
       })
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
    if (item.ruleId) await providerApi.delete(`/api/provider/pricing/${item.ruleId}/`)
    if (item.id) await providerApi.delete(`/api/provider/facilities/${item.id}/`)
    fetchData()
  } catch (err) {
    console.error('Failed to delete item:', err)
  }
}

onMounted(fetchData)
watch(() => props.serviceId, fetchData)
</script>

<template>
  <div class="d-flex flex-column h-100">
    <!-- 1. Permissions Card (Collapsible) -->
    <VCard 
      class="mb-6 border overflow-hidden" 
      elevation="0" 
      v-if="mode === 'categories'"
      variant="flat"
      color="surface"
    >
      <div 
        @click="showPermissions = !showPermissions" 
        class="cursor-pointer py-3 px-5 d-flex align-center justify-space-between bg-var-theme-background"
        style="transition: background 0.2s"
        v-ripple
      >
        <div class="d-flex align-center gap-3">
            <VAvatar color="primary" variant="tonal" size="36">
                <VIcon icon="tabler-shield-lock" size="20" />
            </VAvatar>
            <div>
                 <div class="text-subtitle-1 font-weight-bold">Plan Permissions</div>
                 <div class="text-caption text-medium-emphasis">View your access level</div>
            </div>
        </div>
        <div class="d-flex align-center gap-2">
           <VIcon :icon="showPermissions ? 'tabler-chevron-up' : 'tabler-chevron-down'" size="20" class="text-medium-emphasis" />
        </div>
      </div>
      
      <VExpandTransition>
        <div v-show="showPermissions">
          <VDivider />
            <div class="d-flex flex-wrap gap-4 pa-5 bg-grey-lighten-5">
              <div v-for="row in permissionMatrix" :key="row.entity" class="bg-surface border rounded-lg px-4 py-3 flex-grow-1" style="min-width: 200px">
                  <div class="text-caption font-weight-bold text-uppercase mb-2 text-medium-emphasis">{{ row.entity }}</div>
                  <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center gap-1" :class="row.create ? 'text-success' : 'text-medium-emphasis'">
                         <VIcon :icon="row.create ? 'tabler-circle-check-filled' : 'tabler-circle-x'" size="16" />
                         <span class="text-caption font-weight-medium">Create</span>
                      </div>
                      <div class="d-flex align-center gap-1" :class="row.edit ? 'text-success' : 'text-medium-emphasis'">
                         <VIcon :icon="row.edit ? 'tabler-circle-check-filled' : 'tabler-circle-x'" size="16" />
                         <span class="text-caption font-weight-medium">Edit</span>
                      </div>
                      <div class="d-flex align-center gap-1" :class="row.delete ? 'text-success' : 'text-medium-emphasis'">
                         <VIcon :icon="row.delete ? 'tabler-circle-check-filled' : 'tabler-circle-x'" size="16" />
                         <span class="text-caption font-weight-medium">Delete</span>
                      </div>
                  </div>
              </div>
            </div>
        </div>
      </VExpandTransition>
    </VCard>

    <!-- 2. Toolbar & Search -->
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
       <!-- Search -->
       <div style="flex: 1; min-width: 280px; max-width: 500px;">
        <VTextField
          v-model="searchQuery"
          placeholder="Search categories & facilities..."
          prepend-inner-icon="tabler-search"
          density="comfortable"
          variant="outlined"
          hide-details
          class="rounded-lg bg-surface"
        >
        </VTextField>
      </div>

       <!-- Actions -->
       <div class="d-flex align-center gap-3">
          <VBtnToggle
            v-if="mode !== 'categories'"
            v-model="viewMode"
            mandatory
            density="comfortable"
            color="primary"
            variant="outlined"
            class="rounded-lg"
          >
            <VBtn value="card" icon="tabler-layout-grid" />
            <VBtn value="table" icon="tabler-list" />
          </VBtnToggle>
          
          <VDivider v-if="mode !== 'categories'" vertical class="mx-1" />

          <div v-if="mode === 'categories'">
               <VBtn
                v-if="normalizedPerms.can_create"
                color="primary"
                prepend-icon="tabler-plus"
                height="44"
                class="px-6"
                @click="openCategoryDrawer()"
              >
                Add Category
              </VBtn>
               <VBtn v-else disabled color="medium-emphasis" prepend-icon="tabler-lock">Add Category</VBtn>
          </div>
       </div>
    </div>

    <!-- 3. Content Area -->
    <div v-if="loading" class="d-flex justify-center align-center py-12 flex-grow-1">
       <VProgressCircular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="hierarchy.length > 0">
       
       <!-- MODE: Categories (Grid) -->
       <div v-if="mode === 'categories'">
          <VRow>
             <VCol v-for="category in hierarchy" :key="category.id" cols="12" sm="6" md="4" lg="3">
                <VCard 
                  class="h-100 d-flex flex-column hover-card border"
                  elevation="0" 
                  @click="normalizedPerms.can_edit ? openCategoryDrawer(category) : null"
                >
                   <VCardItem class="items-start">
                      <template #prepend>
                         <VAvatar color="primary" variant="tonal" rounded="lg">
                            <VIcon icon="tabler-category" />
                         </VAvatar>
                      </template>
                      <template #append>
                         <VChip size="x-small" :color="category.is_active ? 'success' : 'secondary'">
                            {{ category.is_active ? 'Active' : 'Inactive' }}
                         </VChip>
                      </template>
                      <VCardTitle class="mt-1">{{ category.name }}</VCardTitle>
                      <VCardSubtitle class="line-clamp-2 mt-1">{{ category.description || 'No description' }}</VCardSubtitle>
                   </VCardItem>
                   
                   <VCardText class="d-flex align-end mt-auto pt-2">
                       <span class="text-caption text-medium-emphasis bg-grey-lighten-4 px-2 py-1 rounded">
                         {{ category.items?.length || 0 }} Facilities
                       </span>
                       <VSpacer />
                       <!-- Actions on Hover -->
                       <div class="hover-actions d-flex gap-1" v-if="normalizedPerms.can_delete">
                          <VBtn 
                            icon="tabler-trash" 
                            variant="text" 
                            size="x-small" 
                            color="error" 
                            @click.stop="deleteCategory(category.id)" 
                          />
                       </div>
                   </VCardText>
                </VCard>
             </VCol>
          </VRow>
       </div>

       <!-- MODE: Facilities / Summary -->
       <div v-else class="d-flex flex-column gap-6">
          <div v-for="category in hierarchy" :key="category.id">
             <!-- Section Header -->
             <div class="d-flex align-center justify-space-between mb-4 mt-2">
                <div class="d-flex align-center gap-3">
                   <div class="bg-primary-lighten-5 pa-2 rounded-lg text-primary">
                      <VIcon icon="tabler-category" size="20" />
                   </div>
                   <div>
                      <h4 class="text-h6 font-weight-bold">{{ category.name }}</h4>
                      <div class="text-caption text-medium-emphasis">{{ category.items?.length || 0 }} Items available</div>
                   </div>
                </div>
                <!-- Action for Facility Create -->
                <div v-if="mode === 'facilities'">
                   <VBtn 
                      v-if="normalizedPerms.can_create"
                      variant="text" 
                      color="primary" 
                      prepend-icon="tabler-plus"
                      @click="openFacilityDrawer(category)"
                    >
                      New Item
                    </VBtn>
                </div>
             </div>

             <!-- Items Grid -->
             <div v-if="category.items && category.items.length > 0">
                <VRow>
                   <VCol v-for="item in category.items" :key="item.id" cols="12" sm="6" md="4" lg="3">
                      <VCard class="border h-100 d-flex flex-column hover-card-v2" elevation="0">
                          <div class="pa-4 flex-grow-1">
                             <div class="d-flex justify-space-between align-start mb-2">
                                <h5 class="text-subtitle-1 font-weight-bold">{{ item.name }}</h5>
                                <div class="d-flex gap-1 align-center hover-actions">
                                  <VIcon 
                                    v-if="mode === 'facilities' && normalizedPerms.can_edit"
                                    icon="tabler-pencil" 
                                    size="16" 
                                    class="text-medium-emphasis cursor-pointer edit-icon"
                                    @click="openFacilityDrawer(category, item)" 
                                  />
                                  <VIcon 
                                    v-if="mode === 'facilities' && normalizedPerms.can_delete"
                                    icon="tabler-trash" 
                                    size="16" 
                                    class="text-error cursor-pointer delete-icon"
                                    @click="deleteFacility(item)" 
                                  />
                                </div>
                             </div>
                             
                             <p class="text-body-2 text-medium-emphasis line-clamp-2 mb-3" style="min-height: 40px;">
                                {{ item.description || 'No description provided.' }}
                             </p>
                             
                             <div class="d-flex align-center gap-2 mt-auto">
                                <VChip color="primary" variant="flat" size="small" class="font-weight-bold">
                                   ${{ item.price }}
                                </VChip>
                                <span class="text-caption text-medium-emphasis">
                                   per {{ String(item.billing_unit || '').replace('_', ' ').toLowerCase() }}
                                </span>
                             </div>
                          </div>
                      </VCard>
                   </VCol>
                </VRow>
             </div>
             <div v-else class="text-center py-6 border-dashed rounded-lg bg-grey-lighten-5">
                 <span class="text-medium-emphasis text-body-2">No facilities yet.</span>
                 <VBtn 
                   v-if="mode === 'facilities' && normalizedPerms.can_create"
                   variant="text" 
                   size="small" 
                   color="primary" 
                   class="ms-2"
                   @click="openFacilityDrawer(category)"
                 >
                   Add One
                 </VBtn>
             </div>
          </div>
       </div>

    </template>
    
    <div v-else class="text-center py-12 flex-grow-1 d-flex flex-column align-center justify-center">
        <VAvatar color="secondary" variant="tonal" size="64" class="mb-4">
           <VIcon icon="tabler-layout-grid-add" size="32" />
        </VAvatar>
        <h3 class="text-h6 font-weight-bold">No Categories Configured</h3>
        <p class="text-medium-emphasis mb-6">Create your first category to start adding facilities.</p>
        <VBtn v-if="normalizedPerms.can_create" color="primary" @click="openCategoryDrawer()">
           Create Category
        </VBtn>
    </div>

    <!-- Category Drawer -->
    <VNavigationDrawer v-model="categoryDrawerOpen" location="end" temporary width="400">
       <div class="d-flex flex-column h-100">
          <div class="pa-4 border-b d-flex align-center justify-space-between bg-surface">
             <h3 class="text-h6 font-weight-bold">{{ isEdit ? 'Edit Category' : 'New Category' }}</h3>
             <VBtn icon="tabler-x" variant="text" density="compact" @click="categoryDrawerOpen = false" />
          </div>
          <div class="pa-4 flex-grow-1 overflow-y-auto">
             <VForm @submit.prevent="submitCategory">
                <AppTextField
                  v-model="categoryForm.name"
                  label="Category Name *"
                  placeholder="e.g. Grooming"
                  class="mb-4"
                  :rules="[v => !!v || 'Required']"
                />
                <AppTextarea
                  v-model="categoryForm.description"
                  label="Description"
                  placeholder="Describe this category..."
                  rows="3"
                  class="mb-4"
                />
                <VSwitch v-model="categoryForm.is_active" label="Enabled" color="success" />
                
                <VBtn block color="primary" type="submit" class="mt-6" :loading="submitting" size="large">
                   {{ isEdit ? 'Save Changes' : 'Create Category' }}
                </VBtn>

                <VBtn 
                  v-if="isEdit && normalizedPerms.can_delete" 
                  block variant="text" color="error" class="mt-2" 
                  @click="deleteCategory(editId); categoryDrawerOpen=false;"
                >
                   Delete Category
                </VBtn>
             </VForm>
          </div>
       </div>
    </VNavigationDrawer>

    <!-- Facility Drawer -->
    <VNavigationDrawer v-model="facilityDrawerOpen" location="end" temporary width="450">
       <div class="d-flex flex-column h-100">
          <div class="pa-4 border-b d-flex align-center justify-space-between bg-surface">
             <h3 class="text-h6 font-weight-bold">{{ isEdit ? 'Edit Facility' : 'New Facility' }}</h3>
             <VBtn icon="tabler-x" variant="text" density="compact" @click="facilityDrawerOpen = false" />
          </div>
          <div class="pa-4 flex-grow-1 overflow-y-auto">
             <VForm @submit.prevent="submitFacility">
                <!-- Facility Info -->
                <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis text-uppercase">Facility Details</div>
                <AppTextField
                  v-model="facilityForm.name"
                  label="Name *"
                  placeholder="e.g. Deluxe Suite"
                  class="mb-4"
                  :rules="[v => !!v || 'Required']"
                />
                <AppTextarea
                  v-model="facilityForm.description"
                  label="Description"
                  rows="2"
                  class="mb-6"
                />

                <VDivider class="mb-6" />

                <!-- Pricing Info -->
                <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis text-uppercase">Pricing Configuration</div>
                <VRow>
                   <VCol cols="12">
                      <VSelect
                        v-model="facilityForm.billing_unit"
                        :items="billingUnitOptions"
                        item-title="label"
                        item-value="value"
                        label="Billing Type *"
                      />
                   </VCol>
                   <VCol cols="6">
                      <AppTextField
                        v-model.number="facilityForm.base_price"
                        label="Price ($) *"
                        type="number"
                      />
                   </VCol>
                   <VCol cols="6" v-if="['PER_SESSION', 'HOURLY'].includes(facilityForm.billing_unit)">
                      <AppTextField
                        v-model.number="facilityForm.duration_minutes"
                        label="Duration (min)"
                        type="number"
                      />
                   </VCol>
                </VRow>

                <div class="mt-4">
                  <VSwitch v-model="facilityForm.is_active" label="Available for Booking" color="success" />
                </div>

                <div class="mt-auto pt-6">
                   <VBtn block color="primary" type="submit" size="large" :loading="submitting">
                      {{ isEdit ? 'Save Changes' : 'Create Item' }}
                   </VBtn>
                   <VBtn 
                      v-if="isEdit && facilityForm.ruleId && normalizedPerms.can_delete" 
                      block variant="text" color="error" class="mt-2"
                      @click="deleteFacility({ ruleId: facilityForm.ruleId }); facilityDrawerOpen=false;" 
                    >
                      Delete Item
                   </VBtn>
                </div>
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

.hover-card, .hover-card-v2 {
  transition: all 0.2s ease-in-out;
  border-radius: 12px !important;
  
  .hover-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(var(--v-theme-primary), 0.3) !important;
    box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15) !important;
    
    .hover-actions {
      opacity: 1;
    }
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
