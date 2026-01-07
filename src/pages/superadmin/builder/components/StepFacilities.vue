<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['state', 'hideNavigation'])
const emit = defineEmits(['next', 'prev', 'update:state'])

const facilities = ref([])
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const usesFacilities = ref(false)
const viewMode = ref('card')
const searchQuery = ref('')

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const filteredFacilities = computed(() => {
  if (!searchQuery.value) return facilities.value
  const query = searchQuery.value.toLowerCase()
  return facilities.value.filter(f => 
    f.name.toLowerCase().includes(query) || 
    (f.description && f.description.toLowerCase().includes(query))
  )
})

const form = ref({
  name: '',
  description: '',
  service: props.state.selectedServiceId,
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

const fetchFacilities = async () => {
  if (!props.state.selectedServiceId) return
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/facilities/', {
      params: { service: props.state.selectedServiceId }
    })
    facilities.value = res.data.results || res.data || []
    if (facilities.value.length > 0) {
      usesFacilities.value = true
    }
  } catch (err) {
    console.error('Failed to fetch facilities:', err)
  } finally {
    loading.value = false
  }
}

const openAddDrawer = () => {
  isEdit.value = false
  form.value = {
    name: '',
    description: '',
    service: props.state.selectedServiceId,
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = (facility) => {
  isEdit.value = true
  editId.value = facility.id
  form.value = { ...facility, service: facility.service?.id || facility.service }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/facilities/${editId.value}/`, form.value)
    } else {
      await superAdminApi.post('/api/superadmin/facilities/', form.value)
    }
    drawerOpen.value = false
    fetchFacilities()
  } catch (err) {
    console.error('Failed to save facility:', err)
  }
}

const toggleStatus = async (facility) => {
  try {
    await superAdminApi.patch(`/api/superadmin/facilities/${facility.id}/`, {
      is_active: facility.is_active,
    })
  } catch (err) {
    console.error('Failed to toggle status:', err)
    facility.is_active = !facility.is_active
  }
}

const selectFacility = (facilityId) => {
  emit('update:state', { ...props.state, selectedFacilityId: facilityId })
  emit('next')
}

const skipStep = () => {
  emit('update:state', { ...props.state, selectedFacilityId: null })
  emit('next')
}

const deleteDialog = ref(false)
const deleteItem = ref(null)

const openDeleteDialog = (item) => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteFacility = async () => {
  try {
    await superAdminApi.delete(`/api/superadmin/facilities/${deleteItem.value.id}/`)
    deleteDialog.value = false
    fetchFacilities()
  } catch (err) {
    console.error('Failed to delete facility:', err)
  }
}

onMounted(() => {
  fetchServices()
  fetchFacilities()
})
watch(() => props.state.selectedServiceId, fetchFacilities)
</script>

<template>
  <div>

    <!-- Consolidated Toolbar -->
    <div class="d-flex flex-wrap align-center gap-4 mb-4">
      <div style="min-width: 250px; flex: 1;">
        <AppTextField
          v-model="searchQuery"
          placeholder="Search facilities..."
          prepend-inner-icon="tabler-search"
          density="compact"
          hide-details
          class="premium-search"
        />
      </div>
      
      <div class="d-flex align-center gap-2">
        <VSwitch
          v-model="usesFacilities"
          label="Enable Facilities"
          color="primary"
          hide-details
          density="compact"
          class="me-4"
        />

        <VDivider vertical class="mx-2" />

        <VBtnToggle
          v-model="viewMode"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          class="premium-toggle"
          divided
        >
          <VBtn value="card" icon="tabler-layout-grid" size="small" />
          <VBtn value="table" icon="tabler-list" size="small" />
        </VBtnToggle>

        <VDivider vertical class="mx-2" />

        <VBtn 
          variant="text" 
          color="medium-emphasis" 
          @click="skipStep"
          class="text-none"
        >
          Skip
        </VBtn>
        <VBtn 
          color="primary" 
          prepend-icon="tabler-plus" 
          @click="openAddDrawer"
          elevation="2"
          :disabled="!usesFacilities"
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

        <template v-else-if="facilities.length > 0">
          <!-- Card View -->
          <VRow v-if="viewMode === 'card'">
            <VCol
              v-for="facility in filteredFacilities"
              :key="facility.id"
              cols="12"
              sm="6"
              md="4"
            >
              <VCard 
                :class="['facility-card h-100', { 'selected': props.state.selectedFacilityId === facility.id }]"
                @click="selectFacility(facility.id)"
                elevation="0"
                border
              >
                <VCardText class="pa-5 d-flex flex-column h-100">
                  <!-- Header: Icon + Name + Actions -->
                  <div class="d-flex justify-space-between align-start mb-3">
                    <div class="d-flex align-center gap-3 flex-grow-1" style="min-width: 0;">
                      <VAvatar 
                        size="40" 
                        :color="props.state.selectedFacilityId === facility.id ? 'primary' : 'secondary'" 
                        variant="tonal"
                        class="rounded-lg"
                      >
                        <VIcon icon="tabler-building-hospital" size="24" />
                      </VAvatar>
                      <div class="text-truncate">
                        <h3 class="text-subtitle-1 font-weight-bold text-truncate">{{ facility.name }}</h3>
                        <div class="d-flex align-center gap-2">
                          <VBadge
                            dot
                            :color="facility.is_active ? 'success' : 'error'"
                            inline
                          />
                          <span class="text-caption text-medium-emphasis">{{ facility.is_active ? 'Active' : 'Inactive' }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Direct Actions -->
                    <div class="d-flex gap-1">
                      <IconBtn 
                        size="small" 
                        color="medium-emphasis" 
                        variant="text"
                        @click.stop="openEditDrawer(facility)"
                        v-tooltip="'Edit'"
                      >
                        <VIcon icon="tabler-edit" />
                      </IconBtn>
                      <IconBtn 
                        size="small" 
                        color="error" 
                        variant="text"
                        @click.stop="openDeleteDialog(facility)"
                        v-tooltip="'Delete'"
                      >
                        <VIcon icon="tabler-trash" />
                      </IconBtn>
                    </div>
                  </div>
                  
                  <!-- Description -->
                  <div class="mb-4 flex-grow-1">
                    <p 
                      v-if="facility.description && facility.description !== facility.name" 
                      class="text-body-2 text-medium-emphasis line-clamp-2 mb-0"
                    >
                      {{ facility.description }}
                    </p>
                    <p v-else class="text-caption text-disabled font-italic mb-0">
                      No additional details
                    </p>
                  </div>

                  <!-- Footer: Toggle -->
                  <div class="d-flex align-center justify-space-between pt-3 border-t mt-auto" @click.stop>
                    <span class="text-caption font-weight-medium text-medium-emphasis">
                      {{ facility.is_active ? 'Enabled' : 'Disabled' }}
                    </span>
                    <VSwitch
                      v-model="facility.is_active"
                      density="compact"
                      hide-details
                      color="primary"
                      @update:model-value="toggleStatus(facility)"
                    />
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Table View -->
          <VCard v-else class="border">
            <VDataTable
              :headers="headers"
              :items="filteredFacilities"
              density="comfortable"
              hover
              @click:row="(e, { item }) => selectFacility(item.id)"
            >
              <template #item.name="{ item }">
                <div class="d-flex align-center gap-2">
                  <VIcon v-if="props.state.selectedFacilityId === item.id" icon="tabler-check" color="primary" size="18" />
                  <span :class="{ 'font-weight-bold text-primary': props.state.selectedFacilityId === item.id }">
                    {{ item.name }}
                  </span>
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
                  <IconBtn size="small" @click.stop="openEditDrawer(item)">
                    <VIcon icon="tabler-edit" />
                  </IconBtn>
                  <IconBtn size="small" color="error" @click.stop="openDeleteDialog(item)">
                    <VIcon icon="tabler-trash" />
                  </IconBtn>
                </div>
              </template>
            </VDataTable>
          </VCard>
        </template>

        <div v-else class="text-center py-12 bg-light rounded-lg border-dashed">
          <VIcon icon="tabler-building-hospital" size="48" color="medium-emphasis" class="mb-4" />
          <h3 class="text-h6 font-weight-bold mb-2">No Facilities Defined</h3>
          <p class="text-body-2 text-medium-emphasis mb-6">Add facilities that providers can use for this service.</p>
          <VBtn variant="tonal" color="primary" @click="openAddDrawer">Add First Facility</VBtn>
        </div>
      </div>
    </VExpandTransition>

    <div v-if="!usesFacilities" class="text-center py-12 bg-light rounded-lg border-dashed">
      <VIcon icon="tabler-info-circle" size="48" color="medium-emphasis" class="mb-4" />
      <h3 class="text-h6 font-weight-bold mb-2">Facilities Disabled</h3>
      <p class="text-body-2 text-medium-emphasis">Toggle the switch above if this service requires specific facilities.</p>
    </div>

    <div v-if="!hideNavigation" class="d-flex justify-space-between mt-8">
      <VBtn variant="text" prepend-icon="tabler-arrow-left" @click="emit('prev')">Back</VBtn>
      <VBtn color="primary" append-icon="tabler-arrow-right" @click="emit('next')">Next Step</VBtn>
    </div>

    <!-- DELETE CONFIRMATION -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold text-high-emphasis">
            Delete Facility?
          </h2>

          <p class="text-body-2 mt-1 text-medium-emphasis">
            Delete <strong class="text-primary">{{ deleteItem?.name }}</strong> permanently?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="red" prepend-icon="tabler-trash" @click="deleteFacility">
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
            <h3 class="text-h6 font-weight-bold">{{ isEdit ? 'Edit Facility' : 'Add Facility' }}</h3>
            <VBtn icon="tabler-x" variant="text" @click="drawerOpen = false" />
          </div>

          <div class="flex-grow-1 overflow-y-auto pa-6">
            <VForm id="facilityForm" @submit.prevent="submit">
              <VCard variant="tonal" color="primary" class="pa-4 mb-6 border-0">
                <h4 class="text-subtitle-1 font-weight-bold mb-4">Facility Information</h4>
                
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
                />

                <AppTextField
                  v-model="form.name"
                  label="Facility Name *"
                  placeholder="e.g. Full Spa Treatment"
                  class="mb-4"
                  required
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                />

                <AppTextarea
                  v-model="form.description"
                  label="Description"
                  placeholder="Briefly describe this facility..."
                  class="mb-0"
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  rows="3"
                />
              </VCard>

              <VCard variant="tonal" color="error" class="pa-4 mb-8 border-0">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Status Options</h4>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Active</span>
                  <VSwitch v-model="form.is_active" color="success" hide-details inset />
                </div>
              </VCard>
            </VForm>
          </div>

          <div class="pa-6 border-t bg-surface">
            <div class="d-flex justify-end gap-4">
              <VBtn variant="outlined" color="secondary" @click="drawerOpen = false">Cancel</VBtn>
              <VBtn color="primary" type="submit" form="facilityForm">
                {{ isEdit ? 'Update Facility' : 'Create Facility' }}
              </VBtn>
            </div>
          </div>
        </div>
      </VNavigationDrawer>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.facility-card {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));

  &:hover {
    border-color: rgb(var(--v-theme-primary));
    transform: translateY(-2px);
    box-shadow: 0 4px 18px rgba(var(--v-theme-primary), 0.1) !important;
  }

  &.selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
    box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
  }
}

.premium-search {
  :deep(.v-field__outline__start),
  :deep(.v-field__outline__end) {
    border-color: rgba(var(--v-border-color), 0.15);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.border-dashed {
  border: 2px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}
</style>

<style lang="scss">
.builder-drawer {
  position: fixed !important;
  top: 0 !important;
  height: 100vh !important;
  z-index: 100000 !important;
  
  .v-navigation-drawer__content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>
