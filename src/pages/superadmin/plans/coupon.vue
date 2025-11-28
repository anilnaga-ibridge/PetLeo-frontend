<template>
  <section>
    <!-- HEADER -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold"> Plans Management </VCardTitle>
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
            <VBtn color="primary" prepend-icon="tabler-plus" class="px-6" @click="openAddDrawer">
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
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        show-select
        @update:options="updateOptions"
      >
        <template #item.title="{ item }">
          <strong>{{ item.title }}</strong>
          <div class="text-sm text-medium-emphasis">{{ item.subtitle }}</div>
        </template>

        <template #item.role="{ item }">
          <VChip size="small">{{ item.role }}</VChip>
        </template>

        <template #item.default_billing_cycle="{ item }">
          {{ item.default_billing_cycle?.name || "—" }}
        </template>

        <template #item.is_active="{ item }">
          <VChip size="small" color="success" v-if="item.is_active">Active</VChip>
          <VChip size="small" color="error" v-else>Inactive</VChip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-x-1">
            <IconBtn @click="openEditDrawer(item)">
              <VIcon icon="tabler-edit" />
            </IconBtn>

            <IconBtn color="blue" @click="togglePublish(item)">
              <VIcon :icon="item.is_active ? 'tabler-eye-off' : 'tabler-eye'"/>
            </IconBtn>

            <IconBtn color="red" @click="openDeleteDialog(item)">
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
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="720" class="pa-4" style="border-left: 2px solid #E2E8F0;">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">{{ isEdit ? "Update Plan" : "Create Plan" }}</h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VDivider class="mb-4" />

      <VForm ref="planForm">
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField v-model="form.title" label="Title *" placeholder="e.g., Pro Groomer" />
          </VCol>

          <VCol cols="12" sm="6">
            <AppTextField v-model="form.role_name" label="Role Name" placeholder="e.g., Groomer" />
          </VCol>

          <VCol cols="12" sm="6">
            <VSelect v-model="form.role" :items="roleOptions" label="Role" />
          </VCol>

          <VCol cols="12" sm="6">
            <AppTextField v-model="form.subtitle" label="Subtitle" />
          </VCol>

          <VCol cols="12">
            <AppTextField v-model="form.description" label="Description" textarea />
          </VCol>

          <VCol cols="12" sm="6">
            <VSelect v-model="form.default_billing_cycle" :items="billingCycles" item-title="name" item-value="id" label="Default Billing Cycle" />
          </VCol>

          <VCol cols="12" sm="6" class="d-flex align-center">
            <VSwitch v-model="form.is_active" label="Active" color="success" />
          </VCol>

          <!-- PRICES (repeatable) -->
          <VCol cols="12">
            <h4 class="text-subtitle-1 mb-2">Prices</h4>
            <div v-for="(p, idx) in form.prices" :key="idx" class="mb-3 border rounded-lg pa-3">
              <VRow>
                <VCol cols="12" sm="4">
                  <VSelect v-model="p.billing_cycle" :items="billingCycles" item-title="name" item-value="id" label="Billing Cycle" />
                </VCol>

                <VCol cols="12" sm="3">
                  <AppTextField v-model="p.amount" label="Amount" type="number" />
                </VCol>

                <VCol cols="12" sm="3">
                  <AppTextField v-model="p.currency" label="Currency" />
                </VCol>

                <VCol cols="12" sm="2" class="d-flex align-center justify-end">
                  <VBtn variant="flat" color="red" @click="removePrice(idx)"><VIcon icon="tabler-trash" /></VBtn>
                </VCol>
              </VRow>
            </div>
            <VBtn color="primary" variant="outlined" @click="addPrice">Add Price</VBtn>
          </VCol>

          <!-- ITEMS: service -> categories + permissions -->
          <VCol cols="12" class="mt-4">
            <h4 class="text-subtitle-1 mb-2">Plan Items (Service → Categories)</h4>
            <div v-for="(g, gi) in form.items" :key="gi" class="mb-4 border rounded-lg pa-3">
              <VRow>
                <VCol cols="12" sm="5">
                  <VSelect v-model="g.service" :items="services" item-title="display_name" item-value="id" label="Service" @change="onServiceChange(gi)" />
                </VCol>

                <VCol cols="12" sm="5">
                  <VSelect v-model="g.categories" :items="getCategoriesForService(g.service)" item-title="name" item-value="id" multiple label="Categories" />
                </VCol>

                <VCol cols="12" sm="2" class="d-flex align-center justify-end">
                  <VBtn variant="flat" color="red" @click="removeItemGroup(gi)"><VIcon icon="tabler-trash" /></VBtn>
                </VCol>

                <VCol cols="12" class="mt-2">
                  <div class="d-flex gap-x-2">
                    <VCheckbox v-model="g.can_view" label="View" />
                    <VCheckbox v-model="g.can_create" label="Create" />
                    <VCheckbox v-model="g.can_edit" label="Edit" />
                    <VCheckbox v-model="g.can_delete" label="Delete" />
                  </div>
                </VCol>
              </VRow>
            </div>

            <VBtn color="primary" variant="outlined" @click="addItemGroup">Add Item Group</VBtn>
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

          <h2 class="text-h6 font-weight-bold">Delete Plan?</h2>
          <p class="text-body-2 mt-1 text-medium-emphasis">You are about to delete <strong>{{ deleteItem?.title }}</strong>.</p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" variant="flat" prepend-icon="tabler-trash" @click="deletePlan">Delete</VBtn>
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
  name: "PlansPage",
  setup() {
    const baseURL = "http://127.0.0.1:8003/api/superadmin/plans/";
    const billingURL = "http://127.0.0.1:8003/api/superadmin/billing-cycles/";
    const servicesURL = "http://127.0.0.1:8003/api/superadmin/services/";
    const categoriesURL = "http://127.0.0.1:8003/api/superadmin/categories/";

    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;
    if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // table state
    const plans = ref([]);
    const headers = [
      { title: "Title", key: "title" },
      { title: "Role", key: "role" },
      { title: "Billing Cycle", key: "default_billing_cycle" },
      { title: "Active", key: "is_active" },
      { title: "Actions", key: "actions", sortable: false },
    ];
    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");

    // drawer + form
    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const loading = ref(false);
    const editId = ref(null);

    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const billingCycles = ref([]);
    const services = ref([]);
    const categories = ref([]);

    const roleOptions = ["individual", "organization", "business"];

    const form = ref({
      title: "",
      role_name: "",
      role: "individual",
      subtitle: "",
      description: "",
      default_billing_cycle: null,
      is_active: true,
      prices: [],
      items: [],
    });

    const fetchBillingCycles = async () => {
      try {
        const res = await axios.get(billingURL);
        billingCycles.value = res.data.results || res.data;
      } catch (err) {
        console.error("billing cycles load failed", err);
      }
    };

    const fetchServices = async () => {
      try {
        const res = await axios.get(servicesURL);
        services.value = res.data.results || res.data;
      } catch (err) {
        console.error("services load failed", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await axios.get(categoriesURL);
        categories.value = res.data.results || res.data;
      } catch (err) {
        console.error("categories load failed", err);
      }
    };

    const fetchPlans = async () => {
      try {
        const params = { page: page.value, page_size: itemsPerPage.value, search: searchQuery.value };
        const res = await axios.get(baseURL, { params });
        plans.value = res.data.results || res.data;
        totalItems.value = res.data.count || res.data.length;
      } catch (err) {
        console.error("failed to load plans", err);
      }
    };

    onMounted(async () => {
      await fetchBillingCycles();
      await fetchServices();
      await fetchCategories();
      await fetchPlans();
    });

    watch([page, itemsPerPage, searchQuery], fetchPlans);

    const updateOptions = () => fetchPlans();

    // prices helpers
    const addPrice = () => {
      form.value.prices.push({ billing_cycle: null, amount: "", currency: "USD", is_active: true });
    };
    const removePrice = (idx) => {
      form.value.prices.splice(idx, 1);
    };

    // items helpers
    const addItemGroup = () => {
      form.value.items.push({ service: null, categories: [], can_view: false, can_create: false, can_edit: false, can_delete: false });
    };
    const removeItemGroup = (gi) => {
      form.value.items.splice(gi, 1);
    };
    const onServiceChange = (gi) => {
      // nothing heavy — user will pick categories from available list
    };
    const getCategoriesForService = (serviceId) => {
      if (!serviceId) return [];
      // if categories include service link, filter; otherwise return all categories
      return categories.value.filter(c => c.service_id ? c.service_id === serviceId : true);
    };

    // drawer actions
    const openAddDrawer = () => {
      isEdit.value = false;
      editId.value = null;
      form.value = {
        title: "",
        role_name: "",
        role: "individual",
        subtitle: "",
        description: "",
        default_billing_cycle: null,
        is_active: true,
        prices: [],
        items: [],
      };
      drawerOpen.value = true;
    };

    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;
      // Map nested structures if present
      form.value = {
        title: item.title || "",
        role_name: item.role_name || "",
        role: item.role || "individual",
        subtitle: item.subtitle || "",
        description: item.description || "",
        default_billing_cycle: item.default_billing_cycle?.id || item.default_billing_cycle || null,
        is_active: item.is_active ?? true,
        prices: (item.prices || []).map(p => ({ billing_cycle: p.billing_cycle?.id || p.billing_cycle, amount: p.amount, currency: p.currency || "USD", is_active: p.is_active ?? true })),
        items: (item.items || []).map(it => ({ service: it.service || (it.service?.id ?? null), categories: (it.category ? [it.category] : (it.categories || []).map(c => c.id || c)), can_view: it.can_view, can_create: it.can_create, can_edit: it.can_edit, can_delete: it.can_delete })),
      };
      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // submit
    const submit = async () => {
      // basic validation
      if (!form.value.title?.trim()) return alert("Title is required");
      loading.value = true;
      const payload = {
        title: form.value.title,
        role_name: form.value.role_name,
        role: form.value.role,
        subtitle: form.value.subtitle,
        description: form.value.description,
        default_billing_cycle: form.value.default_billing_cycle,
        is_active: form.value.is_active,
        prices: form.value.prices.map(p => ({ billing_cycle: p.billing_cycle, amount: p.amount, currency: p.currency, is_active: p.is_active })),
        items: form.value.items.map(i => ({ service: i.service, categories: i.categories, can_view: i.can_view, can_create: i.can_create, can_edit: i.can_edit, can_delete: i.can_delete })),
      };

      try {
        if (isEdit.value) {
          await axios.put(baseURL + editId.value + "/", payload);
        } else {
          await axios.post(baseURL, payload);
        }
        drawerOpen.value = false;
        await fetchPlans();
      } catch (err) {
        console.error("save plan failed", err);
        alert(err?.response?.data?.detail || "Save failed");
      } finally {
        loading.value = false;
      }
    };

    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deletePlan = async () => {
      try {
        await axios.delete(baseURL + deleteItem.value.id + "/");
        deleteDialog.value = false;
        await fetchPlans();
      } catch (err) {
        console.error("delete failed", err);
        alert(err?.response?.data?.detail || "Delete failed");
      }
    };

    const togglePublish = async (item) => {
      try {
        if (item.is_active) {
          await axios.post(baseURL + item.id + "/unpublish/");
        } else {
          await axios.post(baseURL + item.id + "/publish/");
        }
        await fetchPlans();
      } catch (err) {
        console.error("publish toggle failed", err);
      }
    };

    return {
      plans, headers, page, itemsPerPage, totalItems, searchQuery, updateOptions,
      drawerOpen, isEdit, loading, form, openAddDrawer, openEditDrawer, closeDrawer, submit,
      deleteDialog, deleteItem, openDeleteDialog, deletePlan,
      addPrice, removePrice, addItemGroup, removeItemGroup, onServiceChange, getCategoriesForService,
      billingCycles, services, categories, roleOptions, togglePublish
    };
  }
};
</script>
