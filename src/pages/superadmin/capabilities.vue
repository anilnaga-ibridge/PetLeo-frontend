<script setup>
import { ref, onMounted, computed } from 'vue'
import { superAdminApi } from '@/plugins/axios'

// ── State ────────────────────────────────────────────────────────────────────
const capabilities = ref([])
const loading      = ref(false)
const saving       = ref(false)
const searchQuery  = ref('')
const filterGroup  = ref('All')
const filterService = ref('All')

// ── Dialog State ─────────────────────────────────────────────────────────────
const showDialog  = ref(false)
const isEdit      = ref(false)
const deleteDialog = ref(false)
const deleteTarget = ref(null)

const emptyForm = () => ({
  key: '',
  label: '',
  description: '',
  group: 'General',
  service: 'VETERINARY',
})

const form = ref(emptyForm())
const formError = ref('')

// ── Options ───────────────────────────────────────────────────────────────────
const groupOptions   = ['General', 'Core', 'Reception', 'Nursing', 'Doctor', 'Laboratory', 'Pharmacy', 'Finance', 'Admin']
const serviceOptions = ['VETERINARY', 'GROOMING', 'DAYCARE', 'BOARDING', 'TRAINING', 'TRANSPORT']

// ── Computed ──────────────────────────────────────────────────────────────────
const uniqueGroups = computed(() => {
  const groups = [...new Set(capabilities.value.map(c => c.group).filter(Boolean))]
  
  return ['All', ...groups.sort()]
})

const uniqueServices = computed(() => {
  const services = [...new Set(capabilities.value.map(c => c.service).filter(Boolean))]
  
  return ['All', ...services.sort()]
})

const filtered = computed(() => {
  return capabilities.value.filter(c => {
    const q = searchQuery.value.toLowerCase()
    const matchSearch  = !q || c.key.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    const matchGroup   = filterGroup.value === 'All' || c.group === filterGroup.value
    const matchService = filterService.value === 'All' || c.service === filterService.value
    
    return matchSearch && matchGroup && matchService
  })
})

const groupColor = g => {
  const map = { Core: 'primary', Reception: 'info', Nursing: 'green', Doctor: 'purple', Laboratory: 'cyan', Pharmacy: 'orange', Finance: 'yellow', Admin: 'red' }
  
  return map[g] || 'secondary'
}

