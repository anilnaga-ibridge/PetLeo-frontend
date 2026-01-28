<template>
  <section class="premium-page-container pa-4">
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-end mb-8">
      <div>
        <h1 class="text-h3 font-weight-bold mb-2 gradient-text">
          Roles Management
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          Configure system roles and define access control policies
        </p>
      </div>
      <VBtn
        color="primary"
        size="large"
        prepend-icon="tabler-plus"
        class="elevation-4 premium-btn action-btn-top"
        @click="openAddDrawer"
      >
        Create New Role
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
                icon="tabler-user-shield"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Total Roles
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
                icon="tabler-key"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Total Permissions
              </div>
              <div class="text-h4 font-weight-bold">
                {{ allPermissions.length }}
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
                icon="tabler-lock-check"
                size="32"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold">
                Security
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
            placeholder="Search roles by name or description..."
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
              :items="filteredRoles"
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

              <!-- ID -->
              <template #item.id="{ item }">
                <span class="text-caption font-weight-bold text-medium-emphasis">{{ item.id }}</span>
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
                      icon="tabler-shield"
                      size="20"
                    />
                  </VAvatar>
                  <span class="font-weight-bold text-high-emphasis">
                    {{ item.name }}
                  </span>
                </div>
              </template>

              <!-- PERMISSIONS -->
              <template #item.permissions="{ item }">
                <div
                  class="d-flex flex-wrap gap-1"
                  style="max-width:320px;"
                >
                  <VChip
                    v-for="p in (item.permission_details || []).slice(0, 3)"
                    :key="`r-${item.id}-p-${p.id}`"
                    variant="tonal"
                    size="x-small"
                    color="primary"
                    class="rounded-pill font-weight-semibold"
                  >
                    {{ p.codename }}
                  </VChip>
                  <VChip
                    v-if="(item.permission_details || []).length > 3"
                    variant="tonal"
                    size="x-small"
                    color="secondary"
                    class="rounded-pill font-weight-semibold"
                  >
                    +{{ item.permission_details.length - 3 }}
                  </VChip>
                  <span
                    v-if="!(item.permission_details && item.permission_details.length)"
                    class="text-caption text-disabled italic"
                  >No permissions assigned</span>
                </div>
              </template>

              <!-- ACTIONS -->
              <template #item.actions="{ item }">
                <div class="d-flex align-center gap-3">
                  <VTooltip
                    text="Edit Role"
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
                    text="Manage Permissions"
                    location="top"
                    offset="10"
                  >
                    <template #activator="{ props }">
                      <VBtn
                        v-bind="props"
                        icon
                        variant="tonal"
                        color="secondary"
                        size="x-small"
                        class="action-btn-v2"
                        @click="openManagePermissionsDrawer(item)"
                      >
                        <VIcon
                          icon="tabler-key"
                          size="18"
                        />
                      </VBtn>
                    </template>
                  </VTooltip>

                  <VTooltip
                    text="Delete Role"
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
                      icon="tabler-shield-off"
                      size="80"
                      color="secondary"
                    />
                  </div>
                  <h3 class="text-h5 font-weight-bold mb-2">
                    No roles found
                  </h3>
                  <p class="text-body-1 text-medium-emphasis">
                    We couldn't find any roles matching your search criteria.
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

    <!-- RIGHT DRAWER (Role Builder) -->
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
          {{ isEdit ? "Update Role" : "New Role" }}
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Configure role identity and core description
        </p>
      </div>

      <VDivider class="mx-8 opacity-50" />

      <div class="drawer-content-v2 pa-8 flex-grow-1 overflow-y-auto">
        <VForm ref="roleFormRef">
          <div class="form-group mb-8">
            <div class="input-label-v2 mb-3">
              Role Name *
            </div>
            <AppTextField
              v-model="form.name"
              placeholder="e.g., system_admin, clinic_manager"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="tabler-shield"
              class="premium-field-v2"
            />
          </div>

          <div class="form-group mb-8">
            <div class="input-label-v2 mb-3">
              Description
            </div>
            <AppTextField
              v-model="form.description"
              placeholder="What does this role represent?"
              variant="outlined"
              density="comfortable"
              textarea
              rows="3"
              class="premium-field-v2"
            />
          </div>

          <div class="form-group mb-0">
            <div class="input-label-v2 mb-3">
              Initial Permissions
            </div>
            <VSelect
              v-model="form.permissions"
              :items="allPermissions"
              item-title="codename"
              item-value="id"
              placeholder="Pick base permissions"
              multiple
              chips
              closable-chips
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="tabler-key"
              class="premium-field-v2"
            >
              <template #chip="{ props, item }">
                <VChip
                  v-bind="props"
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="rounded-pill"
                />
              </template>
            </VSelect>
          </div>
        </VForm>
      </div>

      <div class="drawer-footer-v2 pa-6 px-8">
        <div class="d-flex gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-lg flex-1"
            size="default"
            @click="closeDrawer"
          >
            Cancel
          </VBtn>
          <VBtn
            :loading="loading"
            color="primary"
            class="rounded-lg flex-1 elevation-2"
            size="default"
            @click="submit"
          >
            {{ isEdit ? "Update" : "Create" }}
          </VBtn>
        </div>
      </div>
    </VNavigationDrawer>

    <!-- RIGHT DRAWER (Permission Assignment Builder) -->
    <VNavigationDrawer
      v-model="permDrawerOpen"
      location="end"
      temporary
      width="500"
      class="premium-drawer-v2"
      border="none"
      scrim="rgba(15, 23, 42, 0.4)"
    >
      <div class="drawer-header-v2 pa-8 pb-6">
        <div class="d-flex justify-space-between align-center mb-4">
          <VAvatar
            color="secondary"
            variant="tonal"
            size="48"
          >
            <VIcon
              icon="tabler-key"
              size="24"
            />
          </VAvatar>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="secondary"
            @click="closePermDrawer"
          />
        </div>
        <h3 class="text-h4 font-weight-bold mb-1">
          Manage Permissions
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Role: <strong class="text-primary">{{ selectedRole?.name }}</strong>
        </p>
      </div>

      <VDivider class="mx-8 opacity-50" />

      <div class="drawer-content-v2 pa-8 flex-grow-1 overflow-y-auto">
        <div class="search-container mb-6">
          <AppTextField
            v-model="permSearchFilter"
            placeholder="Search permissions..."
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="compact"
            class="premium-field-v2"
            clearable
            hide-details
          />
        </div>
        
        <div class="permissions-list-v2">
          <TransitionGroup name="list-fade">
            <div 
              v-for="perm in filteredAvailablePermissions" 
              :key="perm.id"
              class="permission-item-v2 d-flex align-center pa-3 mb-2 rounded-lg"
              :class="{ 'is-selected': permSelection.includes(perm.id) }"
              @click="togglePermission(perm.id)"
            >
              <VCheckbox
                v-model="permSelection"
                :value="perm.id"
                color="primary"
                hide-details
                readonly
                class="me-3"
              />
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-bold">
                  {{ perm.codename }}
                </div>
                <div class="text-caption text-medium-emphasis mt-0.5">
                  ID: {{ perm.id }} | System Access
                </div>
              </div>
            </div>
          </TransitionGroup>
          <div
            v-if="filteredAvailablePermissions.length === 0"
            class="text-center pa-8 text-medium-emphasis italic"
          >
            No permissions matching search
          </div>
        </div>
      </div>

      <div class="drawer-footer-v2 pa-6 px-8">
        <div class="d-flex gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            class="rounded-lg flex-1"
            size="default"
            @click="closePermDrawer"
          >
            Cancel
          </VBtn>
          <VBtn
            :loading="permLoading"
            color="primary"
            class="rounded-lg flex-1 elevation-2"
            size="default"
            @click="saveRolePermissions"
          >
            Save Changes
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
            This will permanently remove the <strong class="text-high-emphasis">{{ deleteItem?.name }}</strong> role. 
            Users assigned to this role will lose their associated access.
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
            @click="deleteRole"
          >
            Confirm
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>

