<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useTheme } from 'vuetify'

const store = useVeterinaryStore()
const { global: theme } = useTheme()

const activeTab = ref('forms')
const loading = ref(false)
const forms = ref([])
const fieldDefinitions = ref([])
const activeEntity = ref('PET')

const entityTypes = [
  { title: 'Pet', value: 'PET', icon: 'tabler-dog' },
  { title: 'Owner', value: 'OWNER', icon: 'tabler-user' },
  { title: 'Clinic', value: 'CLINIC', icon: 'tabler-building-hospital' },
]

// Dialogs
const formDialog = ref(false)
const fieldDialog = ref(false)
const deleteDialog = ref(false)
const itemToDelete = ref(null)

const editingForm = ref({ id: null, name: '', code: '', description: '', fields: [] })
const editingField = ref({ id: null, label: '', key: '', field_type: 'TEXT', entity_type: 'PET' })

const fieldTypes = [
  { title: 'Text', value: 'TEXT' },
  { title: 'Number', value: 'NUMBER' },
  { title: 'Date', value: 'DATE' },
  { title: 'Boolean', value: 'BOOLEAN' },
  { title: 'Dropdown', value: 'DROPDOWN' },
  { title: 'Textarea', value: 'TEXTAREA' },
]

const loadData = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'forms') {
      forms.value = await store.fetchForms()
    } else {
      fieldDefinitions.value = await store.fetchDynamicFieldDefinitions(activeEntity.value)
    }
  } catch (e) {
    console.error("Failed to load metadata:", e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const openFormDialog = (form = null) => {
  if (form) {
    editingForm.value = { ...form }
  } else {
    editingForm.value = { id: null, name: '', code: '', description: '', fields: [] }
  }
  formDialog.value = true
}

const saveForm = async () => {
  try {
    await store.saveFormDefinition(editingForm.value, editingForm.value.code)
    formDialog.value = false
    loadData()
  } catch (e) {
    console.error("Failed to save form:", e)
  }
}

const openFieldDialog = (field = null) => {
  if (field) {
    editingField.value = { ...field }
  } else {
    editingField.value = { id: null, label: '', key: '', field_type: 'TEXT', entity_type: activeEntity.value }
  }
  fieldDialog.value = true
}

const saveField = async () => {
  try {
    if (editingField.value.id) {
      await store.updateDynamicField(editingField.value.id, editingField.value)
    } else {
      await store.createDynamicField(editingField.value)
    }
    fieldDialog.value = false
    loadData()
  } catch (e) {
    console.error("Failed to save field:", e)
  }
}

const confirmDelete = (item, type) => {
  itemToDelete.value = { item, type }
  deleteDialog.value = true
}

const deleteItem = async () => {
  try {
    const { item, type } = itemToDelete.value
    if (type === 'form') {
      await store.deleteFormDefinition(item.code)
    } else {
      await store.deleteDynamicField(item.id)
    }
    deleteDialog.value = false
    loadData()
  } catch (e) {
    console.error("Failed to delete:", e)
  }
}
</script>

<template>
  <VContainer fluid>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">
          Clinic Metadata Hub
        </h1>
        <p class="text-medium-emphasis">
          Configure clinical forms and custom data fields
        </p>
      </div>
      <VSpacer />
      <VBtn 
        v-if="activeTab === 'forms'"
        color="primary" 
        prepend-icon="tabler-plus"
        @click="openFormDialog"
      >
        Create New Form
      </VBtn>
      <VBtn 
        v-else
        color="primary" 
        prepend-icon="tabler-plus"
        @click="openFieldDialog"
      >
        Add {{ activeEntity }} Field
      </VBtn>
    </div>

    <VTabs
      v-model="activeTab"
      bg-color="transparent"
      color="primary"
      class="mb-4"
      @update:model-value="loadData"
    >
      <VTab
        value="forms"
        prepend-icon="tabler-file-text"
      >
        Clinical Forms
      </VTab>
      <VTab
        value="fields"
        prepend-icon="tabler-settings-automation"
      >
        Entity Metadata
      </VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <!-- FORMS TAB -->
      <VWindowItem value="forms">
        <VRow v-if="loading">
          <VCol
            v-for="i in 3"
            :key="i"
            cols="12"
            md="4"
          >
            <VSkeletonLoader type="card" />
          </VCol>
        </VRow>
        <VRow v-else-if="forms.length">
          <VCol
            v-for="form in forms"
            :key="form.id"
            cols="12"
            md="4"
          >
            <VCard
              variant="outlined"
              class="h-100 premium-card"
            >
              <VCardItem>
                <template #prepend>
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    class="mr-3"
                  >
                    <VIcon icon="tabler-forms" />
                  </VAvatar>
                </template>
                <VCardTitle>{{ form.name }}</VCardTitle>
                <VCardSubtitle>{{ form.code }}</VCardSubtitle>
              </VCardItem>
              
              <VCardText>
                <p class="text-body-2 mb-4">
                  {{ form.description || 'No description provided.' }}
                </p>
                <div class="d-flex align-center gap-2">
                  <VChip
                    size="small"
                    variant="tonal"
                    color="info"
                  >
                    {{ form.fields?.length || 0 }} Fields
                  </VChip>
                  <VChip
                    size="small"
                    variant="tonal"
                    :color="form.is_active ? 'success' : 'error'"
                  >
                    {{ form.is_active ? 'Active' : 'Inactive' }}
                  </VChip>
                </div>
              </VCardText>

              <VDivider />
              
              <VCardActions class="pa-4">
                <VBtn
                  variant="tonal"
                  color="primary"
                  block
                  @click="openFormDialog(form)"
                >
                  Configure Form
                </VBtn>
                <VBtn
                  icon
                  color="error"
                  variant="text"
                  size="small"
                  @click="confirmDelete(form, 'form')"
                >
                  <VIcon
                    icon="tabler-trash"
                    size="18"
                  />
                </VBtn>
              </VCardActions>
            </VCard>
          </VCol>
        </VRow>
        <div
          v-else
          class="text-center py-12"
        >
          <VIcon
            icon="tabler-mood-empty"
            size="64"
            color="medium-emphasis"
            class="mb-4"
          />
          <h3 class="text-h6 text-medium-emphasis">
            No Clinical Forms Found
          </h3>
        </div>
      </VWindowItem>

      <!-- DYNAMIC FIELDS TAB -->
      <VWindowItem value="fields">
        <div class="d-flex gap-2 mb-6">
          <VBtn 
            v-for="type in entityTypes" 
            :key="type.value"
            :variant="activeEntity === type.value ? 'elevated' : 'tonal'"
            :color="activeEntity === type.value ? 'primary' : 'secondary'"
            :prepend-icon="type.icon"
            rounded="xl"
            @click="activeEntity = type.value; loadData()"
          >
            {{ type.title }}
          </VBtn>
        </div>

        <VCard
          variant="outlined"
          class="premium-card overflow-hidden"
        >
          <VDataTable
            :headers="[
              { title: 'Label', key: 'label' },
              { title: 'Machine Key', key: 'key' },
              { title: 'Type', key: 'field_type' },
              { title: 'Required', key: 'is_required' },
              { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
            ]"
            :items="fieldDefinitions"
            :loading="loading"
          >
            <template #item.field_type="{ item }">
              <VChip
                size="small"
                density="comfortable"
                variant="tonal"
              >
                {{ item.field_type }}
              </VChip>
            </template>
            <template #item.is_required="{ item }">
              <VIcon 
                :icon="item.is_required ? 'tabler-check' : 'tabler-x'" 
                :color="item.is_required ? 'success' : 'medium-emphasis'"
                size="18"
              />
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex justify-end gap-2">
                <VBtn
                  icon
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  @click="openFieldDialog(item)"
                >
                  <VIcon
                    icon="tabler-edit"
                    size="14"
                  />
                </VBtn>
                <VBtn
                  icon
                  size="x-small"
                  variant="tonal"
                  color="error"
                  @click="confirmDelete(item, 'field')"
                >
                  <VIcon
                    icon="tabler-trash"
                    size="14"
                  />
                </VBtn>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VWindowItem>
    </VWindow>

    <!-- FORM DIALOG -->
    <VDialog
      v-model="formDialog"
      max-width="600px"
      persistent
    >
      <VCard>
        <VCardTitle class="pa-4">
          {{ editingForm.id ? 'Edit Clinical Form' : 'Create Clinical Form' }}
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="editingForm.name"
                label="Form Name"
                variant="outlined"
                placeholder="e.g. Vitals Form"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editingForm.code"
                label="Form Code"
                variant="outlined"
                placeholder="e.g. VITALS_FORM"
                :disabled="!!editingForm.id"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSwitch
                v-model="editingForm.is_active"
                label="Is Active"
                color="success"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="editingForm.description"
                label="Description"
                variant="outlined"
                rows="2"
              />
            </VCol>
          </VRow>
          
          <div
            v-if="editingForm.id"
            class="mt-4"
          >
            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-1 font-weight-bold">Form Fields ({{ editingForm.fields.length }})</span>
              <VSpacer />
              <VBtn
                size="small"
                variant="text"
                color="primary"
                prepend-icon="tabler-external-link"
                to="/veterinary/vitals"
                target="_blank"
              >
                Manage Fields in UI
              </VBtn>
            </div>
            <p class="text-caption text-medium-emphasis mb-4">
              Fields can be visually managed directly within the clinical forms for a better live-preview experience.
            </p>
          </div>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            @click="formDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            @click="saveForm"
          >
            Save Form
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- FIELD DIALOG -->
    <VDialog
      v-model="fieldDialog"
      max-width="500px"
    >
      <VCard>
        <VCardTitle class="pa-4">
          {{ editingField.id ? 'Edit Field' : 'Add New Field' }} ({{ activeEntity }})
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="editingField.label"
                label="Field Label"
                variant="outlined"
                placeholder="e.g. Breed, Weight"
              />
            </VCol>
            <VCol cols="12">
              <VTextField
                v-model="editingField.key"
                label="Machine Key"
                variant="outlined"
                placeholder="e.g. pet_breed"
                :disabled="!!editingField.id"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="editingField.field_type"
                :items="fieldTypes"
                label="Field Type"
                variant="outlined"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="editingField.is_required"
                label="Required"
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
            @click="fieldDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            @click="saveField"
          >
            Save Field
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- DELETE DIALOG -->
    <VDialog
      v-model="deleteDialog"
      max-width="400px"
    >
      <VCard color="surface">
        <VCardTitle class="text-h6 pa-4">
          Confirm Deletion
        </VCardTitle>
        <VCardText class="pa-4">
          Are you sure you want to delete this {{ itemToDelete?.type }}? This action cannot be undone and may result in data loss.
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            @click="deleteItem"
          >
            Delete Forever
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped>
.premium-card {
  border-radius: 16px !important;
  transition: all 0.2s ease-in-out;
  border-color: rgba(var(--v-border-color), 0.12) !important;
}

.premium-card:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 4px 18px -4px rgba(var(--v-theme-primary), 0.1) !important;
}

:deep(.v-data-table) {
  background: transparent !important;
}

:deep(.v-data-table__th) {
  font-weight: bold !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em;
}
</style>
