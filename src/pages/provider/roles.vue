<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'
import RoleManagementWizard from '@/components/provider/RoleManagementWizard.vue' // IMPORT WIZARD
import { VDataTable } from 'vuetify/components'

definePage({
  meta: {
    layout: 'blank',
    permission: 'manage_employees',
  },
})

// State
const roles = ref([])
const capabilities = ref([])
const planCapabilities = ref([]) // Flat list of keys user has
const permissionTree = ref([]) // Full tree structure for Wizard
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const currentRole = ref(null) // Role being edited

// Headers
const headers = [
  { title: 'Role Name', key: 'name' },
  { title: 'Description', key: 'description' },
  { title: 'Capabilities', key: 'capabilities_count' },
  { title: 'Employees', key: 'employees_count' },
  { title: 'Created', key: 'created_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Fetch Data
const fetchData = async () => {
  loading.value = true
  try {
    const [rolesRes, capsRes, myPermsRes] = await Promise.all([
      api.get('http://127.0.0.1:8002/api/provider/roles/'),
      api.get('http://127.0.0.1:8002/api/provider/capabilities/'),
      api.get('http://127.0.0.1:8002/api/provider/permissions/'), // Returns tree
    ])
    
    roles.value = rolesRes.data
    capabilities.value = capsRes.data
    permissionTree.value = myPermsRes.data.permissions || []

  } catch (err) {
    console.error('Failed to fetch data', err)
    errorMessage.value = 'Failed to load roles and capabilities.'
  } finally {
    loading.value = false
  }
}

// Open Dialog
const openDialog = (role = null) => {
  errorMessage.value = ''
  successMessage.value = ''
  currentRole.value = role ? (role.raw || role) : null
  dialog.value = true
}

// Handle Wizard Save
const handleWizardSave = async payload => {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (currentRole.value) {
      await api.patch(`http://127.0.0.1:8002/api/provider/roles/${currentRole.value.id}/`, payload)
      successMessage.value = 'Role updated successfully!'
    } else {
      await api.post('http://127.0.0.1:8002/api/provider/roles/', payload)
      successMessage.value = 'Role created successfully!'
    }
    
    fetchData()
    setTimeout(() => {
      dialog.value = false
    }, 1500)

  } catch (err) {
    console.error('Save Error:', err)
    errorMessage.value = 'Failed to save role.'
  } finally {
    saving.value = false
  }
}

// Delete Role
const deleteRole = async id => {
  if (!confirm('Are you sure you want to delete this role?')) return
  try {
    await api.delete(`http://127.0.0.1:8002/api/provider/roles/${id}/`)
    fetchData()
  } catch (err) {
    console.error('Delete Error:', err)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <ProviderLayout>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <div class="d-flex justify-space-between align-center flex-wrap gap-4">
          <VCardTitle>Provider Roles</VCardTitle>
          <div class="d-flex gap-4 align-center">
            <VTextField
              v-model="search"
              density="compact"
              label="Search Roles"
              prepend-inner-icon="tabler-search"
              hide-details
              style="max-width: 200px;"
            />
            <VBtn
              prepend-icon="tabler-plus"
              @click="openDialog"
            >
              Create Role
            </VBtn>
          </div>
        </div>
      </VCardItem>

      <VDataTable
        :headers="headers"
        :items="roles"
        :loading="loading"
        :search="search"
        class="text-no-wrap"
      >
        <template #item.capabilities_count="{ item }">
          <VChip
            size="small"
            color="primary"
            variant="tonal"
          >
            {{ (item.capabilities || item.raw?.capabilities || []).length }}
          </VChip>
        </template>

        <template #item.employees_count="{ item }">
          <VChip
            size="small"
            color="info"
            variant="tonal"
          >
            {{ (item.employees || item.raw?.employees || []).length }}
          </VChip>
        </template>

        <template #item.created_at="{ item }">
          {{ new Date(item.created_at || item.raw?.created_at).toLocaleDateString() }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon="tabler-edit"
              variant="text"
              color="primary"
              size="small"
              @click="openDialog(item.raw || item)"
            />
            <VBtn
              v-if="!(item.is_system_role || item.raw?.is_system_role)"
              icon="tabler-trash"
              variant="text"
              color="error"
              size="small"
              @click="deleteRole(item.id || item.raw?.id)"
            />
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Role Wizard -->
    <RoleManagementWizard
      v-model="dialog"
      :role="currentRole"
      :available-permissions="permissionTree"
      @save="handleWizardSave"
    />
  </ProviderLayout>
</template>

<style scoped>
.header-icon-soft {
  background: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
