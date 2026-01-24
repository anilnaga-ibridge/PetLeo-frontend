<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['state', 'hideNavigation'])
const emit = defineEmits(['next', 'prev', 'update:state'])

const categories = ref([])
const services = ref([])
const selectedServiceData = ref(null)
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const viewMode = ref('card') // 'card' or 'table'
const searchQuery = ref('')

const form = ref({
  name: '',
  description: '',
  service: props.state.selectedServiceId,
  linked_capability: null,
  is_active: true,
})

const veterinaryCapabilities = [
  { title: 'Reception / Check-in', value: 'VETERINARY_VISITS', subtitle: 'Manage appointments and check-ins' },
  { title: 'Vitals / Nurse Station', value: 'VETERINARY_VITALS', subtitle: 'Record patient vitals and triage' },
  { title: 'Doctor Consultation', value: 'VETERINARY_PRESCRIPTIONS', subtitle: 'Prescriptions and diagnosis' },
  { title: 'Laboratory', value: 'VETERINARY_LABS', subtitle: 'Order and view lab results' },
  { title: 'Pharmacy', value: 'VETERINARY_MEDICINE_REMINDERS', subtitle: 'Dispense medicines and manage inventory' },
]

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const fetchServices = async () => {
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')

    services.value = res.data.results || res.data || []
    selectedServiceData.value = services.value.find(s => s.id === props.state.selectedServiceId)
  } catch (err) {
    console.error('Failed to fetch services:', err)
  }
}

