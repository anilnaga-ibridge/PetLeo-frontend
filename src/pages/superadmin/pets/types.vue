<template>
  <section class="premium-page-container pa-4">
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-end mb-8">
      <div>
        <h1 class="text-h3 font-weight-bold mb-2 gradient-text">
          Pet Classifications
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          Define and manage top-level pet categories for the system
        </p>
      </div>
      <VBtn
        color="primary"
        size="large"
        prepend-icon="tabler-plus"
        class="elevation-4 premium-btn action-btn-top"
        @click="openAddDrawer"
      >
        Add Classification
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
                icon="tabler-category"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Total Types
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
                icon="tabler-paw"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                System Keys
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
                icon="tabler-shield-check"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Status
              </div>
              <div class="text-h4 font-weight-bold">
                Active
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>

    <!-- MAIN CONTENT CARD -->
    <VCard class="premium-card-v2 glass-morphism overflow-visible">
      <VCardText class="pa-6">
        <div class="table-controls d-flex align-center mb-6">
          <AppTextField
            v-model="searchQuery"
            placeholder="Search classification by name..."
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
          <div key="table-container">
            <VDataTable
              v-model:items-per-page="itemsPerPage"
              v-model:page="page"
              :items="filteredTypes"
              item-value="id"
              :headers="headers"
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

              <!-- NAME -->
              <template #item.name="{ item }">
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
                    {{ item.name }}
                  </span>
                </div>
              </template>

              <!-- KEY -->
              <template #item.key="{ item }">
                <VChip
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="font-weight-bold px-4 rounded-pill"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-code"
                      size="14"
                      class="me-1"
                    />
                  </template>
                  {{ item.key }}
                </VChip>
              </template>

              <!-- ACTIONS -->
              <template #item.actions="{ item }">
                <div class="d-flex align-center gap-3">
                  <VTooltip
                    text="Edit Classification"
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
                    text="Delete Classification"
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
                    We couldn't find any classifications matching your search.
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
          {{ isEdit ? "Update Classification" : "New Classification" }}
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Define a main category for pet breeds
        </p>
      </div>

      <VDivider class="mx-8 opacity-50" />

      <div class="drawer-content-v2 pa-8 flex-grow-1 overflow-y-auto">
        <VForm ref="refForm">
          <div class="form-group mb-8">
            <div class="input-label-v2 mb-3">
              Classification Name
            </div>
            <AppTextField
              v-model="form.name"
              placeholder="e.g., Canine, Feline, Aquatic"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="tabler-paw"
              class="premium-field-v2"
              @keyup.enter="submit"
            />
            <p class="text-caption text-medium-emphasis mt-2">
              Note: The system key will be automatically generated from the name.
            </p>
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
            This will permanently remove <strong class="text-high-emphasis">{{ deleteItem?.name }}</strong>. 
            Related breeds may be affected. This action is irreversible.
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
            @click="deletePetType"
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

export default {
  name: "PetTypesPage",

  setup() {
    const baseURL = "/api/superadmin/pet-types/"

    // Table states
    const petTypes = ref([])
    const loadingTable = ref(false)

    const headers = [
      { title: "CLASSIFICATION", key: "name", align: 'start' },
      { title: "SYSTEM KEY", key: "key", align: 'start' },
      { title: "ACTIONS", key: "actions", sortable: false, align: 'end' },
    ]

    const page = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const searchQuery = ref("")

    // FILTERED TYPES (CLIENT-SIDE)
    const filteredTypes = computed(() => {
      let result = [...petTypes.value]
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()

        result = result.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.key.toLowerCase().includes(query),
        )
      }
      
      return result
    })

    const totalFilteredCount = computed(() => filteredTypes.value.length)

    // Drawer states
    const drawerOpen = ref(false)
    const isEdit = ref(false)
    const loading = ref(false)
    const editId = ref(null)
    const refForm = ref(null)

    // Delete states
    const deleteDialog = ref(false)
    const deleteItem = ref(null)

    const form = ref({
      name: "",
    })

    // Fetch API (ALL for client-side filtering)
    const fetchPetTypes = async () => {
      loadingTable.value = true
      try {
        const params = {
          page_size: 1000, 
        }

        const res = await axios.get(baseURL, { params })

        petTypes.value = res.data.results || res.data
        totalItems.value = res.data.count || res.data.length
      } catch (error) {
        console.error("Error fetching pet types:", error)
      } finally {
        setTimeout(() => {
          loadingTable.value = false
        }, 300)
      }
    }

    onMounted(fetchPetTypes)

    const updateOptions = () => fetchPetTypes()

    // Add drawer
    const openAddDrawer = () => {
      isEdit.value = false
      form.value = { name: "" }
      drawerOpen.value = true
    }

    // Edit drawer
    const openEditDrawer = item => {
      isEdit.value = true
      editId.value = item.id

      form.value = { name: item.name }
      drawerOpen.value = true
    }

    const closeDrawer = () => (drawerOpen.value = false)

    // Submit
    const submit = async () => {
      if (!form.value.name) return
      
      loading.value = true

      try {
        if (isEdit.value) {
          await axios.put(baseURL + editId.value + "/", form.value)
        } else {
          await axios.post(baseURL, form.value)
        }

        drawerOpen.value = false
        fetchPetTypes()
      } catch (error) {
        console.error("Error submitting pet type:", error)
      } finally {
        loading.value = false
      }
    }

    // Delete flow
    const openDeleteDialog = item => {
      deleteItem.value = item
      deleteDialog.value = true
    }

    const deletePetType = async () => {
      try {
        await axios.delete(baseURL + deleteItem.value.id + "/")
        deleteDialog.value = false
        fetchPetTypes()
      } catch (error) {
        console.error("Error deleting pet type:", error)
      }
    }

    return {
      petTypes,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,
      loadingTable,
      filteredTypes,
      totalFilteredCount,

      drawerOpen,
      form,
      isEdit,
      loading,
      refForm,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deletePetType,

      updateOptions,
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
