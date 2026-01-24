<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { veterinaryApi } from '@/plugins/axios'

// Components
import AppTextField from '@core/components/app-form-elements/AppTextField.vue'
import AppDrawerHeaderSection from '@core/components/AppDrawerHeaderSection.vue'

// DATA
const clinics = ref([])
const loading = ref(false)
const searchQuery = ref('')
const drawerOpen = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const editingId = ref(null)

const form = ref({
  name: '',
  address: '',
  phone: '',
})

const headers = [
  { title: 'Clinic Name', key: 'name' },
  { title: 'Address', key: 'address' },
  { title: 'Phone', key: 'phone' },
  { title: 'Status', key: 'is_primary' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

// API ACTIONS
const fetchClinics = async () => {
  loading.value = true
  try {
    const res = await veterinaryApi.get('/veterinary/clinics/')

    clinics.value = res.data
  } catch (err) {
    console.error('Failed to fetch clinics:', err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.name) return

  saving.value = true
  errorMessage.value = ''

  try {
    if (isEdit.value && editingId.value) {
      await veterinaryApi.patch(`/veterinary/clinics/${editingId.value}/`, form.value)
    } else {
      await veterinaryApi.post('/veterinary/clinics/', form.value)
    }
    
    drawerOpen.value = false
    fetchClinics()
  } catch (error) {
    console.error('Save failed:', error)
    if (error.response && error.response.data) {
      errorMessage.value = typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data)
    } else {
      errorMessage.value = 'An unexpected error occurred.'
    }
  } finally {
    saving.value = false
  }
}

const deleteClinic = async item => {
  if (!confirm(`Are you sure you want to delete ${item.name}?`)) return
  try {
    await veterinaryApi.delete(`/veterinary/clinics/${item.id}/`)
    fetchClinics()
  } catch (err) {
    console.error('Delete failed:', err)
  }
}

// DRAWER ACTIONS
const openAddDrawer = () => {
  isEdit.value = false
  editingId.value = null
  errorMessage.value = ''
  form.value = { name: '', address: '', phone: '' }
  drawerOpen.value = true
}

const openEditDrawer = item => {
  isEdit.value = true
  editingId.value = item.id
  errorMessage.value = ''
  form.value = {
    name: item.name,
    address: item.address,
    phone: item.phone,
  }
  drawerOpen.value = true
}

// WATCHERS
watch(drawerOpen, val => {
  if (!val) {
    errorMessage.value = ''
    saving.value = false
  }
})

onMounted(() => {
  fetchClinics()
})
</script>

<template>
  <section>
    <!-- HEADER -->
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">
          My Clinics
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            sm="4"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search clinics..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>

          <VCol
            cols="12"
            sm="8"
            class="d-flex justify-end"
          >
            <VBtn
              color="primary"
              prepend-icon="tabler-plus"
              class="px-6"
              @click="openAddDrawer"
            >
              Add Clinic
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTable
        :headers="headers"
        :items="clinics"
        :loading="loading"
        :search="searchQuery"
        hover
        density="comfortable"
        class="text-no-wrap"
      >
        <!-- Name -->
        <template #item.name="{ item }">
          <strong class="text-primary">{{ item.name }}</strong>
        </template>

        <!-- Status -->
        <template #item.is_primary="{ item }">
          <VChip
            v-if="item.is_primary"
            size="small"
            color="success"
          >
            Active
          </VChip>
          <VChip
            v-else
            size="small"
            color="secondary"
            variant="tonal"
          >
            Standard
          </VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="openEditDrawer(item)">
            <VIcon icon="tabler-edit" />
          </IconBtn>

          <IconBtn 
            v-if="!item.is_primary"
            color="error" 
            @click="deleteClinic(item)"
          >
            <VIcon icon="tabler-trash" />
          </IconBtn>
        </template>
        
        <!-- Empty State -->
        <template #no-data>
          <div class="text-center py-4">
            No clinics found.
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- DRAWER -->
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      width="450"
      temporary
      class="pa-4"
      style="border-left: 2px solid #E2E8F0;"
    >
      <!-- Drawer Header -->
      <div
        class="pa-4 mb-4 rounded-lg"
        style="background:linear-gradient(135deg,#7367F0,#9E95F5);color:white;"
      >
        <h3 class="text-h6 font-weight-bold mb-1">
          {{ isEdit ? "Update Clinic" : "Create Clinic" }}
        </h3>
        <p class="text-caption opacity-90">
          Manage your clinic details.
        </p>
      </div>

      <!-- Form -->
      <VForm @submit.prevent="handleSubmit">
        <VRow>
          <VCol cols="12">
            <AppTextField
              v-model="form.name"
              label="Clinic Name"
              placeholder="e.g. Happy Paws Vet Clinic"
              required
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.address"
              label="Address"
              placeholder="Full address"
            />
          </VCol>

          <VCol cols="12">
            <AppTextField
              v-model="form.phone"
              label="Phone Number"
              placeholder="Contact number"
            />
          </VCol>
          
          <VCol
            v-if="errorMessage"
            cols="12"
          >
            <VAlert
              type="error"
              variant="tonal"
            >
              {{ errorMessage }}
            </VAlert>
          </VCol>

          <VCol
            cols="12"
            class="d-flex gap-3 pt-4"
          >
            <VBtn
              type="submit"
              color="primary"
              block
              :loading="saving"
            >
              {{ isEdit ? 'Update' : 'Create' }}
            </VBtn>
            <VBtn
              variant="tonal"
              color="secondary"
              block
              @click="drawerOpen = false"
            >
              Cancel
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VNavigationDrawer>
  </section>
</template>
