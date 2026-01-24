
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import DynamicField from './DynamicField.vue'

const props = defineProps({
  visitId: {
    type: String,
    required: true,
  },
  pet: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['submitted', 'cancel'])

const store = useVeterinaryStore()
const loading = ref(false)
const formDefinition = ref(null)
const formData = ref({})
const addMetricDialog = ref(false)
const isEditing = ref(false)
const managementMode = ref(false)
const viewMode = ref('cards') // 'cards' or 'table'

const newMetric = ref({
  id: null,
  label: '',
  field_type: 'NUMBER',
  unit: '',
  is_required: false,
  field_key: '',
})

const fieldTypes = [
  { title: 'Number', value: 'NUMBER' },
  { title: 'Text', value: 'TEXT' },
  { title: 'Yes/No', value: 'BOOLEAN' },
  { title: 'Dropdown', value: 'SELECT' },
]

const loadDefinition = async () => {
  loading.value = true
  try {
    const data = await store.fetchFormDefinition('VITALS')

    formDefinition.value = data
    
    // Fetch latest visit summary to get current vitals data
    const summary = await store.fetchVisitSummary(props.visitId)
    const existingVitals = summary.vitals || {}
    
    // Initialize formData with current fields and existing values
    const initialData = {}

    data.fields.forEach(f => {
      initialData[f.field_key] = existingVitals[f.field_key] || null
    })
    formData.value = initialData
  } catch (e) {
    console.error("Failed to load vitals definition:", e)
  } finally {
    loading.value = false
  }
}

onMounted(loadDefinition)

const submit = async () => {
  loading.value = true
  try {
    await store.submitForm(props.visitId, 'VITALS', formData.value)

    // Transition visit status to VITALS_RECORDED
    await store.updateVisitStatus(props.visitId, 'VITALS_RECORDED')
    emit('submitted')
  } catch (e) {
    console.error("Failed to submit vitals:", e)
  } finally {
    loading.value = false
  }
}

const addNewMetric = async () => {
  if (!newMetric.value.label) return
  
  loading.value = true
  try {
    let updatedFields = [...formDefinition.value.fields]
    
    if (isEditing.value) {
      // Update existing field
      updatedFields = updatedFields.map(f => {
        if (f.field_key === newMetric.value.field_key) {
          return {
            ...f,
            label: newMetric.value.label,
            field_type: newMetric.value.field_type,
            unit: newMetric.value.unit,
            is_required: newMetric.value.is_required,
          }
        }
        
        return f
      })
    } else {
      // 1. Generate a key from label
      const key = newMetric.value.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      
      // 2. Add as new field
      updatedFields.push({
        field_key: key,
        label: newMetric.value.label,
        field_type: newMetric.value.field_type,
        unit: newMetric.value.unit,
        is_required: newMetric.value.is_required,
        order: updatedFields.length + 1,
      })
    }
    
    // 3. Update form definition in backend
    await store.saveFormDefinition({
      ...formDefinition.value,
      fields: updatedFields,
    }, 'VITALS')
    
    addMetricDialog.value = false
    resetMetricForm()
    
    // 4. Reload definition to reflect changes
    await loadDefinition()
  } catch (e) {
    console.error("Failed to save metric:", e)
  } finally {
    loading.value = false
  }
}

const openEditDialog = field => {
  isEditing.value = true
  newMetric.value = { 
    id: field.id,
    label: field.label, 
    field_type: field.field_type, 
    unit: field.unit || '', 
    is_required: field.is_required,
    field_key: field.field_key,
  }
  addMetricDialog.value = true
}

const openAddDialog = () => {
  isEditing.value = false
  resetMetricForm()
  addMetricDialog.value = true
}

const resetMetricForm = () => {
  newMetric.value = { id: null, label: '', field_type: 'NUMBER', unit: '', is_required: false, field_key: '' }
}

const deleteMetric = async fieldKey => {
  if (!confirm('Are you sure you want to remove this measurement? All data for this field in this visit will be lost.')) return
  
  loading.value = true
  try {
    const updatedFields = formDefinition.value.fields.filter(f => f.field_key !== fieldKey)
    
    await store.saveFormDefinition({
      ...formDefinition.value,
      fields: updatedFields,
    }, 'VITALS')
    
    await loadDefinition()
  } catch (e) {
    console.error("Failed to delete metric:", e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="vitals-entry-form">
    <div class="d-flex align-center justify-space-between mb-4">
      <h3 class="text-h6 font-weight-bold">
        Metrics Collection
      </h3>
      <VBtnGroup
        variant="tonal"
        color="primary"
        density="compact"
        rounded="xl"
      >
        <VBtn 
          :variant="viewMode === 'cards' ? 'elevated' : 'tonal'" 
          prepend-icon="tabler-layout-grid"
          @click="viewMode = 'cards'"
        >
          Cards
        </VBtn>
        <VBtn 
          :variant="viewMode === 'table' ? 'elevated' : 'tonal'" 
          prepend-icon="tabler-list"
          @click="viewMode = 'table'"
        >
          Table
        </VBtn>
      </VBtnGroup>
    </div>

    <VForm
      ref="formRef"
      @submit.prevent="submit"
    >
      <!-- CARDS VIEW -->
      <VRow v-if="viewMode === 'cards'">
        <VCol 
          v-for="field in formDefinition?.fields" 
          :key="field.id" 
          cols="12" 
          md="6"
        >
          <VCard
            variant="outlined"
            class="pa-4 h-100 dynamic-vital-card position-relative"
          >
            <!-- Edit/Delete overlay in Management Mode -->
            <div
              v-if="managementMode"
              class="management-overlay d-flex gap-2"
            >
              <VBtn
                icon
                size="x-small"
                color="primary"
                variant="elevated"
                @click="openEditDialog(field)"
              >
                <VIcon
                  icon="tabler-edit"
                  size="14"
                />
              </VBtn>
              <VBtn
                icon
                size="x-small"
                color="error"
                variant="elevated"
                @click="deleteMetric(field.field_key)"
              >
                <VIcon
                  icon="tabler-trash"
                  size="14"
                />
              </VBtn>
            </div>

            <div class="d-flex align-center gap-2 mb-2">
              <VAvatar
                color="primary"
                variant="tonal"
                size="32"
              >
                <VIcon
                  :icon="field.field_type === 'NUMBER' ? 'tabler-chart-bar' : 'tabler-edit'"
                  size="18"
                />
              </VAvatar>
              <span class="text-subtitle-1 font-weight-bold">{{ field.label }}</span>
            </div>
            
            <DynamicField
              v-model="formData[field.field_key]"
              :field="field"
              hide-label
            />
            
            <div
              v-if="field.field_key === 'weight' && pet.last_weight"
              class="text-caption text-medium-emphasis mt-n2 ms-2"
            >
              Previous: {{ pet.last_weight }} kg
            </div>
          </VCard>
        </VCol>

        <!-- ADD NEW METRIC BUTTON -->
        <VCol
          cols="12"
          md="6"
          class="d-flex align-center"
        >
          <VCard 
            v-ripple 
            variant="flat"
            class="pa-4 w-100 d-flex flex-column align-center justify-center border-dashed add-metric-box"
            @click="openAddDialog"
          >
            <VIcon
              icon="tabler-plus"
              size="32"
              color="medium-emphasis"
              class="mb-2"
            />
            <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">Add New Metric</span>
          </VCard>
        </VCol>
      </VRow>

      <!-- TABLE VIEW -->
      <VCard
        v-else
        variant="outlined"
        class="mb-6 rounded-xl overflow-hidden border-light"
      >
        <VTable
          density="comfortable"
          class="vitals-table"
        >
          <thead>
            <tr>
              <th class="text-left font-weight-bold">
                Measurement
              </th>
              <th class="text-left font-weight-bold">
                Value / Input
              </th>
              <th
                v-if="managementMode"
                class="text-right font-weight-bold"
                style="width: 100px;"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="field in formDefinition?.fields"
              :key="field.id"
            >
              <td>
                <div class="d-flex align-center gap-2">
                  <VIcon
                    :icon="field.field_type === 'NUMBER' ? 'tabler-chart-bar' : 'tabler-edit'"
                    size="18"
                    color="primary"
                  />
                  <span class="font-weight-medium">{{ field.label }}</span>
                  <span
                    v-if="field.unit"
                    class="text-caption text-medium-emphasis"
                  >({{ field.unit }})</span>
                </div>
              </td>
              <td class="py-2">
                <DynamicField
                  v-model="formData[field.field_key]"
                  :field="field"
                  hide-label
                  density="compact"
                  variant="underlined"
                />
                <div
                  v-if="field.field_key === 'weight' && pet.last_weight"
                  class="text-caption text-medium-emphasis mt-n2"
                >
                  Prev: {{ pet.last_weight }} kg
                </div>
              </td>
              <td
                v-if="managementMode"
                class="text-right"
              >
                <div class="d-flex justify-end gap-1">
                  <VBtn
                    icon
                    size="x-small"
                    color="primary"
                    variant="text"
                    @click="openEditDialog(field)"
                  >
                    <VIcon
                      icon="tabler-edit"
                      size="14"
                    />
                  </VBtn>
                  <VBtn
                    icon
                    size="x-small"
                    color="error"
                    variant="text"
                    @click="deleteMetric(field.field_key)"
                  >
                    <VIcon
                      icon="tabler-trash"
                      size="14"
                    />
                  </VBtn>
                </div>
              </td>
            </tr>
            <tr
              v-if="managementMode"
              class="add-metric-row"
            >
              <td
                colspan="3"
                class="text-center py-2"
              >
                <VBtn 
                  variant="text" 
                  color="medium-emphasis" 
                  prepend-icon="tabler-plus" 
                  size="small"
                  @click="openAddDialog"
                >
                  Add New Measurement Type
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>

      <VRow>
        <VCol
          cols="12"
          class="d-flex justify-end py-0"
        >
          <VSwitch
            v-model="managementMode"
            label="Management Mode"
            color="primary"
            hide-details
            density="compact"
            class="mt-n2"
          />
        </VCol>

        <!-- ACTIONS -->
        <VCol
          cols="12"
          class="d-flex gap-3 pt-6"
        >
          <VBtn
            variant="tonal"
            color="secondary"
            size="large"
            class="flex-grow-1 rounded-xl"
            @click="emit('cancel')"
          >
            Cancel
          </VBtn>
          <VBtn 
            color="primary" 
            size="large" 
            class="flex-grow-1 px-8 rounded-xl shadow-btn" 
            :loading="loading" 
            prepend-icon="tabler-player-play"
            @click="submit"
          >
            Finalize & Send to Doctor
          </VBtn>
        </VCol>
      </VRow>
    </VForm>

    <!-- Simplified Metric Creator/Editor Dialog -->
    <VDialog
      v-model="addMetricDialog"
      max-width="450px"
    >
      <VCard :title="isEditing ? 'Edit Measurement' : 'Add New Measurement Type'">
        <VCardText class="pt-2">
          <p class="text-body-2 text-medium-emphasis mb-6">
            Create a new field that you want to track for all patients.
          </p>
          
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="newMetric.label"
                label="Measurement Name"
                placeholder="e.g. Blood Pressure, O2 Saturation"
                variant="outlined"
                hide-details
                class="mb-4"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="newMetric.field_type"
                :items="fieldTypes"
                label="Result Type"
                variant="outlined"
                hide-details
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="newMetric.unit"
                label="Unit (Optional)"
                placeholder="e.g. mmHg, %"
                variant="outlined"
                hide-details
              />
            </VCol>
            <VCol cols="12">
              <VCheckbox
                v-model="newMetric.is_required"
                label="Is this field mandatory?"
                hide-details
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            @click="addMetricDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn 
            color="primary" 
            variant="elevated" 
            :loading="loading"
            :disabled="!newMetric.label"
            @click="addNewMetric"
          >
            Add Now
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.vitals-entry-form {
  user-select: none;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.dynamic-vital-card {
  background-color: #fafafa;
  border-radius: 16px !important;
  transition: all 0.2s ease;
}

.management-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.dynamic-vital-card:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: #fff;
}

.add-metric-box {
  min-height: 120px;
  border: 2px dashed rgba(var(--v-border-color), 0.5) !important;
  cursor: pointer;
  border-radius: 16px !important;
  transition: background 0.2s ease;
}

.add-metric-box:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-color: rgb(var(--v-theme-primary)) !important;
}

.shadow-btn {
    box-shadow: 0 8px 24px -8px rgba(var(--v-theme-primary), 0.5) !important;
}

:deep(.dynamic-field .v-field) {
  border-radius: 12px !important;
}

.vitals-table :deep(th) {
  background-color: #f8f9fa !important;
  font-size: 0.75rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
}

.vitals-table :deep(td) {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05) !important;
}

.border-light {
  border-color: rgba(0,0,0,0.05) !important;
}
</style>

<style scoped>
.vitals-entry-form {
  user-select: none;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.vital-input-large :deep(input) {
  font-size: 1.8rem !important;
  font-weight: 800 !important;
  text-align: center;
  color: rgb(var(--v-theme-primary));
}

.dark-field-card {
  background-color: #fafafa;
  border: 1px solid #e0e0e0 !important;
  border-radius: 16px !important;
  transition: all 0.2s ease;
}

.dark-field-card:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: #fff;
}

.mm-card {
    border-left: 4px solid rgb(var(--v-theme-primary)) !important;
}

.mm-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ccc;
}
.mm-indicator.pink { background-color: #ff80ab; box-shadow: 0 0 8px #ff80ab; }
.mm-indicator.pale { background-color: #ffe0b2; box-shadow: 0 0 8px #ffe0b2; }
.mm-indicator.cyanotic { background-color: #b3e5fc; box-shadow: 0 0 8px #b3e5fc; }
.mm-indicator.icteric { background-color: #fff176; box-shadow: 0 0 8px #fff176; }

.mm-btn {
    text-transform: none !important;
    letter-spacing: 0 !important;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mm-btn.active {
    transform: scale(1.05);
}

.shadow-btn {
    box-shadow: 0 8px 24px -8px rgba(var(--v-theme-primary), 0.5) !important;
}
</style>
