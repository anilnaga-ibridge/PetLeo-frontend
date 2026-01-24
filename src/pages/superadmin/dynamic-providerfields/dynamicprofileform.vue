<template>
  <div class="provider-container">
    <!-- HEADER -->
    <div class="header-card">
      <div class="header-left">
        <h1 class="page-title">
          {{ pageTitle }}
        </h1>
        <p class="subtitle">
          Fill your profile details below
        </p>
      </div>
      <div class="header-right">
        <div class="role-badge">
          <span
            class="role-label"
            style="color:red"
          >Role  </span>
          <strong class="role-value">{{ displayRole }}</strong>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div
      v-if="loading"
      class="loading"
    >
      Loading dynamic fields…
    </div>

    <!-- FORM -->
    <form
      v-else
      class="form-card"
      @submit.prevent="submitForm"
    >
      <div
        v-for="field in fields"
        :key="field.id"
        class="field-block"
      >
        <label class="field-label">
          {{ field.label }}
          <span
            v-if="field.is_required"
            class="required"
          >*</span>
        </label>

        <!-- TEXT -->
        <input
          v-if="['text','number','date'].includes(field.field_type)"
          v-model="formData[field.id]"
          :type="field.field_type"
          class="input-control"
        >

        <!-- TEXTAREA -->
        <textarea
          v-else-if="field.field_type === 'textarea'"
          v-model="formData[field.id]"
          class="textarea-control"
        />

        <!-- DROPDOWN -->
        <select
          v-else-if="field.field_type === 'dropdown'"
          v-model="formData[field.id]"
          class="select-control"
        >
          <option
            value=""
            disabled
          >
            Select
          </option>
          <option
            v-for="o in field.options"
            :key="o"
            :value="o"
          >
            {{ o }}
          </option>
        </select>

        <!-- MULTISELECT -->
        <div
          v-else-if="field.field_type === 'multiselect'"
          class="multi-box"
        >
          <label
            v-for="opt in field.options"
            :key="opt"
            class="multi-option"
          >
            <input
              type="checkbox"
              :checked="formData[field.id].includes(opt)"
              @change="toggleMulti(field.id, opt, $event.target.checked)"
            >
            {{ opt }}
          </label>
        </div>

        <!-- FILE -->
        <div
          v-else-if="field.field_type === 'file'"
          class="file-box"
        >
          <!-- File Input -->
          <input
            type="file"
            @change="onFileChange(field.id, $event)"
          >

          <!-- PREVIEW EXISTING -->
          <div
            v-if="fileMetadata[field.id]?.file_url"
            class="file-preview"
          >
            <img
              v-if="isImage(fileMetadata[field.id].file_url)"
              :src="fileMetadata[field.id].file_url"
              class="preview-img"
            >
          </div>

          <!-- NEW FILE PREVIEW -->
          <div
            v-if="fileMetadata[field.id]?.objectUrl"
            class="file-preview"
          >
            <img
              v-if="isImage(fileMetadata[field.id].objectUrl)"
              :src="fileMetadata[field.id].objectUrl"
              class="preview-img"
            >
            <span>{{ fileMetadata[field.id].name }} ({{ formatBytes(fileMetadata[field.id].size) }})</span>
          </div>
        </div>

        <!-- ERRORS -->
        <div
          v-if="errors[field.id]"
          class="error-msg"
        >
          {{ errors[field.id] }}
        </div>
      </div>

      <div class="form-footer">
        <button
          type="submit"
          :disabled="submitting"
        >
          <span v-if="submitting">Saving...</span>
          <span v-else>Save</span>
        </button>
      </div>
    </form>

    <div
      v-if="successMessage"
      class="success-msg"
    >
      {{ successMessage }}
    </div>
    <div
      v-if="errorMessage"
      class="error-msg large"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue"
import { api } from "@/plugins/axios"
import { useCookie } from "@/@core/composable/useCookie"

const GET_PROFILE_API = "http://127.0.0.1:8002/api/provider/profile/"
const SUBMIT_API = "http://127.0.0.1:8002/api/provider/submit/"

const fields = ref([])
const loading = ref(false)
const submitting = ref(false)

const formData = reactive({})
const fileMetadata = reactive({})
const errors = reactive({})
const successMessage = ref("")
const errorMessage = ref("")

