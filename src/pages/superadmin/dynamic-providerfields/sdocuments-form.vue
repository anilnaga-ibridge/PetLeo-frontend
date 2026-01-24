<script setup>
/**
 * DocumentFieldBuilder.vue
 * - Page UI/UX matches your ProfileFieldBuilder exactly
 * - CRUD for document definitions
 * - Drag & drop reorder + Save Order (PATCH)
 * - Confirm delete dialog + Snackbar success UI (includes source="documents")
 *
 * Requirements:
 * - axios plugin at "@/plugins/axios"
 * - Vuetify components loaded in your app
 */

import { ref, reactive, computed, onMounted, watch } from "vue"
import { api as axios } from "@/plugins/axios"
import { useRouter } from "vue-router"

// ---------- Config ----------
const ROLES_API = "http://127.0.0.1:8000/auth/roles/public"
const DOC_API = "http://127.0.0.1:8003/api/superadmin/definitions/documents/" // manual documents route

// ---------- state ----------
const roles = ref([])
const selectedTarget = ref(null)

const loading = ref(false)
const savingOrder = ref(false)

// search + pagination
const docSearch = ref("")
const docPageSize = ref(20)
const docPage = ref(1)

// documents list
const docDefinitions = ref([])
const docLoading = ref(false)

// form/modal state
const docModalOpen = ref(false)
const docIsEdit = ref(false)

const docForm = reactive({
  id: null,
  key: "",
  label: "",
  is_required: true,
  allow_multiple: false,
  allowed_types: [],
  order: 0,
  help_text: "",
})

const docTypeInput = ref("")

