<template>
  <section class="premium-page-container pa-4">
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-end mb-8">
      <div>
        <h1 class="text-h3 font-weight-bold mb-2 gradient-text">
          Pet Breeds
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          Professional management of pet categories and their associated breeds
        </p>
      </div>
      <VBtn
        color="primary"
        size="large"
        prepend-icon="tabler-plus"
        class="elevation-4 premium-btn action-btn-top"
        @click="openAddDrawer"
      >
        Create New Breed
      </VBtn>
    </div>

    <!-- STATS OVERVIEW -->
    <VRow class="mb-8">
      <VCol
        cols="12"
        sm="4"
      >
        <VCard class="stats-card glass-morphism pa-2">
          <div class="d-flex align-center">
            <VAvatar
              color="primary"
              variant="tonal"
              size="56"
              class="rounded-lg me-4"
            >
              <VIcon
                icon="tabler-paw"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Total Breeds
              </div>
              <div class="text-h4 font-weight-bold">
                {{ totalItems }}
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <VCard class="stats-card glass-morphism pa-2">
          <div class="d-flex align-center">
            <VAvatar
              color="info"
              variant="tonal"
              size="56"
              class="rounded-lg me-4"
            >
              <VIcon
                icon="tabler-category"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Pet Types
              </div>
              <div class="text-h4 font-weight-bold">
                {{ petTypes.length }}
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <VCard class="stats-card glass-morphism pa-2">
          <div class="d-flex align-center">
            <VAvatar
              color="success"
              variant="tonal"
              size="56"
              class="rounded-lg me-4"
            >
              <VIcon
                icon="tabler-check"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Active System
              </div>
              <div class="text-h4 font-weight-bold">
                Live
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <!-- PET TYPE TABS -->
    <div class="tabs-container mb-6">
      <VTabs
        v-model="selectedPetType"
        align-tabs="start"
        class="premium-tabs-v2"
        color="primary"
        hide-slider
      >
        <VTab
          :value="null"
          class="rounded-pill me-2"
        >
          All Types
        </VTab>
        <VTab
          v-for="type in petTypes"
          :key="type.id"
          :value="type.id"
          class="rounded-pill me-2"
        >
          <VIcon
            icon="tabler-paw"
            size="18"
            class="me-2"
          />
          {{ type.name }}
        </VTab>
      </VTabs>
    </div>

    <!-- MAIN CONTENT CARD -->
    <VCard class="premium-card-v2 glass-morphism overflow-visible">
      <VCardText class="pa-6">
        <div class="table-controls d-flex align-center mb-6">
          <AppTextField
            v-model="searchQuery"
            placeholder="Search breeds by name..."
            prepend-inner-icon="tabler-search"
            variant="solo"
            class="premium-search-v2 flex-grow-1"
            clearable
            hide-details
          />
        </div>

        <!-- TABLE SECTION WITH TRANSITION -->
        <Transition
          name="fade-slide"
          mode="out-in"
        >
          <div :key="selectedPetType">
            <VDataTable
              v-model:items-per-page="itemsPerPage"
              v-model:page="page"
              :items="filteredBreeds"
              item-value="id"
              :headers="dynamicHeaders"
              class="premium-table-v2"
              hover
              density="comfortable"
              :loading="loadingTable"
            >
              <!-- CUSTOM LOADING STATE -->
              <template #loading>
                <div class="skeleton-wrapper pa-4">
                  <VSkeletonLoader
                    v-for="n in 5"
                    :key="n"
                    type="table-row"
                    class="mb-2"
                  />
                </div>
              </template>

              <!-- PET TYPE NAME -->
              <template #item.petType="{ item }">
                <div class="d-flex align-center list-item-animation">
                  <VAvatar
                    size="36"
                    color="primary"
                    variant="tonal"
                    class="me-3 elevation-1"
                  >
                    <VIcon
                      icon="tabler-paw"
                      size="20"
                    />
                  </VAvatar>
                  <span class="font-weight-bold text-high-emphasis">
                    {{ petTypes.find(pt => pt.id === item.petType)?.name || "—" }}
                  </span>
                </div>
              </template>

              <!-- BREED -->
              <template #item.breed="{ item }">
                <span class="text-body-1 font-weight-semibold breed-name">{{ item.breed }}</span>
              </template>

              <!-- ACTIONS -->
              <template #item.actions="{ item }">
                <div class="d-flex align-center gap-3">
                  <VTooltip
                    text="Edit Breed"
                    location="top"
                    offset="10"
                  >
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        variant="tonal"
                        color="info"
                        size="x-small"
                        class="action-btn-v2"
                        @click="openEditDrawer(item)"
                      >
                        <VIcon
                          icon="tabler-edit"
                          size="18"
                        />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip
                    text="Delete Breed"
                    location="top"
                    offset="10"
                  >
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        variant="tonal"
                        color="error"
                        size="x-small"
                        class="action-btn-v2"
                        @click="openDeleteDialog(item)"
                      >
                        <VIcon
                          icon="tabler-trash"
                          size="18"
                        />
                      </VBtn>
                    </template>
                  </VTooltip>
                </div>
              </template>

              <!-- NO DATA STATE -->
              <template #no-data>
                <div class="empty-state pa-12 text-center">
                  <div class="empty-icon-wrapper mb-6">
                    <VIcon
                      icon="tabler-database-x"
                      size="80"
                      color="secondary"
                    />
                  </div>
                  <h3 class="text-h5 font-weight-bold mb-2">
                    No results found
                  </h3>
                  <p class="text-body-1 text-medium-emphasis">
                    We couldn't find any breeds matching your current filters.
                  </p>
                </div>
              </template>

              <!-- PAGINATION -->
              <template #bottom>
                <VDivider />
                <div class="pa-4 d-flex justify-end">
                  <TablePagination
                    v-model:page="page"
                    :items-per-page="itemsPerPage"
                    :total-items="totalFilteredCount"
                  />
                </div>
              </template>
            </VDataTable>
          </div>
        </Transition>
      </VCardText>
    </VCard>

    <!-- RIGHT DRAWER (Premium Builder Style) -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="480"
      class="premium-drawer-v2"
      border="none"
      scrim="rgba(15, 23, 42, 0.4)"
    >
      <div class="drawer-header-v2 pa-8 pb-6">
        <div class="d-flex justify-space-between align-center mb-4">
          <VAvatar
            color="primary"
            variant="tonal"
            size="48"
          >
            <VIcon
              :icon="isEdit ? 'tabler-edit' : 'tabler-plus'"
              size="24"
            />
          </VAvatar>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="secondary"
            @click="closeDrawer"
          />
        </div>
        <h3 class="text-h4 font-weight-bold mb-1">
          {{ isEdit ? "Update Breed" : "New Breed" }}
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Fill in the details to configure the pet breed
        </p>
      </div>

      <VDivider class="mx-8 opacity-50" />

      <div class="drawer-content-v2 pa-8 flex-grow-1 overflow-y-auto">
        <VForm ref="refForm">
          <div class="form-group mb-8">
            <div class="input-label-v2 mb-3">
              Pet Classification
            </div>
            <VSelect
              v-model="form.petType"
              :items="petTypes"
              item-title="name"
              item-value="id"
              placeholder="Select Classification"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="tabler-category"
              class="premium-field-v2"
            >
              <template #item="{ props, item }">
                <VListItem
                  v-bind="props"
                  :title="item.raw.name"
                  class="rounded-lg mx-2 my-1"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-paw"
                      size="18"
                      class="me-2"
                      color="primary"
                    />
                  </template>
                </VListItem>
              </template>
            </VSelect>
          </div>

          <div class="form-group mb-8">
            <div class="input-label-v2 mb-3">
              Breed Name
            </div>
            <AppTextField
              v-model="form.breed"
              placeholder="e.g., Golden Retriever"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="tabler-paw"
              class="premium-field-v2"
              @keyup.enter="submit"
            />
          </div>
        </VForm>
      </div>

      <div class="drawer-footer-v2 pa-8 pt-4">
        <div class="d-flex gap-4">
          <VBtn
            block
            variant="tonal"
            color="secondary"
            size="large"
            class="rounded-xl flex-1"
            @click="closeDrawer"
          >
            Cancel
          </VBtn>
          <VBtn
            block
            :loading="loading"
            color="primary"
            size="large"
            class="rounded-xl flex-1 elevation-4"
            @click="submit"
          >
            {{ isEdit ? "Update" : "Create" }}
          </VBtn>
        </div>
      </div>
    </VNavigationDrawer>

    <!-- DELETE DIALOG (Premium Polish) -->
    <VDialog
      v-model="deleteDialog"
      width="440"
      persistent
      transition="scale-transition"
    >
      <VCard class="pa-8 pb-6 rounded-2xl glass-morphism-v2 elevation-24">
        <div class="text-center">
          <div class="mb-6 d-inline-block">
            <VAvatar
              size="80"
              color="error"
              variant="tonal"
              class="floating-animation"
            >
              <VIcon
                icon="tabler-alert-circle"
                size="48"
              />
            </VAvatar>
          </div>

          <h3 class="text-h4 font-weight-bold mb-3">
            Confirm Deletion
          </h3>
          <p class="text-body-1 text-medium-emphasis mb-8">
            This will permanently remove <strong class="text-high-emphasis">{{ deleteItem?.breed }}</strong> from the breeds list. This action is irreversible.
          </p>
        </div>

        <div class="d-flex gap-4">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-xl flex-1"
            size="large"
            @click="deleteDialog = false"
          >
            Go Back
          </VBtn>

          <VBtn
            color="error"
            class="rounded-xl flex-1 elevation-4"
            size="large"
            prepend-icon="tabler-trash"
            @click="deleteBreed"
          >
            Confirm
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>

