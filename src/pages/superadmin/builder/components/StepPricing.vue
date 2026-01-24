<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['state', 'hideNavigation'])
const emit = defineEmits(['next', 'prev', 'update:state'])

const pricings = ref([])
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const categories = ref([])
const facilities = ref([])
const services = ref([])

const fetchServices = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')

    services.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch services:', err)
  }
}

const viewMode = ref('card')
const searchQuery = ref('')

const headers = [
  { title: 'Price', key: 'base_price' },
  { title: 'Billing', key: 'billing_unit' },
  { title: 'Context', key: 'context', sortable: false },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const filteredPricings = computed(() => {
  if (!searchQuery.value) return pricings.value
  const query = searchQuery.value.toLowerCase()
  
  return pricings.value.filter(p => 
    p.billing_unit.toLowerCase().includes(query) ||
    (p.category_display && p.category_display.toLowerCase().includes(query)) ||
    (p.facility_display && p.facility_display.toLowerCase().includes(query)),
  )
})

const form = ref({
  service: props.state.selectedServiceId,
  category: props.state.selectedCategoryId,
  facility: null,
  billing_unit: 'PER_SESSION',
  base_price: 0,
  duration_minutes: null,
  is_active: true,
})

const billingUnitOptions = [
  { label: 'Per Session', value: 'PER_SESSION' },
  { label: 'Per Hour', value: 'HOURLY' },
  { label: 'Per Day', value: 'DAILY' },
  { label: 'Per Week', value: 'WEEKLY' },
  { label: 'One Time', value: 'ONE_TIME' },
]

const getBillingLabel = value => {
  return billingUnitOptions.find(o => o.value === value)?.label || value
}

const fetchPricings = async () => {
  if (!props.state.selectedServiceId) return
  loading.value = true
  try {
    const params = { service: props.state.selectedServiceId }
    if (props.state.selectedCategoryId) {
      params.category = props.state.selectedCategoryId
    }
    if (props.state.selectedFacilityId) {
      params.facility = props.state.selectedFacilityId
    }
    const res = await superAdminApi.get('/api/superadmin/pricing-rules/', { params })

    pricings.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch pricings:', err)
  } finally {
    loading.value = false
  }
}

const fetchContextData = async () => {
  try {
    const [catRes, facRes] = await Promise.all([
      superAdminApi.get('/api/superadmin/categories/', { params: { service: props.state.selectedServiceId } }),
      superAdminApi.get('/api/superadmin/facilities/', { params: { service: props.state.selectedServiceId } }),
    ])

    categories.value = catRes.data.results || catRes.data || []
    facilities.value = facRes.data.results || facRes.data || []
  } catch (err) {
    console.error('Failed to fetch context data:', err)
  }
}

const openAddDrawer = () => {
  fetchContextData()
  isEdit.value = false
  form.value = {
    service: props.state.selectedServiceId,
    category: props.state.selectedCategoryId,
    facility: null,
    billing_unit: 'PER_SESSION',
    base_price: 0,
    duration_minutes: null,
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = pricing => {
  fetchContextData()
  isEdit.value = true
  editId.value = pricing.id
  form.value = {
    ...pricing,
    service: pricing.service?.id || pricing.service,
    category: pricing.category?.id || pricing.category,
    facility: pricing.facility?.id || pricing.facility,
  }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    const payload = { ...form.value }
    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/pricing-rules/${editId.value}/`, payload)
    } else {
      await superAdminApi.post('/api/superadmin/pricing-rules/', payload)
    }
    drawerOpen.value = false
    fetchPricings()
  } catch (err) {
    console.error('Failed to save pricing:', err)
  }
}

const toggleStatus = async pricing => {
  try {
    await superAdminApi.patch(`/api/superadmin/pricing-rules/${pricing.id}/`, {
      is_active: pricing.is_active,
    })
  } catch (err) {
    console.error('Failed to toggle status:', err)
    pricing.is_active = !pricing.is_active
  }
}

const showDuration = computed(() => ['PER_SESSION', 'HOURLY'].includes(form.value.billing_unit))

const deleteDialog = ref(false)
const deleteItem = ref(null)

const openDeleteDialog = item => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deletePricing = async () => {
  try {
    await superAdminApi.delete(`/api/superadmin/pricing-rules/${deleteItem.value.id}/`)
    deleteDialog.value = false
    fetchPricings()
  } catch (err) {
    console.error('Failed to delete pricing:', err)
  }
}

onMounted(() => {
  fetchServices()
  fetchPricings()
  fetchContextData()
})

watch(() => props.state.selectedServiceId, () => {
  fetchPricings()
  fetchContextData()
})
</script>

<template>
  <div>
    <!-- Consolidated Toolbar -->
    <div class="d-flex flex-wrap align-center gap-4 mb-6">
      <div style="min-width: 250px; flex: 1;">
        <AppTextField
          v-model="searchQuery"
          placeholder="Filter pricing rules..."
          prepend-inner-icon="tabler-search"
          density="comfortable"
          hide-details
          class="premium-search-v2"
        />
      </div>
      
      <div class="d-flex align-center gap-3">
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
          color="primary" 
          prepend-icon="tabler-plus" 
          rounded="lg"
          class="premium-btn shadow-v2"
          @click="openAddDrawer"
        >
          New Rule
        </VBtn>
      </div>
    </div>

    <VRow v-if="loading">
      <VCol
        v-for="i in 3"
        :key="i"
        cols="12"
        sm="6"
        md="4"
      >
        <VSkeletonLoader
          type="card"
          class="rounded-lg"
        />
      </VCol>
    </VRow>

    <template v-else-if="pricings.length > 0">
      <!-- Card View with Animation -->
      <TransitionGroup 
        v-if="viewMode === 'card'"
        name="list-fade" 
        tag="div" 
        class="v-row"
      >
        <VCol
          v-for="pricing in filteredPricings"
          :key="pricing.id"
          cols="12"
          sm="6"
          md="4"
        >
          <VCard 
            class="premium-card-v2 h-100"
            @click="openEditDrawer(pricing)"
          >
            <VCardText class="pa-6 d-flex flex-column h-100">
              <!-- Header -->
              <div class="d-flex justify-space-between align-start mb-4">
                <div>
                  <div class="text-h4 font-weight-bold gradient-text mb-1">
                    ₹{{ pricing.base_price }}
                  </div>
                  <VChip 
                    size="x-small" 
                    color="primary" 
                    variant="tonal" 
                    class="font-weight-bold uppercase"
                  >
                    {{ getBillingLabel(pricing.billing_unit) }}
                  </VChip>
                </div>
                
                <div class="d-flex gap-1 action-buttons">
                  <VBtn 
                    icon="tabler-edit" 
                    size="x-small" 
                    variant="tonal" 
                    color="primary"
                    rounded="lg"
                    @click.stop="openEditDrawer(pricing)"
                  />
                  <VBtn 
                    icon="tabler-trash" 
                    size="x-small" 
                    variant="tonal" 
                    color="error"
                    rounded="lg"
                    @click.stop="openDeleteDialog(pricing)"
                  />
                </div>
              </div>
              
              <VDivider class="mb-5 border-dashed" />

              <!-- Context Details -->
              <div class="d-flex flex-column gap-4 mb-4 flex-grow-1">
                <div class="d-flex align-center gap-3">
                  <VAvatar
                    size="32"
                    color="primary"
                    variant="tonal"
                    class="rounded-lg"
                  >
                    <VIcon
                      icon="tabler-hierarchy-2"
                      size="18"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-caption text-medium-emphasis leading-none mb-1">
                      Service Type
                    </div>
                    <div class="text-body-2 font-weight-bold leading-none">
                      {{ pricing.category_display || 'Global Default' }}
                    </div>
                  </div>
                </div>

                <div class="d-flex align-center gap-3">
                  <VAvatar
                    size="32"
                    color="info"
                    variant="tonal"
                    class="rounded-lg"
                  >
                    <VIcon
                      icon="tabler-building-hospital"
                      size="18"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-caption text-medium-emphasis leading-none mb-1">
                      Linked Facility
                    </div>
                    <div class="text-body-2 font-weight-bold leading-none">
                      {{ pricing.facility_display || 'Universal' }}
                    </div>
                  </div>
                </div>

                <div
                  v-if="pricing.duration_minutes"
                  class="d-flex align-center gap-3"
                >
                  <VAvatar
                    size="32"
                    color="warning"
                    variant="tonal"
                    class="rounded-lg"
                  >
                    <VIcon
                      icon="tabler-clock"
                      size="18"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-caption text-medium-emphasis leading-none mb-1">
                      Service Duration
                    </div>
                    <div class="text-body-2 font-weight-bold leading-none">
                      {{ pricing.duration_minutes }} Minutes
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="mt-auto pt-4 border-t d-flex align-center justify-space-between">
                <VChip 
                  size="x-small" 
                  :color="pricing.is_active ? 'success' : 'secondary'" 
                  variant="tonal"
                  label
                  class="rounded-sm"
                >
                  {{ pricing.is_active ? 'ACTIVE' : 'INACTIVE' }}
                </VChip>
                
                <VSwitch
                  v-model="pricing.is_active"
                  density="compact"
                  hide-details
                  color="success"
                  @click.stop
                  @update:model-value="toggleStatus(pricing)"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </TransitionGroup>

      <!-- Table View -->
      <VCard
        v-else
        class="border"
      >
        <VDataTable
          :headers="headers"
          :items="filteredPricings"
          density="comfortable"
          hover
          @click:row="(e, { item }) => openEditDrawer(item)"
        >
          <template #item.base_price="{ item }">
            <span class="font-weight-bold text-primary">₹{{ item.base_price }}</span>
          </template>
          <template #item.billing_unit="{ item }">
            <VChip
              size="small"
              label
            >
              {{ getBillingLabel(item.billing_unit) }}
            </VChip>
          </template>
          <template #item.context="{ item }">
            <div class="d-flex flex-column text-caption">
              <span>Type: {{ item.category_display || 'All' }}</span>
              <span>Facility: {{ item.facility_display || 'All' }}</span>
            </div>
          </template>
          <template #item.is_active="{ item }">
            <VSwitch
              v-model="item.is_active"
              density="compact"
              hide-details
              color="success"
              @click.stop
              @update:model-value="toggleStatus(item)"
            />
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <IconBtn
                size="small"
                @click.stop="openEditDrawer(item)"
              >
                <VIcon icon="tabler-edit" />
              </IconBtn>
              <IconBtn
                size="small"
                color="error"
                @click.stop="openDeleteDialog(item)"
              >
                <VIcon icon="tabler-trash" />
              </IconBtn>
            </div>
          </template>
        </VDataTable>
      </VCard>
    </template>

    <div
      v-else
      class="text-center py-12 bg-light rounded-lg border-dashed"
    >
      <VIcon
        icon="tabler-currency-dollar"
        size="48"
        color="medium-emphasis"
        class="mb-4"
      />
      <h3 class="text-h6 font-weight-bold mb-2">
        No Pricing Rules
      </h3>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Define how much providers should be charged for this service.
      </p>
      <VBtn
        variant="tonal"
        color="primary"
        @click="openAddDrawer"
      >
        Add First Rule
      </VBtn>
    </div>

    <div
      v-if="!hideNavigation"
      class="d-flex justify-space-between mt-8"
    >
      <VBtn
        variant="text"
        prepend-icon="tabler-arrow-left"
        @click="emit('prev')"
      >
        Back
      </VBtn>
      <VBtn
        color="primary"
        append-icon="tabler-arrow-right"
        @click="emit('next')"
      >
        Next Step
      </VBtn>
    </div>

    <!-- DELETE CONFIRMATION -->
    <VDialog
      v-model="deleteDialog"
      width="420"
      transition="dialog-bottom-transition"
      persistent
    >
      <VCard
        class="pa-4 rounded-xl"
        elevation="12"
      >
        <div class="text-center mb-3">
          <VAvatar
            size="60"
            color="red"
            variant="tonal"
            class="mb-3"
          >
            <VIcon
              icon="tabler-alert-triangle"
              size="32"
              color="red-darken-2"
            />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold text-high-emphasis">
            Delete Pricing Rule?
          </h2>

          <p class="text-body-2 mt-1 text-medium-emphasis">
            Delete this pricing rule permanently?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="red"
            prepend-icon="tabler-trash"
            @click="deletePricing"
          >
            Delete
          </VBtn>
        </div>
      </VCard>
    </VDialog>

    <!-- Add/Edit Drawer -->
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
              {{ isEdit ? 'Edit Pricing' : 'Add Pricing' }}
            </h3>
            <VBtn
              icon="tabler-x"
              variant="text"
              @click="drawerOpen = false"
            />
          </div>

          <div class="flex-grow-1 overflow-y-auto pa-6">
            <VForm
              id="pricingForm"
              @submit.prevent="submit"
            >
              <VCard
                variant="tonal"
                color="primary"
                class="pa-4 mb-6 border-0"
              >
                <h4 class="text-subtitle-1 font-weight-bold mb-4">
                  Pricing Context
                </h4>
                
                <VSelect
                  v-model="form.service"
                  :items="services"
                  item-title="display_name"
                  item-value="id"
                  label="Select Service *"
                  placeholder="Choose parent service"
                  class="mb-4"
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  readonly
                  :menu-props="{ zIndex: 10000 }"
                />

                <VSelect
                  v-model="form.category"
                  :items="categories"
                  label="Service Type"
                  placeholder="Select type (Optional)"
                  item-title="name"
                  item-value="id"
                  class="mb-4"
                  clearable
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  :menu-props="{ zIndex: 10000 }"
                />
                
                <VSelect
                  v-model="form.facility"
                  :items="facilities"
                  label="Facility"
                  placeholder="Select facility (Optional)"
                  item-title="name"
                  item-value="id"
                  class="mb-0"
                  clearable
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  :menu-props="{ zIndex: 10000 }"
                />
              </VCard>

              <VCard
                variant="tonal"
                color="secondary"
                class="pa-4 mb-6 border-0"
              >
                <h4 class="text-subtitle-1 font-weight-bold mb-4">
                  Pricing Details
                </h4>
                
                <VSelect
                  v-model="form.billing_unit"
                  :items="billingUnitOptions"
                  label="Charge Frequency *"
                  item-title="label"
                  item-value="value"
                  class="mb-4"
                  required
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  :menu-props="{ zIndex: 10000 }"
                />

                <AppTextField
                  v-model.number="form.base_price"
                  label="Price (₹) *"
                  type="number"
                  placeholder="0.00"
                  class="mb-4"
                  required
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                />

                <AppTextField
                  v-if="showDuration"
                  v-model.number="form.duration_minutes"
                  label="Duration (Minutes)"
                  type="number"
                  placeholder="e.g. 60"
                  class="mb-0"
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                />
              </VCard>

              <VCard
                variant="tonal"
                color="error"
                class="pa-4 mb-8 border-0"
              >
                <h4 class="text-subtitle-1 font-weight-bold mb-2">
                  Status Options
                </h4>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Active</span>
                  <VSwitch
                    v-model="form.is_active"
                    color="success"
                    hide-details
                    inset
                  />
                </div>
              </VCard>
            </VForm>
          </div>

          <div class="pa-6 border-t bg-surface">
            <div class="d-flex justify-end gap-4">
              <VBtn
                variant="outlined"
                color="secondary"
                @click="drawerOpen = false"
              >
                Cancel
              </VBtn>
              <VBtn
                color="primary"
                type="submit"
                form="pricingForm"
              >
                {{ isEdit ? 'Update Pricing' : 'Create Pricing' }}
              </VBtn>
            </div>
          </div>
        </div>
      </VNavigationDrawer>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
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

.gradient-text {
  background: linear-gradient(135deg, #7367f0 0%, #ce9ffc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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

.leading-none { line-height: 1 !important; }

.uppercase {
  text-transform: uppercase;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>
