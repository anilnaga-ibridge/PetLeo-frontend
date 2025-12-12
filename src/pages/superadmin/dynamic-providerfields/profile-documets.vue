<template>
  <v-container class="py-10" max-width="980">
    <v-card class="pa-6 elevation-12 premium-card">

      <!-- Header -->
      <v-row align="center" justify="space-between" class="mb-6">
        <v-col cols="12" sm="8">
          <div class="title-wrap">
            <h1 class="page-title">{{ pageTitle }}</h1>
            <div class="subtitle">Complete your profile — fields marked <span class="text-danger">*</span> are required</div>
          </div>
        </v-col>
        <v-col cols="12" sm="4" class="d-flex justify-end">
          <v-chip v-if="dynamicTarget" class="role-chip" outlined>{{ dynamicTarget.toUpperCase() }}</v-chip>
        </v-col>
      </v-row>

      <!-- Alerts -->
      <transition name="fade-down">
        <v-alert v-if="successMessage" type="success" dense class="mb-4">{{ successMessage }}</v-alert>
      </transition>
      <transition name="fade-down">
        <v-alert v-if="errorMessage" type="error" dense class="mb-4">{{ errorMessage }}</v-alert>
      </transition>

      <!-- Loading -->
      <div v-if="loading" class="loading-wrap">
        <v-progress-circular indeterminate size="48"></v-progress-circular>
      </div>

      <!-- Form -->
      <v-form v-else @submit.prevent="submitForm" ref="formRef" class="form-surface">
        <v-row dense>
          <v-col cols="12" md="6" v-for="field in fields" :key="field.id" class="pb-4">
            <v-sheet elevation="0" class="field-card pa-4">
              <div class="field-header mb-3">
                <div>
                  <div class="field-label">{{ field.label }}
                    <span v-if="field.is_required" class="text-danger">*</span>
                  </div>
                  <div class="field-help" v-if="field.help_text">{{ field.help_text }}</div>
                </div>
              </div>

              <!-- TEXT / NUMBER / DATE -->
              <div v-if="['text','number','date'].includes(field.field_type)">
                <v-text-field
                  v-model="formData[fieldKey(field.id)]"
                  :type="field.field_type"
                  dense
                  outlined
                  rounded
                  :error-messages="errors[fieldKey(field.id)] ? [errors[fieldKey(field.id)]] : []"
                />
              </div>

              <!-- TEXTAREA -->
              <div v-else-if="field.field_type === 'textarea'">
                <v-textarea
                  v-model="formData[fieldKey(field.id)]"
                  dense
                  outlined
                  rounded
                  auto-grow
                  :error-messages="errors[fieldKey(field.id)] ? [errors[fieldKey(field.id)]] : []"
                />
              </div>

              <!-- DROPDOWN -->
              <div v-else-if="field.field_type === 'dropdown'">
                <v-select
                  v-model="formData[fieldKey(field.id)]"
                  :items="field.options || []"
                  dense
                  outlined
                  rounded
                  :error-messages="errors[fieldKey(field.id)] ? [errors[fieldKey(field.id)]] : []"
                />
              </div>

              <!-- MULTISELECT -->
              <div v-else-if="field.field_type === 'multiselect'">
                <div class="multi-grid">
                  <v-chip
                    v-for="opt in field.options"
                    :key="opt"
                    class="option-chip"
                    outlined
                    @click="toggleMulti(field.id, opt, !((formData[fieldKey(field.id)] || []).includes(opt)))"
                    :class="{ 'chip-selected': (formData[fieldKey(field.id)] || []).includes(opt) }"
                  >
                    {{ opt }}
                  </v-chip>
                </div>
                <div v-if="errors[fieldKey(field.id)]" class="field-error">{{ errors[fieldKey(field.id)] }}</div>
              </div>

              <!-- FILE FIELD -->
              <div v-else-if="field.field_type === 'file'">
                <!-- Avatar style (profile image) -->
                <div v-if="isProfileImageField(field)" class="avatar-wrap">
                  <label class="avatar-drop" :title="'Upload ' + field.label">
                    <input
                      ref="avatarInputs"
                      type="file"
                      accept="image/*"
                      class="d-none"
                      @change="ev => onFileChange(field.id, ev.target.files ? ev.target.files[0] : ev)"
                    />
                    <div class="avatar-frame" :class="{ 'has-preview': !!fileMetadata[fieldKey(field.id)]?.objectUrl || !!fileMetadata[fieldKey(field.id)]?.file_url }">
                      <img v-if="fileMetadata[fieldKey(field.id)]?.objectUrl || fileMetadata[fieldKey(field.id)]?.file_url"
                           :src="fileMetadata[fieldKey(field.id)]?.objectUrl || fileMetadata[fieldKey(field.id)]?.file_url"
                           class="avatar-img" />
                      <v-avatar v-else size="96" class="avatar-placeholder">
                        <v-icon large>mdi-camera</v-icon>
                      </v-avatar>

                      <div class="avatar-overlay">
                        <v-btn icon small class="icon-btn" @click.stop="$refs.avatarInputs[fields.indexOf(field)].click()">
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </label>
                  <div class="avatar-meta mt-3">
                    <div class="file-name">{{ fileMetadata[fieldKey(field.id)]?.name || 'No file selected' }}</div>
                    <div class="file-sub">{{ formatBytes(fileMetadata[fieldKey(field.id)]?.size) }}</div>
                  </div>
                </div>

                <!-- Minimal pill picker (for other file fields) -->
                <div v-else class="picker-wrap">
                  <input
                    :ref="'picker-' + field.id"
                    type="file"
                    class="d-none"
                    @change="ev => onFileChange(field.id, ev.target.files ? ev.target.files[0] : ev)"
                  />
                  <v-row align="center" no-gutters>
                    <v-col cols="auto">
                      <v-btn
                        depressed
                        class="picker-btn"
                        @click="$refs['picker-' + field.id].click()"
                      >
                        <v-icon left>mdi-paperclip</v-icon>
                        Choose file
                      </v-btn>
                    </v-col>
                    <v-col>
                      <div class="picker-info">
                        <div class="file-name">{{ fileMetadata[fieldKey(field.id)]?.name || 'No file selected' }}</div>
                        <div class="file-sub">{{ fileMetadata[fieldKey(field.id)]?.file_url ? 'Uploaded' : formatBytes(fileMetadata[fieldKey(field.id)]?.size) }}</div>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <div v-if="errors[fieldKey(field.id)]" class="field-error mt-2">{{ errors[fieldKey(field.id)] }}</div>
              </div>

            </v-sheet>
          </v-col>
        </v-row>

        <!-- Requested Documents Section (dropzone) -->
        <v-divider class="my-6"></v-divider>
        <div class="requested-section">
          <h3 class="section-title">Upload Required Documents</h3>

          <v-row dense>
            <v-col cols="12" md="6" v-for="doc in requestedDocuments" :key="doc.id" class="pb-4">
              <v-sheet class="doc-card pa-4" elevation="1">
                <div class="doc-header d-flex justify-space-between align-center mb-3">
                  <div>
                    <div class="doc-label">{{ doc.label }}</div>
                    <div class="doc-help" v-if="doc.help_text">{{ doc.help_text }}</div>
                  </div>
                  <div class="doc-actions">
                    <!-- If single and existing file -> show Update (premium purple) -->
                    <template v-if="existingRequestedByDefinition[doc.id] && existingRequestedByDefinition[doc.id].length">
                      <v-btn small class="update-btn" @click="$refs['docInput-' + doc.id].click()">
                        Update
                      </v-btn>
                    </template>

                    <!-- Choose -->
                    <template v-else>
                      <v-btn small text @click="$refs['docInput-' + doc.id].click()">Choose</v-btn>
                    </template>

                    <!-- Hidden file input (SINGLE file always) -->
                    <input
                      :ref="'docInput-' + doc.id"
                      type="file"
                      class="d-none"
                      @change="ev => onRequestedFileChange(doc.id, ev.target.files ? Array.from(ev.target.files) : ev, doc)"
                    />
                  </div>
                </div>

                <!-- Dropzone area -->
                <div
                  class="dropzone"
                  @click="$refs['docInput-' + doc.id].click()"
                  @dragover.prevent="onDropZoneDrag($event, doc.id)"
                  @dragenter.prevent="onDropZoneEnter($event, doc.id)"
                  @dragleave.prevent="onDropZoneLeave($event, doc.id)"
                  @drop.prevent="onDropZoneDrop($event, doc)"
                  :class="{ 'drop-active': dropHover === doc.id }"
                >
                  <div class="dz-inner">
                    <v-icon size="36">mdi-cloud-upload-outline</v-icon>
                    <div class="dz-text">Drag & drop here, or click {{ existingRequestedByDefinition[doc.id] && existingRequestedByDefinition[doc.id].length ? 'Update' : 'Choose' }}</div>
                    <div class="dz-sub">Accepted: {{ (doc.allowed_types || []).join(', ') || 'any' }}</div>
                  </div>
                </div>

                <!-- Newly selected preview (single) -->
                <div v-if="requestedFiles[doc.id] && requestedFiles[doc.id].length" class="preview-grid mt-3">
                  <v-chip
                    v-for="(f, i) in requestedFiles[doc.id]"
                    :key="i"
                    class="preview-chip"
                    outlined
                    >
                    <v-avatar v-if="isImage(f.objectUrl)" size="36" class="me-2">
                      <img :src="f.objectUrl" />
                    </v-avatar>
                    <div class="preview-meta">
                      <div class="pname">{{ f.name }}</div>
                      <div class="psize">{{ formatBytes(f.size) }}</div>
                    </div>
                  </v-chip>
                </div>

                <!-- Existing uploaded (server) -->
                <div v-if="existingRequestedByDefinition[doc.id] && existingRequestedByDefinition[doc.id].length" class="existing-grid mt-3">
                  <v-chip
                    v-for="(file, idx) in existingRequestedByDefinition[doc.id]"
                    :key="file.id || idx"
                    class="existing-chip"
                    outlined
                  >
                    <v-avatar v-if="isImage(file.file_url)" size="36" class="me-2">
                      <img :src="file.file_url" />
                    </v-avatar>
                    <div class="existing-meta">
                      <a :href="file.file_url" target="_blank" class="existing-name">{{ file.filename }}</a>
                      <div class="existing-sub">Status: {{ file.status || 'pending' }}</div>
                    </div>
                  </v-chip>
                </div>

              </v-sheet>
            </v-col>
          </v-row>
        </div>

        <!-- Submit -->
        <v-row class="mt-6">
          <v-col cols="12" class="d-flex justify-space-between">
            <v-btn :loading="submitting" :disabled="submitting" color="primary" class="save-btn" type="submit">
              {{ submitting ? 'Saving...' : 'Save' }}
            </v-btn>
            <v-btn text @click="resetForm" v-if="!submitting">Reset</v-btn>
          </v-col>
        </v-row>
      </v-form>
