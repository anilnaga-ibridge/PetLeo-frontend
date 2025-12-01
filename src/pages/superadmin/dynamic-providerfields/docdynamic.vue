<template>
  <section>
    <div class="pa-10 bg-surface min-h-screen">

      <!-- HEADER -->
      <v-row align="center" justify="space-between" class="mb-10">
        <v-col cols="12" md="8">
          <h1 class="page-title">Provider Documents</h1>
          <p class="subtitle">Upload and manage your verification documents.</p>
        </v-col>

        <v-col cols="12" md="4" class="text-right">
          <v-chip class="role-chip" outlined>{{ displayRole }}</v-chip>
        </v-col>
      </v-row>

      <!-- ACTION BAR -->
      <v-card class="pa-4 mb-8 elevation-6 action-bar">
        <v-row justify="end" align="center" dense>
          <v-btn variant="tonal" color="#6C27FF" class="me-3" @click="fetchDocDefinitions">
            Refresh definitions
          </v-btn>

          <v-btn color="primary" :disabled="!authUserId" @click="fetchUploadedDocs">
            Reload uploads
          </v-btn>
        </v-row>
      </v-card>

      <!-- GRID -->
      <v-row dense>

        <!-- LEFT PANEL: Definitions -->
        <v-col cols="12" md="6">
          <h2 class="section-title">Required Documents</h2>

          <div v-if="docLoading" class="centered py-8">
            <v-progress-circular indeterminate size="44" />
            <div class="mt-3 text-muted">Loading document definitions...</div>
          </div>

          <div v-else-if="docDefinitions.length === 0" class="empty-state">
            <div class="empty-icon">📄</div>
            <div class="empty-text">No document definitions found.</div>
          </div>

          <div v-else>
            <v-card
              v-for="def in sortedDefs"
              :key="def.id"
              class="mb-6 def-card elevation-3"
            >
              <v-card-title class="d-flex justify-space-between align-center">
                <div>
                  <div class="def-title">{{ def.label }}</div>
                  <div class="def-sub mt-1">
                    <span class="muted">{{ def.key }}</span> • <b>{{ 'Single' }}</b>
                  </div>
                  <div v-if="def.help_text" class="help-text mt-2">{{ def.help_text }}</div>
                  <div v-else class="help-text mt-2 muted">
                    Allowed: <b>{{ def.allowed_types?.length ? def.allowed_types.join(', ') : 'Any' }}</b>
                  </div>
                </div>

                <div class="actions">
                  <v-btn
                    :color="getUploadedForDef(def.id) ? 'warning' : 'primary'"
                    small
                    @click="onUploadClick(def)"
                  >
                    {{ getUploadedForDef(def.id) ? 'Update' : 'Upload' }}
                  </v-btn>

                  <!-- hidden input (single) -->
                  <input
                    type="file"
                    :ref="el => fileInputs[def.id] = el"
                    class="d-none"
                    accept="*/*"
                    @change="(e) => onFileSelectedSingle(def, e)"
                    :multiple="false"
                  />
                </div>
              </v-card-title>

              <v-card-text>
                <transition name="fade">
                  <div v-if="uploading[def.id]" class="upload-progress">
                    <div class="d-flex justify-space-between mb-2 small muted">
                      <div>{{ uploading[def.id].file }}</div>
                      <div>{{ uploading[def.id].progress }}%</div>
                    </div>

                    <v-progress-linear :model-value="uploading[def.id].progress" height="8" rounded />
                  </div>
                </transition>

                <div v-if="getUploadedForDef(def.id)" class="existing-block mt-4">
                  <div class="existing-label">Existing file</div>
                  <div class="existing-row d-flex align-center mt-2">
                    <div v-if="isImage(getUploadedForDef(def.id).content_type)" class="thumb">
                      <img :src="getUploadedForDef(def.id).file_url" alt="preview" />
                    </div>
                    <div class="meta ms-3">
                      <div class="filename">{{ getUploadedForDef(def.id).filename }}</div>
                      <div class="muted small">{{ readableSize(getUploadedForDef(def.id).size) }} • {{ getUploadedForDef(def.id).content_type }}</div>
                      <div class="mt-2">
                        <v-btn text small @click="openDocument(getUploadedForDef(def.id))">Open</v-btn>
                        <v-btn text small color="red" @click="deleteDocument(getUploadedForDef(def.id))">Delete</v-btn>
                      </div>
                    </div>
                  </div>
                </div>

              </v-card-text>
            </v-card>
          </div>
        </v-col>

        <!-- RIGHT PANEL: Uploaded Files list -->
        <v-col cols="12" md="6">
          <h2 class="section-title">Uploaded Files</h2>

          <v-card class="mb-4 elevation-3">
            <v-card-text>
              <div v-if="docsLoading" class="centered py-8">
                <v-progress-circular indeterminate size="44" />
                <div class="mt-3 text-muted">Loading uploaded files...</div>
              </div>

              <div v-else-if="uploadedDocs.length === 0" class="empty-state small">
                <div class="empty-icon">📁</div>
                <div class="empty-text">No documents uploaded yet.</div>
              </div>

              <div v-else>
                <v-card
                  v-for="doc in uploadedDocs"
                  :key="doc.id"
                  class="mb-4 pa-4 uploaded-card elevation-1"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div v-if="isImage(doc.content_type)" class="u-thumb mb-2">
                        <img :src="doc.file_url || doc.file_path || doc.file" alt="preview" />
                      </div>

                      <div class="u-filename">{{ doc.filename }}</div>
                      <div class="muted small mt-1">{{ readableSize(doc.size) }} • {{ doc.content_type }}</div>
                      <div class="mt-2 status">Status: <b>{{ doc.status || 'pending' }}</b></div>
                    </div>

                    <div class="d-flex flex-column gap-2">
                      <v-btn small variant="outlined" @click="openDocument(doc)">Open</v-btn>
                      <v-btn small color="red" @click="deleteDocument(doc)">Delete</v-btn>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snackbar.open" :color="snackbar.color" location="bottom right" timeout="3200">
        {{ snackbar.message }}
      </v-snackbar>
    </div>
  </section>
