<script>
import axios from "axios";
import { ref, onMounted, watch, nextTick } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "PlanItemsPage",

  setup() {
    const BASE = "http://127.0.0.1:8003/api/superadmin/";
    const baseURL = BASE + "plan-items/";
    const plansURL = BASE + "plans/";
    const servicesURL = BASE + "services/";
    const categoriesURL = BASE + "categories/";
    const facilitiesURL = BASE + "facilities/";

    // Token
    const cookieToken = useCookie("accessToken");
    const token = cookieToken.value;

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // State
    const items = ref([]);
    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const searchQuery = ref("");

    const headers = [
      { title: "Plan", key: "plan" },
      { title: "Service", key: "service" },
      { title: "Category", key: "category" },
      { title: "Facilities", key: "facilities" },
      { title: "View", key: "can_view" },
      { title: "Create", key: "can_create" },
      { title: "Edit", key: "can_edit" },
      { title: "Delete", key: "can_delete" },
      { title: "Actions", key: "actions", sortable: false },
    ];

    const drawerOpen = ref(false);
    const isEdit = ref(false);
    const editId = ref(null);
    const loading = ref(false);

    const plans = ref([]);
    const services = ref([]);
    const categories = ref([]);
    const facilities = ref([]);

    const form = ref({
      plan: null,
      service_id: null,
      category_id: null,
      facilities: [],
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    });

    // Lookup fetch
    const fetchLookup = async (url, setter) => {
      try {
        const res = await axios.get(url, { params: { page_size: 1000 } });
        setter.value = res.data.results || res.data || [];
      } catch (err) {
        console.error("❌ Lookup Error:", err);
      }
    };

    // Fetch items
    const fetchItems = async () => {
      try {
        const res = await axios.get(baseURL, {
          params: {
            page: page.value,
            page_size: itemsPerPage.value,
            search: searchQuery.value,
          },
        });

        const list = res.data.results || res.data || [];
        totalItems.value = res.data.count ?? list.length;

        // Convert to new array to avoid VDataTable caching problem
        items.value = JSON.parse(JSON.stringify(list));

      } catch (err) {
        console.error("❌ fetchItems Error:", err);
      }
    };

    onMounted(async () => {
      await Promise.all([
        fetchLookup(plansURL, plans),
        fetchLookup(servicesURL, services),
        fetchLookup(categoriesURL, categories),
        fetchLookup(facilitiesURL, facilities),
      ]);

      fetchItems();
    });

    watch([page, itemsPerPage, searchQuery], fetchItems);

    // ADD drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      editId.value = null;
      form.value = {
        plan: null,
        service_id: null,
        category_id: null,
        facilities: [],
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      };
      drawerOpen.value = true;
    };

    // EDIT drawer
    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;

      form.value = {
        plan: item.plan?.id ?? null,
        service_id: item.service?.id ?? null,
        category_id: item.category?.id ?? null,

        facilities: (item.facilities_detail || []).map(f => f.id),

        can_view: !!item.can_view,
        can_create: !!item.can_create,
        can_edit: !!item.can_edit,
        can_delete: !!item.can_delete,
      };

      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Submit (Create / Update)
    const submit = async () => {
      loading.value = true;

      if (!form.value.service_id && !form.value.category_id) {
        alert("Please select either Service or Category.");
        loading.value = false;
        return;
      }

      const payload = {
        plan_id: form.value.plan,
        service_id: form.value.service_id,
        category_id: form.value.category_id,
        facilities: form.value.facilities,
        can_view: form.value.can_view,
        can_create: form.value.can_create,
        can_edit: form.value.can_edit,
        can_delete: form.value.can_delete,
      };

      try {
        if (isEdit.value) {
          await axios.put(`${baseURL}${editId.value}/`, payload);
        } else {
          await axios.post(baseURL, payload);
        }

        drawerOpen.value = false;
        await fetchItems();

      } catch (err) {
        console.error("❌ Submit Error:", err.response?.data || err);
        alert(JSON.stringify(err.response?.data));
      } finally {
        loading.value = false;
      }
    };

    // Delete
    const deleteDialog = ref(false);
    const deleteItem = ref(null);

    const openDeleteDialog = (item) => {
      deleteItem.value = item;
      deleteDialog.value = true;
    };

    const deleteItemConfirm = async () => {
      if (!deleteItem.value) return;

      console.log("Deleting PlanItem ID:", deleteItem.value.id);

      try {
        await axios.delete(`${baseURL}${deleteItem.value.id}/`);
        deleteDialog.value = false;
        await fetchItems();
      } catch (err) {
        console.error("❌ Delete Error:", err);
      }
    };

    return {
      items,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,

      drawerOpen,
      isEdit,
      loading,
      editId,
      plans,
      services,
      categories,
      facilities,

      form,
      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      submit,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deleteItemConfirm,

      updateOptions: fetchItems,
    };
  },
};
</script>




