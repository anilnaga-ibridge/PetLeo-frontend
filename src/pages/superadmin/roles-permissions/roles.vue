<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Roles Management </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search roles..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>

          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn
              color="primary"
              prepend-icon="tabler-plus"
              class="px-6"
              @click="openAddDrawer"
            >
              Add Role
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- ============================= -->
      <!--       ROLE TABLE             -->
      <!-- ============================= -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="roles"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- SHOW ROLE ID -->
        <template #item.id="{ item }">
          <strong>{{ item.id }}</strong>
        </template>

        <!-- ROLE NAME -->
        <template #item.name="{ item }">
          <strong>{{ item.name }}</strong>
        </template>

        <!-- PERMISSION CHIPS -->
        <template #item.permissions="{ item }">
          <div class="d-flex gap-2" style="flex-wrap:wrap; max-width:320px;">
            <VChip
              v-for="p in item.permission_details || []"
              :key="`r-${item.id}-p-${p.id}`"
              class="ma-0 pa-1"
              variant="tonal"
              size="small"
            >
              {{ p.codename }} (ID: {{ p.id }})
            </VChip>
            <span v-if="!(item.permission_details && item.permission_details.length)">—</span>
          </div>
        </template>

        <!-- ACTIONS -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-x-1">
            <IconBtn @click="openEditDrawer(item)">
              <VIcon icon="tabler-edit" />
            </IconBtn>

            <IconBtn color="primary" @click="openManagePermissionsDrawer(item)">
              <VIcon icon="tabler-key" />
            </IconBtn>

            <IconBtn color="red" @click="openDeleteDialog(item)">
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </div>
        </template>

        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
          />
        </template>
      </VDataTableServer>
    </VCard>

    <!-- ============================= -->
    <!--   CREATE / EDIT ROLE DRAWER   -->
    <!-- ============================= -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="480"
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Role" : "Create New Role" }}
        </h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <VForm ref="roleFormRef">
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="form.name"
              label="Role Name *"
              placeholder="e.g., admin"
              prepend-inner-icon="tabler-user"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.description"
              label="Description"
              placeholder="Short description"
              textarea
              rows="3"
            />
          </VCol>

          <VCol cols="12">
            <VSelect
              v-model="form.permissions"
              :items="allPermissions"
              item-title="codename"
              item-value="id"
              label="Assign Permissions"
              multiple
              chips
              hint="Select zero or more permissions"
            />
          </VCol>
        </VRow>
      </VForm>

      <div class="d-flex justify-end mt-4">
        <VBtn variant="text" class="me-2" @click="closeDrawer">Cancel</VBtn>
        <VBtn :loading="loading" color="primary" @click="submit">
          {{ isEdit ? "Update" : "Create" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- ============================= -->
    <!--     PERMISSION ASSIGNMENT     -->
    <!-- ============================= -->
    <VNavigationDrawer
      v-model="permDrawerOpen"
      location="end"
      temporary
      width="420"
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold"> Manage Permissions </h3>
        <IconBtn @click="closePermDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <div v-if="selectedRole">
        <p class="text-body-2 mb-3">Role: <strong>{{ selectedRole.name }}</strong></p>

        <VForm>
          <VRow>
            <VCol cols="12" v-for="perm in allPermissions" :key="perm.id">
              <VCheckbox
                v-model="permSelection"
                :label="`${perm.codename} (ID: ${perm.id})`"
                :value="perm.id"
                hide-details
              />
            </VCol>
          </VRow>
        </VForm>
      </div>

      <div class="d-flex justify-end mt-4">
        <VBtn variant="text" class="me-2" @click="closePermDrawer">Cancel</VBtn>
        <VBtn :loading="permLoading" color="primary" @click="saveRolePermissions">
          Save Permissions
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- ============================= -->
    <!--         DELETE DIALOG         -->
    <!-- ============================= -->
    <VDialog v-model="deleteDialog" width="420" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold"> Delete Role? </h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            You are about to delete <strong>{{ deleteItem?.name }}</strong>
          </p>

          <p class="text-body-2 text-medium-emphasis">
            This action is permanent.
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>

          <VBtn color="error" variant="flat" prepend-icon="tabler-trash"
                @click="deleteRole">
            Delete
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>

<script>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "RolesPage",

  setup() {
    const baseURL = "http://127.0.0.1:8000/auth/roles/";
    const permURL = "http://127.0.0.1:8000/auth/permissions/";

    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const roles = ref([]);
    const allPermissions = ref([]);

    const headers = [
      { title: "ID", key: "id" },
      { title: "Name", key: "name" },
      { title: "Description", key: "description" },
      { title: "Permissions", key: "permissions", sortable: false },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");

    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const editId = ref(null);

    const permDrawerOpen = ref(false);
    const permLoading = ref(false);
    const selectedRole = ref(null);
    const permSelection = ref([]);

    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const form = ref({
      name: "",
      description: "",
      permissions: [],
    });

    // Load permissions
    const fetchAllPermissions = async () => {
      const res = await axios.get(permURL);
      allPermissions.value = res.data.results || res.data || [];
    };

    // Load roles
    const fetchRoles = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };
      const res = await axios.get(baseURL, { params });
      roles.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(() => {
      fetchAllPermissions();
      fetchRoles();
    });

    watch([page, itemsPerPage, searchQuery], fetchRoles);

    const updateOptions = () => fetchRoles();

    const openAddDrawer = () => {
      isEdit.value = false;
      editId.value = null;
      form.value = { name: "", description: "", permissions: [] };
      drawerOpen.value = true;
    };

    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;
      form.value = {
        name: item.name,
        description: item.description,
        permissions: (item.permission_details || []).map((p) => p.id),
      };
      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    const openManagePermissionsDrawer = (item) => {
      selectedRole.value = item;
      permSelection.value = (item.permission_details || []).map((p) => p.id);
      permDrawerOpen.value = true;
    };

    const closePermDrawer = () => (permDrawerOpen.value = false);

    const submit = async () => {
      loading.value = true;
      const payload = {
        name: form.value.name,
        description: form.value.description,
        permissions: form.value.permissions,
      };

      try {
        if (isEdit.value) {
          await axios.put(`${baseURL}${editId.value}/`, payload);
        } else {
          await axios.post(baseURL, payload);
        }
        drawerOpen.value = false;
        fetchRoles();
      } finally {
        loading.value = false;
      }
    };

    const saveRolePermissions = async () => {
      permLoading.value = true;
      try {
        const payload = {
          name: selectedRole.value.name,
          description: selectedRole.value.description,
          permissions: permSelection.value,
        };
        await axios.put(`${baseURL}${selectedRole.value.id}/`, payload);
        permDrawerOpen.value = false;
        fetchRoles();
      } finally {
        permLoading.value = false;
      }
    };

    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteRole = async () => {
      await axios.delete(`${baseURL}${deleteItem.value.id}/`);
      deleteDialog.value = false;
      fetchRoles();
    };

    return {
      roles,
      allPermissions,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,

      drawerOpen,
      form,
      isEdit,
      loading,
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
      saveRolePermissions,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deleteRole,
    };
  },
};
</script>

<style scoped>
/* optional styling */
</style>