</template>

<script setup>
/* Premium single-file upload page
   - Enforces single file per definition (client-side)
   - If already uploaded -> 'Update' (will replace existing)
   - Uses your existing APIs (DEFS_API / UPLOAD_API / LIST_API / ITEM_API)
*/

import { ref, reactive, computed, onMounted } from 'vue';
import api from '@/plugins/axios';
import { useCookie } from '@/@core/composable/useCookie';

const DEFS_API = 'http://127.0.0.1:8002/api/provider/documents/definitions/';
const UPLOAD_API = 'http://127.0.0.1:8002/api/provider/documents/upload/';
const LIST_API = 'http://127.0.0.1:8002/api/provider/documents/';
const ITEM_API = (id) => `http://127.0.0.1:8002/api/provider/documents/${id}/`;

const selectedTarget = ref('individual');
const docDefinitions = ref([]);
const docLoading = ref(false);

const uploadedDocs = ref([]);
const docsLoading = ref(false);

const uploading = reactive({});         // { defId: {progress, file} }
const fileInputs = reactive({});        // references to inputs

const snackbar = reactive({ open: false, message: '', color: 'success', timer: null });

const userData = useCookie('userData').value || {};
const authUserId = ref(userData.id || '');
const displayRole = userData.provider_type || 'unknown';

function showSnackbar(msg, color = 'success', timeout = 3000) {
  snackbar.message = msg;
  snackbar.color = color;
  snackbar.open = true;
  clearTimeout(snackbar.timer);
  snackbar.timer = setTimeout(() => (snackbar.open = false), timeout);
}

