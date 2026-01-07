<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue', 'refresh'])

const dialog = ref(false)
const cycles = ref([])
const loading = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = ref({
  code: '',
  display_name: '',
  duration_days: 30,
  is_active: true,
})

const headers = [
  { title: 'Display Name', key: 'display_name' },
  { title: 'Code', key: 'code' },
  { title: 'Duration (Days)', key: 'duration_days' },
  { title: 'Status', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const fetchCycles = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/billing-cycles/')
    cycles.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch billing cycles:', err)
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  isEdit.value = false
  form.value = {
    code: '',
    display_name: '',
    duration_days: 30,
    is_active: true,
  }
  dialog.value = true
}

const openEdit = (item) => {
  isEdit.value = true
  editId.value = item.id
  form.value = { ...item }
  dialog.value = true
}

const submit = async () => {
  try {
    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/billing-cycles/${editId.value}/`, form.value)
    } else {
      await superAdminApi.post('/api/superadmin/billing-cycles/', form.value)
    }
    dialog.value = false
    fetchCycles()
    emit('refresh')
  } catch (err) {
    console.error('Failed to save billing cycle:', err)
  }
}

const deleteCycle = async (id) => {
  if (!confirm('Are you sure you want to delete this billing cycle?')) return
  try {
    await superAdminApi.delete(`/api/superadmin/billing-cycles/${id}/`)
    fetchCycles()
    emit('refresh')
  } catch (err) {
    console.error('Failed to delete billing cycle:', err)
  }
}

onMounted(() => {
  fetchCycles()
})
</script>

<template>
  <VCard class="mb-6">
    <VCardTitle class="d-flex justify-space-between align-center pa-4">
      <span>Billing Cycles</span>
      <VBtn color="primary" size="small" prepend-icon="tabler-plus" @click="openAdd">
        Add Cycle
      </VBtn>
    </VCardTitle>
    <VDataTable
      :headers="headers"
      :items="cycles"
      :loading="loading"
      class="text-no-wrap"
    >
      <template #item.is_active="{ item }">
        <VChip :color="item.is_active ? 'success' : 'error'" size="small">
          {{ item.is_active ? 'Active' : 'Inactive' }}
        </VChip>
      </template>
      <template #item.actions="{ item }">
        <VBtn icon="tabler-edit" variant="text" size="small" color="primary" @click="openEdit(item)" />
        <VBtn icon="tabler-trash" variant="text" size="small" color="error" @click="deleteCycle(item.id)" />
      </template>
    </VDataTable>

    <VDialog v-model="dialog" max-width="500">
      <VCard>
        <VCardTitle>{{ isEdit ? 'Edit Billing Cycle' : 'Add Billing Cycle' }}</VCardTitle>
        <VCardText>
          <VForm @submit.prevent="submit">
            <AppTextField
              v-model="form.display_name"
              label="Display Name"
              placeholder="e.g. Monthly"
              class="mb-4"
              required
            />
            <AppTextField
              v-model="form.code"
              label="Code"
              placeholder="e.g. MONTHLY"
              class="mb-4"
              required
            />
            <AppTextField
              v-model.number="form.duration_days"
              label="Duration (Days)"
              type="number"
              class="mb-4"
              required
            />
            <VSwitch
              v-model="form.is_active"
              label="Active"
              color="success"
            />
            <div class="d-flex justify-end gap-2 mt-4">
              <VBtn variant="text" @click="dialog = false">Cancel</VBtn>
              <VBtn color="primary" type="submit">Save</VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>
  </VCard>
</template>
