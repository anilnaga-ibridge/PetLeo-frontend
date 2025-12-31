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
      service_id: [], // Array of service IDs
    });

    // New State for Unified UI
    const selectedFeatures = ref({}); // { serviceId: [catId1, catId2] }
    const selectedCRUD = ref({});     // { serviceId: { can_view: true, can_create: false... } }

    const isVeterinary = (service) => {
      if (!service) return false;
      const name = service.name || service.display_name || "";
      return name.toUpperCase().includes("VETERINARY");
    };

    const featureMapping = {
      'VETERINARY_VISITS': 'Manage Visits',
      'VETERINARY_VITALS': 'Record Vitals',
      'VETERINARY_PRESCRIPTIONS': 'Prescriptions',
      'VETERINARY_LABS': 'Lab Tests',
      'VETERINARY_ONLINE_CONSULT': 'Online Consultation',
      'VETERINARY_OFFLINE_VISIT': 'Offline Visits',
      'VETERINARY_MEDICINE_REMINDERS': 'Medicine Reminders'
    };

    const formatFeatureName = (name) => {
      if (!name) return '';
      // Try exact match
      if (featureMapping[name]) return featureMapping[name];
      // Try matching without VETERINARY_ prefix if DB has different naming
      const upper = name.toUpperCase();
      if (featureMapping[upper]) return featureMapping[upper];
      
      // Fallback: Title Case if it looks like a code
      if (upper.includes('_')) {
         return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return name;
    };



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

    // Initialize state when services are selected
    watch(() => form.value.service_id, (newVal) => {
      const ids = Array.isArray(newVal) ? newVal : (newVal ? [newVal] : []);
      ids.forEach(id => {
        if (!selectedFeatures.value[id]) selectedFeatures.value[id] = [];
        if (!selectedCRUD.value[id]) selectedCRUD.value[id] = { 
          can_view: false, 
          can_create: false, 
          can_edit: false, 
          can_delete: false 
        };
      });
    });

    // Computed: Get selected service objects
    const selectedServicesList = computed(() => {
      const ids = Array.isArray(form.value.service_id) ? form.value.service_id : [];
      return services.value.filter(s => ids.includes(s.id));
    });

    // Helper to get categories for a service
    const getCategoriesForService = (serviceId) => {
      return categories.value.filter(c => {
        const cServiceId = c.service?.id || c.service;
        return String(cServiceId) === String(serviceId);
      });
    };

    // ADD drawer
    const openAddDrawer = async () => {
      isEdit.value = false;
      editId.value = null;
      form.value = {
        plan: null,
        service_id: [],
      };
      selectedFeatures.value = {};
      selectedCRUD.value = {};
      
      // Refresh lookups to ensure we have latest categories
      await Promise.all([
        fetchLookup(servicesURL, services),
        fetchLookup(categoriesURL, categories)
      ]);

      drawerOpen.value = true;
    };

    // EDIT drawer
    const openEditDrawer = (item) => {
      isEdit.value = true;
      editId.value = item.id;

      // For Edit, we only support editing one item at a time, but UI is built for bulk.
      // We'll just load the single item into the form.
      form.value = {
        plan: item.plan?.id ?? null,
        service_id: item.service?.id ? [item.service.id] : [],
      };
      
      // Populate state based on what it is
      selectedFeatures.value = {};
      selectedCRUD.value = {};

      if (item.service) {
        const sId = item.service.id;
        if (isVeterinary(item.service)) {
           // If it's a category permission
           if (item.category) {
             selectedFeatures.value[sId] = [item.category.id];
           }
        } else {
           // CRUD
           selectedCRUD.value[sId] = {
             can_view: !!item.can_view,
             can_create: !!item.can_create,
             can_edit: !!item.can_edit,
             can_delete: !!item.can_delete,
           };
        }
      }

      drawerOpen.value = true;
    };

    const closeDrawer = () => (drawerOpen.value = false);

    // Submit (Create / Update)
    const submit = async () => {
      loading.value = true;

      if (!form.value.plan) {
        alert("Please select a Plan.");
        loading.value = false;
        return;
      }
      if (!form.value.service_id || form.value.service_id.length === 0) {
        alert("Please select at least one Service.");
        loading.value = false;
        return;
      }

      try {
        const promises = [];
        let createdCount = 0;
        let skippedCount = 0;

        // Iterate over selected services
        const serviceIds = Array.isArray(form.value.service_id) ? form.value.service_id : [form.value.service_id];

        for (const sId of serviceIds) {
          const serviceObj = services.value.find(s => s.id === sId);
          if (!serviceObj) continue;

          if (isVeterinary(serviceObj)) {
            // === VETERINARY (Feature-based) ===
            // Create one capability per selected Category
            const catIds = selectedFeatures.value[sId] || [];
            for (const cId of catIds) {
              const payload = {
                plan_id: form.value.plan,
                service_id: sId,
                category_id: cId,
                facility_id: null,
                // Feature permissions usually imply "View" access to that feature
                can_view: true, 
                can_create: true, // Defaulting to full access for the feature
                can_edit: true,
                can_delete: true,
              };
              promises.push(createOrUpdate(payload));
            }
            // If no categories selected, maybe they just want the service itself?
            if (catIds.length === 0) {
               // Optional: Create a "Core" capability if no category selected?
               // For now, we'll assume they must select features.
            }

          } else {
            // === REGULAR (CRUD-based) ===
            const perms = selectedCRUD.value[sId] || { can_view: false, can_create: false, can_edit: false, can_delete: false };
            
            // Only create if at least one permission is true
            if (perms.can_view || perms.can_create || perms.can_edit || perms.can_delete) {
              const payload = {
                plan_id: form.value.plan,
                service_id: sId,
                category_id: null,
                facility_id: null,
                can_view: perms.can_view,
                can_create: perms.can_create,
                can_edit: perms.can_edit,
                can_delete: perms.can_delete,
              };
              promises.push(createOrUpdate(payload));
            }
          }
        }

        await Promise.all(promises);
        
        drawerOpen.value = false;
        await fetchItems();

      } catch (err) {
        console.error("❌ Submit Error:", err.response?.data || err);
        alert(JSON.stringify(err.response?.data));
      } finally {
        loading.value = false;
      }
    };

    const createOrUpdate = (payload) => {
       if (isEdit.value && editId.value) {
         return axios.put(`${baseURL}${editId.value}/`, payload);
       } else {
         return axios.post(baseURL, payload).catch(err => {
            if (err.response?.data?.non_field_errors?.[0]?.includes("unique set")) {
               // ignore duplicates
            } else {
               throw err;
            }
         });
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
      selectedFeatures,
      selectedCRUD,
      selectedServicesList,
      getCategoriesForService,
      isVeterinary,
      
      openAddDrawer,
      openEditDrawer,
      closeDrawer,
      submit,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deleteItemConfirm,

      updateOptions: fetchItems,
      formatFeatureName,
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
          <!-- VETERINARY: Show Feature Badge -->
          <div v-if="isVeterinary(item.service)">
            <VChip v-if="item.category" size="small" color="primary" variant="flat" prepend-icon="tabler-star">
              Feature: {{ formatFeatureName(item.category.name) }}
            </VChip>
            <span v-else class="text-medium-emphasis">-</span>
          </div>
          <!-- REGULAR: Show Category Chip -->
          <div v-else>
            <VChip v-if="item.category" size="small" color="info" variant="tonal">
              {{ item.category.name }}
            </VChip>
            <span v-else class="text-medium-emphasis">-</span>
          </div>
        </template>

        <template #item.facility="{ item }">
          <!-- VETERINARY: Hide Facility -->
          <div v-if="isVeterinary(item.service)">
            <span class="text-disabled text-caption">N/A</span>
          </div>
          <!-- REGULAR: Show Facility Chip -->
          <div v-else>
            <VChip v-if="item.facility" size="small" color="success" variant="tonal">
              {{ item.facility.name }}
            </VChip>
            <span v-else class="text-medium-emphasis">-</span>
          </div>
        </template>

        <!-- Permissions Grouped -->
        <!-- Permissions Grouped -->
        <template #item.can_view="{ item }">
          <div v-if="isVeterinary(item.service)">
            <VChip size="x-small" color="success" variant="elevated">Enabled</VChip>
          </div>
          <VIcon v-else :icon="item.can_view ? 'tabler-check' : 'tabler-x'" :color="item.can_view ? 'success' : 'medium-emphasis'" />
        </template>
        <template #item.can_create="{ item }">
          <div v-if="isVeterinary(item.service)">
            <span class="text-disabled">-</span>
          </div>
          <VIcon v-else :icon="item.can_create ? 'tabler-check' : 'tabler-x'" :color="item.can_create ? 'success' : 'medium-emphasis'" />
        </template>
        <template #item.can_edit="{ item }">
          <div v-if="isVeterinary(item.service)">
            <span class="text-disabled">-</span>
          </div>
          <VIcon v-else :icon="item.can_edit ? 'tabler-check' : 'tabler-x'" :color="item.can_edit ? 'success' : 'medium-emphasis'" />
        </template>
        <template #item.can_delete="{ item }">
          <div v-if="isVeterinary(item.service)">
            <span class="text-disabled">-</span>
          </div>
          <VIcon v-else :icon="item.can_delete ? 'tabler-check' : 'tabler-x'" :color="item.can_delete ? 'success' : 'medium-emphasis'" />
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
    <VNavigationDrawer v-model="drawerOpen" location="end" temporary width="450" class="pa-0" style="border-left: 2px solid #E2E8F0;">
      <div class="d-flex flex-column h-100 pa-4">
        <!-- Header -->
        <div class="pa-3 mb-4 rounded-lg flex-shrink-0" style="background: linear-gradient(135deg, #42a5f5, #1e88e5); color: white;">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h3 class="text-h6 font-weight-bold mb-1">{{ isEdit ? "Update Capability" : "Create Capability" }}</h3>
              <div class="text-caption opacity-90">Define what plans can do</div>
            </div>
            <IconBtn @click="closeDrawer" color="white" variant="text"><VIcon icon="tabler-x" /></IconBtn>
          </div>
        </div>

        <!-- Scrollable Form -->
        <div class="flex-grow-1 overflow-y-auto pe-2">
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
                />
              </VCol>

              <!-- DYNAMIC PERMISSIONS SECTION -->
              <VCol cols="12" v-if="selectedServicesList.length > 0">
                <VLabel class="mb-2 font-weight-medium">Permissions</VLabel>
                
                <div v-for="service in selectedServicesList" :key="service.id" class="mb-4">
                  <VCard variant="outlined" class="pa-3">
                    <div class="d-flex align-center mb-3">
                      <VAvatar size="32" color="primary" variant="tonal" class="me-2">
                        <VIcon :icon="service.icon || 'tabler-box'" size="18" />
                      </VAvatar>
                      <span class="font-weight-bold">{{ service.display_name }}</span>
                      <VChip v-if="isVeterinary(service)" size="x-small" color="info" class="ms-2">Feature-Based</VChip>
                      <VChip v-else size="x-small" color="secondary" class="ms-2">CRUD-Based</VChip>
                    </div>

                    <VDivider class="mb-3" />

                    <!-- VETERINARY: Show Categories as Checkboxes -->
                    <div v-if="isVeterinary(service)">
                      <div class="bg-grey-lighten-4 pa-3 rounded mb-3">
                        <div class="font-weight-bold text-primary mb-1">Veterinary Management (Feature Permissions)</div>
                        <div class="text-caption text-medium-emphasis">Select the features enabled for this plan.</div>
                      </div>

                      <div v-if="getCategoriesForService(service.id).length === 0" class="text-caption text-medium-emphasis px-3">
                        No features available for this service.
                      </div>
                      <div v-else class="d-flex flex-column gap-2 px-3">
                        <VCheckbox 
                          v-for="cat in getCategoriesForService(service.id)" 
                          :key="cat.id"
                          v-model="selectedFeatures[service.id]"
                          :value="cat.id"
                          :label="formatFeatureName(cat.name)"
                          density="compact"
                          hide-details
                        />
                      </div>
                    </div>

                    <!-- REGULAR: Show CRUD Checkboxes -->
                    <div v-else>
                      <div class="bg-grey-lighten-4 pa-3 rounded mb-3">
                        <div class="font-weight-bold text-primary mb-1">{{ service.display_name }} (CRUD Permissions)</div>
                        <div class="text-caption text-medium-emphasis">Define access levels for this service.</div>
                      </div>

                      <div class="d-flex flex-wrap gap-4 justify-space-between px-3">
                        <VCheckbox 
                          v-model="selectedCRUD[service.id].can_view" 
                          label="View" color="primary" density="compact" hide-details 
                          @update:model-value="(val) => { if(!selectedCRUD[service.id]) selectedCRUD[service.id] = {}; selectedCRUD[service.id].can_view = val; }"
                        />
                        <VCheckbox 
                          v-model="selectedCRUD[service.id].can_create" 
                          label="Create" color="success" density="compact" hide-details 
                          @update:model-value="(val) => { if(!selectedCRUD[service.id]) selectedCRUD[service.id] = {}; selectedCRUD[service.id].can_create = val; }"
                        />
                        <VCheckbox 
                          v-model="selectedCRUD[service.id].can_edit" 
                          label="Edit" color="warning" density="compact" hide-details 
                          @update:model-value="(val) => { if(!selectedCRUD[service.id]) selectedCRUD[service.id] = {}; selectedCRUD[service.id].can_edit = val; }"
                        />
                        <VCheckbox 
                          v-model="selectedCRUD[service.id].can_delete" 
                          label="Delete" color="error" density="compact" hide-details 
                          @update:model-value="(val) => { if(!selectedCRUD[service.id]) selectedCRUD[service.id] = {}; selectedCRUD[service.id].can_delete = val; }"
                        />
                      </div>
                    </div>

                  </VCard>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </div>

        <!-- Footer -->
        <div class="d-flex justify-end mt-4 pt-2 border-t flex-shrink-0 gap-2">
          <VBtn variant="text" @click="closeDrawer">Cancel</VBtn>
          <VBtn :loading="loading" color="primary" style="background: linear-gradient(135deg, #42a5f5, #1e88e5);" @click="submit">
            {{ isEdit ? "Update" : "Create" }}
          </VBtn>
        </div>
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
