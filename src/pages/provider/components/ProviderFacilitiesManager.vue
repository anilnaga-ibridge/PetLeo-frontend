<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { providerApi } from '@/plugins/axios'
import { useCookie } from '@/@core/composable/useCookie'

const props = defineProps({
  serviceId: {
    type: String,
    required: true,
  },
  permissions: {
    type: Object,
    default: () => ({
      can_create: false,
      can_edit: false,
      can_delete: false,
    }),
  },
  mode: {
    type: String,
    default: 'facilities', // 'categories', 'facilities', 'summary'
    validator: v => ['categories', 'facilities', 'summary'].includes(v),
  },
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

const normalizedPerms = computed(() => {
  if (isAdmin.value) {
    return {
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_view: true,
    }
  }
  
  return {
    can_create: !!props.permissions?.can_create,
    can_edit: !!props.permissions?.can_edit,
    can_delete: !!props.permissions?.can_delete,
    can_view: true,
  }
})

const showPermissionDialog = ref(false)

const permissionMatrix = computed(() => [
  { entity: 'Category', create: normalizedPerms.value.can_create, edit: normalizedPerms.value.can_edit, delete: normalizedPerms.value.can_delete },
  { entity: 'Facility', create: normalizedPerms.value.can_create, edit: normalizedPerms.value.can_edit, delete: normalizedPerms.value.can_delete },
  { entity: 'Price',    create: normalizedPerms.value.can_create, edit: normalizedPerms.value.can_edit, delete: normalizedPerms.value.can_delete },
])

const handleRestrictedAction = action => {
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
  is_active: true,
})

const facilityForm = ref({
  name: '',
  description: '',
  service: props.serviceId,
  category: null,
  protocol_type: 'MINUTES_BASED',
  pricing_strategy: 'FIXED',
  base_price: 0,
  duration_minutes: 60,
  session_duration_value: 1, // Intermediate value for UI
  session_duration_unit: 'hours', // 'minutes' or 'hours'
  duration_value: null, // For SESSIONS (e.g. 10 sessions)
  daily_capacity: null,
  monthly_limit: null,
  billing_unit: 'PER_SESSION',
  is_active: true,
  image_file: null, // Primary image
  imageUrl: null,
  gallery_files: [], // Multi-image gallery
  galleryUrls: [],
})

const billingUnitOptions = [
  { label: 'Per Session', value: 'PER_SESSION' },
  { label: 'Per Hour', value: 'HOURLY' },
  { label: 'Per Day', value: 'DAILY' },
  { label: 'Per Week', value: 'WEEKLY' },
  { label: 'One Time', value: 'ONE_TIME' },
]

const protocolOptions = [
  { label: 'Minutes Based (Slots)', value: 'MINUTES_BASED' },
  { label: 'Session Based (Packages)', value: 'SESSION_BASED' },
  { label: 'Day Based (Date Range)', value: 'DAY_BASED' },
]

const strategyOptions = [
  { label: 'Fixed Total Price', value: 'FIXED' },
  { label: 'Per Unit (Min/Hr/Day)', value: 'PER_UNIT' },
]

// Image Preview Helpers
const handleImageUpload = file => {
  if (!file || (Array.isArray(file) && file.length === 0)) return
  try {
    const actualFile = Array.isArray(file) ? file[0] : file
    if (actualFile) {
      facilityForm.value.imageUrl = window.URL.createObjectURL(actualFile)
    }
  } catch (err) {
    console.error('Error creating preview:', err)
  }
}

const handleGalleryUpload = files => {
  if (!files || files.length === 0) return
  try {
    const actualFiles = Array.isArray(files) ? files : Array.from(files)

    actualFiles.forEach(f => {
      facilityForm.value.galleryUrls.push(window.URL.createObjectURL(f))
      facilityForm.value.gallery_files.push(f)
    })
  } catch (err) {
    console.error('Error creating gallery previews:', err)
  }
}

const removeGalleryImage = idx => {
  facilityForm.value.galleryUrls.splice(idx, 1)
  facilityForm.value.gallery_files.splice(idx, 1)
}

// Fetch Data
const fetchData = async () => {
  if (!props.serviceId) return
  loading.value = true
  try {
    const [catRes, priceRes] = await Promise.all([
      providerApi.get(`/api/provider/categories/?service=${props.serviceId}`),
      providerApi.get(`/api/provider/pricing/?service=${props.serviceId}`),
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

  const getCategoryId = rule => {
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
        description: (rule.description && rule.description !== 'null') ? rule.description : (rule.facility_description && rule.facility_description !== 'null') ? rule.facility_description : (typeof rule.facility === 'object' ? rule.facility.description : ''),
        price: rule.price,
        duration: (rule.duration !== null && rule.duration !== undefined && rule.duration !== 'null') ? rule.duration : (rule.duration_minutes !== null && rule.duration_minutes !== undefined && rule.duration_minutes !== 'null') ? rule.duration_minutes : 60,
        billing_unit: rule.billing_unit,
        protocol_type: rule.service_duration_type === 'SESSIONS' ? 'SESSION_BASED' : rule.service_duration_type === 'DAYS' ? 'DAY_BASED' : 'MINUTES_BASED',
        pricing_strategy: rule.pricing_model,
        duration_value: rule.duration_value,
        daily_capacity: rule.daily_capacity,
        monthly_limit: rule.monthly_limit,
        is_active: rule.is_active,
        image_url: rule.facility_image_url || rule.facility?.image_url || rule.facility?.image || null, // Capture image URL
        gallery: rule.facility_gallery || rule.facility?.gallery || [],
        can_edit: rule.can_edit,
        can_delete: rule.can_delete,
      })),
    }
  })

  // Uncategorized Rules
  const leftoverRules = pricingRules.value.filter(rule => 
    !processedRuleIds.has(rule.id) && rule.facility,
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
        description: (rule.description && rule.description !== 'null') ? rule.description : (rule.facility_description && rule.facility_description !== 'null') ? rule.facility_description : '',
        price: rule.price,
        billing_unit: rule.billing_unit,
        duration: (rule.duration !== null && rule.duration !== undefined && rule.duration !== 'null') ? rule.duration : (rule.duration_minutes !== null && rule.duration_minutes !== undefined && rule.duration_minutes !== 'null') ? rule.duration_minutes : 60,
        protocol_type: rule.service_duration_type === 'SESSIONS' ? 'SESSION_BASED' : rule.service_duration_type === 'DAYS' ? 'DAY_BASED' : 'MINUTES_BASED',
        pricing_strategy: rule.pricing_model,
        duration_value: rule.duration_value,
        daily_capacity: rule.daily_capacity,
        monthly_limit: rule.monthly_limit,
        is_active: rule.is_active,
        image_url: rule.facility_image_url || rule.facility?.image_url || rule.facility?.image || null,
        gallery: rule.facility_gallery || rule.facility?.gallery || [],
        can_edit: rule.can_edit,
        can_delete: rule.can_delete,
      })),
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
      is_active: category.is_active,
    }
  } else {
    isEdit.value = false
    categoryForm.value = {
      name: '',
      description: '',
      service_id: props.serviceId,
      is_active: true,
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

const deleteCategory = async id => {
  if (!confirm('Delete this category?')) return
  try {
    await providerApi.delete(`/api/provider/categories/${id}/`)
    fetchData()
  } catch (err) {
    console.error('Failed to delete category:', err)
  }
}

const toggleCategoryStatus = async category => {
  try {
    await providerApi.patch(`/api/provider/categories/${category.id}/`, {
      is_active: category.is_active,
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
    
    // Split duration_minutes for UI
    let durationValue = item.duration || 60
    let durationUnit = 'minutes'
    if (durationValue % 60 === 0 && durationValue >= 60) {
      durationValue = durationValue / 60
      durationUnit = 'hours'
    }

    facilityForm.value = {
      name: item.name,
      description: item.description,
      service: props.serviceId,
      category: category.id === 'uncategorized' ? null : category.id,
      protocol_type: item.protocol_type || 'MINUTES_BASED',
      pricing_strategy: item.pricing_strategy || 'FIXED',
      base_price: item.price,
      duration_minutes: item.duration,
      session_duration_value: durationValue,
      session_duration_unit: durationUnit,
      billing_unit: item.billing_unit,
      duration_value: item.duration_value,
      daily_capacity: item.daily_capacity,
      monthly_limit: item.monthly_limit,
      is_active: item.is_active,
      ruleId: item.ruleId,
      image_file: null,
      imageUrl: item.image_url, // Primary image
      galleryUrls: item.gallery?.map(g => g.image_url) || [],
      gallery_files: [],
    }
  } else {
    isEdit.value = false
    facilityForm.value = {
      name: '',
      description: '',
      service: props.serviceId,
      category: category.id === 'uncategorized' ? null : category.id,
      protocol_type: 'MINUTES_BASED',
      pricing_strategy: 'FIXED',
      base_price: 0,
      duration_minutes: 60,
      session_duration_value: 1,
      session_duration_unit: 'hours',
      duration_value: null,
      daily_capacity: null,
      monthly_limit: null,
      billing_unit: 'PER_SESSION',
      is_active: true,
      image_file: null,
      imageUrl: null,
      gallery_files: [],
      galleryUrls: [],
    }
  }
  facilityDrawerOpen.value = true
}

const submitFacility = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    const finalDuration = facilityForm.value.session_duration_unit === 'hours' 
      ? (facilityForm.value.session_duration_value || 0) * 60 
      : (facilityForm.value.session_duration_value || 0)

    // 1. Prepare Facility Data (Multipart)
    const facilityFormData = new FormData()

    facilityFormData.append('name', facilityForm.value.name)
    facilityFormData.append('description', facilityForm.value.description || '')
    facilityFormData.append('service', props.serviceId)
    if (facilityForm.value.category) {
      facilityFormData.append('category', facilityForm.value.category)
    }
    facilityFormData.append('protocol_type', facilityForm.value.protocol_type)
    facilityFormData.append('pricing_strategy', facilityForm.value.pricing_strategy)
    facilityFormData.append('base_price', facilityForm.value.base_price || 0)
    facilityFormData.append('duration_minutes', finalDuration)
    facilityFormData.append('is_active', facilityForm.value.is_active)
    
    if (facilityForm.value.image_file) {
      const actualImg = Array.isArray(facilityForm.value.image_file) ? facilityForm.value.image_file[0] : facilityForm.value.image_file
      if (actualImg) {
        facilityFormData.append('image', actualImg)
      }
    }

    // Gallery images
    if (facilityForm.value.gallery_files && facilityForm.value.gallery_files.length > 0) {
      const filesToAppend = Array.isArray(facilityForm.value.gallery_files[0]) 
        ? facilityForm.value.gallery_files[0] 
        : facilityForm.value.gallery_files
          
      filesToAppend.forEach(file => {
        facilityFormData.append('gallery', file)
      })
    }

    // Debug: Log the FormData contents
    console.log("=== SUBMITTING FACILITY FORMDATA ===")
    for (let pair of facilityFormData.entries()) {
      console.log(`${pair[0]}:`, pair[1])
    }
    console.log("======================================")

    let facilityId = editId.value
    if (isEdit.value && facilityId) {
      await providerApi.put(`/api/provider/facilities/${facilityId}/`, facilityFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    } else {
      const res = await providerApi.post('/api/provider/facilities/', facilityFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      facilityId = res.data.id
    }

    // 2. Prepare/Update Pricing Rule (JSON is fine here, or match if backend changed)
    const pricingData = {
      service_id: props.serviceId,
      category_id: facilityForm.value.category,
      facility: facilityId,
      price: facilityForm.value.base_price || 0,
      billing_unit: facilityForm.value.billing_unit,
      duration: finalDuration,
      service_duration_type: facilityForm.value.protocol_type === 'SESSION_BASED' ? 'SESSIONS' : facilityForm.value.protocol_type === 'DAY_BASED' ? 'DAYS' : 'MINUTES',
      pricing_model: facilityForm.value.pricing_strategy,
      duration_value: facilityForm.value.duration_value,
      daily_capacity: facilityForm.value.daily_capacity,
      monthly_limit: facilityForm.value.monthly_limit,
      is_active: facilityForm.value.is_active,
      description: facilityForm.value.description,
    }

    if (isEdit.value && facilityForm.value.ruleId) {
      await providerApi.put(`/api/provider/pricing/${facilityForm.value.ruleId}/`, pricingData)
    } else {
      await providerApi.post('/api/provider/pricing/', pricingData)
    }

    facilityDrawerOpen.value = false
    fetchData()
  } catch (err) {
    console.error('Failed to save facility:', err)
  } finally {
    submitting.value = false
  }
}

const deleteFacility = async item => {
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
  <div class="d-flex flex-column">
    <!-- 1. Permissions Card (Collapsible) -->
    <VCard 
      v-if="mode === 'categories'" 
      class="mb-6 border overflow-hidden" 
      elevation="0"
      variant="flat"
      color="surface"
    >
      <div 
        v-ripple 
        class="cursor-pointer py-3 px-5 d-flex align-center justify-space-between bg-var-theme-background"
        style="transition: background 0.2s"
        @click="showPermissions = !showPermissions"
      >
        <div class="d-flex align-center gap-3">
          <VAvatar
            color="primary"
            variant="tonal"
            size="36"
          >
            <VIcon
              icon="tabler-shield-lock"
              size="20"
            />
          </VAvatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">
              Plan Permissions
            </div>
            <div class="text-caption text-medium-emphasis">
              View your access level
            </div>
          </div>
        </div>
        <div class="d-flex align-center gap-2">
          <VIcon
            :icon="showPermissions ? 'tabler-chevron-up' : 'tabler-chevron-down'"
            size="20"
            class="text-medium-emphasis"
          />
        </div>
      </div>
      
      <VExpandTransition>
        <div v-show="showPermissions">
          <VDivider />
          <div class="d-flex flex-wrap gap-4 pa-5 bg-grey-lighten-5">
            <div
              v-for="row in permissionMatrix"
              :key="row.entity"
              class="bg-surface border rounded-lg px-4 py-3 flex-grow-1"
              style="min-width: 200px"
            >
              <div class="text-caption font-weight-bold text-uppercase mb-2 text-medium-emphasis">
                {{ row.entity }}
              </div>
              <div class="d-flex align-center justify-space-between">
                <div
                  class="d-flex align-center gap-1"
                  :class="row.create ? 'text-success' : 'text-medium-emphasis'"
                >
                  <VIcon
                    :icon="row.create ? 'tabler-circle-check-filled' : 'tabler-circle-x'"
                    size="16"
                  />
                  <span class="text-caption font-weight-medium">Create</span>
                </div>
                <div
                  class="d-flex align-center gap-1"
                  :class="row.edit ? 'text-success' : 'text-medium-emphasis'"
                >
                  <VIcon
                    :icon="row.edit ? 'tabler-circle-check-filled' : 'tabler-circle-x'"
                    size="16"
                  />
                  <span class="text-caption font-weight-medium">Edit</span>
                </div>
                <div
                  class="d-flex align-center gap-1"
                  :class="row.delete ? 'text-success' : 'text-medium-emphasis'"
                >
                  <VIcon
                    :icon="row.delete ? 'tabler-circle-check-filled' : 'tabler-circle-x'"
                    size="16"
                  />
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
        />
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
          <VBtn
            value="card"
            icon="tabler-layout-grid"
          />
          <VBtn
            value="table"
            icon="tabler-list"
          />
        </VBtnToggle>
          
        <VDivider
          v-if="mode !== 'categories'"
          vertical
          class="mx-1"
        />

        <div v-if="mode === 'categories'">
          <VBtn
            v-if="normalizedPerms.can_create"
            color="primary"
            prepend-icon="tabler-plus"
            height="44"
            class="px-6"
            @click="openCategoryDrawer"
          >
            Add Category
          </VBtn>
          <VBtn
            v-else
            disabled
            color="medium-emphasis"
            prepend-icon="tabler-lock"
          >
            Add Category
          </VBtn>
        </div>
      </div>
    </div>

    <!-- 3. Content Area -->
    <div
      v-if="loading"
      class="d-flex justify-center align-center py-12 flex-grow-1"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="48"
      />
    </div>

    <div
      v-else-if="hierarchy.length > 0"
      class="px-1"
    >
      <!-- MODE: Categories (Grid) -->
      <div v-if="mode === 'categories'">
        <VRow>
          <VCol
            v-for="category in hierarchy"
            :key="category.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <VCard 
              class="h-100 d-flex flex-column hover-card border"
              elevation="0" 
              @click="normalizedPerms.can_edit ? openCategoryDrawer(category) : null"
            >
              <VCardItem class="items-start">
                <template #prepend>
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    rounded="lg"
                  >
                    <VIcon icon="tabler-category" />
                  </VAvatar>
                </template>
                <template #append>
                  <VChip
                    size="x-small"
                    :color="category.is_active ? 'success' : 'secondary'"
                  >
                    {{ category.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                </template>
                <VCardTitle class="mt-1">
                  {{ category.name }}
                </VCardTitle>
                <VCardSubtitle class="line-clamp-2 mt-1">
                  {{ category.description || 'No description provided' }}
                </VCardSubtitle>
              </VCardItem>
                   
              <VCardText class="d-flex align-end mt-auto pt-2">
                <span class="text-caption text-medium-emphasis bg-grey-lighten-4 px-2 py-1 rounded">
                  {{ category.items?.length || 0 }} Facilities
                </span>
                <VSpacer />
                <!-- Actions on Hover -->
                <div class="hover-actions d-flex gap-1">
                  <VBtn 
                    v-if="normalizedPerms.can_edit"
                    icon="tabler-pencil" 
                    variant="text" 
                    size="x-small" 
                    color="medium-emphasis" 
                    @click.stop="openCategoryDrawer(category)" 
                  />
                  <VBtn 
                    v-if="normalizedPerms.can_delete"
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
      <div
        v-else
        class="d-flex flex-column gap-6"
      >
        <div
          v-for="category in hierarchy"
          :key="category.id"
        >
          <!-- Section Header -->
          <div class="d-flex align-center justify-space-between mb-4 mt-2">
            <div class="d-flex align-center gap-3">
              <div class="bg-primary-lighten-5 pa-2 rounded-lg text-primary">
                <VIcon
                  icon="tabler-category"
                  size="20"
                />
              </div>
              <div>
                <h4 class="text-h6 font-weight-bold">
                  {{ category.name }}
                </h4>
                <div class="text-caption text-medium-emphasis">
                  {{ category.items?.length || 0 }} Items available
                </div>
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
              <VCol
                v-for="item in category.items"
                :key="item.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <VCard
                  class="border h-100 d-flex flex-row hover-card-v2 overflow-hidden"
                  elevation="0"
                >
                  <!-- Image Section -->
                  <div
                    class="facility-image-wrapper"
                    style="width: 100px; height: 100%; border-right: 1px solid rgba(var(--v-border-color), 0.1);"
                  >
                    <VImg 
                      v-if="item.image_url" 
                      :src="item.image_url" 
                      cover 
                      height="100%" 
                      class="bg-grey-lighten-4"
                    />
                    <div
                      v-else
                      class="w-100 h-100 d-flex align-center justify-center bg-grey-lighten-4 text-disabled"
                    >
                      <VIcon
                        icon="tabler-photo-off"
                        size="24"
                      />
                    </div>
                  </div>

                  <div class="pa-4 flex-grow-1">
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div class="d-flex flex-column gap-1">
                        <h5 class="text-subtitle-1 font-weight-bold">
                          {{ item.name }}
                        </h5>
                        <VChip
                          size="x-small"
                          :color="item.protocol_type === 'SESSION_BASED' ? 'info' : 'secondary'"
                          variant="tonal"
                          class="text-uppercase"
                          style="width: fit-content;"
                        >
                          {{ item.protocol_type?.replace('_', ' ') }}
                        </VChip>
                      </div>
                      <div class="d-flex gap-1 align-center hover-actions">
                        <VIcon 
                          v-if="normalizedPerms.can_edit"
                          icon="tabler-pencil" 
                          size="16" 
                          class="text-medium-emphasis cursor-pointer edit-icon"
                          @click="openFacilityDrawer(category, item)" 
                        />
                        <VIcon 
                          v-if="normalizedPerms.can_delete"
                          icon="tabler-trash" 
                          size="16" 
                          class="text-error cursor-pointer delete-icon"
                          @click="deleteFacility(item)" 
                        />
                      </div>
                    </div>
                             
                    <p
                      class="text-caption text-medium-emphasis line-clamp-2 mb-4"
                      style="height: 32px;"
                    >
                      {{ item.description || 'No description provided' }}
                    </p>
                             
                    <div class="d-flex flex-column gap-1 mt-auto">
                      <div class="d-flex align-center gap-2">
                        <span class="text-h6 font-weight-bold text-primary">₹{{ item.price }}</span>
                        <span class="text-caption text-medium-emphasis">
                          {{ item.pricing_strategy === 'FIXED' ? '(Fixed Total)' : `/ ${String(item.billing_unit || '').replace('PER_', '').toLowerCase()}` }}
                        </span>
                      </div>
                      <div class="text-caption text-medium-emphasis d-flex align-center gap-1">
                        <VIcon
                          icon="tabler-clock"
                          size="14"
                        />
                        <span>
                          {{ (item.duration && item.duration !== 'null' && item.duration >= 60 && item.duration % 60 === 0) ? `${item.duration / 60} hour(s)` : `${(item.duration && item.duration !== 'null') ? item.duration : 60} minutes` }}
                        </span>
                      </div>
                    </div>
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </div>
          <div
            v-else
            class="text-center py-6 border-dashed rounded-lg bg-grey-lighten-5"
          >
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
    </div>
    
    <div
      v-else
      class="text-center py-12 flex-grow-1 d-flex flex-column align-center justify-center"
    >
      <VAvatar
        color="secondary"
        variant="tonal"
        size="64"
        class="mb-4"
      >
        <VIcon
          icon="tabler-layout-grid-add"
          size="32"
        />
      </VAvatar>
      <h3 class="text-h6 font-weight-bold">
        No Categories Configured
      </h3>
      <p class="text-medium-emphasis mb-6">
        Create your first category to start adding facilities.
      </p>
      <VBtn
        v-if="normalizedPerms.can_create"
        color="primary"
        @click="openCategoryDrawer"
      >
        Create Category
      </VBtn>
    </div>

    <!-- Category Drawer -->
    <VNavigationDrawer
      v-model="categoryDrawerOpen"
      location="end"
      temporary
      width="400"
    >
      <div class="d-flex flex-column h-100">
        <div class="pa-4 border-b d-flex align-center justify-space-between bg-surface">
          <h3 class="text-h6 font-weight-bold">
            {{ isEdit ? 'Edit Category' : 'New Category' }}
          </h3>
          <VBtn
            icon="tabler-x"
            variant="text"
            density="compact"
            @click="categoryDrawerOpen = false"
          />
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
            <VSwitch
              v-model="categoryForm.is_active"
              label="Enabled"
              color="success"
            />
                
            <VBtn
              block
              color="primary"
              type="submit"
              class="mt-6"
              :loading="submitting"
              size="large"
            >
              {{ isEdit ? 'Save Changes' : 'Create Category' }}
            </VBtn>

            <VBtn 
              v-if="isEdit && normalizedPerms.can_delete" 
              block
              variant="text"
              color="error"
              class="mt-2" 
              @click="deleteCategory(editId); categoryDrawerOpen=false;"
            >
              Delete Category
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
    >
      <div class="d-flex flex-column h-100">
        <div class="pa-4 border-b d-flex align-center justify-space-between bg-surface">
          <h3 class="text-h6 font-weight-bold">
            {{ isEdit ? 'Edit Facility' : 'New Facility' }}
          </h3>
          <VBtn
            icon="tabler-x"
            variant="text"
            density="compact"
            @click="facilityDrawerOpen = false"
          />
        </div>
        <div class="pa-4 flex-grow-1 overflow-y-auto">
          <VForm @submit.prevent="submitFacility">
            <!-- Facility Info -->
            <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis text-uppercase">
              Facility Details
            </div>
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
              class="mb-4"
            />

            <!-- Image Upload -->
            <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis text-uppercase">
              Service Image
            </div>
            <div class="mb-4">
              <div
                v-if="facilityForm.imageUrl"
                class="mb-3 rounded-lg overflow-hidden border-2 border-primary border-opacity-25"
                style="height: 100px; position: relative;"
              >
                <VImg
                  :src="facilityForm.imageUrl"
                  cover
                  height="100"
                />
                <div 
                  class="position-absolute d-flex gap-2" 
                  style="top: 8px; right: 8px;"
                >
                  <VBtn 
                    icon="tabler-trash" 
                    size="x-small" 
                    color="error"
                    variant="elevated"
                    elevation="2"
                    @click="facilityForm.imageUrl = null; facilityForm.image_file = null;"
                  />
                </div>
              </div>
              
              <div
                v-else
                class="upload-box mb-3 d-flex flex-column align-center justify-center cursor-pointer border-dashed rounded-lg bg-var-theme-background pa-4 text-center"
                style="min-height: 100px; border-width: 2px;"
                @click="$refs.serviceImageInput.click()"
              >
                <VAvatar
                  color="primary"
                  variant="tonal"
                  rounded="lg"
                  size="36"
                  class="mb-2"
                >
                  <VIcon 
                    icon="tabler-camera" 
                    size="18"
                  />
                </VAvatar>
                <div class="text-caption font-weight-bold text-primary">
                  Upload Primary Image
                </div>
                <input
                  ref="serviceImageInput"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="e => handleImageUpload(e.target.files[0])"
                >
              </div>
            </div>

            <!-- Gallery Images -->
            <div class="text-subtitle-2 font-weight-bold mb-3 text-medium-emphasis text-uppercase">
              Service Gallery (Additional Images)
            </div>
            <div class="mb-6">
              <div class="gallery-grid">
                <div
                  v-for="(url, idx) in facilityForm.galleryUrls"
                  :key="idx"
                  class="gallery-item rounded-lg overflow-hidden border"
                >
                  <VImg
                    :src="url"
                    cover
                    height="100%"
                    width="100%"
                  />
                  <VBtn 
                    icon="tabler-x" 
                    size="x-small" 
                    color="error" 
                    variant="elevated"
                    class="gallery-remove-btn"
                    @click="removeGalleryImage(idx)"
                  />
                </div>
                
                <div
                  class="gallery-add-box rounded-lg d-flex flex-column align-center justify-center cursor-pointer border-dashed bg-var-theme-background"
                  @click="$refs.galleryImagesInput.click()"
                >
                  <VIcon 
                    icon="tabler-plus" 
                    size="24"
                    color="medium-emphasis"
                  />
                  <span class="text-caption font-weight-medium text-medium-emphasis mt-1">Add More</span>
                  <input
                    ref="galleryImagesInput"
                    type="file"
                    multiple
                    accept="image/*"
                    hidden
                    @change="e => handleGalleryUpload(Array.from(e.target.files))"
                  >
                </div>
              </div>
            </div>

            <VDivider class="mb-6" />

            <!-- PRICING & PROTOCOL INTEGRATION -->
            <VCard
              variant="tonal"
              color="success"
              class="pa-4 mb-6 border-0"
            >
              <h4 class="text-subtitle-1 font-weight-bold mb-4 text-success">
                Booking Protocol & Pricing
              </h4>
                  
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="facilityForm.protocol_type"
                    :items="protocolOptions"
                    item-title="label"
                    item-value="value"
                    label="Duration Basis (Behavior) *"
                    class="mb-4"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="facilityForm.pricing_strategy"
                    :items="strategyOptions"
                    item-title="label"
                    item-value="value"
                    label="Pricing Strategy *"
                    class="mb-4"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                  />
                </VCol>
              </VRow>

              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model.number="facilityForm.base_price"
                    :label="facilityForm.pricing_strategy === 'FIXED' ? 'Base Price (₹) *' : 'Base Price (₹) *'"
                    type="number"
                    :hint="facilityForm.pricing_strategy === 'FIXED' ? 'This is the total price for the session' : 'Price will be multiplied by duration'"
                    persistent-hint
                    required
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                    prepend-inner-icon="tabler-currency-rupee"
                    :rules="[v => v >= 0 || 'Price cannot be negative']"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <!-- Standard Slot Duration (MINUTES based) -->
                  <AppTextField
                    v-if="['MINUTES_BASED', 'DAY_BASED'].includes(facilityForm.protocol_type) || !facilityForm.protocol_type"
                    v-model.number="facilityForm.session_duration_value"
                    :label="facilityForm.protocol_type === 'DAY_BASED' ? 'Days *' : 'Slot Duration *'"
                    type="number"
                    placeholder="e.g. 30"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                    prepend-inner-icon="tabler-clock"
                    style="flex: 2;"
                  >
                    <template
                      v-if="facilityForm.protocol_type !== 'DAY_BASED'"
                      #append-inner
                    >
                      <VSelect
                        v-model="facilityForm.session_duration_unit"
                        :items="['minutes', 'hours']"
                        density="compact"
                        variant="plain"
                        hide-details
                        style="width: 90px;"
                      />
                    </template>
                  </AppTextField>

                  <!-- Session Duration (SESSIONS/HOURS based) -->
                  <div
                    v-else-if="facilityForm.protocol_type === 'SESSION_BASED'"
                    class="d-flex align-center gap-2"
                  >
                    <AppTextField
                      v-model.number="facilityForm.session_duration_value"
                      label="Session Duration *"
                      type="number"
                      placeholder="e.g. 1"
                      density="comfortable"
                      variant="outlined"
                      bg-color="surface"
                      style="flex: 2;"
                    />
                    <VSelect
                      v-model="facilityForm.session_duration_unit"
                      :items="['minutes', 'hours']"
                      label="Unit"
                      density="comfortable"
                      variant="outlined"
                      bg-color="surface"
                      style="flex: 1;"
                      class="mt-1"
                    />
                  </div>

                  <!-- Legacy Duration Value (Total Sessions in a package) -->
                  <AppTextField
                    v-if="facilityForm.protocol_type === 'SESSION_BASED'"
                    v-model.number="facilityForm.duration_value"
                    label="Total Sessions in Package"
                    type="number"
                    placeholder="e.g. 10"
                    class="mt-4"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                    prepend-inner-icon="tabler-hash"
                    hint="Number of sessions included in this fixed price package"
                    persistent-hint
                  />

                  <!-- Billing Unit (If PER_UNIT) -->
                  <VSelect
                    v-if="facilityForm.pricing_strategy === 'PER_UNIT'"
                    v-model="facilityForm.billing_unit"
                    :items="billingUnitOptions"
                    item-title="label"
                    item-value="value"
                    label="Billing Unit *"
                    class="mt-4"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                  />
                </VCol>
              </VRow>

              <VRow class="mt-2">
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model.number="facilityForm.daily_capacity"
                    label="Daily Capacity"
                    type="number"
                    placeholder="Max per day"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                    hint="Global limit for this facility"
                    persistent-hint
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <AppTextField
                    v-model.number="facilityForm.monthly_limit"
                    label="Monthly Limit"
                    type="number"
                    placeholder="Max per month"
                    density="comfortable"
                    variant="outlined"
                    bg-color="surface"
                  />
                </VCol>
              </VRow>
            </VCard>

            <div class="mt-4">
              <VSwitch
                v-model="facilityForm.is_active"
                label="Available for Booking"
                color="success"
              />
            </div>

            <div class="mt-auto pt-6">
              <VBtn
                block
                color="primary"
                type="submit"
                size="large"
                :loading="submitting"
              >
                {{ isEdit ? 'Save Changes' : 'Create Item' }}
              </VBtn>
              <VBtn 
                v-if="isEdit && facilityForm.ruleId && normalizedPerms.can_delete" 
                block
                variant="text"
                color="error"
                class="mt-2"
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
    <VDialog
      v-model="showPermissionDialog"
      max-width="450"
    >
      <VCard>
        <VCardText class="text-center pa-8">
          <VAvatar
            color="error"
            variant="tonal"
            size="64"
            class="mb-4"
          >
            <VIcon
              icon="tabler-lock"
              size="32"
            />
          </VAvatar>
          <h3 class="text-h5 font-weight-bold mb-2">
            Permission Denied
          </h3>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Your current plan does not allow you to <strong>{{ permissionDeniedAction }}</strong>.
            <br>Only <strong>View</strong> and <strong>Create</strong> (Category) actions are allowed in your tier.
          </p>
          <div class="d-flex justify-center gap-3">
            <VBtn
              variant="text"
              color="secondary"
              @click="showPermissionDialog = false"
            >
              Close
            </VBtn>
            <VBtn
              color="primary"
              :to="{ name: 'provider-home', hash: '#plans' }"
            >
              Upgrade Plan
            </VBtn>
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

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 12px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  background-color: rgba(var(--v-theme-on-surface), 0.04);

  .gallery-remove-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
  }
}

.gallery-add-box {
  aspect-ratio: 1;
  transition: all 0.2s ease;
  border-width: 2px;
  border-color: rgba(var(--v-border-color), 0.5);

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background-color: rgba(var(--v-theme-primary), 0.05) !important;
  }
}

.upload-box {
  transition: all 0.2s ease;
  border-color: rgba(var(--v-border-color), 0.5);

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
    background-color: rgba(var(--v-theme-primary), 0.05) !important;
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