<script>
import { superAdminApi as axios } from "@/plugins/axios"
import { ref, onMounted, watch, computed } from "vue"
import { useCookie } from "@/@core/composable/useCookie"

export default {
  name: "PetBreedsPage",

  setup() {
    const baseURL = "/api/superadmin/pet-breeds/"
    const petTypeURL = "/api/superadmin/pet-types/"

    // States
    const petBreeds = ref([])
    const petTypes = ref([])
    const selectedPetType = ref(null)
    const loadingTable = ref(false)
    const refForm = ref(null)

    const baseHeaders = [
      { title: "CLASSIFICATION", key: "petType", align: 'start', sortable: false },
      { title: "BREED NAME", key: "breed", align: 'start' },
      { title: "ACTIONS", key: "actions", sortable: false, align: 'end' },
    ]

    const dynamicHeaders = computed(() => {
      if (selectedPetType.value) {
        return baseHeaders.filter(h => h.key !== 'petType')
      }
      
      return baseHeaders
    })

    const page = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const searchQuery = ref("")

    // FILTERED BREEDS (CLIENT-SIDE)
    const filteredBreeds = computed(() => {
      let result = [...petBreeds.value]
      
      if (selectedPetType.value) {
        result = result.filter(item => item.petType === selectedPetType.value)
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()

        result = result.filter(item => item.breed.toLowerCase().includes(query))
      }
      
      return result
    })

    const totalFilteredCount = computed(() => filteredBreeds.value.length)

    const drawerOpen = ref(false)
    const isEdit = ref(false)
    const loading = ref(false)
    const editId = ref(null)

    const deleteDialog = ref(false)
    const deleteItem = ref(null)

    const form = ref({
      petType: "",
      breed: "",
    })

    // Load all Pet Types
    const fetchPetTypes = async () => {
      try {
        const res = await axios.get(petTypeURL)

        petTypes.value = res.data.results || res.data
      } catch (error) {
        console.error("Error fetching pet types:", error)
      }
    }

    // Load breeds (FETCH ALL for client-side filtering)
    const fetchBreeds = async () => {
      loadingTable.value = true
      try {
        const params = {
          page_size: 1000, 
        }

        const res = await axios.get(baseURL, { params })

        petBreeds.value = res.data.results || res.data
        totalItems.value = res.data.count || res.data.length
      } catch (error) {
        console.error("Error fetching breeds:", error)
      } finally {
        setTimeout(() => {
          loadingTable.value = false
        }, 300)
      }
    }

    onMounted(() => {
      fetchPetTypes()
      fetchBreeds()
    })

    const updateOptions = () => fetchBreeds()

    // Drawer actions
    const openAddDrawer = () => {
      isEdit.value = false
      form.value = { 
        petType: selectedPetType.value || "", 
        breed: "", 
      }
      drawerOpen.value = true
    }

    const openEditDrawer = item => {
      isEdit.value = true
      editId.value = item.id

      form.value = {
        petType: item.petType,
        breed: item.breed,
      }

      drawerOpen.value = true
    }

    const closeDrawer = () => (drawerOpen.value = false)

    // Submit
    const submit = async () => {
      if (!form.value.petType || !form.value.breed) return
      
      loading.value = true

      const payload = {
        petType: form.value.petType,
        breed: form.value.breed,
      }

      try {
        if (isEdit.value) {
          await axios.put(baseURL + editId.value + "/", payload)
        } else {
          await axios.post(baseURL, payload)
        }

        drawerOpen.value = false
        fetchBreeds()
      } catch (error) {
        console.error("Error submitting breed:", error)
      } finally {
        loading.value = false
      }
    }

    // Delete
    const openDeleteDialog = item => {
      deleteItem.value = item
      deleteDialog.value = true
    }

    const deleteBreed = async () => {
      try {
        await axios.delete(baseURL + deleteItem.value.id + "/")
        deleteDialog.value = false
        fetchBreeds()
      } catch (error) {
        console.error("Error deleting breed:", error)
      }
    }

    return {
      petBreeds,
      petTypes,
      selectedPetType,
      dynamicHeaders,
      page,
      itemsPerPage,
      totalItems,
      totalFilteredCount,
      loadingTable,
      filteredBreeds,
      searchQuery,

      drawerOpen,
      form,
      isEdit,
      loading,
      refForm,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      updateOptions,

      deleteDialog,
      deleteItem,
      deleteBreed,
      submit,
    }
  },
}
</script>

