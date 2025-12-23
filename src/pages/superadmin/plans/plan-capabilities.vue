<script>
import axios from "axios";
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { useCookie } from "@/@core/composable/useCookie";

export default {
  name: "PlanCapabilitiesPage",

  setup() {
    const BASE = "http://127.0.0.1:8003/api/superadmin/";
    const baseURL = BASE + "plan-capabilities/";
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
      { title: "Facility", key: "facility" },
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
      facility_id: null,
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

    // Computed Filters
    const filteredCategories = computed(() => {
      const selectedIds = form.value.service_id;
      if (!selectedIds || (Array.isArray(selectedIds) && selectedIds.length === 0)) {
        return [];
      }
      const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
      
      return categories.value.filter(c => {
        const sId = c.service?.id || c.service;
        return ids.includes(sId);
      });
    });

    const filteredFacilities = computed(() => {
      const selectedIds = form.value.service_id;
      if (!selectedIds || (Array.isArray(selectedIds) && selectedIds.length === 0)) {
        return [];
      }
      const ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];

      return facilities.value.filter(f => {
        const sId = f.service?.id || f.service;
        return ids.includes(sId);
      });
    });

    const onServiceChange = () => {
      if (!isEdit.value) {
        // Clear selections if they no longer belong to selected services
        const validCats = filteredCategories.value.map(c => c.id);
        const validFacs = filteredFacilities.value.map(f => f.id);
        
        if (Array.isArray(form.value.category_id)) {
          form.value.category_id = form.value.category_id.filter(id => validCats.includes(id));
        }
        if (Array.isArray(form.value.facility_id)) {
          form.value.facility_id = form.value.facility_id.filter(id => validFacs.includes(id));
        }
      }
    };

    // ADD drawer
    const openAddDrawer = () => {
      isEdit.value = false;
      editId.value = null;
      form.value = {
        plan: null,
        service_id: [],
        category_id: [],
        facility_id: [],
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
        facility_id: item.facility?.id ?? null,

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

      if ((!form.value.service_id || form.value.service_id.length === 0) && (!form.value.category_id || form.value.category_id.length === 0)) {
        alert("Please select either Service or Category.");
        loading.value = false;
        return;
      }

      try {
        if (isEdit.value) {
          // Edit Mode: Single Update
          const payload = {
            plan_id: form.value.plan,
            service_id: form.value.service_id,
            category_id: form.value.category_id || null,
            facility_id: form.value.facility_id || null,
            can_view: form.value.can_view,
            can_create: form.value.can_create,
            can_edit: form.value.can_edit,
            can_delete: form.value.can_delete,
          };
          await axios.put(`${baseURL}${editId.value}/`, payload);
        } else {
          // Create Mode: Filtered Combinations
          const services = Array.isArray(form.value.service_id) ? form.value.service_id : [form.value.service_id];
          const selectedCatIds = Array.isArray(form.value.category_id) ? form.value.category_id : [];
          const selectedFacIds = Array.isArray(form.value.facility_id) ? form.value.facility_id : [];

          const promises = [];
          let createdCount = 0;
          let skippedCount = 0;

          for (const sId of services) {
            const validCats = selectedCatIds.length > 0 
              ? selectedCatIds.filter(cId => {
                  const cat = categories.value.find(c => c.id === cId);
                  return cat && (cat.service?.id === sId || cat.service === sId);
                })
              : [null]; 

            const validFacs = selectedFacIds.length > 0
              ? selectedFacIds.filter(fId => {
                  const fac = facilities.value.find(f => f.id === fId);
                  return fac && (fac.service?.id === sId || fac.service === sId);
                })
              : [null];

            for (const cat of validCats) {
              for (const fac of validFacs) {
                const payload = {
                  plan_id: form.value.plan,
                  service_id: sId,
                  category_id: cat,
                  facility_id: fac,
                  can_view: form.value.can_view,
                  can_create: form.value.can_create,
                  can_edit: form.value.can_edit,
                  can_delete: form.value.can_delete,
                };
                
                // Wrap in a promise that catches errors to prevent Promise.all from failing
                const p = axios.post(baseURL, payload)
                  .then(() => { createdCount++; })
                  .catch(err => {
                    // If error is "unique set", just skip
                    if (err.response?.data?.non_field_errors?.[0]?.includes("unique set")) {
                      skippedCount++;
                    } else {
                      throw err; // Re-throw other errors
                    }
                  });
                promises.push(p);
              }
            }
          }
          
          // Use Promise.all to wait for all, but individual errors (except unique) will still bubble up if we want, 
          // or we can use allSettled. Since we re-throw non-unique errors, Promise.all will reject on unexpected errors.
          await Promise.all(promises);

          if (createdCount > 0 || skippedCount > 0) {
             // Success message could be added here if needed
             console.log(`Created ${createdCount}, Skipped ${skippedCount} duplicates.`);
          }
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

      console.log("Deleting PlanCapability ID:", deleteItem.value.id);

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
      filteredCategories,
      filteredFacilities,
      onServiceChange,
      
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
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">Plan Capabilities</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField 
              v-model="searchQuery" 
              placeholder="Search capabilities..." 
              prepend-inner-icon="tabler-search" 
            />
          </VCol>

          <VCol cols="12" sm="8" class="d-flex justify-end">
            <VBtn color="primary" prepend-icon="tabler-plus" class="px-6" @click="openAddDrawer">
              Add Capability
            </VBtn>
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
        class="text-no-wrap"
        @update:options="updateOptions"
      >

        <template #item.plan="{ item }">
          <div class="d-flex align-center">
            <VAvatar size="32" color="primary" variant="tonal" class="me-2">
              <VIcon icon="tabler-file-certificate" size="18" />
            </VAvatar>
            <span class="font-weight-medium">{{ item.plan?.title || "-" }}</span>
          </div>
        </template>

        <template #item.service="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon icon="tabler-briefcase" size="16" class="text-medium-emphasis" />
            <span>{{ item.service?.display_name || "-" }}</span>
          </div>
        </template>

        <template #item.category="{ item }">
          <VChip v-if="item.category" size="small" color="info" variant="tonal">
            {{ item.category.name }}
          </VChip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <template #item.facility="{ item }">
          <VChip v-if="item.facility" size="small" color="success" variant="tonal">
            {{ item.facility.name }}
          </VChip>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <!-- Permissions Grouped -->
        <template #item.can_view="{ item }">
          <VIcon :icon="item.can_view ? 'tabler-check' : 'tabler-x'" :color="item.can_view ? 'success' : 'medium-emphasis'" />
        </template>
        <template #item.can_create="{ item }">
          <VIcon :icon="item.can_create ? 'tabler-check' : 'tabler-x'" :color="item.can_create ? 'success' : 'medium-emphasis'" />
        </template>
        <template #item.can_edit="{ item }">
          <VIcon :icon="item.can_edit ? 'tabler-check' : 'tabler-x'" :color="item.can_edit ? 'success' : 'medium-emphasis'" />
        </template>
        <template #item.can_delete="{ item }">
          <VIcon :icon="item.can_delete ? 'tabler-check' : 'tabler-x'" :color="item.can_delete ? 'success' : 'medium-emphasis'" />
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

    <!-- Drawer -->
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="450" class="pa-4" style="border-left: 2px solid #E2E8F0;">
      <div class="pa-3 mb-4 rounded-lg" style="background: linear-gradient(135deg, #42a5f5, #1e88e5); color: white;">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ isEdit ? "Update Capability" : "Create Capability" }}</h3>
            <div class="text-caption opacity-90">Define what plans can do</div>
          </div>
          <IconBtn @click="closeDrawer" color="white" variant="text"><VIcon icon="tabler-x" /></IconBtn>
        </div>
      </div>

      <VForm>
        <VRow>
          <VCol cols="12">
            <AppSelect 
              v-model="form.plan" 
              :items="plans" 
              item-title="title" 
              item-value="id" 
              label="Plan *" 
              placeholder="Select a plan"
              prepend-inner-icon="tabler-file-certificate"
            />
          </VCol>

          <VCol cols="12">
            <AppSelect 
              v-model="form.service_id" 
              :items="services" 
              item-title="display_name" 
              item-value="id" 
              :label="isEdit ? 'Service' : 'Service (Select multiple)'" 
              :multiple="!isEdit"
              :chips="!isEdit"
              closable-chips
              placeholder="Select service(s)"
              prepend-inner-icon="tabler-briefcase"
              @update:model-value="onServiceChange"
            />
          </VCol>

          <VCol cols="12">
            <AppSelect 
              v-model="form.category_id" 
              :items="filteredCategories" 
              item-title="name" 
              item-value="id" 
              :label="isEdit ? 'Category' : 'Category (Select multiple)'" 
              :multiple="!isEdit"
              :chips="!isEdit"
              closable-chips
              placeholder="Select category(s)"
              prepend-inner-icon="tabler-category"
              :disabled="!form.service_id || (Array.isArray(form.service_id) && form.service_id.length === 0)"
            />
          </VCol>

          <VCol cols="12">
            <AppSelect 
              v-model="form.facility_id" 
              :items="filteredFacilities" 
              item-title="name" 
              item-value="id" 
              :label="isEdit ? 'Facility' : 'Facility (Select multiple)'" 
              :multiple="!isEdit"
              :chips="!isEdit"
              closable-chips
              placeholder="Select facility(s)"
              prepend-inner-icon="tabler-building"
              :disabled="!form.service_id || (Array.isArray(form.service_id) && form.service_id.length === 0)"
            />
          </VCol>

          <VCol cols="12">
            <VLabel class="mb-2 font-weight-medium">Permissions</VLabel>
            <VCard variant="outlined" class="pa-3">
              <div class="d-flex flex-wrap gap-4 justify-space-between">
                <VCheckbox v-model="form.can_view" label="View" color="primary" density="compact" hide-details />
                <VCheckbox v-model="form.can_create" label="Create" color="success" density="compact" hide-details />
                <VCheckbox v-model="form.can_edit" label="Edit" color="warning" density="compact" hide-details />
                <VCheckbox v-model="form.can_delete" label="Delete" color="error" density="compact" hide-details />
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VForm>

      <div class="d-flex justify-end mt-6 gap-2">
        <VBtn variant="text" @click="closeDrawer">Cancel</VBtn>
        <VBtn :loading="loading" color="primary" style="background: linear-gradient(135deg, #42a5f5, #1e88e5);" @click="submit">
          {{ isEdit ? "Update" : "Create" }}
        </VBtn>
      </div>
    </VNavigationDrawer>

    <!-- Delete dialog -->
    <VDialog v-model="deleteDialog" width="420" transition="dialog-bottom-transition">
      <VCard class="pa-4 rounded-xl" elevation="10">
        <div class="text-center mb-3">
          <VAvatar size="60" color="error" variant="tonal" class="mb-3">
            <VIcon icon="tabler-alert-triangle" size="32" />
          </VAvatar>
          <h3 class="text-h6 font-weight-bold">Delete Capability?</h3>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Are you sure you want to delete this capability?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="deleteItemConfirm" prepend-icon="tabler-trash">Delete</VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>
