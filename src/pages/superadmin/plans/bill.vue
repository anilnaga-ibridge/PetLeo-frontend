<script>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "BillingCyclesPage",

  setup() {
    const baseURL = "http://127.0.0.1:8003/api/superadmin/billing-cycles/";

    // Token
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Table state
    const billingCycles = ref([]);
    const headers = [
      { title: "Name", key: "name" },
      { title: "Duration", key: "duration" },
      { title: "Active", key: "is_active" },
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

    const durationTypes = ["days", "weeks", "months", "years"];

    const form = ref({
      name: "",
      duration_value: 1,
      duration_type: "months",
      is_active: true,
    });

    // Fetch data
    const fetchBillingCycles = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(baseURL, { params });

      billingCycles.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(fetchBillingCycles);
    watch([page, itemsPerPage, searchQuery], fetchBillingCycles);

    const updateOptions = () => fetchBillingCycles();

    // Add drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      form.value = {
        name: "",
        duration_value: 1,
        duration_type: "months",
        is_active: true,
      };
      drawerOpen.value = true;
    };

    // Edit
    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;

      form.value = { ...item };
      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    const submit = async () => {
      loading.value = true;

      if (isEdit.value) {
        await axios.put(baseURL + editId.value + "/", form.value);
      } else {
        await axios.post(baseURL, form.value);
      }

      drawerOpen.value = false;
      loading.value = false;
      fetchBillingCycles();
    };

    // Delete
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteBillingCycle = async () => {
      await axios.delete(baseURL + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchBillingCycles();
    };

    return {
      billingCycles,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,
      drawerOpen,
      form,
      isEdit,
      loading,
      durationTypes,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      updateOptions,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deleteBillingCycle,
      submit,
    };
  },
};
</script>



<template>
  <section>
    <!-- HEADER CARD -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Billing Cycles </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search billing cycles..."
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
              Add Billing Cycle
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items="billingCycles"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        show-select
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- NAME -->
        <template #item.name="{ item }">
          <strong>{{ item.name }}</strong>
        </template>

        <!-- DURATION -->
        <template #item.duration="{ item }">
          {{ item.duration_value }} {{ item.duration_type }}
        </template>

        <!-- ACTIVE -->
        <template #item.is_active="{ item }">
          <VChip size="small" color="success" v-if="item.is_active">Active</VChip>
          <VChip size="small" color="error" v-else>Inactive</VChip>
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
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Billing Cycle" : "Create Billing Cycle" }}
        </h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <VForm>
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="form.name"
              label="Name *"
              placeholder="e.g., Monthly"
              prepend-inner-icon="tabler-hash"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.duration_value"
              label="Duration Value *"
              type="number"
              placeholder="e.g., 1"
            />
          </VCol>

          <VCol cols="12">
            <VSelect
              v-model="form.duration_type"
              :items="durationTypes"
              label="Duration Type *"
            />
          </VCol>

          <VCol cols="12">
            <VSwitch v-model="form.is_active" label="Active" color="success" />
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

          <h2 class="text-h6 font-weight-bold text-high-emphasis">
            Delete Billing Cycle?
          </h2>

          <p class="text-body-2 mt-1 text-medium-emphasis">
            You are about to delete 
            <strong class="text-primary">{{ deleteItem?.name }}</strong>.
          </p>

          <p class="text-body-2 mt-1 text-medium-emphasis">
            This action is permanent.
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>

          <VBtn color="error" variant="flat" prepend-icon="tabler-trash"
            @click="deleteBillingCycle">
            Delete
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>