<style scoped>
/* Page Layout */
.premium-page-container {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Typography & Colors */
.gradient-text {
  background: linear-gradient(135deg, #7367f0 0%, #ce9ffc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
}

/* Glassmorphism V2 */
.glass-morphism {
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.glass-morphism-v2 {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

/* Stats Cards */
.stats-card {
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
}

.stats-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  border-color: rgba(115, 103, 240, 0.3);
}

/* Custom Tabs V2 */
.premium-tabs-v2 :deep(.v-tabs-bar) {
  background-color: transparent !important;
  height: 48px;
}

.premium-tabs-v2 :deep(.v-tab) {
  text-transform: none;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s ease;
  letter-spacing: 0.2px;
}

.premium-tabs-v2 :deep(.v-tab--selected) {
  background: white !important;
  color: #7367f0 !important;
  box-shadow: 0 4px 12px rgba(115, 103, 240, 0.15) !important;
}

/* Main Table Card V2 */
.premium-card-v2 {
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(115, 103, 240, 0.05);
}

/* Premium Search V2 */
.premium-search-v2 :deep(.v-field) {
  border-radius: 16px !important;
  background: white !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) !important;
  border: 1px solid #f1f5f9 !important;
  transition: all 0.3s ease;
}

.premium-search-v2 :deep(.v-field--focused) {
  border-color: #7367f0 !important;
  box-shadow: 0 0 0 4px rgba(115, 103, 240, 0.1) !important;
}

/* Premium Table V2 */
.premium-table-v2 {
  background: transparent !important;
}

.premium-table-v2 :deep(th) {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.08em;
  color: #64748b !important;
  background: rgba(248, 250, 252, 0.8) !important;
  height: 60px !important;
  border-bottom: 2px solid #f1f5f9 !important;
}

.premium-table-v2 :deep(td) {
  height: 72px !important;
  border-bottom: 1px solid #f1f5f9 !important;
}

.premium-table-v2 :deep(tr:hover) {
  background-color: rgba(115, 103, 240, 0.02) !important;
}

/* Breed Name Styling */
.breed-name {
  color: #1e293b;
  letter-spacing: -0.2px;
}

/* Action Buttons V2 */
.action-btn-v2 {
  border-radius: 12px !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-btn-v2:hover {
  transform: scale(1.1) rotate(3deg);
}

/* Premium Drawer V2 */
.premium-drawer-v2 {
  display: flex !important;
  flex-direction: column !important;
}

.drawer-header-v2 {
  background: linear-gradient(to bottom, #fcfcfd, #ffffff);
}

.input-label-v2 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.2px;
}

.premium-field-v2 :deep(.v-field) {
  border-radius: 14px !important;
  border: 1.5px solid #e2e8f0 !important;
  transition: border-color 0.2s ease;
}

.premium-field-v2 :deep(.v-field--focused) {
  border-color: #7367f0 !important;
}

.drawer-footer-v2 {
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

/* Animations */
.list-item-animation {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.floating-animation {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* Custom Buttons */
.premium-btn {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.4px;
  border-radius: 14px;
  padding: 0 24px !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.premium-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px rgba(115, 103, 240, 0.25) !important;
}

.action-btn-top {
  height: 52px !important;
}

/* Empty State */
.empty-icon-wrapper {
  background: rgba(148, 163, 184, 0.1);
  display: inline-flex;
  padding: 24px;
  border-radius: 30px;
}
</style>
