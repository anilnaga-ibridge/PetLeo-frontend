<script setup>
import { ref, onMounted, computed } from 'vue'
import { api } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'
import { VDataTable } from 'vuetify/components'

definePage({
  meta: {
    layout: 'blank',
    permission: 'manage_employees'
  },
})

// State
const roles = ref([])
const capabilities = ref([])
const planCapabilities = ref([])
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const editingId = ref(null)

// Form
const form = ref({
  name: '',
  description: '',
  capabilities: []
})

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
      api.get('http://127.0.0.1:8002/api/provider/permissions/')
    ])
    
    roles.value = rolesRes.data
    capabilities.value = capsRes.data
    
    // Extract flat list of capability keys from the permission tree
    const flatCaps = []
    myPermsRes.data.permissions.forEach(svc => {
      if (svc.service_key) flatCaps.push(svc.service_key)
      svc.categories.forEach(cat => {
        if (cat.linked_capability) flatCaps.push(cat.linked_capability)
      })
    })
    planCapabilities.value = [...new Set(flatCaps)]

  } catch (err) {
    console.error('Failed to fetch data', err)
    errorMessage.value = 'Failed to load roles and capabilities.'
  } finally {
    loading.value = false
  }
}

// Filtered Capabilities (only those in plan)
const assignableCapabilities = computed(() => {
  return capabilities.value.filter(cap => planCapabilities.value.includes(cap.key))
})

// Grouped Capabilities for UI
const groupedCapabilities = computed(() => {
  const groups = {}
  capabilities.value.forEach(cap => {
    if (!groups[cap.group]) groups[cap.group] = []
    groups[cap.group].push({
      ...cap,
      isLocked: !planCapabilities.value.includes(cap.key)
    })
  })
  return groups
})

// Open Dialog
const openDialog = (role = null) => {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (role) {
    editingId.value = role.id || role.raw?.id
    form.value = {
      name: role.name || role.raw?.name,
      description: role.description || role.raw?.description,
      capabilities: role.capabilities || role.raw?.capabilities || []
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      description: '',
      capabilities: []
    }
  }
  dialog.value = true
}

// Handle Submit
const handleSubmit = async () => {
  if (!form.value.name) {
    errorMessage.value = 'Role name is required.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (editingId.value) {
      await api.patch(`http://127.0.0.1:8002/api/provider/roles/${editingId.value}/`, form.value)
      successMessage.value = 'Role updated successfully!'
    } else {
      await api.post('http://127.0.0.1:8002/api/provider/roles/', form.value)
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
const deleteRole = async (id) => {
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
            <VBtn prepend-icon="tabler-plus" @click="openDialog()">
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
          <VChip size="small" color="primary" variant="tonal">
            {{ (item.capabilities || item.raw?.capabilities || []).length }}
          </VChip>
        </template>

        <template #item.employees_count="{ item }">
          <VChip size="small" color="info" variant="tonal">
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

    <!-- Role Drawer -->
    <VNavigationDrawer
      v-model="dialog"
      location="end"
      width="500"
      temporary
      elevation="0"
      scrim="rgba(0,0,0,0.3)"
    >
      <div class="d-flex flex-column h-100 bg-grey-lighten-5">
        <div class="drawer-header px-8 pt-10 pb-6 bg-white elevation-1">
          <VBtn 
            icon="tabler-x" 
            variant="text" 
            color="medium-emphasis" 
            class="position-absolute"
            style="top: 10px; right: 10px;"
            @click="dialog = false" 
          />
          
          <div class="d-flex align-center gap-4">
            <div class="header-icon-soft elevation-3 bg-primary-lighten-5 pa-2 rounded-lg">
              <VIcon icon="tabler-user-shield" size="28" color="primary" />
            </div>
            <div>
              <h2 class="text-h5 font-weight-bold text-high-emphasis">
                {{ editingId ? 'Edit Role' : 'New Role' }}
              </h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                Define what this role can do
              </p>
            </div>
          </div>
        </div>

        <div class="flex-grow-1 px-8 py-8 overflow-y-auto">
          <VForm @submit.prevent="handleSubmit">
            <div class="d-flex flex-column gap-6">
              
              <VTextField
                v-model="form.name"
                label="Role Name"
                placeholder="e.g. Senior Nurse"
                variant="outlined"
                required
              />

              <VTextarea
                v-model="form.description"
                label="Description"
                placeholder="Briefly describe this role's responsibilities"
                variant="outlined"
                rows="2"
              />

              <div>
                <VLabel class="mb-2 font-weight-bold">Permissions</VLabel>
                <p class="text-caption text-medium-emphasis mb-4">
                  Select the capabilities assigned to this role.
                </p>
                
                <div v-for="(caps, group) in groupedCapabilities" :key="group" class="mb-6">
                  <div class="text-subtitle-2 font-weight-bold text-primary mb-2 border-b pb-1">
                    {{ group }}
                  </div>
                  <div class="d-flex flex-column gap-1">
                    <div
                      v-for="cap in caps"
                      :key="cap.key"
                      class="d-flex align-center gap-2"
                    >
                      <VCheckbox
                        v-model="form.capabilities"
                        :value="cap.key"
                        :label="cap.label"
                        :hint="cap.description"
                        :disabled="cap.isLocked"
                        persistent-hint
                        density="compact"
                        class="mb-1 flex-grow-1"
                      />
                      <VTooltip v-if="cap.isLocked" location="top">
                        <template #activator="{ props }">
                          <VIcon
                            v-bind="props"
                            icon="tabler-lock"
                            size="18"
                            color="warning"
                            class="mb-4"
                          />
                        </template>
                        <span>Available in Professional Plan</span>
                      </VTooltip>
                    </div>
                  </div>
                </div>
                
                <div v-if="assignableCapabilities.length === 0" class="text-center py-4 border rounded-lg bg-white">
                  <VIcon icon="tabler-alert-circle" color="warning" class="mb-2" />
                  <p class="text-body-2 mb-0">No capabilities available in your current plan.</p>
                </div>
              </div>

            </div>

            <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-6">
              {{ errorMessage }}
            </VAlert>
            <VAlert v-if="successMessage" type="success" variant="tonal" class="mt-6">
              {{ successMessage }}
            </VAlert>
          </VForm>
        </div>

        <div class="pa-6 bg-white border-t">
          <div class="d-flex gap-4">
            <VBtn variant="text" class="flex-grow-1" @click="dialog = false">Cancel</VBtn>
            <VBtn 
              color="primary" 
              class="flex-grow-1" 
              :loading="saving" 
              @click="handleSubmit"
            >
              {{ editingId ? 'Update Role' : 'Create Role' }}
            </VBtn>
          </div>
        </div>
      </div>
    </VNavigationDrawer>
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
