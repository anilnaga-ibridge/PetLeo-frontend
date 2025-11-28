<template>
  <v-container class="provider-page" fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6 header-card" flat>
          <v-row align="center" justify="space-between">
            <v-col cols="12" md="8">
              <h2 class="page-title">{{ pageTitle }}</h2>
              <div class="subtitle">Fill your profile details below</div>
            </v-col>
            <v-col cols="12" md="4" class="d-flex justify-end">
              <v-chip color="indigo" text-color="white" class="role-badge">
                <span class="mr-2">Role</span>
                <strong class="role-value">{{ displayRole }}</strong>
              </v-chip>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="loading" class="my-8">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate size="36" color="primary"></v-progress-circular>
        <div class="mt-2">Loading profile…</div>
      </v-col>
    </v-row>

    <v-row v-else-if="fields.length === 0" class="my-8">
      <v-col cols="12" class="text-center">
        <v-alert type="info" border="left" colored-border>
          No fields found for <strong>{{ pageTitle }}</strong>.
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <v-card class="pa-6 form-card">
          <v-row>
            <!-- Left: avatar using saved file-field or default -->
            <v-col cols="12" md="3" class="d-flex flex-column align-center">
              <v-avatar size="120" class="mb-4">
                <v-img :src="profileImageUrl || defaultAvatar" />
              </v-avatar>

              <v-file-input
                v-model="imageFile"
                accept="image/*"
                label="Upload Photo"
                dense
                hide-details
                @change="onImageUpload"
              ></v-file-input>

              <div class="caption mt-2 muted">Allowed JPG, GIF or PNG. Max size 5 MB</div>
              <v-btn text small class="mt-3" @click="resetImage">Reset</v-btn>
            </v-col>

            <!-- Right: fields -->
            <v-col cols="12" md="9">
              <v-form ref="formRef" lazy-validation>
                <v-row>
                  <template v-for="field in fields" :key="field.id">
                    <v-col :cols="12" :md="6" class="field-col">
                      <label class="field-label">{{ field.label }}
                        <span v-if="field.is_required" class="required">*</span>
                      </label>

                      <v-text-field
                        v-if="['text','number','date'].includes(field.field_type)"
                        v-model="formData[field.id]"
                        :type="field.field_type === 'number' ? 'number' : (field.field_type === 'date' ? 'date' : 'text')"
                        dense hide-details
                        :placeholder="field.help_text || field.label"
                      />

                      <v-textarea
                        v-else-if="field.field_type === 'textarea'"
                        v-model="formData[field.id]"
                        rows="4" dense hide-details
                        :placeholder="field.help_text || field.label"
                      />

                      <v-select
                        v-else-if="field.field_type === 'dropdown'"
                        :items="field.options || []"
                        v-model="formData[field.id]"
                        dense hide-details
                        :placeholder="'Select ' + field.label"
                      />

                      <v-select
                        v-else-if="field.field_type === 'multiselect'"
                        v-model="formData[field.id]"
                        :items="field.options || []"
                        multiple chips dense hide-details
                      />

                      <div v-else-if="field.field_type === 'file'">
                        <v-file-input
                          :label="field.label"
                          dense
                          show-size
                          truncate-length="20"
                          hide-details
                          @change="file => onFieldFileUpload(field, file)"
                        />
                        <div v-if="fileMetadata[field.id]" class="file-meta mt-2">
                          <a :href="fileMetadata[field.id].url" target="_blank">{{ fileMetadata[field.id].name }}</a>
                          <div class="muted">{{ formatBytes(fileMetadata[field.id].size) }}</div>
                        </div>
                      </div>

                      <div v-else class="unsupported">Unsupported: {{ field.field_type }}</div>

                      <!-- per-field action buttons -->
                      <div class="field-actions mt-2 d-flex gap-2">
                        <v-btn small color="primary" text @click="updateSingle(field)" :loading="updating[field.id]">Update</v-btn>
                        <v-btn small color="error" text @click="confirmDelete(field)" :loading="deleting[field.id]">Delete</v-btn>

                        <div v-if="errors[field.id]" class="err-text ml-3">{{ errors[field.id] }}</div>
                      </div>
                    </v-col>
                  </template>
                </v-row>

                <v-row class="mt-4">
                  <v-col cols="12" class="d-flex gap-3">
                    <v-btn color="primary" :loading="submitting" @click.prevent="submitForm">Save Changes</v-btn>
                    <v-btn outlined @click="loadPage">Reload</v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Delete dialog -->
      <v-dialog v-model="deleteDialog" max-width="480">
        <v-card>
          <v-card-title>Confirm delete</v-card-title>
          <v-card-text>Delete saved value for <strong>{{ deletingFieldLabel }}</strong> ?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" @click="deleteFieldConfirmed">Delete</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="toast.show" :timeout="3500" top right>
        {{ toast.msg }}
      </v-snackbar>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'
