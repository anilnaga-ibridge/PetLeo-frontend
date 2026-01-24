
<script setup>
import { ref, onMounted, watch } from "vue"
import { superAdminApi } from "@/plugins/axios"

// Relative paths for superAdminApi (baseURL: http://127.0.0.1:8003)
const BASE_PATH = "/api/superadmin/"
const baseURL = BASE_PATH + "billing-cycles/"

// State
const billingCycles = ref([])
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const search = ref("")
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

const deleteDialog = ref(false)
const deleteItem = ref(null)

// Form
const form = ref({
  code: "",
  display_name: "",
  duration_days: 30,
  is_active: true,
})

// Headers
const headers = [
  { title: "Code", key: "code" },
  { title: "Display Name", key: "display_name" },
  { title: "Duration (Days)", key: "duration_days" },
  { title: "Status", key: "is_active" },
  { title: "Actions", key: "actions", sortable: false },
]

// Fetch Data
const fetchBillingCycles = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: itemsPerPage.value,
      search: search.value,
    }

    const res = await superAdminApi.get(baseURL, { params })

    billingCycles.value = res.data.results || res.data
    totalItems.value = res.data.count || res.data.length
  } catch (err) {
    console.error("Error fetching billing cycles:", err)
  } finally {
    loading.value = false
  }
}

// Watchers
watch([page, itemsPerPage, search], fetchBillingCycles)

// Actions
const openAddDrawer = () => {
  isEdit.value = false
  editId.value = null
  form.value = {
    code: "",
    display_name: "",
    duration_days: 30,
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = item => {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    code: item.code,
    display_name: item.display_name,
    duration_days: item.duration_days,
    is_active: item.is_active,
  }
  drawerOpen.value = true
}

const submit = async () => {
  if (!form.value.code || !form.value.display_name) return alert("Code and Display Name are required")

  loading.value = true
  try {
    if (isEdit.value) {
      await superAdminApi.put(`${baseURL}${editId.value}/`, form.value)
    } else {
      await superAdminApi.post(baseURL, form.value)
    }
    drawerOpen.value = false
    fetchBillingCycles()
  } catch (err) {
    console.error("Submit error:", err)
    alert("Failed to save billing cycle.")
  } finally {
    loading.value = false
  }
}

const openDeleteDialog = item => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteBillingCycle = async () => {
  try {
    await superAdminApi.delete(`${baseURL}${deleteItem.value.id}/`)
    deleteDialog.value = false
    fetchBillingCycles()
  } catch (err) {
    console.error("Delete error:", err)
    alert("Failed to delete billing cycle.")
  }
}

// Init
onMounted(() => {
  fetchBillingCycles()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">
          Billing Cycles Management
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            sm="4"
          >
            <AppTextField
              v-model="search"
              placeholder="Search billing cycles..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>
          <VCol
            cols="12"
            sm="8"
            class="d-flex justify-end"
          >
            <VBtn
              color="primary"
              prepend-icon="tabler-plus"
              @click="openAddDrawer"
            >
              Add Billing Cycle
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="billingCycles"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
      >
        <template #item.code="{ item }">
          <VChip
            color="primary"
            label
          >
            {{ item.code }}
          </VChip>
        </template>

        <template #item.is_active="{ item }">
          <VChip
            size="small"
            :color="item.is_active ? 'success' : 'error'"
          >
            {{ item.is_active ? "Active" : "Inactive" }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>
          <IconBtn
            color="error"
            @click="openDeleteDialog(item)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- DRAWER -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="500"
      class="pa-4"
    >
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">
          {{ isEdit ? "Update Billing Cycle" : "Create Billing Cycle" }}
        </h3>
        <IconBtn @click="drawerOpen = false">
          <VIcon icon="tabler-x" />
        </IconBtn>
      </div>

      <VForm @submit.prevent="submit">
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="form.code"
              label="Code (e.g. MONTHLY) *"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.display_name"
              label="Display Name (e.g. Monthly) *"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.duration_days"
              label="Duration (Days) *"
              type="number"
            />
          </VCol>

          <VCol cols="12">
            <VSwitch
              v-model="form.is_active"
              label="Active"
            />
          </VCol>

          <VCol
            cols="12"
            class="d-flex justify-end gap-2"
          >
            <VBtn
              variant="text"
              @click="drawerOpen = false"
            >
              Cancel
            </VBtn>
            <VBtn
              type="submit"
              :loading="loading"
            >
              Save
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VNavigationDrawer>

    <!-- DELETE DIALOG -->
    <VDialog
      v-model="deleteDialog"
      width="400"
    >
      <VCard title="Delete Billing Cycle?">
        <VCardText>
          Are you sure you want to delete <strong>{{ deleteItem?.display_name }}</strong>?
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            @click="deleteBillingCycle"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>
