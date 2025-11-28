<script>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "PetTypesPage",

  setup() {
    const baseURL = "http://127.0.0.1:8003/api/superadmin/pet-types/";

    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;

    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Table states
    const petTypes = ref([]);
    const headers = [
      { title: "Name", key: "name" },
      { title: "Key", key: "key" },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");

    // Drawer states
    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);

    const editId = ref(null);

    // Delete states
    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const form = ref({
      name: "",
    });

    // Fetch API
    const fetchPetTypes = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(baseURL, { params });

      petTypes.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(fetchPetTypes);
    watch([page, itemsPerPage, searchQuery], fetchPetTypes);

    const updateOptions = () => fetchPetTypes();

    // Add drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      form.value = { name: "" };
      drawerOpen.value = true;
    };

    // Edit drawer
    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;

      form.value = { name: item.name };
      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Submit
    const submit = async () => {
      loading.value = true;

      if (isEdit.value) {
        await axios.put(baseURL + editId.value + "/", form.value);
      } else {
        await axios.post(baseURL, form.value);
      }

      drawerOpen.value = false;
      loading.value = false;

      fetchPetTypes();
    };

    // Delete flow
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deletePetType = async () => {
      await axios.delete(baseURL + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchPetTypes();
    };

    return {
      petTypes,
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

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deletePetType,

      updateOptions,
      submit,
    };
  },
};
</script>
<template>
  <section>
    <!-- HEADER -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Pet Types Management </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search pet types..."
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
              Add Pet Type
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="petTypes"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- NAME -->
        <template #item.name="{ item }">
          <strong>{{ item.name }}</strong>
        </template>

        <!-- KEY -->
        <template #item.key="{ item }">
          <VChip color="primary" size="small">{{ item.key }}</VChip>
        </template>

        <!-- ACTIONS -->
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

        <!-- PAGINATION -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
          />
        </template>
      </VDataTableServer>
    </VCard>

    <!-- RIGHT DRAWER -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="450"
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Pet Type" : "Create Pet Type" }}
        </h3>

        <IconBtn @click="closeDrawer">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </div>

      <VDivider class="mb-4" />

      <!-- FORM -->
      <VForm>
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="form.name"
              label="Name *"
              placeholder="e.g., Dog, Cat, Bird"
              prepend-inner-icon="tabler-paw"
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

          <h2 class="text-h6 font-weight-bold">Delete Pet Type?</h2>

          <p class="text-body-2 text-medium-emphasis mt-2">
            You are about to delete:
            <strong class="text-primary">{{ deleteItem?.name }}</strong>
          </p>

          <p class="text-body-2 text-medium-emphasis">
            This action cannot be undone.
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>

          <VBtn
            color="error"
            variant="flat"
            prepend-icon="tabler-trash"
            @click="deletePetType"
          >
            Delete
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>