const fetchCategories = async () => {
  if (!props.state.selectedServiceId) return
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/categories/', {
      params: { 
        service: props.state.selectedServiceId,
        search: searchQuery.value,
      },
    })

    categories.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch categories:', err)
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
    linked_capability: null,
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = category => {
  isEdit.value = true
  editId.value = category.id
  form.value = { ...category, service: category.service?.id || category.service }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/categories/${editId.value}/`, form.value)
    } else {
      await superAdminApi.post('/api/superadmin/categories/', form.value)
    }
    drawerOpen.value = false
    fetchCategories()
  } catch (err) {
    console.error('Failed to save category:', err)
  }
}

const toggleStatus = async category => {
  try {
    await superAdminApi.patch(`/api/superadmin/categories/${category.id}/`, {
      is_active: category.is_active,
    })
  } catch (err) {
    console.error('Failed to toggle status:', err)
    category.is_active = !category.is_active
  }
}

const selectCategory = categoryId => {
  emit('update:state', { ...props.state, selectedCategoryId: categoryId })
  emit('next')
}

const skipStep = () => {
  emit('update:state', { ...props.state, selectedCategoryId: null })
  emit('next')
}

// Dynamic Labels
const isVeterinary = computed(() => {
  const s = selectedServiceData.value
  
  return s && (s.name.toUpperCase().startsWith("VETERINARY") || s.display_name.toUpperCase().includes("VETERINARY"))
})

const typeLabel = computed(() => isVeterinary.value ? "Feature" : "Type")
const nameLabel = computed(() => isVeterinary.value ? "Feature Name *" : "Type Name *")
const descriptionLabel = computed(() => isVeterinary.value ? "Feature Description" : "Description")

const deleteDialog = ref(false)
const deleteItem = ref(null)

const openDeleteDialog = item => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteCategory = async () => {
  try {
    await superAdminApi.delete(`/api/superadmin/categories/${deleteItem.value.id}/`)
    deleteDialog.value = false
    fetchCategories()
  } catch (err) {
    console.error('Failed to delete category:', err)
  }
}

onMounted(() => {
  fetchServices()
  fetchCategories()
})

watch(() => props.state.selectedServiceId, () => {
  fetchServices()
  fetchCategories()
})

watch(searchQuery, fetchCategories)
</script>

<template>
  <div>
    <!-- Consolidated Toolbar -->
    <div class="d-flex flex-wrap align-center gap-4 mb-6">
      <div style="min-width: 250px; flex: 1;">
        <AppTextField
          v-model="searchQuery"
          placeholder="Filter features..."
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
          @click="openAddDrawer"
        >
          New {{ typeLabel }}
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

    <template v-else-if="categories.length > 0">
      <!-- Card View with Animation -->
      <TransitionGroup 
        v-if="viewMode === 'card'"
        name="list-fade" 
        tag="div" 
        class="v-row"
      >
        <VCol
          v-for="category in categories"
          :key="category.id"
          cols="12"
          sm="6"
          md="4"
        >
          <VCard
            class="premium-card-v2 h-100"
            :class="[{ 'is-selected': props.state.selectedCategoryId === category.id }]"
            @click="selectCategory(category.id)"
          >
            <VCardText class="pa-6 d-flex flex-column h-100">
              <!-- Header -->
              <div class="d-flex justify-space-between align-start mb-4">
                <VAvatar 
                  size="48" 
                  :color="props.state.selectedCategoryId === category.id ? 'primary' : 'secondary'" 
                  variant="tonal"
                  class="rounded-xl"
                >
                  <VIcon
                    :icon="isVeterinary ? 'tabler-stethoscope' : 'tabler-category'"
                    size="26"
                  />
                </VAvatar>
                
                <div
                  v-if="!category.is_system"
                  class="d-flex gap-1 action-buttons"
                >
                  <VBtn 
                    icon="tabler-edit" 
                    size="x-small" 
                    variant="tonal" 
                    color="primary"
                    rounded="lg"
                    @click.stop="openEditDrawer(category)"
                  />
                  <VBtn 
                    icon="tabler-trash" 
                    size="x-small" 
                    variant="tonal" 
                    color="error"
                    rounded="lg"
                    @click.stop="openDeleteDialog(category)"
                  />
                </div>
                <VChip
                  v-else
                  size="x-small"
                  color="secondary"
                  variant="flat"
                  class="text-uppercase font-weight-bold"
                >
                  System
                </VChip>
              </div>
              
              <div class="mb-4">
                <div class="d-flex align-center gap-2 mb-1">
                  <h3 class="text-h6 font-weight-bold text-truncate">
                    {{ category.name }}
                  </h3>
                  <VIcon
                    v-if="category.is_system"
                    icon="tabler-shield-check"
                    size="16"
                    color="primary"
                  />
                </div>
                <p 
                  v-if="category.description && category.description !== category.name" 
                  class="text-body-2 text-medium-emphasis line-clamp-2 mb-0"
                >
                  {{ category.description }}
                </p>
                <p
                  v-else
                  class="text-caption text-disabled font-italic mb-0"
                >
                  Standard {{ typeLabel.toLowerCase() }} configuration
                </p>
              </div>

              <!-- Footer -->
              <div class="mt-auto pt-4 border-t d-flex align-center justify-space-between">
                <VChip 
                  size="x-small" 
                  :color="category.is_active ? 'success' : 'secondary'" 
                  variant="tonal"
                  label
                  class="rounded-sm"
                >
                  {{ category.is_active ? 'ACTIVE' : 'INACTIVE' }}
                </VChip>
                
                <VSwitch
                  v-model="category.is_active"
                  density="compact"
                  hide-details
                  color="success"
                  @click.stop
                  @update:model-value="toggleStatus(category)"
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
          :items="categories"
          density="comfortable"
          hover
          @click:row="(e, { item }) => selectCategory(item.id)"
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center gap-2">
              <VIcon
                v-if="props.state.selectedCategoryId === item.id"
                icon="tabler-check"
                color="primary"
                size="18"
              />
              <span :class="{ 'font-weight-bold text-primary': props.state.selectedCategoryId === item.id }">
                {{ item.name }}
              </span>
              <VIcon
                v-if="item.is_system"
                icon="tabler-lock"
                size="14"
                color="medium-emphasis"
              />
            </div>
          </template>
          <template #item.is_active="{ item }">
            <VChip
              :color="item.is_active ? 'success' : 'error'"
              size="x-small"
              label
            >
              {{ item.is_active ? 'Active' : 'Inactive' }}
            </VChip>
          </template>
          <template #item.actions="{ item }">
            <div
              v-if="!item.is_system"
              class="d-flex gap-1"
            >
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
            <VChip
              v-else
              size="x-small"
              color="secondary"
              variant="tonal"
            >
              SYSTEM
            </VChip>
          </template>
        </VDataTable>
      </VCard>
    </template>

    <div
      v-else
      class="text-center py-12 bg-light rounded-lg border-dashed"
    >
      <VIcon
        icon="tabler-hierarchy-2"
        size="48"
        color="medium-emphasis"
        class="mb-4"
      />
      <h3 class="text-h6 font-weight-bold mb-2">
        No {{ typeLabel }}s Found
      </h3>
      <p class="text-body-2 text-medium-emphasis mb-6">
        You can skip this step if this service doesn't have sub-types.
      </p>
      <VBtn
        variant="tonal"
        color="primary"
        @click="openAddDrawer"
      >
        Add First {{ typeLabel }}
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
            Delete {{ typeLabel }}?
          </h2>

          <p class="text-body-2 mt-1 text-medium-emphasis">
            Delete <strong class="text-primary">{{ deleteItem?.name }}</strong> permanently?
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
            @click="deleteCategory"
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
          <!-- Drawer Header -->
          <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header">
            <div>
              <h3 class="text-h6 font-weight-bold">
                {{ isEdit ? 'Update' : 'Create' }} {{ typeLabel }}
              </h3>
              <p class="text-caption mb-0 text-medium-emphasis">
                Manage {{ typeLabel.toLowerCase() }}s for your services.
              </p>
            </div>
            <VBtn
              icon="tabler-x"
              variant="text"
              @click="drawerOpen = false"
            />
          </div>

          <!-- Scrollable Content -->
          <div class="flex-grow-1 overflow-y-auto pa-6">
            <VForm
              id="typeForm"
              @submit.prevent="submit"
            >
              <VCard
                variant="tonal"
                color="primary"
                class="pa-4 mb-6 border-0"
              >
                <h4 class="text-subtitle-1 font-weight-bold mb-4">
                  {{ typeLabel }} Information
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
                  v-if="isVeterinary"
                  v-model="form.linked_capability"
                  :items="veterinaryCapabilities"
                  item-title="title"
                  item-value="value"
                  :item-props="true"
                  label="Linked Capability *"
                  placeholder="Map to system capability"
                  class="mb-4"
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  :menu-props="{ zIndex: 10000 }"
                  hint="Required for system workflow integration"
                  persistent-hint
                />

                <AppTextField
                  v-model="form.name"
                  :label="nameLabel"
                  placeholder="e.g. Hair Cutting"
                  class="mb-4"
                  required
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                />

                <AppTextarea
                  v-model="form.description"
                  :label="descriptionLabel"
                  placeholder="Briefly describe this..."
                  class="mb-0"
                  density="comfortable"
                  variant="outlined"
                  bg-color="surface"
                  rows="3"
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
              
              <!-- Buttons moved inside form for better mobile/scroll handling -->
              <div class="d-flex justify-end gap-4 mt-4">
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
                >
                  {{ isEdit ? 'Update' : 'Create' }} {{ typeLabel }}
                </VBtn>
              </div>
            </VForm>
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
  z-index: 100000 !important; /* Ensure it's above navbar */
  
  .v-navigation-drawer__content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>