const userData = useCookie("userData").value || {}
const userId = userData.id
const dynamicTarget = userData.provider_type
const userRole = userData.role

const pageTitle = computed(() =>
  dynamicTarget === "employee"
    ? "Employee Profile"
    : dynamicTarget === "organization"
      ? "Organization Profile"
      : "Individual Profile",
)

const displayRole = computed(() => userRole || "unknown")

const isImage = url => /\.(jpg|jpeg|png|gif|webp)$/i.test(url)

// ------------------------ FILE CHANGE ------------------------
function onFileChange(fieldId, event) {
  const f = event.target.files[0]
  if (!f) return

  const url = URL.createObjectURL(f)

  fileMetadata[fieldId] = {
    name: f.name,
    size: f.size,
    type: f.type,
    file: f,
    objectUrl: url,
    file_url: null,
  }

  formData[fieldId] = f.name
}

// ----------------------- FORMAT BYTES -----------------------
function formatBytes(bytes) {
  if (!bytes) return "0 KB"
  const sizes = ["B", "KB", "MB"]
  let i = Math.floor(Math.log(bytes) / Math.log(1024))
  
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}

// ------------------------ VALIDATION ------------------------
function validateFields() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true

  fields.value.forEach(f => {
    const v = formData[f.id]
    if (f.is_required && (!v || (Array.isArray(v) && !v.length))) {
      errors[f.id] = `${f.label} is required`
      ok = false
    }
  })

  return ok
}

// ------------------------ FETCH PROFILE ------------------------
async function fetchProfile() {
  loading.value = true

  try {
    const res = await api.get(GET_PROFILE_API, {
      params: { user: userId, target: dynamicTarget },
    })

    fields.value = res.data.fields || []

    // SET DEFAULT VALUES
    fields.value.forEach(f => {
      if (f.field_type === "multiselect") {
        formData[f.id] = Array.isArray(f.value) ? f.value : []
      } else if (f.field_type === "file") {
        if (f.metadata?.file_url) {
          fileMetadata[f.id] = {
            name: f.metadata.name,
            size: f.metadata.size,
            type: f.metadata.content_type,
            file: null,
            objectUrl: null,
            file_url: f.metadata.file_url,
          }
        }
        formData[f.id] = f.value || ""
      } else {
        formData[f.id] = f.value || ""
      }
    })

  } catch (err) {
    errorMessage.value = "Failed to load profile"
  }

  loading.value = false
}

// ------------------------ SUBMIT FORM ------------------------
async function submitForm() {
  if (!validateFields()) return

  submitting.value = true
  successMessage.value = ""
  errorMessage.value = ""

  const fd = new FormData()

  // FIELDS JSON
  const fieldsPayload = fields.value.map(f => ({
    field_id: f.id,
    value: formData[f.id],
    metadata: fileMetadata[f.id] || {},
  }))

  fd.append("fields", JSON.stringify(fieldsPayload))

  // APPEND FILES
  fields.value.forEach(f => {
    if (f.field_type === "file" && fileMetadata[f.id]?.file) {
      fd.append(String(f.id), fileMetadata[f.id].file)
    }
  })

  try {
    await api.post(`${SUBMIT_API}?user=${userId}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    successMessage.value = "Saved successfully!"
    await fetchProfile()

  } catch (err) {
    errorMessage.value = err.response?.data?.error || "Submit failed"
  }

  submitting.value = false
}

onMounted(fetchProfile)
</script>

<style scoped>
/* CLEAN UI */
.provider-container {
  max-width: 900px;
  margin: auto;
  font-family: Inter, sans-serif;
  padding-bottom: 40px;
}

.header-card {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
}

.role-badge {
  background: #4f46e5;
  padding: 10px 14px;
  color: white;
  border-radius: 10px;
}

.form-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.field-block {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
}

.input-control,
.textarea-control,
.select-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.multi-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.multi-option {
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 6px;
}

.file-preview {
  margin-top: 8px;
}

.preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  margin-bottom: 6px;
  border-radius: 8px;
}

button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
}

.success-msg {
  color: green;
  margin-top: 10px;
}

.error-msg {
  color: red;
  margin-top: 10px;
}
</style>
