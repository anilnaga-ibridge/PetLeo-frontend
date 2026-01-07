<script setup>
import { ref, onMounted } from "vue";
import { superAdminApi } from "@/plugins/axios";

const baseURL = "/api/superadmin/plans/";
const billingCycleURL = "/api/superadmin/billing-cycles/";

const router = useRouter();
const route = useRoute();

// Check if edit mode
const planId = route.query.id || null;
const isEdit = ref(!!planId);

// Dropdowns
const billingCycles = ref([]);
const targetTypes = [
  { title: "Individual", value: "INDIVIDUAL" },
  { title: "Organization", value: "ORGANIZATION" },
];

// Form
const form = ref({
  title: "",
  target_type: "ORGANIZATION",
  subtitle: "",
  description: "",
  features: [],
  billing_cycle: null,
  price: 0,
  currency: "INR",
  is_active: true,
});

// Chips input
const featureInput = ref("");

const addFeature = () => {
  if (featureInput.value.trim()) {
    form.value.features.push(featureInput.value.trim());
    featureInput.value = "";
  }
};

const removeFeature = (i) => form.value.features.splice(i, 1);

// Fetch billing cycles
const fetchBillingCycles = async () => {
  try {
    const res = await superAdminApi.get(billingCycleURL);
    billingCycles.value = res.data.results || res.data || [];
  } catch (err) {
    console.error("Error fetching billing cycles:", err);
  }
};

// Load existing data
const loadPlan = async () => {
  if (!planId) return;

  try {
    const res = await superAdminApi.get(`${baseURL}${planId}/`);
    const p = res.data;

    form.value = {
      title: p.title,
      target_type: p.target_type,
      subtitle: p.subtitle,
      description: p.description,
      features: Array.isArray(p.features) ? [...p.features] : [],
      billing_cycle: p.billing_cycle,
      price: p.price,
      currency: p.currency,
      is_active: p.is_active,
    };
  } catch (err) {
    console.error("Error loading plan:", err);
  }
};

// Submit handler
const loading = ref(false);

const submit = async () => {
  loading.value = true;

  const payload = {
    title: form.value.title,
    target_type: form.value.target_type,
    subtitle: form.value.subtitle,
    description: form.value.description,
    features: [...form.value.features],
    billing_cycle: form.value.billing_cycle,
    price: form.value.price,
    currency: form.value.currency,
    is_active: form.value.is_active,
  };

  try {
    if (isEdit.value) {
      await superAdminApi.put(`${baseURL}${planId}/`, payload);
    } else {
      await superAdminApi.post(baseURL, payload);
    }

    router.push("/superadmin/plans/planss");
  } catch (err) {
    console.error("Submit error:", err.response?.data || err);
    alert("Failed to save plan! Check console for details.");
  } finally {
    loading.value = false;
  }
};

// Init
onMounted(async () => {
  await fetchBillingCycles();
  if (isEdit.value) await loadPlan();
});
</script>
<template>
  <section>
    <VCard class="pa-6">
      <VCardTitle class="text-h5 font-weight-bold mb-4">
        {{ isEdit ? "Update Plan" : "Create New Plan" }}
      </VCardTitle>

      <VForm>
        <VRow>
          <VCol cols="12">
            <AppTextField v-model="form.title" label="Title *" />
          </VCol>

          <VCol cols="12">
            <VSelect
              v-model="form.target_type"
              :items="targetTypes"
              item-title="title"
              item-value="value"
              label="Target Type *"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField v-model="form.subtitle" label="Subtitle" />
          </VCol>

          <VCol cols="12">
            <AppTextarea v-model="form.description" label="Description" rows="3" />
          </VCol>

          <!-- FEATURES -->
          <VCol cols="12">
            <label>Features</label>

            <div class="d-flex flex-wrap gap-2 mt-2">
              <VChip
                v-for="(feature, index) in form.features"
                :key="index"
                closable
                @click:close="removeFeature(index)"
              >
                {{ feature }}
              </VChip>
            </div>

            <div class="d-flex gap-2 mt-2">
              <AppTextField
                v-model="featureInput"
                placeholder="Add feature..."
                @keyup.enter="addFeature"
              />
              <VBtn @click="addFeature">Add</VBtn>
            </div>
          </VCol>

          <VCol cols="12" md="6">
            <VSelect
              v-model="form.billing_cycle"
              :items="billingCycles"
              item-title="display_name"
              item-value="code"
              label="Billing Cycle *"
            />
          </VCol>
          
          <VCol cols="12" md="6">
             <AppTextField v-model="form.price" label="Price" type="number" />
          </VCol>

          <VCol cols="12">
            <VSwitch v-model="form.is_active" label="Active" />
          </VCol>
        </VRow>
      </VForm>

      <div class="d-flex justify-end mt-4">
        <VBtn variant="text" class="me-2" @click="router.push('/superadmin/plans/planss')">
          Cancel
        </VBtn>

        <VBtn :loading="loading" color="primary" @click="submit">
          {{ isEdit ? "Update" : "Create" }}
        </VBtn>
      </div>
    </VCard>
  </section>
</template>