// ── API ───────────────────────────────────────────────────────────────────────
const fetchCapabilities = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/capabilities/', { params: { page_size: 500 } })

    capabilities.value = res.data.results || res.data || []
  } catch (e) {
    console.error('Failed to fetch capabilities:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchCapabilities)

// ── Dialog helpers ────────────────────────────────────────────────────────────
const openCreate = () => {
  isEdit.value = false
  form.value = emptyForm()
  formError.value = ''
  showDialog.value = true
}

const openEdit = cap => {
  isEdit.value = true
  form.value = { ...cap }
  formError.value = ''
  showDialog.value = true
}

// Auto-generate key from label
const autoKey = () => {
  if (isEdit.value) return        // Don't change key when editing
  if (!form.value.label) return
  const base = form.value.service || 'VETERINARY'

  const slug = form.value.label
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '_')

  form.value.key = `${base}_${slug}`
}

// ── Save ──────────────────────────────────────────────────────────────────────
const save = async () => {
  formError.value = ''
  if (!form.value.key || !form.value.label) {
    formError.value = 'Key and Label are required.'
    
    return
  }

  // Validate key format
  if (!/^[A-Z][A-Z0-9_]*$/.test(form.value.key)) {
    formError.value = 'Key must be UPPER_SNAKE_CASE (e.g. VETERINARY_SURGERY)'
    
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/capabilities/${form.value.key}/`, form.value)
    } else {
      await superAdminApi.post('/api/superadmin/capabilities/', form.value)
    }
    showDialog.value = false
    await fetchCapabilities()
  } catch (e) {
    const data = e.response?.data

    formError.value = data?.key?.[0] || data?.detail || data?.non_field_errors?.[0] || 'Save failed. Please try again.'
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const confirmDelete = cap => {
  deleteTarget.value = cap
  deleteDialog.value = true
}

const doDelete = async () => {
  try {
    await superAdminApi.delete(`/api/superadmin/capabilities/${deleteTarget.value.key}/`)
    deleteDialog.value = false
    await fetchCapabilities()
  } catch (e) {
    console.error('Delete failed:', e)
  }
}
</script>

<template>
  <div class="caps-page pa-6">
    <!-- ── Page Header ─────────────────────────────────────────────────── -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          Capability Management
        </h1>
        <p class="text-body-2 text-medium-emphasis">
          Define what features are available across the platform. No code required.
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        size="default"
        @click="openCreate"
      >
        New Capability
      </VBtn>
    </div>

    <!-- ── Stats Row ───────────────────────────────────────────────────── -->
    <VRow
      class="mb-4"
      dense
    >
      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          elevation="0"
          border
          class="stat-card"
        >
          <VCardText>
            <div class="text-h4 font-weight-black text-primary">
              {{ capabilities.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Total Capabilities
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          elevation="0"
          border
          class="stat-card"
        >
          <VCardText>
            <div class="text-h4 font-weight-black text-success">
              {{ uniqueServices.length - 1 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Services
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          elevation="0"
          border
          class="stat-card"
        >
          <VCardText>
            <div class="text-h4 font-weight-black text-warning">
              {{ uniqueGroups.length - 1 }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Groups
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          elevation="0"
          border
          class="stat-card"
        >
          <VCardText>
            <div class="text-h4 font-weight-black text-info">
              {{ filtered.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Showing
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- ── Filters ─────────────────────────────────────────────────────── -->
    <VCard
      elevation="0"
      border
      class="mb-4"
    >
      <VCardText>
        <div class="d-flex gap-3 flex-wrap align-center">
          <VTextField
            v-model="searchQuery"
            placeholder="Search key, label, description..."
            density="compact"
            variant="outlined"
            prepend-inner-icon="tabler-search"
            hide-details
            style="min-width: 240px; max-width: 340px"
          />
          <VSelect
            v-model="filterService"
            :items="uniqueServices"
            label="Service"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 180px"
          />
          <VSelect
            v-model="filterGroup"
            :items="uniqueGroups"
            label="Group"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 180px"
          />
          <VBtn
            v-if="searchQuery || filterGroup !== 'All' || filterService !== 'All'"
            variant="text"
            size="small"
            @click="searchQuery = ''; filterGroup = 'All'; filterService = 'All'"
          >
            Clear
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- ── Table ───────────────────────────────────────────────────────── -->
    <VCard
      elevation="0"
      border
    >
      <div
        v-if="loading"
        class="d-flex justify-center align-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="40"
        />
      </div>

      <VTable
        v-else
        density="comfortable"
        hover
      >
        <thead>
          <tr>
            <th style="width: 280px">
              Capability Key
            </th>
            <th>Label</th>
            <th>Description</th>
            <th>Group</th>
            <th>Service</th>
            <th style="width: 100px">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="cap in filtered"
            :key="cap.key"
            class="cap-row"
          >
            <td>
              <code class="cap-key">{{ cap.key }}</code>
            </td>
            <td class="font-weight-medium text-body-2">
              {{ cap.label }}
            </td>
            <td class="text-caption text-medium-emphasis">
              {{ cap.description || '—' }}
            </td>
            <td>
              <VChip
                size="x-small"
                :color="groupColor(cap.group)"
                variant="tonal"
              >
                {{ cap.group }}
              </VChip>
            </td>
            <td>
              <VChip
                size="x-small"
                color="primary"
                variant="outlined"
              >
                {{ cap.service }}
              </VChip>
            </td>
            <td>
              <div class="d-flex gap-1">
                <VBtn
                  icon
                  variant="text"
                  size="x-small"
                  color="primary"
                  @click="openEdit(cap)"
                >
                  <VIcon
                    icon="tabler-edit"
                    size="16"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Edit
                  </VTooltip>
                </VBtn>
                <VBtn
                  icon
                  variant="text"
                  size="x-small"
                  color="error"
                  @click="confirmDelete(cap)"
                >
                  <VIcon
                    icon="tabler-trash"
                    size="16"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Delete
                  </VTooltip>
                </VBtn>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0 && !loading">
            <td
              colspan="6"
              class="text-center py-10 text-medium-emphasis"
            >
              <VIcon
                icon="tabler-search-off"
                size="36"
                class="mb-2 d-block mx-auto"
              />
              No capabilities matched your search.
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>

    <!-- ── Create / Edit Dialog ────────────────────────────────────────── -->
    <VDialog
      v-model="showDialog"
      max-width="540"
      persistent
    >
      <VCard>
        <!-- Header -->
        <div
          class="dialog-header"
          :style="isEdit ? 'background: linear-gradient(135deg,#f59e0b,#d97706)' : 'background: linear-gradient(135deg,#3b82f6,#1d4ed8)'"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold text-white">
                {{ isEdit ? 'Edit Capability' : 'Create New Capability' }}
              </div>
              <div class="text-caption text-white opacity-80">
                {{ isEdit ? 'Update the details for this capability' : 'Add a new platform feature capability' }}
              </div>
            </div>
            <VBtn
              icon
              variant="text"
              color="white"
              size="small"
              @click="showDialog = false"
            >
              <VIcon icon="tabler-x" />
            </VBtn>
          </div>
        </div>

        <VCardText class="pt-5">
          <VAlert
            v-if="formError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ formError }}
          </VAlert>

          <div class="d-flex flex-column gap-4">
            <!-- Service -->
            <VSelect
              v-model="form.service"
              :items="serviceOptions"
              label="Service *"
              density="compact"
              variant="outlined"
              prepend-inner-icon="tabler-briefcase"
              @update:model-value="autoKey"
            />

            <!-- Label and auto-key -->
            <VTextField
              v-model="form.label"
              label="Feature Name *"
              density="compact"
              variant="outlined"
              placeholder="e.g. Surgical Procedures"
              prepend-inner-icon="tabler-tag"
              hint="Human-readable name shown in the UI"
              @update:model-value="autoKey"
            />

            <!-- Key — auto-generated but editable -->
            <VTextField
              v-model="form.key"
              label="Capability Key *"
              density="compact"
              variant="outlined"
              prepend-inner-icon="tabler-key"
              :disabled="isEdit"
              hint="Auto-generated. UPPER_SNAKE_CASE only. Cannot be changed after creation."
              :persistent-hint="true"
            />

            <!-- Description -->
            <VTextarea
              v-model="form.description"
              label="Description"
              density="compact"
              variant="outlined"
              rows="2"
              placeholder="Describe what this capability enables..."
            />

            <!-- Group -->
            <VCombobox
              v-model="form.group"
              :items="groupOptions"
              label="Group / Department *"
              density="compact"
              variant="outlined"
              prepend-inner-icon="tabler-users"
              hint="Used for organizing capabilities by department"
            />
          </div>

          <!-- Preview -->
          <div
            v-if="form.key"
            class="cap-preview mt-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              Preview
            </div>
            <div class="d-flex align-center gap-2 flex-wrap">
              <code class="cap-key">{{ form.key }}</code>
              <VChip
                size="x-small"
                :color="groupColor(form.group)"
                variant="tonal"
              >
                {{ form.group }}
              </VChip>
              <VChip
                size="x-small"
                color="primary"
                variant="outlined"
              >
                {{ form.service }}
              </VChip>
            </div>
          </div>
        </VCardText>

        <VCardActions class="pa-5 pt-0">
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            :loading="saving"
            :prepend-icon="isEdit ? 'tabler-device-floppy' : 'tabler-plus'"
            @click="save"
          >
            {{ isEdit ? 'Save Changes' : 'Create Capability' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ── Delete Confirm Dialog ───────────────────────────────────────── -->
    <VDialog
      v-model="deleteDialog"
      max-width="440"
    >
      <VCard>
        <VCardText class="pt-6">
          <div class="d-flex align-center gap-3 mb-4">
            <VAvatar
              color="error"
              variant="tonal"
              size="48"
            >
              <VIcon
                icon="tabler-alert-triangle"
                size="24"
              />
            </VAvatar>
            <div>
              <div class="text-h6 font-weight-bold">
                Delete Capability?
              </div>
              <div class="text-body-2 text-medium-emphasis">
                This action cannot be undone.
              </div>
            </div>
          </div>

          <VAlert
            type="warning"
            variant="tonal"
            density="compact"
          >
            Deleting <strong>{{ deleteTarget?.key }}</strong> will immediately break any role that depends on it.
            Make sure no active roles are using this capability before deleting.
          </VAlert>
        </VCardText>
        <VCardActions class="pa-5 pt-0">
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            prepend-icon="tabler-trash"
            @click="doDelete"
          >
            Yes, Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.caps-page { max-width: 1200px; }

.stat-card {
  border-radius: 12px;
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }

.cap-row { transition: background 0.12s; }
.cap-row:hover { background: rgba(var(--v-theme-primary), 0.03); }

.cap-key {
  background: rgba(var(--v-theme-on-surface), 0.06);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
  color: rgb(var(--v-theme-primary));
}

.dialog-header {
  padding: 20px 24px;
  border-radius: 12px 12px 0 0;
}

.cap-preview {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 8px;
  padding: 12px 14px;
}
</style>

<route lang="yaml">
meta:
  layout: default
  action: read
  subject: Auth
</route>
