<script setup>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

// =============================
//  API BASE URLs
// =============================
const BASE = "http://127.0.0.1:8003/api/superadmin/";
const baseURL = BASE + "plan-prices/";
const plansURL = BASE + "plans/";
const billingCycleURL = BASE + "billing-cycles/";

// =============================
//  TOKEN SETUP
// =============================
const cookieToken = useCookie("accessToken");
const token = cookieToken.value;
if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// =============================
//  TABLE VARIABLES
// =============================
const prices = ref([]);
const page = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const searchQuery = ref("");

const headers = [
  { title: "Plan", key: "plan_title" },
  { title: "Billing Cycle", key: "billing_cycle_name" },
  { title: "Amount", key: "amount" },
  { title: "Currency", key: "currency" },
  { title: "Status", key: "is_active" },
  { title: "Actions", key: "actions", sortable: false },
];

// =============================
//  DRAWER + FORM
// =============================
const drawerOpen = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const loading = ref(false);

const plans = ref([]);
const billingCycles = ref([]);

const form = ref({
  plan_id: null,
  billing_cycle_id: null,
  amount: "",
  currency: "USD",
  is_active: true,
});

// =============================
//  FETCH PLANS
// =============================
const fetchPlans = async () => {
  try {
    const res = await axios.get(plansURL, { params: { page_size: 1000 } });
    plans.value = res.data.results || res.data || [];
  } catch (e) {
    console.error("fetchPlans:", e);
  }
};

// =============================
//  FETCH BILLING CYCLES
// =============================
const fetchBillingCycles = async () => {
  try {
    const res = await axios.get(billingCycleURL, { params: { page_size: 1000 } });
    billingCycles.value = res.data.results || res.data || [];
  } catch (e) {
    console.error("fetchBillingCycles:", e);
  }
};

// =============================
//  FETCH PRICES
// =============================
const fetchPrices = async () => {
  try {
    const params = {
      page: page.value,
      page_size: itemsPerPage.value,
      search: searchQuery.value,
    };
    const res = await axios.get(baseURL, { params });

    prices.value = (res.data.results || res.data || []).map((p) => ({
      ...p,
      plan_title: p.plan?.title || "—",
      billing_cycle_name: p.billing_cycle?.name || "—",
    }));

    totalItems.value = res.data.count ?? prices.value.length;
  } catch (e) {
    console.error("fetchPrices:", e);
  }
};

watch([page, itemsPerPage, searchQuery], fetchPrices);

// =============================
//  ADD / EDIT DRAWERS
// =============================
const openAddDrawer = () => {
  isEdit.value = false;
  editId.value = null;
  form.value = {
    plan_id: null,
    billing_cycle_id: null,
    amount: "",
    currency: "USD",
    is_active: true,
  };
  drawerOpen.value = true;
};

const openEditDrawer = (item) => {
  isEdit.value = true;
  editId.value = item.id;

  form.value = {
    plan_id: item.plan?.id,
    billing_cycle_id: item.billing_cycle?.id,
    amount: item.amount,
    currency: item.currency,
    is_active: item.is_active,
  };

  drawerOpen.value = true;
};

const closeDrawer = () => {
  drawerOpen.value = false;
};

// =============================
//  SUBMIT CREATE / UPDATE
// =============================
const submit = async () => {
  loading.value = true;

  const payload = {
    plan_id: form.value.plan_id,
    billing_cycle_id: form.value.billing_cycle_id,
    amount: parseFloat(form.value.amount),
    currency: form.value.currency,
    is_active: form.value.is_active,
  };

  try {
    if (isEdit.value) {
      await axios.put(`${baseURL}${editId.value}/`, payload);
    } else {
      await axios.post(baseURL, payload);
    }

    drawerOpen.value = false;
    fetchPrices();
  } catch (e) {
    console.error("Submit error:", e.response?.data || e);
    alert("Failed: " + JSON.stringify(e.response?.data));
  } finally {
    loading.value = false;
  }
};

// =============================
//  DELETE PRICE
// =============================
const deleteDialog = ref(false);
const deleteItem = ref(null);

const openDeleteDialog = (item) => {
  deleteItem.value = item;
  deleteDialog.value = true;
};

const deletePrice = async () => {
  try {
    await axios.delete(`${baseURL}${deleteItem.value.id}/`);
    deleteDialog.value = false;
    fetchPrices();
  } catch (e) {
    console.error(e);
    alert("Delete failed");
  }
};

onMounted(() => {
  fetchPlans();
  fetchBillingCycles();
  fetchPrices();
});
</script>





<template>
  <section>
    <VCard class="mb-6">
      <VCardTitle class="d-flex justify-space-between align-center py-4 px-6">
        <span class="text-h6 font-weight-bold">Plan Prices</span>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="openAddDrawer">Add Price</VBtn>
      </VCardTitle>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search prices..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VDataTableServer
        :headers="headers"
        :items="prices"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        hover
        dense
        class="text-no-wrap"
      >
        <template #item.plan_title="{ item }">
          <strong>{{ item.plan_title }}</strong>
        </template>

        <template #item.billing_cycle_name="{ item }">
          {{ item.billing_cycle_name }}
        </template>

        <template #item.is_active="{ item }">
          <VChip size="small" :color="item.is_active ? 'success' : 'red'">
            {{ item.is_active ? "Active" : "Inactive" }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn color="red" @click="openDeleteDialog(item)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- DRAWER -->
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="420" class="pa-4">
      <h3 class="text-h6 font-weight-bold mb-3">{{ isEdit ? "Update Price" : "Create Price" }}</h3>
      <VDivider class="mb-4" />

      <VForm>
        <!-- PLAN -->
        <VSelect
          v-model="form.plan_id"
          :items="plans"
          :item-title="item => item.title || item.name || 'Unknown Plan'"
          item-value="id"
          label="Plan *"
        />

        <!-- BILLING CYCLE -->
        <VSelect
          v-model="form.billing_cycle_id"
          :items="billingCycles"
          :item-title="item => item.name || item.title || 'Unknown Cycle'"
          item-value="id"
          label="Billing Cycle *"
        />

        <AppTextField v-model="form.amount" type="number" label="Amount *" />
        <AppTextField v-model="form.currency" label="Currency" />
        <VSwitch v-model="form.is_active" label="Active" />
      </VForm>

      <div class="d-flex justify-end mt-4">
        <VBtn variant="text" class="mr-2" @click="closeDrawer">Cancel</VBtn>
        <VBtn color="primary" :loading="loading" @click="submit">
          {{ isEdit ? "Update" : "Create" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- DELETE DIALOG -->
    <VDialog v-model="deleteDialog" width="420">
      <VCard class="pa-4">
        <h3 class="text-h6 font-weight-bold">Delete Price?</h3>
        <p class="text-body-2 mt-2">
          This will permanently delete price for:
          <strong>{{ deleteItem?.plan_title }}</strong>
        </p>

        <div class="d-flex justify-end mt-4">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="red" @click="deletePrice">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>