import api from '@/plugins/axios'

/* API endpoints */
const GET_FIELDS_API = 'http://127.0.0.1:8002/api/provider/definitions/'
const GET_SAVED_API = 'http://127.0.0.1:8002/api/provider/values/'
const SUBMIT_API = 'http://127.0.0.1:8002/api/provider/submit/'
const UPLOAD_API = 'http://127.0.0.1:8002/api/provider/upload/'  // POST ?user=&field=
const UPDATE_ONE = (fieldId, userId) => `http://127.0.0.1:8002/api/provider/value/${fieldId}/update/?user=${userId}`
const DELETE_ONE = (fieldId, userId) => `http://127.0.0.1:8002/api/provider/value/${fieldId}/delete/?user=${userId}`

/* state */
const fields = ref([])
const formData = reactive({})
const fileMetadata = reactive({})
const loading = ref(false)
const submitting = ref(false)
const errors = reactive({})
const updating = reactive({})
const deleting = reactive({})
const successMessage = ref('')
const errorMessage = ref('')
const deleteDialog = ref(false)
const deletingFieldId = ref(null)
const deletingFieldLabel = ref('')
const toast = reactive({ show: false, msg: '' })

/* avatar */
const defaultAvatar = '/images/avatars/avatar-1.png'
const profileImageUrl = ref(null)
const imageFile = ref(null)

/* user */
const userData = useCookie('userData').value || {}
const authUserId = userData?.id || null
const dynamicTarget = userData?.provider_type || 'individual'
const displayRole = computed(() => userData?.role || 'user')
const pageTitle = computed(() => dynamicTarget === 'individual' ? 'Individual Provider Profile' : dynamicTarget === 'employee' ? 'Employee Profile' : 'Organization Profile')

/* helpers */
function initFieldValue(f) {
  if (f.field_type === 'multiselect') formData[f.id] = Array.isArray(formData[f.id]) ? formData[f.id] : []
  else formData[f.id] = formData[f.id] ?? ''
}