<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle class="text-h5 font-weight-bold">Plan Items</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField v-model="searchQuery" placeholder="Search..." prepend-inner-icon="tabler-search" />
          </VCol>

          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn color="primary" prepend-icon="tabler-plus" @click="openAddDrawer">Add Item</VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="items"
        item-value="id"
        :items-length="totalItems"
        :headers="headers"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >

        <template #item.plan="{ item }">
          <strong>{{ item.plan?.title || "-" }}</strong>
        </template>

        <template #item.service="{ item }">
          {{ item.service?.display_name || "-" }}
        </template>

        <template #item.category="{ item }">
          {{ item.category?.name || "-" }}
        </template>

        <template #item.facilities="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <VChip v-for="f in item.facilities_detail" :key="f.id" size="x-small">
              {{ f.name }}
            </VChip>
          </div>
        </template>

        <template #item.can_view="{ item }">
          <VChip size="small" v-if="item.can_view">Yes</VChip>
        </template>

        <template #item.can_create="{ item }">
          <VChip size="small" v-if="item.can_create">Yes</VChip>
        </template>

        <template #item.can_edit="{ item }">
          <VChip size="small" v-if="item.can_edit">Yes</VChip>
        </template>

        <template #item.can_delete="{ item }">
          <VChip size="small" v-if="item.can_delete">Yes</VChip>
        </template>

        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)"><VIcon icon="tabler-edit" /></IconBtn>
          <IconBtn color="red" @click="openDeleteDialog(item)"><VIcon icon="tabler-trash" /></IconBtn>
        </template>

        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalItems" />
        </template>

      </VDataTableServer>
    </VCard>

    <!-- Drawer -->
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="520" class="pa-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3>{{ isEdit ? "Update Plan Item" : "Create Plan Item" }}</h3>
        <IconBtn @click="closeDrawer"><VIcon icon="tabler-x" /></IconBtn>
      </div>

      <VForm>
        <VRow>
          <VCol cols="12">
            <VSelect v-model="form.plan" :items="plans" item-title="title" item-value="id" label="Plan *" />
          </VCol>

          <VCol cols="12">
            <VSelect v-model="form.service_id" :items="services" item-title="display_name" item-value="id" label="Service" />
          </VCol>

          <VCol cols="12">
            <VSelect v-model="form.category_id" :items="categories" item-title="name" item-value="id" label="Category" />
          </VCol>

          <VCol cols="12">
            <VSelect v-model="form.facilities" :items="facilities" item-title="name" item-value="id" multiple label="Facilities" />
          </VCol>

          <VCol cols="12" class="d-flex gap-3">
            <VCheckbox v-model="form.can_view" label="View" />
            <VCheckbox v-model="form.can_create" label="Create" />
            <VCheckbox v-model="form.can_edit" label="Edit" />
            <VCheckbox v-model="form.can_delete" label="Delete" />
          </VCol>
        </VRow>
      </VForm>

      <div class="d-flex justify-end mt-4">
        <VBtn variant="text" @click="closeDrawer">Cancel</VBtn>
        <VBtn :loading="loading" color="primary" @click="submit">
          {{ isEdit ? "Update" : "Create" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- Delete dialog -->
    <VDialog v-model="deleteDialog" width="420" persistent>
      <VCard class="pa-4 rounded-xl">
        <div class="text-center">
          <VAvatar size="60" color="red" variant="tonal">
            <VIcon icon="tabler-alert-triangle" size="30" />
          </VAvatar>
          <h2>Delete Plan Item?</h2>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="deleteItemConfirm">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>
