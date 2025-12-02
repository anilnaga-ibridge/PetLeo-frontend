<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Permissions Management </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search permissions..."
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
              Add Permission
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="permissions"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >

        <!-- ID -->
        <template #item.id="{ item }">
          <strong>#{{ item.id }}</strong>
        </template>

        <!-- Codename -->
        <template #item.codename="{ item }">
          <strong>{{ item.codename }}</strong>
        </template>

        <!-- Description -->
        <template #item.description="{ item }">
          <span>{{ item.description || "—" }}</span>
        </template>

        <!-- ACTION BUTTONS -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-x-1">
            <IconBtn @click="openEditDrawer(item)">
              <VIcon icon="tabler-edit" />
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

    <!-- =============================== -->
    <!--       CREATE / EDIT DRAWER      -->
    <!-- =============================== -->

    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="420"
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Permission" : "Create Permission" }}
        </h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <VForm>
        <VRow>

          <!-- MODULE SELECT -->
          <VCol cols="12">
            <VSelect
              v-model="selectedModule"
              :items="permissionModules"
              label="Select Permission Group"
              item-title="module"
              return-object
              prepend-inner-icon="tabler-category"
            />
          </VCol>

          <!-- PERMISSION SELECT -->
          <VCol cols="12">
            <VSelect
              v-model="selectedPermission"
              :items="selectedModule?.permissions || []"
              label="Select Permission"
              item-title="codename"
              item-value="codename"
              prepend-inner-icon="tabler-key"
            />
          </VCol>

          <!-- DESCRIPTION AUTO-FILL -->
          <VCol cols="12">
            <AppTextField
              v-model="form.description"
              label="Description"
              readonly
              variant="solo-filled"
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

    <!-- DELETE DIALOG -->
    <VDialog v-model="deleteDialog" width="420" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold"> Delete Permission? </h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            You are about to delete <strong>{{ deleteItem?.codename }}</strong>
          </p>

          <p class="text-body-2 text-medium-emphasis">
            This action is permanent.
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" variant="flat" prepend-icon="tabler-trash" @click="deletePermission">
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
  name: "PermissionsPage",

  setup() {
    const baseURL = "http://127.0.0.1:8000/auth/permissions/";

    // Token
    const token = useCookie("accessToken").value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // TABLE DATA
    const permissions = ref([]);

    const headers = [
      { title: "ID", key: "id" },
      { title: "Codename", key: "codename" },
      { title: "Description", key: "description" },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");

    // DRAWER STATE
    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const editId = ref(null);

    // DELETE STATE
    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    // STATIC PERMISSION GROUPS (Senior-level architecture)
    const permissionModules = [
      {
        module: "User Management",
        permissions: [
          { codename: "user.view", description: "View users" },
          { codename: "user.create", description: "Create users" },
          { codename: "user.update", description: "Update users" },
          { codename: "user.delete", description: "Delete users" },
        ],
      },
      {
        module: "Roles",
        permissions: [
          { codename: "role.view", description: "View roles" },
          { codename: "role.create", description: "Create roles" },
          { codename: "role.update", description: "Update roles" },
          { codename: "role.delete", description: "Delete roles" },
        ],
      },
      {
        module: "Permissions",
        permissions: [
          { codename: "permission.view", description: "View permissions" },
          { codename: "permission.create", description: "Create permissions" },
          { codename: "permission.update", description: "Update permissions" },
          { codename: "permission.delete", description: "Delete permissions" },
        ],
      },
    ];

    // FORM DATA
    const selectedModule = ref(null);
    const selectedPermission = ref(null);

    const form = ref({
      codename: "",
      description: "",
    });

    // Auto-update codename + description on permission select
    watch(selectedPermission, (val) => {
      if (!val || !selectedModule.value) return;

      const found = selectedModule.value.permissions.find(p => p.codename === val);
      if (found) {
        form.value.codename = found.codename;
        form.value.description = found.description;
      }
    });

    // Fetch Permissions
    const fetchPermissions = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(baseURL, { params });
      permissions.value = res.data.results || res.data;
      totalItems.value = res.data.count || permissions.value.length;
    };

    onMounted(fetchPermissions);
    watch([page, itemsPerPage, searchQuery], fetchPermissions);

    const updateOptions = () => fetchPermissions();

    // Drawer Open
    const openAddDrawer = () => {
      isEdit.value = false;
      editId.value = null;
      selectedModule.value = null;
      selectedPermission.value = null;
      form.value = { codename: "", description: "" };
      drawerOpen.value = true;
    };

    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;
      form.value = { codename: item.codename, description: item.description };

      // Auto-select module + permission based on codename
      for (let group of permissionModules) {
        const perm = group.permissions.find(p => p.codename === item.codename);
        if (perm) {
          selectedModule.value = group;
          selectedPermission.value = perm.codename;
          break;
        }
      }

      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Submit Create / Update
    const submit = async () => {
      loading.value = true;
      const payload = { codename: form.value.codename, description: form.value.description };

      try {
        if (isEdit.value) {
          await axios.put(`${baseURL}${editId.value}/`, payload);
        } else {
          await axios.post(baseURL, payload);
        }
        drawerOpen.value = false;
        fetchPermissions();
      } finally {
        loading.value = false;
      }
    };

    // Delete
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deletePermission = async () => {
      await axios.delete(`${baseURL}${deleteItem.value.id}/`);
      deleteDialog.value = false;
      fetchPermissions();
    };

    return {
      permissions,
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

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deletePermission,

      permissionModules,
      selectedModule,
      selectedPermission,
    };
  },
};
</script>

<style scoped>
/* optional styling */
</style>
