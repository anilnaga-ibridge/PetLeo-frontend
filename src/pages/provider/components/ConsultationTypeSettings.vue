<script setup>
import { ref, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const types = ref([])
const loading = ref(false)
const dialog = ref(false)
const saving = ref(false)
const deleting = ref(false)

const defaultForm = {
  id: null,
  name: '',
  description: '',
  duration_minutes: 30,
  consultation_fee: 500,
  is_active: true
}

const form = ref({ ...defaultForm })

const fetchTypes = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/consultation-types/')
    types.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch consultation types:', err)
  } finally {
    loading.value = false
  }
}

const openDialog = (item = null) => {
  if (item) {
    form.value = { ...item }
  } else {
    form.value = { ...defaultForm }
  }
  dialog.value = true
}

const save = async () => {
  saving.value = true
  try {
    if (form.value.id) {
      await providerApi.put(`/api/provider/consultation-types/${form.value.id}/`, form.value)
    } else {
      await providerApi.post('/api/provider/consultation-types/', form.value)
    }
    await fetchTypes()
    dialog.value = false
  } catch (err) {
    console.error('Failed to save consultation type:', err)
  } finally {
    saving.value = false
  }
}

const deleteType = async (id) => {
  if (!confirm('Are you sure you want to delete this consultation type?')) return
  try {
    await providerApi.delete(`/api/provider/consultation-types/${id}/`)
    await fetchTypes()
  } catch (err) {
    console.error('Failed to delete consultation type:', err)
  }
}

onMounted(fetchTypes)
</script>

<template>
  <VCard flat border class="consultation-settings pa-8 rounded-[32px]">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <div class="d-flex align-center gap-3 mb-2">
           <div class="icon-box-soft">
             <VIcon icon="tabler-stethoscope" color="primary" size="24" />
           </div>
           <h2 class="text-h4 font-weight-black text-slate-800 tracking-tighter mb-0">Consultation Types</h2>
        </div>
        <p class="text-body-1 text-slate-500 ml-12">Define different types of visits and their respective fees.</p>
      </div>
      <VBtn
        color="primary"
        height="54"
        class="rounded-2xl px-8 font-weight-black shadow-primary"
        @click="openDialog()"
      >
        <VIcon icon="tabler-plus" class="mr-2" />
        Add New Type
      </VBtn>
    </div>

    <VRow v-if="loading">
      <VCol v-for="i in 3" :key="i" cols="12" md="4">
        <VSkeletonLoader type="card" />
      </VCol>
    </VRow>

    <VRow v-else-if="types.length > 0">
      <VCol v-for="type in types" :key="type.id" cols="12" md="4">
        <VCard border flat class="rounded-2xl h-100 d-flex flex-column">
          <VCardItem>
            <template #prepend>
              <VAvatar color="primary" variant="tonal" class="mr-3">
                <VIcon icon="tabler-medical-cross" />
              </VAvatar>
            </template>
            <VCardTitle class="font-weight-black">{{ type.name }}</VCardTitle>
            <VCardSubtitle>
              <VChip size="x-small" :color="type.is_active ? 'success' : 'error'" class="font-weight-bold">
                {{ type.is_active ? 'Active' : 'Inactive' }}
              </VChip>
            </VCardSubtitle>
          </VCardItem>

          <VCardText class="flex-grow-1">
            <p class="text-body-2 text-slate-500 mb-4 line-clamp-2">{{ type.description || 'No description provided.' }}</p>
            
            <div class="d-flex gap-4">
              <div class="d-flex flex-column">
                <span class="text-tiny uppercase font-weight-black text-slate-400">Duration</span>
                <span class="font-weight-bold">{{ type.duration_minutes }} mins</span>
              </div>
              <div class="d-flex flex-column">
                <span class="text-tiny uppercase font-weight-black text-slate-400">Base Fee</span>
                <span class="font-weight-bold text-primary">₹{{ type.consultation_fee }}</span>
              </div>
            </div>
          </VCardText>

          <VDivider />

          <VCardActions class="pa-4">
            <VBtn variant="text" color="primary" class="font-weight-bold" @click="openDialog(type)">Edit</VBtn>
            <VSpacer />
            <VBtn variant="text" color="error" class="font-weight-bold" @click="deleteType(type.id)">Delete</VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <div v-else class="text-center py-12">
      <VIcon icon="tabler-mood-empty" size="64" color="slate-200" class="mb-4" />
      <h3 class="text-h5 font-weight-bold text-slate-400">No Consultation Types Yet</h3>
      <p class="text-slate-400">Start by adding your first consultation type to enable bookings.</p>
    </div>

    <!-- Add/Edit Dialog -->
    <VDialog v-model="dialog" max-width="600" persistent>
      <VCard class="rounded-2xl">
        <VCardTitle class="pa-6 pb-0">
          <h2 class="text-h5 font-weight-black">{{ form.id ? 'Edit' : 'Add' }} Consultation Type</h2>
        </VCardTitle>

        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12">
              <label class="label-tiny uppercase mb-2 d-block">Type Name</label>
              <VTextField
                v-model="form.name"
                variant="outlined"
                class="luxury-input"
                placeholder="e.g. Specialist Consultation"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="label-tiny uppercase mb-2 d-block">Duration (minutes)</label>
              <VTextField
                v-model.number="form.duration_minutes"
                type="number"
                variant="outlined"
                class="luxury-input"
              />
            </VCol>

            <VCol cols="12" md="6">
              <label class="label-tiny uppercase mb-2 d-block">Base Fee (₹)</label>
              <VTextField
                v-model.number="form.consultation_fee"
                type="number"
                variant="outlined"
                class="luxury-input"
              />
            </VCol>

            <VCol cols="12">
              <label class="label-tiny uppercase mb-2 d-block">Description</label>
              <VTextarea
                v-model="form.description"
                variant="outlined"
                class="luxury-input"
                rows="3"
                placeholder="What does this consultation involve?"
              />
            </VCol>

            <VCol cols="12">
              <VSwitch v-model="form.is_active" label="Available for booking" color="success" hide-details />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="pa-6 pt-0">
          <VSpacer />
          <VBtn variant="tonal" color="secondary" @click="dialog = false">Cancel</VBtn>
          <VBtn color="primary" class="px-8 font-weight-bold" :loading="saving" @click="save">Save Type</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<style scoped>
.consultation-settings {
  background: white;
  border-color: #f1f5f9 !important;
}

.icon-box-soft {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.label-tiny {
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: #94a3b8;
}

.text-tiny {
  font-size: 10px;
}

.shadow-primary {
  box-shadow: 0 10px 25px rgba(var(--v-theme-primary), 0.25) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tracking-tighter {
  letter-spacing: -1px !important;
}
</style>
