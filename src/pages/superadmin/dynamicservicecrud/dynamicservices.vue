

<!-- <script setup>
import { useCookie } from '@/@core/composable/useCookie'
import axios from 'axios'
import { ref } from 'vue'

const API_URL = 'http://127.0.0.1:8003/api/superadmin/services/'

const service = ref({
  name: '',
  display_name: '',
  description: '',
  is_active: true,
  blocked: false,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const addService = async () => {
  const token = useCookie('accessToken').value
  console.log('Token:', token)

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // ✅ Correct axios usage
    const res = await axios.post(API_URL, service.value, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    successMessage.value = '✅ Service added successfully!'
    console.log('✅ Response:', res.data)

    // Reset form
    service.value = {
      name: '',
      display_name: '',
      description: '',
      is_active: true,
      blocked: false,
    }
  } catch (err) {
    console.error('❌ Error:', err)
    errorMessage.value = err.response?.data?.detail || 'Failed to add service.'
  } finally {
    loading.value = false
  }
}
</script>


<style scoped lang="scss">
.service-form-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
    min-height: 100vh;
    padding: 2rem;
}

.form-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
}

.form-title {
    font-size: 1.8rem;
    font-weight: 600;
    text-align: center;
    background: linear-gradient(to right, #4f46e5, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1.5rem;
}

.form-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;

    label {
        font-weight: 500;
        margin-bottom: 0.4rem;
        color: #4b5563;
    }

    input,
    textarea {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 0.65rem 0.8rem;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
    }

    textarea {
        resize: none;
    }
}

.form-checkbox-group {
    display: flex;
    justify-content: space-between;
    gap: 1rem;

    .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        input {
            accent-color: #4f46e5;
        }

        span {
            color: #374151;
            font-size: 0.95rem;
        }
    }
}

.form-actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;

    button {
        background: linear-gradient(90deg, #4f46e5, #6366f1);
        color: #fff;
        padding: 0.6rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            background: linear-gradient(90deg, #4338ca, #4f46e5);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }
}

.message {
    text-align: center;
    margin-top: 1.25rem;
    font-weight: 500;

    &.success {
        color: #16a34a;
    }

    &.error {
        color: #dc2626;
    }
}

@media (max-width: 640px) {
    .form-card {
        padding: 1.5rem;
    }

    .form-title {
        font-size: 1.5rem;
    }
}
</style> -->


<template>
  <section>
    <!-- HEADER CARD -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Services Management</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search services..."
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
              Add Service
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
        :items="services"
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
          <div class="font-weight-medium text-high-emphasis">
            {{ item.name }}
          </div>
        </template>

        <!-- DISPLAY NAME -->
        <template #item.display_name="{ item }">
          <strong class="text-primary">{{ item.display_name }}</strong>
        </template>

        <!-- DESCRIPTION -->
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

    <!-- 🚀 RIGHT DRAWER -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="450"
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <!-- Drawer Header -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Service" : "Create New Service" }}
        </h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <!-- Form -->
      <VForm>
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="form.name"
              label="Slug Name *"
              placeholder="e.g., pet_care"
              prepend-inner-icon="tabler-hash"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.display_name"
              label="Display Name *"
              placeholder="e.g., Pet Care Service"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.description"
              label="Description"
              textarea
            />
          </VCol>

          <VCol cols="12">
            <VSwitch v-model="form.is_active" label="Active" color="success" />
            <VSwitch v-model="form.blocked" label="Blocked" color="red" />
          </VCol>
        </VRow>
      </VForm>

      <!-- Buttons -->
      <div class="d-flex justify-end mt-4">
        <VBtn variant="text" class="me-2" @click="closeDrawer">Cancel</VBtn>
        <VBtn :loading="loading" color="primary" @click="submit">
          {{ isEdit ? "Update" : "Create" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

   <!-- ⚠️ MODERN DELETE CONFIRMATION -->
<VDialog
  v-model="deleteDialog"
  width="420"
  transition="dialog-bottom-transition"
  persistent
>
  <VCard class="pa-4 rounded-xl" elevation="12">
    
    <!-- ICON + TITLE -->
    <div class="text-center mb-3">
      <VAvatar size="60" color="red" variant="tonal" class="mb-3">
        <VIcon icon="tabler-alert-triangle" size="32" color="red-darken-2" />
      </VAvatar>

      <h2 class="text-h6 font-weight-bold text-high-emphasis">
        Delete Service?
      </h2>
      <p class="text-body-2 mt-1 text-medium-emphasis">
        You are about to delete <strong class="text-primary">{{ deleteItem?.display_name }}</strong>.
      </p>

      <p class="text-body-2 mt-1 text-medium-emphasis">
        This action is <strong>permanent</strong> and cannot be undone.
      </p>
    </div>

    <VDivider class="my-3" />

    <!-- ACTION BUTTONS -->
    <div class="d-flex justify-end gap-2">
      <VBtn
        variant="text"
        color="medium-emphasis"
        class="px-4"
        @click="deleteDialog = false"
      >
        Cancel
      </VBtn>

      <VBtn
        color="error"
        class="px-5"
        variant="flat"
        prepend-icon="tabler-trash"
        @click="deleteService"
      >
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
  name: "ServicesPage",

  setup() {
    const baseURL = "http://127.0.0.1:8003/api/superadmin/services/";

    // TOKEN
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;

    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Table State
    const services = ref([]);
    const headers = [
      { title: "Name", key: "name" },
      { title: "Display Name", key: "display_name" },
      { title: "Description", key: "description" },
      { title: "Active", key: "is_active" },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const page = ref(1);
    const itemsPerPage = ref(10);
    const selectedRows = ref([]);
    const totalItems = ref(0);
    const searchQuery = ref("");

    // Drawer
    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const editId = ref(null);

    // Delete Dialog
    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const form = ref({
      name: "",
      display_name: "",
      description: "",
      is_active: true,
      blocked: false,
    });

    // Fetch services
    const fetchServices = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(baseURL, { params });
      services.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(fetchServices);
    watch([page, itemsPerPage, searchQuery], fetchServices);

    const updateOptions = () => fetchServices();

    // Add drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      form.value = {
        name: "",
        display_name: "",
        description: "",
        is_active: true,
        blocked: false,
      };
      drawerOpen.value = true;
    };

    // Edit drawer
    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;
      form.value = { ...item };
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
      fetchServices();
    };

    // Delete flow
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteService = async () => {
      await axios.delete(baseURL + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchServices();
    };

    return {
      services,
      headers,
      page,
      itemsPerPage,
      selectedRows,
      totalItems,
      searchQuery,
      updateOptions,

      drawerOpen,
      form,
      isEdit,
      loading,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,

      deleteDialog,
      deleteItem,
      deleteService,
      openDeleteDialog,
      submit,
    };
  },
};
</script>