// predefined mimes
const PREDEFINED_MIMES = [
  { label: "PDF", value: "application/pdf" },
  { label: "PNG", value: "image/png" },
  { label: "JPEG", value: "image/jpeg" },
  { label: "JPG", value: "image/jpg" },
  { label: "DOCX", value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { label: "ZIP", value: "application/zip" },
  { label: "CSV", value: "text/csv" },
]

// confirm dialog
const confirmDialog = reactive({
  open: false,
  message: "",
  targetId: null,
})

// snackbar (success / error)
const snackbar = reactive({
  open: false,
  message: "",
  color: "success",
  timeout: 3500,
})

// ---------- helpers ----------
const roleToTarget = name => {
  if (!name) return null
  const n = name.toLowerCase()
  if (n.includes("individual")) return "individual"
  if (n.includes("organization employee")) return "employee"
  if (n.includes("organization")) return "organization"
  
  return null
}

const fetchRoles = async () => {
  try {
    const res = await axios.get(ROLES_API)

    roles.value = res.data
      .map(r => ({ id: r.id, name: r.name, target: roleToTarget(r.name) }))
      .filter(r => r.target)
    if (!selectedTarget.value && roles.value.length) selectedTarget.value = roles.value[0].target
  } catch (err) {
    console.error("fetchRoles error", err)

    // fallback so UI remains usable
    roles.value = [
      { id: "fallback-ind", name: "Individual", target: "individual" },
      { id: "fallback-org", name: "Organization", target: "organization" },
    ]
    if (!selectedTarget.value) selectedTarget.value = roles.value[0].target
  }
}

// ---------- fetch doc definitions ----------
const fetchDocDefinitions = async () => {
  if (!selectedTarget.value) return
  docLoading.value = true
  try {
    const res = await axios.get(`${DOC_API}?target=${selectedTarget.value}`)

    docDefinitions.value = (res.data || []).map(d => ({ ...d, order: Number(d.order || 0) }))
    docDefinitions.value.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  } catch (err) {
    console.error("fetchDocDefinitions error", err)
    docDefinitions.value = []
    showSnackbar("Failed to load document definitions", "error")
  } finally {
    docLoading.value = false
  }
}

// ---------- search + pagination computed ----------
const docFiltered = computed(() => {
  if (!docSearch.value) return docDefinitions.value
  const q = docSearch.value.toLowerCase()
  
  return docDefinitions.value.filter(
    d => (d.label || "").toLowerCase().includes(q) || (d.key || "").toLowerCase().includes(q),
  )
})

const docPaginated = computed(() => {
  const start = (docPage.value - 1) * docPageSize.value
  
  return docFiltered.value.slice(start, start + docPageSize.value)
})

const docTotalPages = computed(() => Math.max(1, Math.ceil(docFiltered.value.length / docPageSize.value)))
const docGoPrev = () => { if (docPage.value > 1) docPage.value-- }
const docGoNext = () => { if (docPage.value < docTotalPages.value) docPage.value++ }
const docGoFirst = () => { docPage.value = 1 }
const docGoLast = () => { docPage.value = docTotalPages.value }

// ---------- doc modal helpers ----------
const openDocCreateModal = () => {
  docIsEdit.value = false
  resetDocForm()
  docModalOpen.value = true
}

const openDocEditModal = d => {
  docIsEdit.value = true
  docForm.id = d.id
  docForm.key = d.key
  docForm.label = d.label
  docForm.is_required = Boolean(d.is_required)
  docForm.allow_multiple = Boolean(d.allow_multiple)
  docForm.allowed_types = Array.isArray(d.allowed_types) ? [...d.allowed_types] : []
  docForm.order = Number(d.order || 0)
  docForm.help_text = d.help_text || ""
  docTypeInput.value = ""
  docModalOpen.value = true
}

const closeDocModal = () => {
  docModalOpen.value = false
  resetDocForm()
}

const resetDocForm = () => {
  docForm.id = null
  docForm.key = ""
  docForm.label = ""
  docForm.is_required = true
  docForm.allow_multiple = false
  docForm.allowed_types = []
  docForm.order = docDefinitions.value.length ? Math.max(...docDefinitions.value.map(d => d.order)) + 1 : 0
  docForm.help_text = ""
  docTypeInput.value = ""
}

// allowed types helpers
const togglePredefinedMime = mime => {
  if (docForm.allowed_types.includes(mime)) {
    docForm.allowed_types = docForm.allowed_types.filter(m => m !== mime)
  } else {
    docForm.allowed_types.push(mime)
  }
}

const addCustomMime = () => {
  const v = (docTypeInput.value || "").trim()
  if (!v) return
  if (!docForm.allowed_types.includes(v)) docForm.allowed_types.push(v)
  docTypeInput.value = ""
}

const removeAllowedType = t => {
  docForm.allowed_types = docForm.allowed_types.filter(m => m !== t)
}

// ---------- create / update doc ----------
const saveDoc = async () => {
  if (!docForm.key || !docForm.label) {
    showSnackbar("Provide machine key and label", "error")
    
    return
  }

  const payload = {
    target: selectedTarget.value,
    key: docForm.key,
    label: docForm.label,
    is_required: docForm.is_required,
    allow_multiple: docForm.allow_multiple,
    allowed_types: docForm.allowed_types,
    order: docForm.order,
    help_text: docForm.help_text,
  }

  try {
    if (docIsEdit.value && docForm.id) {
      await axios.put(`${DOC_API}${docForm.id}/`, payload)

      const idx = docDefinitions.value.findIndex(d => d.id === docForm.id)
      if (idx >= 0) docDefinitions.value[idx] = { ...(docDefinitions.value[idx] || {}), ...payload, id: docForm.id }
      showSnackbar(`Document updated (source: documents)`, "success")
    } else {
      const res = await axios.post(DOC_API, payload)

      // push response if backend returns created object
      if (res?.data) {
        docDefinitions.value.push(res.data)
      } else {
        // optimistic: push payload + temporary id
        docDefinitions.value.push({ ...payload, id: Math.random().toString(36).slice(2, 9) })
      }
      docDefinitions.value.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
      showSnackbar(`Document created (source: documents)`, "success")
    }
    closeDocModal()
  } catch (err) {
    console.error("saveDoc error", err)

    const msg = err?.response?.data?.detail || "Failed to save document. See console."

    showSnackbar(msg, "error")
  }
}

// ---------- delete ----------
const askDelete = id => {
  confirmDialog.open = true
  confirmDialog.message = "Delete this document definition permanently?"
  confirmDialog.targetId = id
}

const performDelete = async () => {
  confirmDialog.open = false

  const id = confirmDialog.targetId
  if (!id) return
  try {
    await axios.delete(`${DOC_API}${id}/`)
    docDefinitions.value = docDefinitions.value.filter(d => d.id !== id)
    showSnackbar("Document deleted (source: documents)", "success")
  } catch (err) {
    console.error("deleteDocDefinition error", err)
    showSnackbar("Delete failed.", "error")
  } finally {
    confirmDialog.targetId = null
  }
}

// ---------- drag & drop for docs ----------
let docDragIndex = null

const onDocDragStart = (e, idx) => {
  docDragIndex = idx
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", String(idx))
  e.currentTarget.classList.add("dragging")
}

const onDocDragOver = e => { e.preventDefault(); e.dataTransfer.dropEffect = "move" }
const onDocDragEnter = e => { e.currentTarget.classList.add("drag-over") }
const onDocDragLeave = e => { e.currentTarget.classList.remove("drag-over") }

const onDocDrop = (e, idx) => {
  e.preventDefault()

  const from = docDragIndex !== null ? docDragIndex : Number(e.dataTransfer.getData("text/plain"))
  const to = idx
  if (from === to) { cleanupDocDragClasses() 

    return }
  const arr = [...docDefinitions.value]
  const [moved] = arr.splice(from, 1)

  arr.splice(to, 0, moved)
  arr.forEach((it, i) => { it.order = i })
  docDefinitions.value = arr
  docDragIndex = null
  cleanupDocDragClasses()
}

const cleanupDocDragClasses = () => {
  const els = document.querySelectorAll(".doc-item")

  els.forEach(el => { el.classList.remove("drag-over"); el.classList.remove("dragging") })
}

// ---------- save doc order ----------
const saveDocOrder = async () => {
  savingOrder.value = true
  try {
    const promises = docDefinitions.value.map(d => {
      // Only patch if id exists (server-managed)
      if (!d?.id) return Promise.resolve()
      
      return axios.patch(`${DOC_API}${d.id}/`, { order: d.order }).catch(err => {
        console.error("Doc order patch failed for", d.id, err)
      })
    })

    await Promise.all(promises)
    showSnackbar("Document order saved ✔ (source: documents)", "success")
  } catch (err) {
    console.error("saveDocOrder error", err)
    showSnackbar("Failed to save document order", "error")
  } finally {
    savingOrder.value = false
  }
}

// ---------- snackbar helper ----------
const showSnackbar = (message, type = "success") => {
  snackbar.message = message
  snackbar.color = type === "error" ? "error" : "success"
  snackbar.open = false // reset to retrigger
  // small timeout to allow v-model change
  setTimeout(() => { snackbar.open = true }, 50)
}

// ---------- watch / lifecycle ----------
watch(selectedTarget, async nv => {
  if (!nv) return
  await fetchDocDefinitions()
})

onMounted(async () => {
  await fetchRoles()
  if (selectedTarget.value) {
    await fetchDocDefinitions()
  } else {
    // safety: if roles already fetched and selectedTarget assigned
    if (roles.value.length && !selectedTarget.value) selectedTarget.value = roles.value[0].target
    if (selectedTarget.value) await fetchDocDefinitions()
  }
})

const router = useRouter()

const goToDocumentPage = () => {
  router.push("/superadmin/dynamic-providerfields/sprofile-form")
}
</script>

<template>
  <VContainer class="py-6">
    <!-- HEADER -->
    <!--
      <VCard class="pa-4 mb-6" elevation="2">
      <VCardTitle class="text-h5 font-weight-bold" style="color:#6C27FF">
      Document Field Builder — SuperAdmin
      </VCardTitle>
      </VCard> 
    -->
    <VCard
      class="pa-4 mb-6"
      elevation="2"
    >
      <div class="d-flex justify-space-between align-center">
        <VCardTitle
          class="text-h5 font-weight-bold"
          style="color:#6C27FF"
        >
          Document Field Builder — SuperAdmin
        </VCardTitle>

        <VBtn
          size="small"
          color="#6C27FF"
          class="text-white"
          rounded="lg"
          @click="goToDocumentPage"
        >
          Profile
        </VBtn>
      </div>
    </VCard>


    <!-- TOP CONTROLS -->
    <VCard
      elevation="2"
      class="mb-6"
    >
      <VCardText>
        <VRow
          class="align-end"
          no-gutters
        >
          <!-- ROLE SELECT -->
          <VCol
            cols="12"
            sm="3"
            class="pe-sm-3"
          >
            <span class="text-caption font-weight-medium">Provider Role</span>
            <VSelect
              v-model="selectedTarget"
              :items="roles"
              item-title="name"
              item-value="target"
              variant="outlined"
              density="comfortable"
              @change="fetchDocDefinitions"
            />
          </VCol>

          <!-- SEARCH -->
          <VCol
            cols="12"
            sm="5"
            class="pe-sm-3"
          >
            <span class="text-caption font-weight-medium">Search documents</span>
            <VTextField
              v-model="docSearch"
              placeholder="Search by key/label…"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
            />
          </VCol>

          <!-- ACTIONS -->
          <VCol
            cols="12"
            sm="4"
            class="d-flex justify-sm-end mt-4 mt-sm-0 gap-3"
          >
            <VBtn
              size="small"
              :style="{ background:'#6C27FF' }"
              @click="openDocCreateModal"
            >
              + Create
            </VBtn>

            <VBtn
              variant="tonal"
              size="small"
              :style="{ '--v-theme-overlay-multiplier':'0', background:'#F3E8FF', color:'#6C27FF' }"
              @click="fetchDocDefinitions"
            >
              Refresh
            </VBtn>

            <VBtn
              size="small"
              :style="{ background:'#6C27FF' }"
              :disabled="savingOrder || docDefinitions.length === 0"
              @click="saveDocOrder"
            >
              {{ savingOrder ? "Saving…" : "Save Order" }}
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- MAIN -->
    <VRow>
      <!-- LEFT: LIST -->
      <VCol
        cols="12"
        md="8"
      >
        <VCard elevation="2">
          <VCardText>
            <!-- Loading -->
            <div
              v-if="docLoading"
              class="text-center py-10"
            >
              <VProgressCircular
                indeterminate
                color="#6C27FF"
              />
              <div class="mt-3">
                Loading documents…
              </div>
            </div>

            <!-- Empty -->
            <div
              v-else-if="docFiltered.length === 0"
              class="text-center py-10 text-grey"
            >
              No documents found.
            </div>

            <!-- List -->
            <div v-else>
              <div
                v-for="(d, idx) in docPaginated"
                :key="d.id"
                class="pa-4 mb-3 rounded-lg border d-flex justify-space-between align-start doc-item"
                style="border-color: #e5e7eb; background:#fafafa"
                draggable="true"
                @dragstart="(e) => onDocDragStart(e, (docPage-1)*docPageSize + idx)"
                @dragover="onDocDragOver"
                @dragenter="onDocDragEnter"
                @dragleave="onDocDragLeave"
                @drop="(e) => onDocDrop(e, (docPage-1)*docPageSize + idx)"
              >
                <div>
                  <div class="d-flex align-center flex-wrap gap-2">
                    <span class="font-weight-bold text-body-1">{{ d.label }}</span>
                    <span class="text-grey">({{ d.key }})</span>
                    <VChip
                      size="small"
                      label
                      :style="{ background:'#EFE4FF', color:'#6C27FF' }"
                    >
                      {{ d.allow_multiple ? 'multiple' : 'single' }}
                    </VChip>
                  </div>

                  <div class="mt-2 text-caption text-grey-darken-1 d-flex flex-wrap gap-4">
                    <div>Required: <b>{{ d.is_required ? "Yes" : "No" }}</b></div>
                    <div>Order: <b>{{ d.order }}</b></div>
                    <div v-if="d.allowed_types?.length">
                      Types: {{ d.allowed_types.join(", ") }}
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-column gap-2">
                  <VBtn
                    size="x-small"
                    :style="{ background:'#6C27FF' }"
                    @click="openDocEditModal(d)"
                  >
                    Edit
                  </VBtn>
                  <VBtn
                    size="x-small"
                    color="red-darken-2"
                    @click="askDelete(d.id)"
                  >
                    Delete
                  </VBtn>
                </div>
              </div>

              <!-- pagination -->
              <div
                v-if="docTotalPages > 1"
                class="d-flex justify-center mt-6"
              >
                <VBtn
                  size="small"
                  :style="{ background:'#6C27FF' }"
                  :disabled="docPage === 1"
                  @click="docGoFirst"
                >
                  «
                </VBtn>
                <VBtn
                  size="small"
                  :style="{ background:'#6C27FF' }"
                  :disabled="docPage === 1"
                  @click="docGoPrev"
                >
                  ‹
                </VBtn>

                <div class="px-4 py-1 text-body-2">
                  Page {{ docPage }} / {{ docTotalPages }}
                </div>

                <VBtn
                  size="small"
                  :style="{ background:'#6C27FF' }"
                  :disabled="docPage === docTotalPages"
                  @click="docGoNext"
                >
                  ›
                </VBtn>
                <VBtn
                  size="small"
                  :style="{ background:'#6C27FF' }"
                  :disabled="docPage === docTotalPages"
                  @click="docGoLast"
                >
                  »
                </VBtn>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- RIGHT: PREVIEW & TIPS -->
      <VCol
        cols="12"
        md="4"
      >
        <VCard
          elevation="3"
          class="pa-5 preview-card"
        >
          <div class="d-flex align-center mb-4">
            <VAvatar
              size="36"
              color="purple-lighten-4"
            >
              <VIcon
                icon="mdi-file-document-outline"
                color="purple-darken-2"
              />
            </VAvatar>
            <h3 class="text-h6 font-weight-bold ms-3 text-purple-darken-3">
              Preview & Tips
            </h3>
          </div>

          <div class="tip-box mb-4">
            <VIcon
              icon="mdi-drag"
              size="20"
              color="purple-darken-2"
              class="me-2"
            />
            <span>Drag documents to reorder. Save order after reordering.</span>
          </div>

          <div class="tip-box mb-4">
            <VIcon
              icon="mdi-file-check-outline"
              size="20"
              color="purple-darken-2"
              class="me-2"
            />
            <span>Pick common MIME types or add custom ones (e.g. application/vnd.geo+json).</span>
          </div>

          <VDivider class="my-4" />

          <h4 class="text-subtitle-1 font-weight-bold mb-3 text-purple-darken-3">
            Quick Validation
          </h4>

          <VList
            density="comfortable"
            nav
            class="rounded-lg"
          >
            <VListItem>
              <template #prepend>
                <VIcon
                  icon="mdi-check-circle-outline"
                  color="purple-darken-2"
                />
              </template>
              <VListItemTitle>Machine key: lowercase, use underscores</VListItemTitle>
            </VListItem>

            <VListItem>
              <template #prepend>
                <VIcon
                  icon="mdi-check-circle-outline"
                  color="purple-darken-2"
                />
              </template>
              <VListItemTitle>Label must be user friendly</VListItemTitle>
            </VListItem>

            <VListItem>
              <template #prepend>
                <VIcon
                  icon="mdi-check-circle-outline"
                  color="purple-darken-2"
                />
              </template>
              <VListItemTitle>Allowed types: empty means any (be careful)</VListItemTitle>
            </VListItem>
          </VList>
        </VCard>
      </VCol>
    </VRow>

    <!-- CREATE / EDIT MODAL -->
    <VDialog
      v-model="docModalOpen"
      max-width="720"
    >
      <VCard
        elevation="8"
        class="rounded-lg"
      >
        <VCardTitle
          class="d-flex justify-space-between align-center px-5 py-4"
          style="background:#F5EDFF; border-bottom:1px solid #E8D8FF;"
        >
          <span
            class="text-h6 font-weight-bold"
            style="color:#6C27FF"
          >{{ docIsEdit ? "Edit Document Definition" : "Create Document Definition" }}</span>
          <VBtn
            icon
            variant="text"
            @click="closeDocModal"
          >
            <VIcon
              icon="mdi-close"
              size="26"
              color="purple-darken-2"
            />
          </VBtn>
        </VCardTitle>

        <VCardText class="px-5 py-4">
          <VRow>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="docForm.key"
                label="Machine Key *"
                placeholder="id_proof"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="docForm.label"
                label="Label *"
                placeholder="ID Proof"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model.number="docForm.order"
                label="Order"
                placeholder="0"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
              class="d-flex align-center"
            >
              <VCheckbox
                v-model="docForm.is_required"
                label="Required"
                color="purple-darken-2"
              />
              <VCheckbox
                v-model="docForm.allow_multiple"
                label="Allow multiple uploads"
                color="purple-darken-2"
                class="ms-4"
              />
            </VCol>
          </VRow>

          <!-- PREDEFINED MIME CHECKS -->
          <div class="mt-4">
            <h4 class="text-subtitle-2 font-weight-bold mb-2">
              Allowed File Types (quick select)
            </h4>
            <div class="d-flex flex-wrap gap-2">
              <VBtn
                v-for="m in PREDEFINED_MIMES"
                :key="m.value"
                :variant="docForm.allowed_types.includes(m.value) ? 'flat' : 'tonal'"
                size="small"
                :style="docForm.allowed_types.includes(m.value) ? { background:'#6C27FF', color:'white' } : {}"
                @click="togglePredefinedMime(m.value)"
              >
                {{ m.label }}
              </VBtn>
            </div>
          </div>

          <!-- MANUAL MIME ADD -->
          <div class="mt-4">
            <h4 class="text-subtitle-2 font-weight-bold mb-2">
              Add custom MIME type
            </h4>
            <div class="d-flex gap-3">
              <VTextField
                v-model="docTypeInput"
                label="e.g. application/vnd.geo+json"
                placeholder="Type MIME and press Add"
                variant="outlined"
                density="comfortable"
                class="flex-grow-1"
                @keyup.enter="addCustomMime"
              />
              <VBtn
                size="small"
                style="background:#6C27FF"
                @click="addCustomMime"
              >
                Add
              </VBtn>
            </div>

            <div class="d-flex flex-wrap gap-2 mt-3">
              <VChip
                v-for="t in docForm.allowed_types"
                :key="t"
                closable
                class="bg-purple-lighten-5 text-purple-darken-3"
                size="small"
                @click:close="removeAllowedType(t)"
              >
                {{ t }}
              </VChip>
            </div>
          </div>

          <VTextField
            v-model="docForm.help_text"
            label="Help Text"
            placeholder="Optional guidance"
            variant="outlined"
            density="comfortable"
            class="mt-4"
          />
        </VCardText>

        <VCardActions
          class="px-5 py-4 justify-end"
          style="border-top:1px solid #EFE8FF"
        >
          <VBtn
            variant="text"
            size="small"
            @click="closeDocModal"
          >
            Cancel
          </VBtn>
          <VBtn
            size="small"
            class="purple-btn"
            @click="saveDoc"
          >
            {{ docIsEdit ? "Update" : "Create" }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Confirm delete dialog -->
    <VDialog
      v-model="confirmDialog.open"
      max-width="480"
    >
      <VCard>
        <VCardTitle class="text-h6">
          Confirm Delete
        </VCardTitle>
        <VCardText>{{ confirmDialog.message }}</VCardText>
        <VCardActions class="justify-end">
          <VBtn
            variant="text"
            size="small"
            @click="confirmDialog.open = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="red"
            size="small"
            @click="performDelete"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar
      v-model="snackbar.open"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      location="top-right"
    >
      <div class="d-flex align-center gap-3">
        <VIcon
          v-if="snackbar.color === 'success'"
          icon="mdi-check-circle"
        />
        <VIcon
          v-else
          icon="mdi-alert-circle"
        />
        <strong>{{ snackbar.message }}</strong>
      </div>
    </VSnackbar>
  </VContainer>
</template>

<style scoped>
.preview-card {
  border-radius: 14px;
  background: white;
  border: 1px solid #eee;
}
.tip-box {
  display: flex;
  align-items: center;
  background: #f7f2ff;
  padding: 10px 14px;
  border-radius: 10px;
  border-left: 4px solid #6C27FF;
  font-size: 14px;
  color: #4a4a4a;
}
.purple-btn {
  background: #6C27FF !important;
  color: white !important;
  transition: 0.25s ease-in-out;
}
.purple-btn:hover { background: #8F4CFF !important; color: white !important; }
.doc-item.dragging { opacity: 0.6; }
.doc-item.drag-over { border-style: dashed; transform: translateY(-4px); }
</style>
