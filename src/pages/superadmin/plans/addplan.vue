<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { useCookie } from "@/@core/composable/useCookie";

const baseURL = "http://127.0.0.1:8003/api/superadmin/plans/";
const billingCycleURL = "http://127.0.0.1:8003/api/superadmin/billing-cycles/";
const rolesURL = "http://127.0.0.1:8000/auth/roles/public/";

const router = useRouter();
const route = useRoute();

// Token
const cookieToken = useCookie("accessToken");
const token = cookieToken.value;
if (token) axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

// Check if edit mode
const planId = route.query.id || null;
const isEdit = ref(!!planId);

// Dropdowns
const billingCycles = ref([]);
const roles = ref([]);

// Form - Crt Field Name => default_billing_cycle_id
const form = ref({
  title: "",
  role: "",
  subtitle: "",
  description: "",
  features: [],
  default_billing_cycle_id: null,   // FIXED
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

// Fetch roles
const fetchRoles = async () => {
  const res = await axios.get(rolesURL);
  roles.value = res.data.roles || res.data || [];
};

// Fetch billing cycles
const fetchBillingCycles = async () => {
  const res = await axios.get(billingCycleURL);
  billingCycles.value = res.data.results || res.data || [];
};

// Load existing data
const loadPlan = async () => {
  if (!planId) return;

  const res = await axios.get(`${baseURL}${planId}/`);
  const p = res.data;

  form.value = {
    title: p.title,
    role: p.role,
    subtitle: p.subtitle,
    description: p.description,
    features: Array.isArray(p.features) ? [...p.features] : [],
    default_billing_cycle_id: p.default_billing_cycle?.id || null,  // FIXED
    is_active: p.is_active,
  };
};

// Submit handler
const loading = ref(false);

const submit = async () => {
  loading.value = true;

  const payload = {
    title: form.value.title,
    role: form.value.role,
    subtitle: form.value.subtitle,
    description: form.value.description,
    features: [...form.value.features],
    default_billing_cycle_id: form.value.default_billing_cycle_id,  // FIXED
    is_active: form.value.is_active,
  };

  try {
    if (isEdit.value) {
      await axios.put(`${baseURL}${planId}/`, payload);
    } else {
      await axios.post(baseURL, payload);
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
  await fetchRoles();
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
              v-model="form.role"
              :items="roles"
              item-title="name"
              item-value="key"
              label="Role *"
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

          <VCol cols="12">
            <VSelect
              v-model="form.default_billing_cycle_id"
              :items="billingCycles"
              item-title="name"
              item-value="id"
              label="Default Billing Cycle"
            />
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
