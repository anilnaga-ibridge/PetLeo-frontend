<template>
  <section>
    <!-- HEADER -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Pet Breeds Management </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search breeds..."
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
              Add Breed
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="petBreeds"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- PET TYPE NAME (FIXED) -->
        <template #item.petType="{ item }">
          <strong>
            {{ petTypes.find(pt => pt.id === item.petType)?.name || "—" }}
          </strong>
        </template>

        <!-- BREED -->
        <template #item.breed="{ item }">
          {{ item.breed }}
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
            :items-per-page="itemsPer-page"
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
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Breed" : "Create New Breed" }}
        </h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <!-- FORM -->
      <VForm>
        <VRow>
          <!-- PET TYPE -->
          <VCol cols="12">
            <VSelect
              v-model="form.petType"
              :items="petTypes"
              item-title="name"
              item-value="id"
              label="Select Pet Type *"
              prepend-inner-icon="tabler-category"
            />
          </VCol>

          <!-- BREED NAME -->
          <VCol cols="12">
            <AppTextField
              v-model="form.breed"
              label="Breed Name *"
              placeholder="e.g., German Shepherd"
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

          <h2 class="text-h6 font-weight-bold"> Delete Breed? </h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            You are about to delete <strong>{{ deleteItem?.breed }}</strong>
          </p>

          <p class="text-body-2 text-medium-emphasis">
            This action is permanent.
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>

          <VBtn color="error" variant="flat" prepend-icon="tabler-trash"
                @click="deleteBreed">
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
  name: "PetBreedsPage",

  setup() {
    const baseURL = "http://127.0.0.1:8003/api/superadmin/pet-breeds/";
    const petTypeURL = "http://127.0.0.1:8003/api/superadmin/pet-types/";

    // Token
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // States
    const petBreeds = ref([]);
    const petTypes = ref([]);

    const headers = [
      { title: "Pet Type", key: "petType" },
      { title: "Breed", key: "breed" },
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

    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const form = ref({
      petType: "",
      breed: "",
    });

    // Load all Pet Types
    const fetchPetTypes = async () => {
      const res = await axios.get(petTypeURL);
      petTypes.value = res.data.results || res.data;
    };

    // Load breeds
    const fetchBreeds = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(baseURL, { params });

      petBreeds.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(() => {
      fetchPetTypes();
      fetchBreeds();
    });

    watch([page, itemsPerPage, searchQuery], fetchBreeds);

    const updateOptions = () => fetchBreeds();

    // Drawer actions
    const openAddDrawer = () => {
      isEdit.value = false;
      form.value = { petType: "", breed: "" };
      drawerOpen.value = true;
    };

    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;

      form.value = {
        petType: item.petType,
        breed: item.breed,
      };

      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Submit
    const submit = async () => {
      loading.value = true;

      const payload = {
        petType: form.value.petType,
        breed: form.value.breed,
      };

      if (isEdit.value) {
        await axios.put(baseURL + editId.value + "/", payload);
      } else {
        await axios.post(baseURL, payload);
      }

      drawerOpen.value = false;
      loading.value = false;
      fetchBreeds();
    };

    // Delete
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteBreed = async () => {
      await axios.delete(baseURL + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchBreeds();
    };

    return {
      petBreeds,
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
      updateOptions,

      deleteDialog,
      deleteItem,
      deleteBreed,
      submit,
    };
  },
};
</script>