function readableSize(bytes = 0) {
  if (!bytes && bytes !== 0) return '0 B';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  let n = Number(bytes || 0);
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

const sortedDefs = computed(() => {
  if (!Array.isArray(docDefinitions.value)) return [];
  return [...docDefinitions.value].sort((a, b) => (Number(a.order || 0) - Number(b.order || 0)) || (a.label || '').localeCompare(b.label || ''));
});

async function fetchDocDefinitions() {
  if (!selectedTarget.value) return;
  docLoading.value = true;
  try {
    const res = await api.get(DEFS_API, { params: { target: selectedTarget.value } });
    // Support different payload shapes
    if (Array.isArray(res.data)) docDefinitions.value = res.data;
    else docDefinitions.value = res.data.definitions || res.data || [];
  } catch (err) {
    console.error('fetchDocDefinitions', err);
    docDefinitions.value = [];
    showSnackbar('Failed to load definitions', 'error');
  } finally {
    docLoading.value = false;
  }
}

async function fetchUploadedDocs() {
  if (!authUserId.value) {
    uploadedDocs.value = [];
    return;
  }
  docsLoading.value = true;
  try {
    const res = await api.get(LIST_API, { params: { user: authUserId.value } });
    uploadedDocs.value = res.data.documents || res.data.uploaded_documents || res.data || [];
  } catch (err) {
    console.error('fetchUploadedDocs', err);
    uploadedDocs.value = [];
    showSnackbar('Failed to load uploaded documents', 'error');
  } finally {
    docsLoading.value = false;
  }
}

// Get the first uploaded document for a definition (single)
function getUploadedForDef(defId) {
  if (!uploadedDocs.value || !uploadedDocs.value.length) return null;
  // definition_id might be string or number
  return uploadedDocs.value.find(d => String(d.definition_id) === String(defId)) || null;
}

// Upload flow (single-file only)
function onUploadClick(def) {
  // If already uploaded, confirm replace
  const existing = getUploadedForDef(def.id);
  if (existing) {
    const ok = confirm(`A file already exists for "${def.label}". Choose a new file to replace it.` + '\n\nProceed to pick a file?');
    if (!ok) return;
  }
  // trigger hidden input
  if (fileInputs[def.id]) fileInputs[def.id].click();
}

// Single-file selected handler (force single)
function onFileSelectedSingle(def, evt) {
  const files = evt.target.files ? Array.from(evt.target.files) : [];
  if (!files.length) return;
  const file = files[0]; // ALWAYS single
  evt.target.value = ''; // reset for future picks
  uploadFileForDefinition(def, file);
}

// Basic allowed check (uses allowed_types list if present)
function isAllowed(def, file) {
  if (!def.allowed_types || !def.allowed_types.length) return true;
  if (!file) return false;
  if (def.allowed_types.includes(file.type)) return true;
  // fallback by extension check
  const ext = (file.name || '').split('.').pop().toLowerCase();
  return def.allowed_types.some(mime => mime.includes(ext));
}

async function uploadFileForDefinition(def, file) {
  if (!authUserId.value) { showSnackbar('Set your user id before uploading', 'error'); return; }
  if (!file) return;
  if (!isAllowed(def, file)) {
    showSnackbar(`File type not allowed for ${def.label}`, 'error');
    return;
  }

  // Show progress UI
  uploading[def.id] = { progress: 0, file: file.name };

  const form = new FormData();
  form.append('file', file);
  form.append('definition_id', def.id);

  try {
    // POST to upload endpoint; backend will replace (server-side) if needed
    await api.post(`${UPLOAD_API}?user=${encodeURIComponent(authUserId.value)}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!evt.lengthComputable) return;
        uploading[def.id].progress = Math.round((evt.loaded * 100) / evt.total);
      },
    });

    showSnackbar(`${def.label} uploaded`, 'success');
    // update list
    await fetchUploadedDocs();
  } catch (err) {
    console.error('upload error', err);
    showSnackbar(err?.response?.data?.error || 'Upload failed', 'error');
  } finally {
    setTimeout(() => { delete uploading[def.id]; }, 600);
  }
}

async function deleteDocument(doc) {
  if (!authUserId.value) { showSnackbar('User id missing', 'error'); return; }
  if (!confirm('Delete this uploaded document?')) return;
  try {
    await api.delete(`${ITEM_API(doc.id)}?user=${encodeURIComponent(authUserId.value)}`);
    showSnackbar('Deleted', 'success');
    await fetchUploadedDocs();
  } catch (err) {
    console.error('deleteDocument', err);
    showSnackbar('Delete failed', 'error');
  }
}

function openDocument(doc) {
  const url = doc.file_url || doc.file || doc.file_path || null;
  if (!url) return showSnackbar('No file URL available', 'error');
  window.open(url, '_blank', 'noopener');
}

function isImage(contentType) {
  return contentType && contentType.startsWith('image/');
}

onMounted(async () => {
  if (!Array.isArray(docDefinitions.value)) docDefinitions.value = [];
  if (!Array.isArray(uploadedDocs.value)) uploadedDocs.value = [];
  await fetchDocDefinitions();
  if (authUserId.value) await fetchUploadedDocs();
});
</script>

<style scoped>
/* Premium Apple-style UI */
.bg-surface { background: linear-gradient(180deg, #FBFBFF, #FFF); min-height: 100vh; }
.page-title { font-size: 20px; font-weight: 700; margin: 0; color: #111827; }
.subtitle { color: #6b7280; margin-top: 6px; font-size: 14px; }
.role-chip { background:#f3e8ff; color:#6C27FF; border-radius: 999px; padding: 6px 12px; }

/* Action bar */
.action-bar { border-radius: 14px; background: #fff; }

/* Section */
.section-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; color: #111827; }

/* Definition card */
.def-card { border-radius: 12px; overflow: hidden; }
.def-title { font-weight: 700; font-size: 15px; color: #111827; }
.def-sub { color: #6b7280; font-size: 13px; }
.help-text { color: #6b7280; font-size: 13px; }

/* upload UI */
.upload-progress { margin-top: 6px; }
.existing-block { border-top: 1px solid rgba(17,24,39,0.04); padding-top: 12px; margin-top: 8px; }
.existing-label { font-size: 13px; color: #6b7280; font-weight: 600; }
.existing-row .thumb img { width: 96px; height: 96px; object-fit: cover; border-radius: 10px; box-shadow: 0 8px 24px rgba(16,24,40,0.06); }
.existing-row .meta .filename { font-weight: 600; }

/* Uploaded list */
.uploaded-card { border-radius: 10px; background: #fff; }
.u-thumb img { width: 120px; height: 120px; object-fit: cover; border-radius: 8px; box-shadow: 0 6px 20px rgba(16,24,40,0.06); }
.u-filename { font-weight: 600; font-size: 15px; color: #111827; }

/* empty states */
.empty-state { border-radius: 12px; background: #fff; padding: 36px; text-align: center; color: #6b7280; }
.empty-icon { font-size: 36px; margin-bottom: 10px; }
.centered { display:flex; align-items:center; justify-content:center; flex-direction:column; }

/* minor */
.muted { color: #6b7280; }
.small { font-size: 12px; }
.actions { display:flex; gap: 8px; align-items:center; }

/* transitions */
.fade-enter-active, .fade-leave-active { transition: all .18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(-6px); }
.fade-enter-to { opacity: 1; transform: translateY(0); }
</style>
