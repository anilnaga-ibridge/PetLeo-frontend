<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import LockedFeature from '@/components/LockedFeature.vue'
import AddCategoryDialog from '@/components/AddCategoryDialog.vue'
import AddFacilityDialog from '@/components/AddFacilityDialog.vue'
import AddPricingDialog from '@/components/AddPricingDialog.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRoute } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'

const route = useRoute()
const permissionStore = usePermissionStore()
const serviceId = computed(() => route.params.serviceId)

const serviceName = ref('')
const canView = ref(false)
const canCreate = ref(false)
const canEdit = ref(false)
const canDelete = ref(false)
const categories = ref([])
const pricingRules = ref([])
const activeTab = ref('overview')
const searchQuery = ref('')

const categoryHeaders = [
  { title: 'CATEGORY NAME', key: 'name', width: '30%' },
  { title: 'FACILITIES', key: 'facilities', sortable: false },
  { title: 'ACTIONS', key: 'actions', align: 'end', sortable: false, width: '100px' },
]

// Dialog State
const showCategoryDialog = ref(false)
const showFacilityDialog = ref(false)
const showPricingDialog = ref(false)
const selectedCategory = ref(null)
const selectedFacility = ref(null)
const selectedPricing = ref(null)

const fetchPricing = async () => {
  if (!serviceId.value) return
  try {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`http://127.0.0.1:8002/api/provider/pricing/?service=${serviceId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    pricingRules.value = response.data.results || response.data
  } catch (err) {
    console.error('Failed to fetch pricing:', err)
  }
}

const fetchCategories = async () => {
  if (!serviceId.value) return
  try {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`http://127.0.0.1:8002/api/provider/categories/?service=${serviceId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    categories.value = response.data.results || response.data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

const openAddPricing = () => {
  selectedPricing.value = null
  showPricingDialog.value = true
}

const openEditPricing = (rule) => {
  selectedPricing.value = rule
  showPricingDialog.value = true
}

const checkPermissions = () => {
  if (!serviceId.value) return

  // Find the service in the store permissions
  const service = permissionStore.permissions.find(p => p.service_id === serviceId.value)
  
  if (service) {
    serviceName.value = service.service_name
    canView.value = service.can_view
    canCreate.value = service.can_create
    canEdit.value = service.can_edit
    canDelete.value = service.can_delete
    // categories are now fetched from API
  } else {
    // Service not found in permissions, likely not allowed
    canView.value = false
  }
}

const openAddCategory = () => {
  selectedCategory.value = null
  showCategoryDialog.value = true
}

const openEditCategory = (category) => {
  selectedCategory.value = category
  showCategoryDialog.value = true
}

const openAddFacility = (category) => {
  selectedFacility.value = null
  // We might want to preselect category if facility belongs to one
  showFacilityDialog.value = true
}

const onSaved = async () => {
  // Refresh permissions/data
  await permissionStore.fetchPermissions()
  checkPermissions()
  fetchPricing()
  fetchCategories()
}

watch(serviceId, () => {
  checkPermissions()
  fetchPricing()
  fetchCategories()
})

onMounted(async () => {
  if (permissionStore.permissions.length === 0) {
    await permissionStore.fetchPermissions()
  }
  checkPermissions()
  fetchPricing()
  fetchCategories()
})

const deleteCategory = async (id) => {
  if (!confirm('Are you sure you want to delete this category?')) return
  try {
    const token = localStorage.getItem('accessToken')
    await axios.delete(`http://127.0.0.1:8002/api/provider/categories/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchCategories()
  } catch (err) {
    console.error('Failed to delete category:', err)
    alert('Failed to delete category')
  }
}

const deleteFacility = async (id) => {
  if (!confirm('Are you sure you want to delete this facility?')) return
  try {
    const token = localStorage.getItem('accessToken')
    await axios.delete(`http://127.0.0.1:8002/api/provider/facilities/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchCategories() // Facilities are nested in categories
  } catch (err) {
    console.error('Failed to delete facility:', err)
    alert('Failed to delete facility')
  }
}

const deletePricing = async (id) => {
  if (!confirm('Are you sure you want to delete this pricing rule?')) return
  try {
    const token = localStorage.getItem('accessToken')
    await axios.delete(`http://127.0.0.1:8002/api/provider/pricing/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchPricing()
  } catch (err) {
    console.error('Failed to delete pricing:', err)
    alert('Failed to delete pricing')
  }
}

// Placeholder Analytics Data
const analytics = [
  { title: 'Total Revenue', value: '$12,450', change: '+12%', icon: 'tabler-currency-dollar', color: 'primary' },
  { title: 'Bookings', value: '145', change: '+5%', icon: 'tabler-calendar-check', color: 'success' },
  { title: 'Profile Views', value: '1,204', change: '+24%', icon: 'tabler-eye', color: 'info' },
  { title: 'Avg. Rating', value: '4.8', change: '+0.2', icon: 'tabler-star', color: 'warning' },
]
</script>

<template>
  <ProviderLayout>
    <!-- LOCKED SCREEN -->
    <LockedFeature 
      v-if="!canView" 
      title="Service Locked"
      message="You do not have permission to view this service. Please upgrade your plan."
    />

    <!-- SERVICE CONTENT -->
    <div v-else class="service-details-page">
      
      <!-- HEADER -->
      <div class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-8 gap-4">
        <div class="d-flex align-center">
          <VAvatar color="primary" variant="tonal" size="64" class="me-4 rounded-lg">
            <VIcon icon="tabler-box" size="32" />
          </VAvatar>
          <div>
            <h1 class="text-h3 font-weight-bold text-primary">{{ serviceName }}</h1>
            <div class="d-flex align-center gap-2 mt-1">
              <VChip color="success" size="small" variant="flat" class="font-weight-bold">Active</VChip>
              <span class="text-body-2 text-medium-emphasis">Service ID: {{ serviceId }}</span>
            </div>
          </div>
        </div>
        
        <div class="d-flex gap-3">
           <VBtn variant="outlined" color="secondary" prepend-icon="tabler-settings">Settings</VBtn>
           <VBtn color="primary" prepend-icon="tabler-eye">View Public Page</VBtn>
        </div>
      </div>

      <!-- TABS -->
      <VTabs v-model="activeTab" class="mb-6 border-b">
        <VTab value="overview">Overview</VTab>
        <VTab value="categories">Categories & Facilities</VTab>
        <VTab value="pricing">Pricing & Plans</VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        
        <!-- 1. OVERVIEW TAB -->
        <VWindowItem value="overview">
          <VRow>
            <VCol v-for="stat in analytics" :key="stat.title" cols="12" sm="6" md="3">
              <VCard elevation="0" class="border">
                <VCardText>
                  <div class="d-flex justify-space-between align-start mb-4">
                    <VAvatar :color="stat.color" variant="tonal" rounded>
                      <VIcon :icon="stat.icon" />
                    </VAvatar>
                    <VChip color="success" size="x-small" variant="tonal">{{ stat.change }}</VChip>
                  </div>
                  <div class="text-h4 font-weight-bold mb-1">{{ stat.value }}</div>
                  <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
                </VCardText>
              </VCard>
            </VCol>
            
            <VCol cols="12" md="8">
              <VCard title="Revenue Trends" class="h-100">
                <VCardText class="d-flex align-center justify-center h-100" style="min-height: 300px;">
                  <div class="text-center text-medium-emphasis">
                    <VIcon icon="tabler-chart-bar" size="48" class="mb-2 opacity-50" />
                    <p>Chart visualization would go here</p>
                  </div>
                </VCardText>
              </VCard>
            </VCol>
            
            <VCol cols="12" md="4">
              <VCard title="Recent Activity" class="h-100">
                <VList lines="two">
                  <VListItem title="New Booking" subtitle="2 mins ago" prepend-icon="tabler-calendar-plus" />
                  <VDivider inset />
                  <VListItem title="Review Received" subtitle="1 hour ago" prepend-icon="tabler-star" />
                  <VDivider inset />
                  <VListItem title="Pricing Updated" subtitle="Yesterday" prepend-icon="tabler-tag" />
                </VList>
              </VCard>
            </VCol>
          </VRow>
        </VWindowItem>

        <!-- 2. CATEGORIES TAB -->
        <VWindowItem value="categories">
          <VCard class="mb-6">
            <VCardItem class="pb-2">
              <VCardTitle class="text-h5 font-weight-bold">Service Structure</VCardTitle>
              <VCardSubtitle>Organize your service into categories and facilities.</VCardSubtitle>
            </VCardItem>

            <VCardText>
              <VRow>
                <VCol cols="12" sm="4">
                  <AppTextField
                    v-model="searchQuery"
                    placeholder="Search categories..."
                    prepend-inner-icon="tabler-search"
                  />
                </VCol>

                <VCol cols="12" sm="8" class="d-flex justify-end gap-2">
                  <VBtn 
                    v-if="canCreate"
                    color="secondary"
                    variant="tonal"
                    prepend-icon="tabler-plus"
                    @click="showFacilityDialog = true"
                  >
                    Add Facility
                  </VBtn>
                  <VBtn 
                    v-if="canCreate"
                    color="primary"
                    prepend-icon="tabler-plus"
                    @click="openAddCategory"
                  >
                    Add Category
                  </VBtn>
                </VCol>
              </VRow>
            </VCardText>

            <VDivider />

            <VDataTable
              :headers="categoryHeaders"
              :items="categories"
              :search="searchQuery"
              item-value="id"
              class="text-no-wrap"
              hover
              density="comfortable"
            >
              <!-- NAME -->
              <template #item.name="{ item }">
                <div class="d-flex align-center">
                  <VAvatar 
                    size="32" 
                    :color="item.is_template ? 'secondary' : 'primary'" 
                    variant="tonal" 
                    class="me-3"
                  >
                    <VIcon :icon="item.is_template ? 'tabler-lock' : 'tabler-category'" size="18" />
                  </VAvatar>
                  <div>
                    <div class="font-weight-bold text-high-emphasis">{{ item.name }}</div>
                    <VChip v-if="item.is_template" size="x-small" color="secondary" variant="outlined" class="mt-1">Standard</VChip>
                  </div>
                </div>
              </template>

              <!-- FACILITIES -->
              <template #item.facilities="{ item }">
                <div class="d-flex flex-wrap gap-2 py-2">
                  <VChip 
                    v-for="facility in item.facilities" 
                    :key="facility.id"
                    size="small"
                    :color="facility.is_template ? 'grey' : 'primary'"
                    variant="tonal"
                    class="font-weight-medium cursor-pointer"
                    :closable="canEdit && !facility.is_template"
                    @click="openEditFacility(facility, item)"
                    @click:close="deleteFacility(facility.id)"
                  >
                    {{ facility.name }}
                    <span v-if="facility.price && facility.price !== '0.00'" class="ms-1 text-success font-weight-bold">
                      ${{ facility.price }}
                    </span>
                    <VTooltip activator="parent" location="top" v-if="!facility.is_template">Click to Edit</VTooltip>
                  </VChip>
                  <span v-if="!item.facilities?.length" class="text-caption text-disabled font-italic px-2">No facilities added</span>
                </div>
              </template>

              <!-- ACTIONS -->
              <template #item.actions="{ item }">
                <div class="d-flex align-center justify-end gap-x-1">
                  <IconBtn 
                    v-if="canEdit" 
                    :disabled="item.is_template"
                    @click="openEditCategory(item)"
                  >
                    <VIcon icon="tabler-edit" />
                    <VTooltip activator="parent" location="top">{{ item.is_template ? 'Standard Category (Locked)' : 'Edit Category' }}</VTooltip>
                  </IconBtn>
                  
                  <IconBtn 
                    v-if="canDelete" 
                    color="red"
                    :disabled="item.is_template"
                    @click="deleteCategory(item.id)"
                  >
                    <VIcon icon="tabler-trash" />
                    <VTooltip activator="parent" location="top">{{ item.is_template ? 'Standard Category (Locked)' : 'Delete Category' }}</VTooltip>
                  </IconBtn>
                </div>
              </template>
            </VDataTable>
          </VCard>
        </VWindowItem>

        <!-- 3. PRICING TAB -->
        <VWindowItem value="pricing">
          <div class="d-flex justify-space-between align-center mb-6">
            <div>
              <h2 class="text-h5 font-weight-bold">Pricing Rules</h2>
              <p class="text-body-2 text-medium-emphasis">Set specific prices for categories and facilities.</p>
            </div>
            <VBtn 
              v-if="canCreate"
              color="primary"
              prepend-icon="tabler-plus"
              @click="openAddPricing"
            >
              Add Pricing Rule
            </VBtn>
          </div>

          <VCard elevation="0" class="border">
            <VTable hover>
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-uppercase text-caption font-weight-bold">Category</th>
                  <th class="text-uppercase text-caption font-weight-bold">Facility</th>
                  <th class="text-uppercase text-caption font-weight-bold">Price</th>
                  <th class="text-uppercase text-caption font-weight-bold">Duration</th>
                  <th class="text-uppercase text-caption font-weight-bold">Discount</th>
                  <th class="text-end text-uppercase text-caption font-weight-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in pricingRules" :key="rule.id">
                  <td>
                    <div class="d-flex align-center">
                      <VIcon icon="tabler-category" size="16" class="me-2 text-medium-emphasis" />
                      {{ rule.category_name || 'All Categories' }}
                    </div>
                  </td>
                  <td>{{ rule.facility_name || 'All Facilities' }}</td>
                  <td>
                    <VChip color="success" size="small" variant="tonal" class="font-weight-bold">
                      ${{ rule.price }}
                    </VChip>
                  </td>
                  <td>{{ rule.duration }}</td>
                  <td>
                    <span v-if="rule.discount" class="text-error font-weight-bold">-{{ rule.discount }}%</span>
                    <span v-else class="text-medium-emphasis">-</span>
                  </td>
                  <td class="text-end">
                    <VBtn 
                      v-if="rule.can_edit" 
                      icon="tabler-edit" 
                      size="small" 
                      variant="text" 
                      color="medium-emphasis" 
                      @click="openEditPricing(rule)"
                    />
                    <VBtn 
                      v-if="rule.can_delete" 
                      icon="tabler-trash" 
                      size="small" 
                      variant="text" 
                      color="error" 
                      @click="deletePricing(rule.id)"
                    />
                  </td>
                </tr>
                <tr v-if="pricingRules.length === 0">
                  <td colspan="6" class="text-center py-8">
                    <div class="d-flex flex-column align-center">
                      <VIcon icon="tabler-currency-dollar-off" size="32" class="text-medium-emphasis mb-2" />
                      <p class="text-body-2 text-medium-emphasis">No pricing rules defined yet.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VWindowItem>

      </VWindow>

      <!-- DIALOGS -->
      <AddCategoryDialog
        v-model="showCategoryDialog"
        :service-id="serviceId"
        :category="selectedCategory"
        @saved="onSaved"
      />
      
      <AddFacilityDialog
        v-model="showFacilityDialog"
        :service-id="serviceId"
        :categories="categories"
        :facility="selectedFacility"
        @saved="onSaved"
      />
      
      <AddPricingDialog
        v-model="showPricingDialog"
        :service-id="serviceId"
        :categories="categories"
        :pricing="selectedPricing"
        @saved="fetchPricing"
      />
    </div>
  </ProviderLayout>
</template>

<style scoped>
.category-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
}
.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.08) !important;
}

.facility-chip {
  transition: all 0.2s;
}
.facility-chip:hover {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