<!-- Uploaded Documents -->
<v-card class="uploaded-section mt-12 pa-8">
  <div class="uploaded-header mb-8">
    <h2 class="uploaded-title">Uploaded Documents</h2>
    <p class="uploaded-subtitle">Review your submitted files</p>
  </div>

  <v-row dense>
    <v-col
      cols="12"
      sm="6"
      md="4"
      lg="3"
      v-for="doc in uploadedDocuments"
      :key="doc.id"
      class="mb-6"
    >
      <v-sheet class="uploaded-card" elevation="0">

        <!-- Premium Thumbnail -->
        <div class="doc-preview">

          <!-- IMAGE preview -->
          <img
            v-if="isImage(doc.file_url)"
            :src="doc.file_url"
            class="preview-img"
          />

          <!-- Non-image preview -->
          <div v-else class="doc-icon">
            <v-icon size="46" color="#6C27FF">mdi-file-document-outline</v-icon>
          </div>
        </div>

        <!-- Actions -->
        <div class="doc-actions">
          <v-btn
            icon
            size="small"
            class="open-btn"
            variant="text"
            :href="doc.file_url"
            target="_blank"
          >
            <v-icon size="22">mdi-open-in-new</v-icon>
          </v-btn>
        </div>

      </v-sheet>
    </v-col>
  </v-row>
