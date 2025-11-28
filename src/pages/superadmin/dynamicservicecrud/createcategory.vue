<!-- <script setup>
import { ref, onMounted } from 'vue'
import { useServiceStore } from '@/stores/servicestore'
import { useCategoryStore } from '@/stores/createcategory'
import { useRouter } from 'vue-router'

const router = useRouter()
const serviceStore = useServiceStore()
const categoryStore = useCategoryStore()

onMounted(serviceStore.fetchServices)

const form = ref({
  service: null,
  name: '',
  description: '',
  is_active: true,
})

const successMessage = ref('')
const errorMessage = ref('')

const submitCategory = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  const success = await categoryStore.createCategory(form.value)

  if (success) {
    successMessage.value = "✅ Category created successfully!"
    form.value = { service: null, name: '', description: '', is_active: true }
  } else {
    errorMessage.value = categoryStore.error
  }
}
const goToCategories = () => {
  router.push('dynamicservices')  // 👈 your route path here
}

// ===========================================================
</script>

<template>
 <div class="flex min-h-screen justify-center items-start bg-grey-lighten-4 relative pa-6 mt-16">

    <button @click="goToCategories" class="redirect-btn">
  ➕ Add Service
</button>

    <VCard class="pa-4" max-width="600" outlined>
      <h3 class="mb-4 text-h5 font-weight-medium text-center">Create Category</h3>

      <VAlert v-if="successMessage" type="success" variant="tonal" class="mb-2">
        {{ successMessage }}
      </VAlert>

      <VAlert v-if="categoryStore.error" type="error" variant="tonal" class="mb-2">
        {{ categoryStore.error }}
      </VAlert>

      <VForm @submit.prevent="submitCategory">
        <VSelect
          label="Select Service"
          :items="serviceStore.services"
          item-title="display_name"
          item-value="id"
          v-model="form.service"
          class="mb-3"
        />

        <AppTextField
          label="Category Name"
          v-model="form.name"
          class="mb-3"
        />

        <AppTextField
          label="Description"
          v-model="form.description"
          class="mb-3"
          type="textarea"
          rows="3"
        />

        <VCheckbox
          label="Active"
          v-model="form.is_active"
          class="mb-3"
        />

        <VBtn class="mt-2" type="submit" :loading="categoryStore.loading" block>
          Save Category
        </VBtn>
      </VForm>
    </VCard>
  </div>
</template>

<style>
.redirect-btn {
  position: absolute;
  top: 80px;
  right: 50px;
  background-color: #0b25ec;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
}
.redirect-btn:hover {
  background-color: #5107ef;
}

</style> -->


<template>
  <section>
    <!-- HEADER CARD -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Categories</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search categories..."
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
              Add Category
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
        :items="categories"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- Name -->
        <template #item.name="{ item }">
          <strong class="text-primary">{{ item.name }}</strong>
        </template>

        <!-- Service -->
        <template #item.service_display="{ item }">
          <div>{{ item.service_display }}</div>
        </template>

        <!-- Description -->
        <template #item.description="{ item }">
          <div class="text-sm text-medium-emphasis">
            {{ item.description }}
          </div>
        </template>

        <!-- STATUS -->
        <template #item.is_active="{ item }">
          <VChip size="small" color="success" v-if="item.is_active">Active</VChip>
          <VChip size="small" color="error" v-else>Inactive</VChip>
        </template>

        <!-- ACTIONS -->
        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn color="red" @click="openDeleteDialog(item)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
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
      <!-- Drawer Header -->
      <div
        class="pa-4 mb-4 rounded-lg"
        style="background: linear-gradient(135deg,#42a5f5,#1e88e5); color:white;"
      >
        <h3 class="text-h6 font-weight-bold mb-1">
          {{ isEdit ? "Update Category" : "Create Category" }}
        </h3>
        <p class="text-caption opacity-90">
          Manage categories for your services.
        </p>
      </div>

      <!-- FORM -->
      <VForm class="px-1">
        <VCard elevation="3" class="pa-4 rounded-lg mb-4" style="background:#F8FAFF;">
          <h4 class="text-h6 font-weight-medium mb-4" style="color:#1E88E5;">
            Category Information
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
                label="Category Name *"
                placeholder="e.g. Hair Cutting"
                color="primary"
                variant="outlined"
                rounded
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
                variant="outlined"
                rounded
              />
            </VCol>
          </VRow>
        </VCard>

        <!-- Status -->
        <VCard elevation="3" class="pa-4 rounded-lg" style="background:#FFF8F7;">
          <h4 class="text-h6 font-weight-medium mb-3" style="color:#D81B60;">
            Status Options
          </h4>

          <div class="d-flex flex-column gap-3">
            <div class="d-flex justify-space-between align-center">
              <span class="text-body-2">Active</span>
              <VSwitch v-model="form.is_active" color="green" inset />
            </div>
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
          {{ isEdit ? "Update Category" : "Create Category" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- DELETE CONFIRMATION -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition" persistent>
      <VCard class="pa-4 rounded-xl" elevation="12">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold text-high-emphasis">
            Delete Category?
          </h2>

          <p class="text-body-2 mt-1 text-medium-emphasis">
            Delete <strong class="text-primary">{{ deleteItem?.name }}</strong> permanently?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="red" prepend-icon="tabler-trash" @click="deleteCategory">
            Delete
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>

<script>
import axios from "axios";
import { ref, watch, onMounted } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "CategoryPage",

  setup() {
    const BASE_URL = "http://127.0.0.1:8003/api/superadmin/";

    // TOKEN
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // TABLE STATE
    const categories = ref([]);
    const services = ref([]);

    const headers = [
      { title: "Name", key: "name" },
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

    // DRAWER + DELETE POPUP
    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const deleteDialog = ref(false);
    const deleteItem = ref(null);
    const editId = ref(null);

    // FORM MODEL
    const form = ref({
      service: null,
      name: "",
      description: "",
      is_active: true,
    });

    // FETCH SERVICES (for dropdown)
    const fetchServices = async () => {
      const res = await axios.get(BASE_URL + "services/");
      services.value = res.data.results || res.data;
    };

    // FETCH CATEGORIES
    const fetchCategories = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(BASE_URL + "categories/", { params });
      categories.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(() => {
      fetchServices();
      fetchCategories();
    });

    watch([page, itemsPerPage, searchQuery], fetchCategories);

    const updateOptions = () => fetchCategories();

    // DRAWER FUNCTIONS
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

    // SUBMIT
    const submit = async () => {
      loading.value = true;

      if (isEdit.value) {
        await axios.put(BASE_URL + "categories/" + editId.value + "/", form.value);
      } else {
        await axios.post(BASE_URL + "categories/", form.value);
      }

      drawerOpen.value = false;
      loading.value = false;
      fetchCategories();
    };

    // DELETE
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteCategory = async () => {
      await axios.delete(BASE_URL + "categories/" + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchCategories();
    };

    return {
      categories,
      services,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,

      drawerOpen,
      isEdit,
      form,
      loading,

      deleteDialog,
      deleteItem,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      submit,
      openDeleteDialog,
      deleteCategory,

      updateOptions,
      selectedRows,
    };
  },
};
</script>