<script>
import { authApi as axios } from "@/plugins/axios"
import { ref, onMounted, watch, computed } from "vue"

export default {
  name: "RolesPage",

  setup() {
    const baseURL = "/auth/roles/"
    const permURL = "/auth/permissions/"

    // Data States
    const roles = ref([])
    const allPermissions = ref([])
    const loadingTable = ref(false)

    const headers = [
      { title: "ID", key: "id", align: 'start', sortable: true },
      { title: "ROLE IDENTITY", key: "name", align: 'start' },
      { title: "DESCRIPTION", key: "description", align: 'start' },
      { title: "PERMISSIONS", key: "permissions", sortable: false, align: 'start' },
      { title: "ACTIONS", key: "actions", sortable: false, align: 'end' },
    ]

    const page = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const searchQuery = ref("")
    const permSearchFilter = ref("")

    // FILTERED ROLES (CLIENT-SIDE)
    const filteredRoles = computed(() => {
      let result = [...roles.value]
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()

        result = result.filter(r => 
          r.name.toLowerCase().includes(query) || 
          (r.description && r.description.toLowerCase().includes(query)) ||
          r.id.toString().includes(query),
        )
      }
      
      return result
    })

    const totalFilteredCount = computed(() => filteredRoles.value.length)

    // Permission filtering in drawer
    const filteredAvailablePermissions = computed(() => {
      if (!permSearchFilter.value) return allPermissions.value
      const query = permSearchFilter.value.toLowerCase()
      
      return allPermissions.value.filter(p => 
        p.codename.toLowerCase().includes(query) || 
        p.id.toString().includes(query),
      )
    })

    // Drawer states
    const drawerOpen = ref(false)
    const isEdit = ref(false)
    const loading = ref(false)
    const editId = ref(null)
    const roleFormRef = ref(null)

    const permDrawerOpen = ref(false)
    const permLoading = ref(false)
    const selectedRole = ref(null)
    const permSelection = ref([])

    // Delete states
    const deleteDialog = ref(false)
    const deleteItem = ref(null)

    const form = ref({
      name: "",
      description: "",
      permissions: [],
    })

    // API Handlers
    const fetchAllPermissions = async () => {
      try {
        const res = await axios.get(permURL)

        allPermissions.value = res.data.results || res.data || []
      } catch (err) {
        console.error("Error fetching permissions:", err)
      }
    }

    const fetchRoles = async () => {
      loadingTable.value = true
      try {
        const params = {
          page_size: 1000, // Fetch all for snappy local filtering
        }

        const res = await axios.get(baseURL, { params })

        roles.value = res.data.results || res.data
        totalItems.value = res.data.count || res.data.length
      } catch (err) {
        console.error("Error fetching roles:", err)
      } finally {
        setTimeout(() => {
          loadingTable.value = false
        }, 300)
      }
    }

    onMounted(() => {
      fetchAllPermissions()
      fetchRoles()
    })

    const updateOptions = () => fetchRoles()

    // Drawer Actions
    const openAddDrawer = () => {
      isEdit.value = false
      editId.value = null
      form.value = { name: "", description: "", permissions: [] }
      drawerOpen.value = true
    }

    const openEditDrawer = item => {
      isEdit.value = true
      editId.value = item.id
      form.value = {
        name: item.name,
        description: item.description,
        permissions: (item.permission_details || []).map(p => p.id),
      }
      drawerOpen.value = true
    }

    const closeDrawer = () => (drawerOpen.value = false)

    const openManagePermissionsDrawer = item => {
      selectedRole.value = item
      permSelection.value = (item.permission_details || []).map(p => p.id)
      permSearchFilter.value = ""
      permDrawerOpen.value = true
    }

    const closePermDrawer = () => (permDrawerOpen.value = false)

    const togglePermission = id => {
      const idx = permSelection.value.indexOf(id)
      if (idx > -1) permSelection.value.splice(idx, 1)
      else permSelection.value.push(id)
    }

    const submit = async () => {
      if (!form.value.name) return
      loading.value = true

      const payload = {
        name: form.value.name,
        description: form.value.description,
        permissions: form.value.permissions,
      }

      try {
        if (isEdit.value) {
          await axios.put(`${baseURL}${editId.value}/`, payload)
        } else {
          await axios.post(baseURL, payload)
        }
        drawerOpen.value = false
        fetchRoles()
      } catch (err) {
        console.error("Error submitting role:", err)
      } finally {
        loading.value = false
      }
    }

    const saveRolePermissions = async () => {
      permLoading.value = true
      try {
        const payload = {
          name: selectedRole.value.name,
          description: selectedRole.value.description,
          permissions: permSelection.value,
        }

        await axios.put(`${baseURL}${selectedRole.value.id}/`, payload)
        permDrawerOpen.value = false
        fetchRoles()
      } catch (err) {
        console.error("Error saving permissions:", err)
      } finally {
        permLoading.value = false
      }
    }

    const openDeleteDialog = item => {
      deleteItem.value = item
      deleteDialog.value = true
    }

    const deleteRole = async () => {
      try {
        await axios.delete(`${baseURL}${deleteItem.value.id}/`)
        deleteDialog.value = false
        fetchRoles()
      } catch (err) {
        console.error("Error deleting role:", err)
      }
    }

    return {
      roles,
      allPermissions,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,
      loadingTable,
      filteredRoles,
      totalFilteredCount,
      permSearchFilter,
      filteredAvailablePermissions,

      drawerOpen,
      form,
      isEdit,
      loading,
      roleFormRef,
      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      updateOptions,
      submit,

      permDrawerOpen,
      permLoading,
      selectedRole,
      permSelection,
      openManagePermissionsDrawer,
      closePermDrawer,
      togglePermission,
      saveRolePermissions,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deleteRole,
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
.premium-drawer-v2 :deep(.v-navigation-drawer__content) {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
}

.premium-drawer-v2 {
  /* ensure drawer itself doesn't have internal scroll that conflicts */
  overflow: hidden !important;
}

.drawer-content-v2 {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  min-height: 0;
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

/* Permission List V2 */
.permissions-list-v2 {
  /* removed max-height to allow parent to handle scroll */
}

.permission-item-v2 {
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.permission-item-v2:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.permission-item-v2.is-selected {
  background: rgba(115, 103, 240, 0.05);
  border-color: #7367f0;
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

.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.3s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
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
