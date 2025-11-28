<!-- <script>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "PlansPage",

  setup() {
    const baseURL = "http://127.0.0.1:8003/api/superadmin/plans/";
    const billingCycleURL = "http://127.0.0.1:8003/api/superadmin/billing-cycles/";
    const rolesURL = "http://127.0.0.1:8000/auth/roles/public/";

    // Token
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Table state
    const plans = ref([]);
    const headers = [
      { title: "Title", key: "title" },
      { title: "Subtitle", key: "subtitle" },
      { title: "Role", key: "role" },
      { title: "Billing Cycle", key: "billing_cycle" },
      { title: "Features", key: "features" },
      { title: "Description", key: "description" },
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

    // Dropdowns
    const billingCycles = ref([]);
    const roles = ref([]);

    // Form
    const form = ref({
      title: "",
      role: "",
      subtitle: "",
      description: "",
      features: [],
      default_billing_cycle: null,
      is_active: true,
    });

    // Chip input model
    const featureInput = ref("");

    // Fetch roles
    const fetchRoles = async () => {
      const res = await axios.get(rolesURL);
      roles.value = res.data?.roles || res.data;
    };

    // Fetch billing cycles
    const fetchBillingCycles = async () => {
      const res = await axios.get(billingCycleURL);
      billingCycles.value = res.data.results || res.data;
    };

    // Fetch plans
    const fetchPlans = async () => {
      const params = {
        page: page.value,
        page_size: itemsPerPage.value,
        search: searchQuery.value,
      };

      const res = await axios.get(baseURL, { params });

      plans.value = res.data.results || res.data;
      totalItems.value = res.data.count || res.data.length;
    };

    onMounted(() => {
      fetchRoles();
      fetchBillingCycles();
      fetchPlans();
    });

    watch([page, itemsPerPage, searchQuery], fetchPlans);

    const updateOptions = () => fetchPlans();

    // Add drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      form.value = {
        title: "",
        role: "",
        subtitle: "",
        description: "",
        features: [],
        default_billing_cycle: null,
        is_active: true,
      };
      featureInput.value = "";
      drawerOpen.value = true;
    };

    // Edit drawer
    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;

      form.value = {
        title: item.title,
        role: item.role,
        subtitle: item.subtitle,
        description: item.description,
        features: item.features || [],
        default_billing_cycle: item.default_billing_cycle?.id || null,
        is_active: item.is_active,
      };

      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Add Feature Chip
    const addFeature = () => {
      if (featureInput.value.trim() !== "") {
        form.value.features.push(featureInput.value.trim());
        featureInput.value = "";
      }
    };

    const removeFeature = (index) => {
      form.value.features.splice(index, 1);
    };

    // Submit
    const submit = async () => {
      loading.value = true;

      const payload = {
        ...form.value,
        default_billing_cycle: form.value.default_billing_cycle,
      };

      if (isEdit.value) {
        await axios.put(baseURL + editId.value + "/", payload);
      } else {
        await axios.post(baseURL, payload);
      }

      drawerOpen.value = false;
      loading.value = false;
      fetchPlans();
    };

    // Delete dialog
    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deletePlan = async () => {
      await axios.delete(baseURL + deleteItem.value.id + "/");
      deleteDialog.value = false;
      fetchPlans();
    };

    return {
      plans,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,

      drawerOpen,
      form,
      isEdit,
      loading,

      billingCycles,
      roles,

      featureInput,
      addFeature,
      removeFeature,

      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      updateOptions,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deletePlan,
      submit,
    };
  },
};
</script> -->
<script>
import axios from "axios";
import { ref, onMounted, watch } from "vue";
import { useCookie } from "@/@core/composable/useCookie";
import { useRouter } from "vue-router";

export default {
  name: "PlansPage",

  setup() {
    const router = useRouter();

    const baseURL = "http://127.0.0.1:8003/api/superadmin/plans/";
    const billingCycleURL = "http://127.0.0.1:8003/api/superadmin/billing-cycles/";
    const rolesURL = "http://127.0.0.1:8000/auth/roles/public/";

    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const plans = ref([]);
    const headers = [
      { title: "Title", key: "title" },
      { title: "Subtitle", key: "subtitle" },
      { title: "Role", key: "role" },
      { title: "Billing Cycle", key: "default_billing_cycle" },
      { title: "Features", key: "features" },
      { title: "Description", key: "description" },
      { title: "Active", key: "is_active" },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");

    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const fetchPlans = async () => {
      try {
        const params = {
          page: page.value,
          page_size: itemsPerPage.value,
          search: searchQuery.value,
        };
        const res = await axios.get(baseURL, { params });
        plans.value = res.data.results || res.data;
        totalItems.value = res.data.count ?? res.data.length;
      } catch (err) {
        console.error("fetchPlans error:", err);
      }
    };

    onMounted(fetchPlans);
    watch([page, itemsPerPage, searchQuery], fetchPlans);

    const updateOptions = () => fetchPlans();

    const goToAddPlan = () => router.push("/superadmin/plans/addplan");
    const goToEditPlan = (id) => router.push(`/superadmin/plans/addplan?id=${id}`);

    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deletePlan = async () => {
      try {
        await axios.delete(`${baseURL}${deleteItem.value.id}/`);
        deleteDialog.value = false;
        fetchPlans();
      } catch (err) {
        console.error("deletePlan error:", err);
        alert("Failed to delete plan");
      }
    };

    return {
      plans,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,

      goToAddPlan,
      goToEditPlan,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deletePlan,
      updateOptions,
    };
  },
};
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Plans</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search plans..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>

          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn color="primary" prepend-icon="tabler-plus" @click="goToAddPlan">
              Add Plan
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="plans"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- Billing Cycle -->
        <template #item.default_billing_cycle="{ item }">
          {{ item.default_billing_cycle?.name || "-" }}
        </template>

        <!-- Features -->
        <template #item.features="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <VChip v-for="(f, i) in item.features" :key="i" size="x-small" color="indigo">
              {{ f }}
            </VChip>
          </div>
        </template>

        <!-- Active / Inactive -->
        <template #item.is_active="{ item }">
          <VChip
            size="small"
            :color="item.is_active ? 'success' : 'error'"
            class="text-white"
          >
            {{ item.is_active ? "Active" : "Inactive" }}
          </VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="goToEditPlan(item.id)">
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

    <!-- DELETE CONFIRMATION -->
    <VDialog v-model="deleteDialog" width="420" persistent>
      <VCard class="pa-4 rounded-xl">
        <div class="text-center mb-3">
          <VAvatar size="60" color="red" variant="tonal">
            <VIcon icon="tabler-alert-triangle" size="32" />
          </VAvatar>

          <h2 class="text-h6 font-weight-bold">Delete Plan?</h2>
          <p>You are about to delete <strong>{{ deleteItem?.title }}</strong>.</p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="deletePlan">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>

<style scoped>
</style>
