<script setup>
import { ref, onMounted, watch } from "vue"
import { superAdminApi } from "@/plugins/axios"

// Relative paths for superAdminApi (baseURL: http://127.0.0.1:8003)
const BASE_PATH = "/api/superadmin/"
const baseURL = BASE_PATH + "coupons/"
const plansURL = BASE_PATH + "plans/"

// State
const coupons = ref([])
const plans = ref([])
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
  discount_type: "percent",
  discount_value: 0,
  max_uses: 1,
  start_date: new Date().toISOString().substr(0, 10),
  end_date: null,
  applies_to_plans: [],
  is_active: true,
})

const discountTypes = [
  { title: "Percentage (%)", value: "percent" },
  { title: "Fixed Amount", value: "fixed" },
]

// Headers
const headers = [
  { title: "Code", key: "code" },
  { title: "Discount", key: "discount" },
  { title: "Usage", key: "usage" },
  { title: "Status", key: "is_active" },
  { title: "Actions", key: "actions", sortable: false },
]

// Fetch Data
const fetchCoupons = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: itemsPerPage.value,
      search: search.value,
    }

    const res = await superAdminApi.get(baseURL, { params })

    coupons.value = res.data.results || res.data
    totalItems.value = res.data.count || res.data.length
  } catch (err) {
    console.error("Error fetching coupons:", err)
  } finally {
    loading.value = false
  }
}

const fetchPlans = async () => {
  try {
    const res = await superAdminApi.get(plansURL)

    plans.value = res.data.results || res.data
  } catch (err) {
    console.error("Error fetching plans:", err)
  }
}

// Watchers
watch([page, itemsPerPage, search], fetchCoupons)

// Actions
const openAddDrawer = () => {
  isEdit.value = false
  editId.value = null
  form.value = {
    code: "",
    discount_type: "percent",
    discount_value: 0,
    max_uses: 1,
    start_date: new Date().toISOString().substr(0, 10),
    end_date: null,
    applies_to_plans: [],
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = item => {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    code: item.code,
    discount_type: item.discount_type,
    discount_value: item.discount_value,
    max_uses: item.max_uses,
    start_date: item.start_date ? item.start_date.substr(0, 10) : null,
    end_date: item.end_date ? item.end_date.substr(0, 10) : null,
    applies_to_plans: item.applies_to_plans || [],
    is_active: item.is_active,
  }
  drawerOpen.value = true
}

const submit = async () => {
  if (!form.value.code) return alert("Code is required")

  loading.value = true
  try {
    if (isEdit.value) {
      await superAdminApi.put(`${baseURL}${editId.value}/`, form.value)
    } else {
      await superAdminApi.post(baseURL, form.value)
    }
    drawerOpen.value = false
    fetchCoupons()
  } catch (err) {
    console.error("Submit error:", err)
    alert("Failed to save coupon.")
  } finally {
    loading.value = false
  }
}

const openDeleteDialog = item => {
  deleteItem.value = item
  deleteDialog.value = true
}

const deleteCoupon = async () => {
  try {
    await superAdminApi.delete(`${baseURL}${deleteItem.value.id}/`)
    deleteDialog.value = false
    fetchCoupons()
  } catch (err) {
    console.error("Delete error:", err)
    alert("Failed to delete coupon.")
  }
}

// Init
onMounted(() => {
  fetchCoupons()
  fetchPlans()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">
          Coupons Management
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
              placeholder="Search coupons..."
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
              Add Coupon
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="coupons"
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

        <template #item.discount="{ item }">
          <span v-if="item.discount_type === 'percent'">{{ item.discount_value }}%</span>
          <span v-else>{{ item.discount_value }} (Fixed)</span>
        </template>

        <template #item.usage="{ item }">
          {{ item.used_count }} / {{ item.max_uses }}
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
          {{ isEdit ? "Update Coupon" : "Create Coupon" }}
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
              label="Coupon Code *"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="form.discount_type"
              :items="discountTypes"
              item-title="title"
              item-value="value"
              label="Discount Type"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="form.discount_value"
              label="Value"
              type="number"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="form.max_uses"
              label="Max Uses"
              type="number"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="form.start_date"
              label="Start Date"
              type="date"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="form.end_date"
              label="End Date"
              type="date"
            />
          </VCol>

          <VCol cols="12">
            <VSelect
              v-model="form.applies_to_plans"
              :items="plans"
              item-title="title"
              item-value="id"
              multiple
              label="Applies to Plans"
              chips
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
      <VCard title="Delete Coupon?">
        <VCardText>
          Are you sure you want to delete <strong>{{ deleteItem?.code }}</strong>?
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
            @click="deleteCoupon"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>
