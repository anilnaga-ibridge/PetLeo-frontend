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
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Plan Prices</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search prices..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>
          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn color="primary" prepend-icon="tabler-plus" class="px-6" @click="openAddDrawer">
              Add Price
            </VBtn>
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
        density="comfortable"
        class="text-no-wrap"
      >
        <template #item.plan_title="{ item }">
          <div class="d-flex align-center">
            <VAvatar size="32" color="primary" variant="tonal" class="me-2">
              <VIcon icon="tabler-box" size="18" />
            </VAvatar>
            <span class="font-weight-medium">{{ item.plan_title }}</span>
          </div>
        </template>

        <template #item.billing_cycle_name="{ item }">
          <VChip size="small" label color="info" variant="tonal">
            {{ item.billing_cycle_name }}
          </VChip>
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-bold text-high-emphasis">
            {{ item.amount }} {{ item.currency }}
          </span>
        </template>

        <template #item.is_active="{ item }">
          <VChip size="small" :color="item.is_active ? 'success' : 'error'" variant="tonal">
            {{ item.is_active ? "Active" : "Inactive" }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="openEditDrawer(item)">
              <VIcon icon="tabler-edit" />
            </IconBtn>
            <IconBtn color="error" @click="openDeleteDialog(item)">
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </div>
        </template>
        
        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalItems" />
        </template>
      </VDataTableServer>
    </VCard>

    <!-- DRAWER -->
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="420" class="pa-4" style="border-left: 2px solid #E2E8F0;">
      <div class="pa-3 mb-4 rounded-lg" style="background: linear-gradient(135deg, #42a5f5, #1e88e5); color: white;">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ isEdit ? "Update Price" : "Create Price" }}</h3>
            <div class="text-caption opacity-90">Configure plan pricing details</div>
          </div>
          <IconBtn @click="closeDrawer" color="white" variant="text"><VIcon icon="tabler-x" /></IconBtn>
        </div>
      </div>

      <VForm @submit.prevent="submit">
        <VRow>
          <!-- PLAN -->
          <VCol cols="12">
            <AppSelect
              v-model="form.plan_id"
              :items="plans"
              :item-title="item => item.title || item.name || 'Unknown Plan'"
              item-value="id"
              label="Plan *"
              placeholder="Select a plan"
              prepend-inner-icon="tabler-box"
              clearable
            />
          </VCol>

          <!-- BILLING CYCLE -->
          <VCol cols="12">
            <AppSelect
              v-model="form.billing_cycle_id"
              :items="billingCycles"
              :item-title="item => item.name || item.title || 'Unknown Cycle'"
              item-value="id"
              label="Billing Cycle *"
              placeholder="Select billing cycle"
              prepend-inner-icon="tabler-calendar-repeat"
              clearable
            />
          </VCol>

          <!-- AMOUNT -->
          <VCol cols="12">
            <AppTextField 
              v-model="form.amount" 
              type="number" 
              label="Amount *" 
              placeholder="0.00"
              prepend-inner-icon="tabler-currency-dollar"
            />
          </VCol>

          <!-- CURRENCY -->
          <VCol cols="12">
            <AppSelect
              v-model="form.currency"
              :items="['USD', 'EUR', 'INR', 'GBP', 'CAD', 'AUD']"
              label="Currency"
              placeholder="Select currency"
              prepend-inner-icon="tabler-coin"
            />
          </VCol>

          <!-- ACTIVE -->
          <VCol cols="12">
            <VCard class="pa-3 border" variant="flat">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="font-weight-medium">Status</div>
                  <div class="text-caption text-medium-emphasis">Enable or disable this price</div>
                </div>
                <VSwitch v-model="form.is_active" color="success" hide-details />
              </div>
            </VCard>
          </VCol>
        </VRow>

        <div class="d-flex justify-end mt-6 gap-2">
          <VBtn variant="text" @click="closeDrawer">Cancel</VBtn>
          <VBtn color="primary" :loading="loading" type="submit" style="background: linear-gradient(135deg, #42a5f5, #1e88e5);">
            {{ isEdit ? "Update" : "Create" }}
          </VBtn>
        </div>
      </VForm>
    </VNavigationDrawer>

    <!-- DELETE DIALOG -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition">
      <VCard class="pa-4 rounded-xl" elevation="10">
        <div class="text-center mb-3">
          <VAvatar size="60" color="error" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" />
          </VAvatar>
          <h3 class="text-h6 font-weight-bold">Delete Price?</h3>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Are you sure you want to delete the price for <br>
            <strong class="text-primary">{{ deleteItem?.plan_title }}</strong>?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="deletePrice" prepend-icon="tabler-trash">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>