</v-card>

    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { api } from '@/plugins/axios';
import { useCookie } from '@/@core/composable/useCookie';

const GET_PROFILE_API = "http://127.0.0.1:8002/api/provider/profile/";

// --- state ---
const fields = ref([]);
const uploadedDocuments = ref([]);
const requestedDocuments = ref([]);
const requestedFiles = reactive({});
const existingRequestedByDefinition = reactive({});
const loading = ref(false);
const submitting = ref(false);
const formData = reactive({});
const fileMetadata = reactive({});
const errors = reactive({});
const successMessage = ref('');
const errorMessage = ref('');
const dropHover = ref(null);

// user cookie
const userData = useCookie('userData').value || {};
const userId = userData.id;
const dynamicTarget = userData.provider_type || null;

const pageTitle = computed(() =>
  dynamicTarget === 'employee' ? 'Employee Profile'
  : dynamicTarget === 'organization' ? 'Organization Profile' : 'Individual Profile'
);

// object url tracking for cleanup
const _objectUrls = [];

/* -------------------------
   Helper functions (UI only)
   ------------------------- */
function fieldKey(id){ return String(id); }

function isProfileImageField(field){
  const name = (field.name||'').toLowerCase();
  const label = (field.label||'').toLowerCase();
  return name.includes('profile') || name.includes('avatar') || label.includes('profile') || label.includes('avatar') || name.includes('image') || label.includes('image');
}