/* file: upload for a field -> call backend upload endpoint */
async function uploadFileToServer(fieldId, file) {
  if (!authUserId) { toast.msg = 'Missing user id'; toast.show = true; return null }
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await api.post(`${UPLOAD_API}?user=${authUserId}&field=${fieldId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data.metadata
  } catch (err) {
    console.error('upload error', err)
    toast.msg = 'File upload failed'
    toast.show = true
    return null
  }
}

/* on field file chosen */
async function onFieldFileUpload(field, file) {
  if (!file) return
  const meta = await uploadFileToServer(field.id, file)
  if (meta) {
    fileMetadata[field.id] = meta
    // for convenience store the url in formData so your save endpoint can pick it up
    formData[field.id] = meta.url
  }
}

/* image upload for avatar (choose the file-field that represents profile photo or add a dedicated upload) */
async function onImageUpload(files) {
  const file = Array.isArray(files) ? files[0] : files
  if (!file) return
  const profileField = fields.value.find(f => f.name === 'profile_photo' || f.field_type === 'file') // heuristic
  if (profileField) {
    const meta = await uploadFileToServer(profileField.id, file)
    if (meta) {
      fileMetadata[profileField.id] = meta
      formData[profileField.id] = meta.url
      profileImageUrl.value = meta.url
      toast.msg = 'Photo uploaded'
      toast.show = true
    }
  } else {
    toast.msg = 'No file field to attach photo'
    toast.show = true
  }
}

function resetImage() {
  profileImageUrl.value = null
  imageFile.value = null
}

/* load page: definitions + saved values */
async function loadPage() {
  loading.value = true
  try {
    const defRes = await api.get(GET_FIELDS_API, { params: { target: dynamicTarget } })
    fields.value = Array.isArray(defRes.data.fields) ? defRes.data.fields : []
    fields.value.forEach(initFieldValue)

    // fetch saved values
    const savedRes = await api.get(GET_SAVED_API, { params: { user: authUserId } })
    const saved = Array.isArray(savedRes.data.values) ? savedRes.data.values : []

    // map saved by field_id
    const savedMap = {}
    saved.forEach(s => (savedMap[String(s.field_id)] = s))

    fields.value.forEach(f => {
      const s = savedMap[String(f.id)]
      if (s) {
        formData[f.id] = s.value
        if (s.metadata && s.metadata.url) {
          fileMetadata[f.id] = s.metadata
        }
        // if a file field contains url and we think it is profile image set it
        if (!profileImageUrl.value && f.field_type === 'file' && s.metadata?.url) {
          profileImageUrl.value = s.metadata.url
        }
      } else {
        initFieldValue(f)
      }
    })
  } catch (err) {
    console.error('load error', err)
    errorMessage.value = 'Failed to load profile. Check console.'
  } finally {
    loading.value = false
  }
}

/* validate */
function validateAll() {
  Object.keys(errors).forEach(k => delete errors[k])
  let ok = true
  fields.value.forEach(f => {
    const v = formData[f.id]
    const empty = v === null || v === '' || (Array.isArray(v) && v.length === 0)
    if (f.is_required && empty) {
      errors[f.id] = `${f.label} is required`
      ok = false
    }
  })
  return ok
}

/* bulk submit */
async function submitForm() {
  if (!validateAll()) {
    toast.msg = 'Fix validation errors'
    toast.show = true
    return
  }
  if (!authUserId) { toast.msg = 'Missing auth user id'; toast.show = true; return }
  submitting.value = true
  try {
    const payload = fields.value.map(f => ({
      field_id: f.id,
      value: formData[f.id],
      metadata: fileMetadata[f.id] || {}
    }))
    await api.post(`${SUBMIT_API}?user=${authUserId}`, payload)
    toast.msg = 'Saved'
    toast.show = true
    await loadPage()
  } catch (err) {
    console.error('submit error', err)
    toast.msg = 'Save failed'
    toast.show = true
  } finally {
    submitting.value = false
  }
}

/* update single field */
async function updateSingle(field) {
  if (!authUserId) { toast.msg = 'Missing user id'; toast.show = true; return }
  updating[field.id] = true
  try {
    const payload = { field_id: field.id, value: formData[field.id], metadata: fileMetadata[field.id] || {} }
    await api.put(UPDATE_ONE(field.id, authUserId), payload)
    toast.msg = `${field.label} updated`; toast.show = true
    await loadPage()
  } catch (err) {
    console.error('update error', err)
    toast.msg = 'Update failed'; toast.show = true
  } finally {
    updating[field.id] = false
  }
}

/* delete single */
function confirmDelete(field) {
  deletingFieldId.value = field.id
  deletingFieldLabel.value = field.label
  deleteDialog.value = true
}

async function deleteFieldConfirmed() {
  const fid = deletingFieldId.value
  deleteDialog.value = false
  if (!fid) return
  deleting[fid] = true
  try {
    await api.delete(DELETE_ONE(fid, authUserId))
    formData[fid] = ''
    delete fileMetadata[fid]
    toast.msg = 'Deleted'; toast.show = true
    await loadPage()
  } catch (err) {
    console.error('delete error', err)
    toast.msg = 'Delete failed'; toast.show = true
  } finally {
    deleting[fid] = false
  }
}

/* util */
function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const sizes = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}

/* init */
onMounted(loadPage)
</script>

<style scoped>
.provider-page { max-width: 1100px; margin: 24px auto; }
.header-card { border-radius: 10px; background: linear-gradient(180deg,#fff,#fbfdff); border: 1px solid #e6eef8; }
.page-title { margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; }
.subtitle { color: #475569; margin-top: 6px; font-size: 13px; }
.role-badge { border-radius: 999px; padding: 8px 14px; font-weight: 700; }
.form-card { border-radius: 10px; border: 1px solid #e6eef8; }
.field-label { font-weight: 600; margin-bottom: 6px; display: block; color: #0f172a; }
.required { color: #ef4444; margin-left: 6px; font-weight: 700; }
.field-actions { align-items: center; }
.file-meta { color: #475569; font-size: 13px; }
.err-text { color: #dc2626; font-weight: 600; font-size: 13px; }
.muted { color: #64748b; font-size: 13px; }
</style>
