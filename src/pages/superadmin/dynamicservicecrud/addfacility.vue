<!-- <script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { useServiceStore } from '@/stores/servicestore'

const API_URL = 'http://127.0.0.1:8003/api/superadmin/facilities/'
const serviceStore = useServiceStore()

onMounted(serviceStore.fetchServices)

const facility = ref({
  service: null,
  name: '',
  description: '',
  price: '',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const addFacility = async () => {
  const token = useCookie('accessToken').value
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await axios.post(API_URL, facility.value, {
      headers: { Authorization: `Bearer ${token}` }
    })

    successMessage.value = '✅ Facility added successfully!'
    console.log(response.data)

    facility.value = { service: null, name: '', description: '', price: '', is_active: true }

  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to add facility.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VCard class="pa-4" max-width="600">
    <h3 class="mb-4">Add Facility</h3>

    <VAlert v-if="successMessage" type="success" variant="tonal">{{ successMessage }}</VAlert>
    <VAlert v-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</VAlert>

    <VForm @submit.prevent="addFacility">

      <VSelect
        label="Select Service"
        :items="serviceStore.services"
        item-title="display_name"
        item-value="id"
        v-model="facility.service"
        required
      />

      <AppTextField label="Facility Name" v-model="facility.name" class="mt-3" required />
      <AppTextField label="Description" v-model="facility.description" class="mt-3" textarea rows="3" />

      <AppTextField label="Price" v-model="facility.price" type="number" class="mt-3" required />

      <VCheckbox label="Active" v-model="facility.is_active" class="mt-3" />

      <VBtn type="submit" class="mt-4" :loading="loading">Save Facility</VBtn>
    </VForm>
  </VCard>
</template> -->
<template>
  <section>
    <!-- HEADER -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Facilities</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search facilities..."
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
              Add Facility
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
        :items="facilities"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        hover
        density="comfortable"
        class="text-no-wrap"
        @update:options="updateOptions"
      >

        <!-- Name -->
        <template #item.name="{ item }">
          <strong class="text-primary">{{ item.name }}</strong>
        </template>

        <!-- Service -->
        <template #item.service_display="{ item }">
          <span>{{ item.service_display }}</span>
        </template>

        <!-- Description -->
        <template #item.description="{ item }">
          <div class="text-sm text-medium-emphasis">
            {{ item.description }}
          </div>
        </template>

        <!-- Active -->
        <template #item.is_active="{ item }">
          <VChip size="small" color="success" v-if="item.is_active">Active</VChip>
          <VChip size="small" color="error" v-else>Inactive</VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn color="red" @click="openDeleteDialog(item)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>

        <!-- Pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
          />
        </template>

      </VDataTableServer>
    </VCard>

    <!-- DRAWER -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      width="450"
      temporary
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <!-- Drawer Header -->
      <div
        class="pa-4 mb-4 rounded-lg"
        style="background:linear-gradient(135deg,#42a5f5,#1e88e5);color:white;"
      >
        <h3 class="text-h6 font-weight-bold mb-1">
          {{ isEdit ? "Update Facility" : "Create Facility" }}
        </h3>
        <p class="text-caption opacity-90">
          Manage facilities for your services.
        </p>
      </div>

      <!-- Form -->
      <VForm class="px-1">
        <VCard elevation="3" class="pa-4 rounded-lg mb-4" style="background:#F8FAFF;">
          <h4 class="text-h6 font-weight-medium mb-4" style="color:#1E88E5;">
            Facility Information
          </h4>

          <VRow dense>
            <!-- Service -->
            <VCol cols="12">
              <AppSelect
                v-model="form.service"
                :items="services"
                item-title="display_name"
                item-value="id"
                label="Select Service *"
                color="primary"
                variant="outlined"
                placeholder="Choose parent service"
                rounded
              />
            </VCol>

            <!-- Name -->
            <VCol cols="12">
              <AppTextField
                v-model="form.name"
                label="Facility Name *"
                placeholder="e.g. Full Spa Treatment"
                color="primary"
                rounded
                variant="outlined"
              />
            </VCol>

            <!-- Description -->
            <VCol cols="12">
              <AppTextField
                v-model="form.description"
                label="Description"
                textarea
                rows="3"
                color="primary"
                rounded
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCard>

        <!-- Status -->
        <VCard elevation="3" class="pa-4 rounded-lg" style="background:#FFF8F7;">
          <h4 class="text-h6 font-weight-medium mb-3" style="color:#D81B60;">
            Status Options
          </h4>

          <div class="d-flex justify-space-between align-center">
            <span>Active</span>
            <VSwitch v-model="form.is_active" color="green" inset />
          </div>
        </VCard>
      </VForm>

      <!-- SAVE BUTTONS -->
      <div class="d-flex justify-end mt-5 gap-2">
        <VBtn variant="outlined" color="red" class="px-5" @click="closeDrawer">
          Cancel
        </VBtn>

        <VBtn
          :loading="loading"
          color="primary"
          class="px-6"
          style="background:linear-gradient(135deg,#42a5f5,#1e88e5);"
          @click="submit"
        >
          {{ isEdit ? "Update Facility" : "Create Facility" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- DELETE POPUP -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold mt-2">Delete Facility?</h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Delete <strong>{{ deleteItem?.name }}</strong> permanently?
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
  </section>
</template>

<script>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "FacilityPage",

  setup() {
    const BASE_URL = "http://127.0.0.1:8003/api/superadmin/";

    // Token
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Table State
    const facilities = ref([]);
    const services = ref([]);

    const headers = [
      { title: "Facility Name", key: "name" },
      { title: "Service", key: "service_display" },
      { title: "Description", key: "description" },
      { title: "Active", key: "is_active" },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");
    const selectedRows = ref([]);

    // Drawer + Delete
    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const deleteDialog = ref(false);
    const deleteItem = ref(null);
    const editId = ref(null);

    // Form
    const form = ref({
      service: null,
      name: "",
      description: "",
      is_active: true,
    });

    // Fetch Services (dropdown)
    const fetchServices = async () => {
      const res = await axios.get(BASE_URL + "services/");
      services.value = res.data.results || res.data;
    };

    // Fetch Facilities
    const fetchFacilities = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };
      const res = await axios.get(BASE_URL + "facilities/", { params });
      facilities.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(() => {
      fetchServices();
      fetchFacilities();
    });

    watch([page, itemsPerPage, searchQuery], fetchFacilities);

    const updateOptions = () => fetchFacilities();

    // Drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      form.value = {
        service: null,
        name: "",
        description: "",
        is_active: true,
      };
      drawerOpen.value = true;
    };

    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;
      form.value = {
        service: item.service,
        name: item.name,
        description: item.description,
        is_active: item.is_active,
      };
      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Submit
    const submit = async () => {
      loading.value = true;

      if (isEdit.value) {
        await axios.put(BASE_URL + "facilities/" + editId.value + "/", form.value);
      } else {
        await axios.post(BASE_URL + "facilities/", form.value);
      }

      drawerOpen.value = false;
      loading.value = false;
      fetchFacilities();
    };

    // Delete
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteFacility = async () => {
      await axios.delete(BASE_URL + "facilities/" + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchFacilities();
    };

    return {
      facilities,
      services,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,
      selectedRows,

      drawerOpen,
      form,
      isEdit,
      loading,

      deleteDialog,
      deleteItem,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      submit,
      openDeleteDialog,
      deleteFacility,

      updateOptions,
    };
  },
};
</script>