function isImage(url){
  if(!url) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function formatBytes(bytes){
  if(bytes === null || bytes === undefined) return '0 KB';
  if(bytes === 0) return '0 KB';
  const sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${sizes[i]}`;
}

/* -------------------------
   Robust file extraction & safe objectURL
   ------------------------- */
function extractSingleFile(value){
  if(!value) return null;
  if(value instanceof File) return value;
  if(Array.isArray(value) && value.length && value[0] instanceof File) return value[0];
  if(value.target && value.target.files && value.target.files.length) return value.target.files[0];
  if(value.files && Array.isArray(value.files) && value.files.length) return value.files[0];
  return null;
}
function safeCreateObjectURL(file){
  try{
    if(!file) return null;
    const u = URL.createObjectURL(file);
    _objectUrls.push(u);
    return u;
  }catch(e){
    console.warn('createObjectURL failed', e);
    return null;
  }
}

/* -------------------------
   File handlers (profile file fields)
   ------------------------- */
function onFileChange(fieldId, value){
  const k = fieldKey(fieldId);

  // revoke previous blob
  if(fileMetadata[k]?.objectUrl && fileMetadata[k].objectUrl.startsWith('blob:')){
    try{ URL.revokeObjectURL(fileMetadata[k].objectUrl); }catch(e){}
  }

  const file = extractSingleFile(value);

  if(!file){
    // user cleared — keep server file if present
    if(fileMetadata[k]?.file_url){
      formData[k] = fileMetadata[k].name || '';
      fileMetadata[k] = {...fileMetadata[k]};
    } else {
      formData[k] = '';
      fileMetadata[k] = {};
    }
    return;
  }

  const url = safeCreateObjectURL(file);

  fileMetadata[k] = {
    name: file.name,
    size: file.size || 0,
    type: file.type || '',
    file,
    objectUrl: url,
    file_url: null
  };

  formData[k] = file.name;
}

/* -------------------------
   Requested doc handlers (SINGLE file enforced)
   - onRequestedFileChange auto-uploads replacement if existing server file present
   ------------------------- */
function onRequestedFileChange(defId, files, docObj = null){
  // revoke previous previews for this def
  if(requestedFiles[defId]){
    requestedFiles[defId].forEach(f => {
      if(f.objectUrl && f.objectUrl.startsWith('blob:')){
        try{ URL.revokeObjectURL(f.objectUrl); }catch(e){}
      }
    });
  }
  requestedFiles[defId] = [];

  if(!files) return;

  // Normalize to array
  let arr = [];
  if(files instanceof File) arr = [files];
  else if(Array.isArray(files)) arr = files.slice();
  else if(files.target && files.target.files) arr = Array.from(files.target.files);
  else if(files.files && Array.isArray(files.files)) arr = files.files.slice();

  // Enforce single-file always
  if(arr.length) arr = [arr[0]];

  requestedFiles[defId] = arr.map(f => {
    const url = safeCreateObjectURL(f);
    return { name: f.name, size: f.size || 0, type: f.type || '', file: f, objectUrl: url };
  });

  // Auto-upload replacement if there is an existing uploaded doc for this definition
  const docDefinition = docObj || (requestedDocuments.value.find(d => String(d.id) === String(defId)) || null);
  const hasExisting = (existingRequestedByDefinition[defId] && existingRequestedByDefinition[defId].length);

  if(requestedFiles[defId].length && hasExisting){
    // upload first file immediately and replace on server (backend removes old if necessary)
    uploadRequestedSingle(defId, requestedFiles[defId][0].file, docDefinition);
  }
}

/* -------------------------
   Upload requested single file immediately (replacement flow)
   ------------------------- */
async function uploadRequestedSingle(defId, file, docDef = null){
  if(!file) return;
  successMessage.value = "";
  errorMessage.value = "";

  // client-side check for allowed types if doc definition present
  if(docDef && docDef.allowed_types && docDef.allowed_types.length){
    if(!isFileAllowedByDef(file, docDef)){
      errorMessage.value = `File type not allowed for ${docDef.label}`;
      // clear local selection (keep existing server file)
      requestedFiles[defId] = [];
      return;
    }
  }

  const fd = new FormData();
  fd.append(String(defId), file, file.name);

  try{
    const res = await api.post(`${GET_PROFILE_API}?user=${userId}`, fd, {
      headers: {},
      onUploadProgress: (evt) => {
        // optional progress UI hook
      }
    });

    successMessage.value = `${docDef ? docDef.label : 'Document'} updated successfully`;

    // Update uploadedDocuments from response if provided
    const uploadedFilesResp = res.data.uploaded_files || res.data.uploaded_documents || [];
    if(Array.isArray(uploadedFilesResp) && uploadedFilesResp.length){
      uploadedDocuments.value = uploadedFilesResp;
    }

    // rebuild existingRequestedByDefinition mapping
    Object.keys(existingRequestedByDefinition).forEach(k => delete existingRequestedByDefinition[k]);
    (uploadedDocuments.value || []).forEach(d => {
      const def = d.definition_id || d.definitionId || null;
      if(!def) return;
      if(!existingRequestedByDefinition[def]) existingRequestedByDefinition[def] = [];
      existingRequestedByDefinition[def].push(d);
    });

    // clear preview for this defId
    requestedFiles[defId] = [];

    // re-fetch profile to ensure full sync
    await fetchProfile();
  }catch(err){
    console.error('uploadRequestedSingle error', err);
    errorMessage.value = err?.response?.data?.error || err?.message || 'Upload failed';
    // keep preview so user can retry
  }
}

function isFileAllowedByDef(file, def){
  if(!def || !file) return true;
  if(!def.allowed_types || def.allowed_types.length === 0) return true;
  if(def.allowed_types.includes(file.type)) return true;
  const ext = (file.name || '').split('.').pop().toLowerCase();
  return def.allowed_types.some(mime => mime.includes(ext));
}

/* -------------------------
   Dropzone visual handlers
   ------------------------- */
function onDropZoneDrag(e, docId){ /* prevent default only */ }
function onDropZoneEnter(e, docId){ dropHover.value = docId; }
function onDropZoneLeave(e, docId){ if(dropHover.value === docId) dropHover.value = null; }
function onDropZoneDrop(e, doc){
  dropHover.value = null;
  let dtFiles = [];
  if(e.dataTransfer && e.dataTransfer.files) dtFiles = Array.from(e.dataTransfer.files);
  if(!dtFiles.length) return;
  // ALWAYS enforce single-file: only first file is used
  dtFiles = [dtFiles[0]];
  onRequestedFileChange(doc.id, dtFiles, doc);
}

/* -------------------------
   Validation & API
   ------------------------- */
function validateFields(){
  Object.keys(errors).forEach(k => delete errors[k]);
  let ok = true;
  fields.value.forEach(f => {
    const k = fieldKey(f.id);
    const v = formData[k];
    if(f.is_required){
      if(f.field_type === 'file'){
        const hasExisting = !!(fileMetadata[k] && fileMetadata[k].file_url);
        const hasNew = !!(fileMetadata[k] && fileMetadata[k].file instanceof File);
        if(!hasExisting && !hasNew){
          errors[k] = `${f.label} is required`;
          ok = false;
        }
      } else {
        if(v === null || v === undefined || (Array.isArray(v) && !v.length) || v === ''){
          errors[k] = `${f.label} is required`;
          ok = false;
        }
      }
    }
  });
  return ok;
}

async function fetchProfile(){
  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';
  try{
    const res = await api.get(GET_PROFILE_API, { params: { user: userId, target: dynamicTarget } });
    fields.value = res.data.fields || [];
    uploadedDocuments.value = res.data.uploaded_documents || res.data.uploaded_files || [];
    requestedDocuments.value = res.data.requested_documents || [];

    // rebuild mapping
    Object.keys(existingRequestedByDefinition).forEach(k => delete existingRequestedByDefinition[k]);
    (uploadedDocuments.value || []).forEach(d => {
      const defId = d.definition_id || d.definitionId || null;
      if(!defId) return;
      if(!existingRequestedByDefinition[defId]) existingRequestedByDefinition[defId] = [];
      existingRequestedByDefinition[defId].push(d);
    });

    // init formData and fileMetadata
    fields.value.forEach(f => {
      const k = fieldKey(f.id);
      if(f.field_type === 'file'){
        if(f.metadata && f.metadata.file_url){
          formData[k] = f.metadata.name || f.value || '';
          fileMetadata[k] = {
            name: f.metadata.name || (f.value && typeof f.value === 'string' ? f.value : ''),
            size: f.metadata.size || null,
            type: f.metadata.content_type || '',
            file: null,
            objectUrl: f.metadata.file_url,
            file_url: f.metadata.file_url
          };
        } else {
          formData[k] = '';
          fileMetadata[k] = {};
        }
      } else if(f.field_type === 'multiselect'){
        formData[k] = Array.isArray(f.value) ? f.value : (f.value ? [f.value] : []);
      } else {
        formData[k] = f.value ?? '';
      }
    });

    requestedDocuments.value.forEach(d => {
      if(!requestedFiles[d.id]) requestedFiles[d.id] = [];
      if(!existingRequestedByDefinition[d.id]) existingRequestedByDefinition[d.id] = [];
    });

  }catch(err){
    console.error('fetchProfile error', err);
    errorMessage.value = err?.response?.data?.error || 'Failed to load profile';
  }finally{
    loading.value = false;
  }
}

async function submitForm(){
  successMessage.value = '';
  errorMessage.value = '';
  if(!validateFields()) return;
  submitting.value = true;

  const fd = new FormData();
  const payload = fields.value.map(f => {
    const k = fieldKey(f.id);
    const meta = fileMetadata[k] ? {
      name: fileMetadata[k].name || null,
      size: fileMetadata[k].size || null,
      file_url: fileMetadata[k].file_url || (fileMetadata[k].objectUrl && !fileMetadata[k].objectUrl.startsWith('blob:') ? fileMetadata[k].objectUrl : null),
      content_type: fileMetadata[k].type || null
    } : {};
    return { field_id: f.id, value: formData[k], metadata: meta };
  });

  fd.append('fields', JSON.stringify(payload));

  // profile file fields
  fields.value.forEach(f => {
    if(f.field_type === 'file'){
      const k = fieldKey(f.id);
      if(fileMetadata[k] && fileMetadata[k].file instanceof File){
        fd.append(String(f.id), fileMetadata[k].file, fileMetadata[k].name);
      }
    }
  });

  // requested documents: only single files per def
  Object.keys(requestedFiles).forEach(defId => {
    const arr = requestedFiles[defId] || [];
    if(arr.length){
      const obj = arr[0];
      if(obj && obj.file instanceof File){
        fd.append(String(defId), obj.file, obj.name);
      }
    }
  });

  try{
    const res = await api.post(`${GET_PROFILE_API}?user=${userId}`, fd, { headers: {} });

    successMessage.value = 'Saved successfully!';

    if(Array.isArray(res.data.uploaded_profile_files)){
      res.data.uploaded_profile_files.forEach(pf => {
        const k = fieldKey(pf.field_id);
        fileMetadata[k] = {
          name: pf.filename,
          size: pf.size || null,
          type: pf.content_type || '',
          file: null,
          objectUrl: pf.file_url,
          file_url: pf.file_url
        };
        formData[k] = pf.filename;
      });
    }

    if(Array.isArray(res.data.uploaded_files)){
      uploadedDocuments.value = res.data.uploaded_files;
    } else if(Array.isArray(res.data.uploaded_documents)){
      uploadedDocuments.value = res.data.uploaded_documents;
    }

    // remap requested-doc mapping
    Object.keys(existingRequestedByDefinition).forEach(k => delete existingRequestedByDefinition[k]);
    (uploadedDocuments.value || []).forEach(d => {
      const def = d.definition_id;
      if(!existingRequestedByDefinition[def]) existingRequestedByDefinition[def] = [];
      existingRequestedByDefinition[def].push(d);
    });

    Object.keys(requestedFiles).forEach(k => (requestedFiles[k] = []));
    await fetchProfile();

  }catch(err){
    console.error('submitForm error', err);
    errorMessage.value = err?.response?.data?.error || err?.message || 'Submit failed';
  }finally{
    submitting.value = false;
  }
}

function resetForm(){
  Object.keys(formData).forEach(k => (formData[k] = null));
  Object.keys(requestedFiles).forEach(k => (requestedFiles[k] = []));
  _objectUrls.forEach(u => {
    try{ URL.revokeObjectURL(u); }catch(e){}
  });
  _objectUrls.length = 0;
}

/* -------------------------
   small helpers (multi-select)
   ------------------------- */
function toggleMulti(fieldId, option, next){
  const k = fieldKey(fieldId);
  if(!formData[k]) formData[k] = [];
  if(next && !formData[k].includes(option)) formData[k].push(option);
  if(!next && formData[k].includes(option)) formData[k] = formData[k].filter(x => x !== option);
}

/* -------------------------
   Lifecycle
   ------------------------- */
onMounted(fetchProfile);
onBeforeUnmount(() => {
  _objectUrls.forEach(u => {
    try{ URL.revokeObjectURL(u); }catch(e){}
  });
});
</script>

<style scoped>

/* PREMIUM Uploaded Documents Section */
.uploaded-section {
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fafaff);
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 10px 30px rgba(16, 24, 40, 0.06);
}

.uploaded-header .uploaded-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.uploaded-header .uploaded-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}
.preview-img {
  width: 92px;
  height: 92px;
  object-fit: cover;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.12);
}

/* Document Card */
.uploaded-card {
  padding: 18px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(108, 39, 255, 0.08);
  box-shadow: 0 8px 22px rgba(108, 39, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 18px;
  transition: all 0.18s ease;
}

.uploaded-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 38px rgba(108, 39, 255, 0.12);
}

/* Preview thumbnail */
.doc-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-thumb {
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(16, 24, 40, 0.12);
}

.doc-icon {
  width: 92px;
  height: 92px;
  border-radius: 14px;
  background: #f4e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Info */
.doc-info {
  flex: 1;
}

.doc-name {
  font-weight: 600;
  font-size: 15px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* Actions */
.doc-actions {
  display: flex;
  align-items: center;
}

.open-btn {
  color: #6C27FF;
  background: #f8f4ff;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.open-btn:hover {
  background: #ece2ff;
}

/* Premium Apple-style UI: spacing, soft shadows, smooth radius */
.premium-card {
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfbfc);
  box-shadow: 0 8px 30px rgba(16,24,40,0.08);
}

/* Header */
.title-wrap { display:flex; flex-direction:column; gap:6px; }
.page-title { font-size:20px; font-weight:700; margin:0; color:#111827; }
.subtitle { color:#6b7280; font-size:13px; }

/* Role chip */
.role-chip { background:#f3e8ff; color:#6C27FF; border-radius:999px; }

/* Loading */
.loading-wrap { display:flex; justify-content:center; padding:40px 0; }

/* Form surface */
.form-surface { margin-top:6px; }

/* field card */
.field-card {
  border-radius:12px;
  background: linear-gradient(180deg, #ffffff, #fffafb);
  border: 1px solid rgba(99,102,241,0.06);
  box-shadow: 0 6px 18px rgba(99,102,241,0.04);
}

/* labels */
.field-label { font-weight:600; color:#111827; font-size:14px; }
.field-help { color:#6b7280; font-size:12px; margin-top:4px; }

/* multiselect chips */
.multi-grid { display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; }
.option-chip { border-radius:999px; background:#fbf7ff; color:#6C27FF; }
.chip-selected { background:#6C27FF; color:white !important; }

/* avatar upload */
.avatar-wrap { display:flex; align-items:flex-start; gap:16px; }
.avatar-drop { cursor:pointer; display:flex; align-items:center; gap:12px; }
.avatar-frame { position:relative; width:96px; height:96px; border-radius:18px; overflow:hidden;
  display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#ffffff,#fbfbff); border:1px solid rgba(0,0,0,0.04);
  transition: transform .14s ease, box-shadow .14s ease; }
.avatar-frame.has-preview { box-shadow: 0 6px 20px rgba(16,24,40,0.06); transform: translateY(-2px); }
.avatar-img { width:100%; height:100%; object-fit:cover; display:block; }
.avatar-placeholder { background:#f4f4fb; color:#6C27FF; border-radius:14px; }
.avatar-overlay { position:absolute; right:6px; bottom:6px; }
.icon-btn { background: rgba(255,255,255,0.9); border-radius:10px; box-shadow: 0 4px 10px rgba(16,24,40,0.06); }

/* picker */
.picker-wrap { display:flex; align-items:center; gap:12px; }
.picker-btn { background:#f3f0ff; color:#6C27FF; border-radius:999px; }
.picker-info { min-width:160px; }
.file-name { font-weight:600; color:#111827; }
.file-sub { font-size:12px; color:#6b7280; }

/* UPDATE button (Option 1 - Purple premium) */
.update-btn {
  background: linear-gradient(90deg,#6C27FF,#8F4CFF);
  color: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  box-shadow: 0 6px 18px rgba(108,39,255,0.12);
}

/* errors */
.field-error { color:#ef4444; font-size:13px; margin-top:6px; }

/* requested docs */
.requested-section { margin-top:6px; }
.section-title { font-weight:700; margin-bottom:10px; color:#111827; }
.doc-card { border-radius:12px; background: #fff; border:1px solid rgba(16,24,40,0.03); }

/* dropzone */
.dropzone {
  min-height:120px;
  border-radius:12px;
  border: 1px dashed rgba(99,102,241,0.14);
  display:flex; align-items:center; justify-content:center;
  transition: box-shadow .12s ease, border-color .12s ease, transform .12s ease;
  background: linear-gradient(180deg, rgba(243,242,255,0.3), rgba(255,255,255,0.02));
  cursor: pointer;
}
.dropzone.drop-active { border-color:#6C27FF; box-shadow: 0 10px 30px rgba(108,39,255,0.08); transform: translateY(-4px); }
.dz-inner { text-align:center; color:#6b7280; }
.dz-text { font-weight:600; color:#111827; margin-top:6px; }
.dz-sub { font-size:12px; color:#9ca3af; margin-top:4px; }

/* previews */
.preview-grid { display:flex; gap:10px; flex-wrap:wrap; }
.preview-chip { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:12px; background:#fbfbff; color:#111827; }
.preview-meta .pname { font-weight:600; }
.preview-meta .psize { font-size:12px; color:#6b7280; }

/* existing uploaded */
.existing-grid { display:flex; gap:10px; flex-wrap:wrap; }
.existing-chip { padding:10px; border-radius:12px; background:#fff; }
.existing-name { font-weight:600; color:#111827; text-decoration:none; }
.existing-sub { font-size:12px; color:#6b7280; }

/* uploaded docs list */
.uploaded-list { border-radius:12px; background:linear-gradient(180deg,#fff,#fbfbff); border:1px solid rgba(99,102,241,0.03); }
.uploaded-card { border-radius:10px; background:#fff; border:1px solid rgba(0,0,0,0.03); }

/* buttons */
.save-btn { background: linear-gradient(90deg,#6C27FF,#8F4CFF); color:#fff; border-radius:12px; box-shadow:0 10px 30px rgba(108,39,255,0.12); }

/* transitions */
.fade-down-enter-active, .fade-down-leave-active { transition: all .18s ease; }
.fade-down-enter-from { opacity:0; transform: translateY(-6px); }
.fade-down-enter-to { opacity:1; transform: translateY(0); }
.fade-down-leave-to { opacity:0; transform: translateY(-6px); }
</style>
