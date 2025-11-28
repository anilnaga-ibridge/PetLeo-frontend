<template>
  <div class="provider-container">

    <!-- HEADER -->
    <div class="header-card">
      <div class="header-left">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="subtitle">Fill your profile details below</p>
      </div>
      <div class="header-right">
        <div class="role-badge">
          <span class="role-label">Role</span>
          <strong class="role-value">{{ displayRole }}</strong>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading">Loading dynamic fields…</div>

    <!-- EMPTY -->
    <div v-else-if="fields.length === 0" class="empty-box">
      No dynamic fields available for <strong>{{ pageTitle }}</strong>.
    </div>

    <!-- ===================== FORM ===================== -->
    <form v-else @submit.prevent="submitForm" class="form-card" novalidate>

      <div v-for="field in fields" :key="field.id" class="field-block">

        <!-- label -->
        <label :for="'f-' + field.id" class="field-label">
          {{ field.label }}
          <span v-if="field.is_required" class="required">*</span>
        </label>

        <!-- text / number / date -->
        <input
          v-if="['text','number','date'].includes(field.field_type)"
          :id="'f-' + field.id"
          :type="field.field_type"
          v-model="formData[field.id]"
          class="input-control"
        />

        <!-- textarea -->
        <textarea
          v-else-if="field.field_type === 'textarea'"
          :id="'f-' + field.id"
          v-model="formData[field.id]"
          class="textarea-control"
        ></textarea>

        <!-- dropdown -->
        <select
          v-else-if="field.field_type === 'dropdown'"
          :id="'f-' + field.id"
          v-model="formData[field.id]"
          class="select-control"
        >
          <option value="" disabled>Select</option>
          <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- multiselect -->
        <div v-else-if="field.field_type === 'multiselect'" class="multi-box">
          <label v-for="opt in field.options" :key="opt" class="multi-option">
            <input
              type="checkbox"
              :checked="formData[field.id].includes(opt)"
              @change="toggleMulti(field.id, opt, $event.target.checked)"
            />
            {{ opt }}
          </label>
        </div>

        <!-- file upload -->
        <div v-else-if="field.field_type === 'file'" class="file-box">
          <input type="file" @change="onFileChange(field.id, $event)" />
          <div v-if="fileMetadata[field.id]" class="file-meta">
            <strong>{{ fileMetadata[field.id].name }}</strong>
            <small>{{ formatBytes(fileMetadata[field.id].size) }}</small>
          </div>
        </div>

        <!-- error -->
        <div v-if="errors[field.id]" class="error-msg">{{ errors[field.id] }}</div>
      </div>

      <!-- submit -->
      <div class="form-footer">
        <button type="submit" :disabled="submitting">
          <span v-if="submitting">Saving…</span>
          <span v-else>Save Profile</span>
        </button>
      </div>

    </form>

    <!-- messages -->
    <div v-if="successMessage" class="success-msg">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-msg large">{{ errorMessage }}</div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useCookie } from "@/@core/composable/useCookie";
import api from "@/plugins/axios";

const GET_FIELDS_API = "http://127.0.0.1:8002/api/provider/definitions/";
const GET_SAVED_API = "http://127.0.0.1:8002/api/provider/values/";
const SUBMIT_API = "http://127.0.0.1:8002/api/provider/submit/";

/* states */
const fields = ref([]);
const formData = reactive({});
const fileMetadata = reactive({});
const savedData = ref([]);
const loading = ref(false);
const submitting = ref(false);
const errors = reactive({});
const successMessage = ref("");
const errorMessage = ref("");

/* cookie */
const userData = useCookie("userData").value || {};
const userId = userData?.id;

/* header text */
const displayRole = computed(() => userData?.role || "unknown");
const dynamicTarget = userData?.provider_type || "individual";
const pageTitle = computed(() =>
  dynamicTarget === "individual"
    ? "Individual Provider Profile"
    : dynamicTarget === "employee"
    ? "Employee Profile"
    : "Organization Profile"
);

/* helpers */
function initFieldValue(field) {
  formData[field.id] = savedData.value[field.id] ?? 
    (field.field_type === "multiselect" ? [] :
     field.field_type === "file" ? null : "");
}

function toggleMulti(fieldId, option, checked) {
  if (checked) formData[fieldId].push(option);
  else formData[fieldId] = formData[fieldId].filter(x => x !== option);
}

function onFileChange(fieldId, evt) {
  const file = evt.target.files[0];
  if (!file) return;
  fileMetadata[fieldId] = { name: file.name, size: file.size, type: file.type };
  formData[fieldId] = file.name;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

/* validation */
function validateFields() {
  Object.keys(errors).forEach(k => delete errors[k]);
  let ok = true;

  fields.value.forEach(f => {
    const v = formData[f.id];
    const empty = !v || (Array.isArray(v) && v.length === 0);
    if (f.is_required && empty) {
      errors[f.id] = `${f.label} is required`;
      ok = false;
    }
  });

  return ok;
}

/* payload */
function buildPayload() {
  return fields.value.map(f => ({
    field_id: f.id,
    value: formData[f.id],
    metadata: fileMetadata[f.id] || {}
  }));
}

/* load saved */
async function loadSavedValues() {
  const res = await api.get(GET_SAVED_API, { params: { user: userId } });
  const obj = {};
  res.data.values.forEach(v => {
    obj[v.field_id] = v.value;
  });
  savedData.value = obj;
}

/* load fields + saved */
async function fetchAll() {
  loading.value = true;

  const fieldsRes = await api.get(GET_FIELDS_API, {
    params: { target: dynamicTarget }
  });

  fields.value = fieldsRes.data.fields || [];

  await loadSavedValues();

  fields.value.forEach(initFieldValue);

  loading.value = false;
}

/* submit */
async function submitForm() {
  successMessage.value = "";
  errorMessage.value = "";

  if (!validateFields()) return;

  try {
    submitting.value = true;

    const res = await api.post(`${SUBMIT_API}?user=${userId}`, buildPayload());
    successMessage.value = "Saved successfully!";
  } catch (err) {
    errorMessage.value = err.response?.data?.error || "Submit failed";
  }

  submitting.value = false;
}

onMounted(fetchAll);
</script>

<style scoped>
/* same styling as before */
.provider-container {
  max-width: 900px;
  margin: 28px auto;
  padding: 12px;
  font-family: Inter, system-ui;
}

.header-card {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #e6eef8;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 18px;
}

.page-title { margin: 0; font-size: 20px; font-weight: 700; }
.subtitle { margin-top: 5px; color: #475569; }

.role-badge {
  background: #1e3a8a; color: #fff;
  padding: 8px 12px; border-radius: 50px;
}
.form-card {
  background: #fff;
  border: 1px solid #e6eef8;
  padding: 18px; border-radius: 10px;
}
.field-block { margin-bottom: 18px; }
.field-label { display: block; margin-bottom: 8px; font-weight: 600; }
.input-control, .textarea-control, .select-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #dde7f3;
  border-radius: 8px;
}
.multi-box { display: flex; gap: 10px; flex-wrap: wrap; }
.multi-option { padding: 6px 10px; background: #eef2ff; border-radius: 8px; }
.file-meta { margin-top: 6px; font-size: 13px; color: #475569; }
button {
  background: #2563eb; color: white;
  padding: 12px 18px; border-radius: 10px;
}
.success-msg { margin-top: 12px; color: green; }
.error-msg { margin-top: 12px; color: red; }
</style>
