<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'
import { VDataTable } from 'vuetify/components'
import EmployeePermissionTree from '@/components/provider/EmployeePermissionTree.vue'

definePage({
  meta: {
    layout: 'blank',
    permission: 'manage_employees'
  },
})

// State
const employees = ref([])
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const registering = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const editingId = ref(null)

// Form
const form = ref({
  full_name: '',
  email: '',
  phone_number: ''
})

// Headers
const headers = [
  { title: 'Employee', key: 'full_name' },
  { title: 'Contact', key: 'contact' },
  { title: 'Status', key: 'status' },
  { title: 'Joined', key: 'joined_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Fetch Employees
const fetchEmployees = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/employees/')
    employees.value = res.data
  } catch (err) {
    console.error('Failed to fetch employees', err)
    errorMessage.value = 'Failed to load employees.'
  } finally {
    loading.value = false
  }
}

// Open Dialog (Create or Edit)
const openDialog = (employee = null) => {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (employee) {
    editingId.value = employee.id || employee.raw?.id
    form.value = {
      full_name: employee.full_name || employee.raw?.full_name,
      email: employee.email || employee.raw?.email,
      phone_number: employee.phone_number || employee.raw?.phone_number
    }
  } else {
    editingId.value = null
    form.value = {
      full_name: '',
      email: '',
      phone_number: ''
    }
  }
  dialog.value = true
}

// Handle Form Submit
const handleSubmit = () => {
  if (editingId.value) {
    updateEmployee()
  } else {
    registerEmployee()
  }
}

// Update Employee
const updateEmployee = async () => {
  if (!form.value.phone_number || !form.value.full_name) {
    errorMessage.value = 'Name and Phone are required.'
    return
  }

  registering.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      full_name: form.value.full_name,
      email: form.value.email,
      phone_number: form.value.phone_number,
    }

    await api.patch(`http://127.0.0.1:8002/api/provider/employees/${editingId.value}/`, payload)
    
    successMessage.value = 'Employee updated successfully!'
    setTimeout(() => {
      dialog.value = false
      fetchEmployees()
    }, 1000)

  } catch (err) {
    console.error('Update Error:', err)
    errorMessage.value = 'Update failed.'
  } finally {
    registering.value = false
  }
}

// Register Employee
const registerEmployee = async () => {
  if (!form.value.phone_number || !form.value.full_name) {
    errorMessage.value = 'Name and Phone are required.'
    return
  }

  registering.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const AUTH_URL = 'http://127.0.0.1:8000/auth/api/auth/register/'
    
    const payload = {
      full_name: form.value.full_name,
      email: form.value.email,
      phone_number: form.value.phone_number,
      role: 'employee'
    }

    const res = await api.post(AUTH_URL, payload)
    
    if (res.data?.session_id) {
      successMessage.value = 'Invitation sent successfully!'
      // localStorage.setItem('session_id', res.data.session_id) // Not needed if we aren't redirecting immediately
      fetchEmployees() // Refresh the list to show the new employee
      setTimeout(() => {
        dialog.value = false
        // Optional: Reset form here if needed, but dialog close usually handles it via openDialog logic
      }, 1500)
    } else {
      errorMessage.value = 'Registration failed.'
    }
  } catch (err) {
    console.error('Registration Error:', err)
    errorMessage.value = 'Registration failed.'
  } finally {
    registering.value = false
  }
}

// Manage Services State
const servicesDialog = ref(false)
const loadingServices = ref(false)
const savingServices = ref(false)
const selectedEmployeeForServices = ref(null)
const availableServices = ref([]) // Tree structure
const assignedServices = ref([])  // Tree structure
const permissionsPayload = ref([]) // Flat list to save

// Open Manage Services Dialog
const openManageServices = async (employee) => {
  selectedEmployeeForServices.value = employee
  servicesDialog.value = true
  loadingServices.value = true
  permissionsPayload.value = [] // Reset
  
  try {
    // 1. Fetch Available Services (Tree)
    const availRes = await api.get('http://127.0.0.1:8002/api/provider/employee-assignments/available/')
    availableServices.value = availRes.data
    
    // 2. Fetch Assigned Services (Tree)
    const assignedRes = await api.get(`http://127.0.0.1:8002/api/provider/employee-assignments/${employee.id}/assigned/`)
    assignedServices.value = assignedRes.data
    
  } catch (err) {
    console.error('Failed to fetch services', err)
    errorMessage.value = 'Failed to load services.'
  } finally {
    loadingServices.value = false
  }
}

// Save Services
const saveServices = async () => {
  if (!selectedEmployeeForServices.value) return
  
  savingServices.value = true
  try {
    await api.post(`http://127.0.0.1:8002/api/provider/employee-assignments/${selectedEmployeeForServices.value.id}/assign/`, {
      permissions: permissionsPayload.value
    })
    
    successMessage.value = 'Services assigned successfully!'
    servicesDialog.value = false
    
  } catch (err) {
    console.error('Failed to save services', err)
    errorMessage.value = 'Failed to save assignments.'
  } finally {
    savingServices.value = false
  }
}

// Actions
const updateStatus = async (id, action) => {
  try {
    await api.post(`http://127.0.0.1:8002/api/provider/employees/${id}/${action}/`)
    fetchEmployees()
  } catch (err) {
    console.error(`Failed to ${action} employee`, err)
  }
}

const deleteEmployee = async (id) => {
  if (!confirm('Are you sure you want to remove this employee?')) return
  try {
    await api.delete(`http://127.0.0.1:8002/api/provider/employees/${id}/`)
    fetchEmployees()
  } catch (err) {
    console.error('Failed to delete employee', err)
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'invited': return 'warning'
    case 'suspended': return 'error'
    default: return 'grey'
  }
}

onMounted(() => {
  fetchEmployees()
})
</script>

<template>
  <ProviderLayout>
    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <div class="d-flex justify-space-between align-center flex-wrap gap-4">
          <VCardTitle>Employees</VCardTitle>
          <div class="d-flex gap-4 align-center">
            <VTextField
              v-model="search"
              density="compact"
              label="Search"
              prepend-inner-icon="tabler-search"
              hide-details
              style="max-width: 200px;"
            />
            <VBtn prepend-icon="tabler-user-plus" @click="openDialog()">
              Register Employee
            </VBtn>
          </div>
        </div>
      </VCardItem>

      <VDataTable
        :headers="headers"
        :items="employees"
        :loading="loading"
        :search="search"
        class="text-no-wrap"
      >
        <!-- Employee Column -->
        <template #item.full_name="{ item }">
          <div class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="32" class="me-2">
              {{ (item.full_name || item.raw?.full_name || 'E').charAt(0) }}
            </VAvatar>
            <div class="d-flex flex-column">
              <span class="font-weight-medium">{{ item.full_name || item.raw?.full_name }}</span>
              <span class="text-caption text-disabled">ID: {{ (item.auth_user_id || item.raw?.auth_user_id || '').substring(0,8) }}...</span>
            </div>
          </div>
        </template>

        <!-- Contact Column -->
        <template #item.contact="{ item }">
          <div class="d-flex flex-column">
            <div class="d-flex align-center mb-1">
              <VIcon icon="tabler-phone" size="14" class="me-1 text-disabled" />
              <span class="text-body-2">{{ item.phone_number || item.raw?.phone_number }}</span>
            </div>
            <div v-if="item.email || item.raw?.email" class="d-flex align-center">
              <VIcon icon="tabler-mail" size="14" class="me-1 text-disabled" />
              <span class="text-caption">{{ item.email || item.raw?.email }}</span>
            </div>
          </div>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip :color="getStatusColor(item.status || item.raw?.status)" size="small" label class="text-capitalize">
            {{ item.status || item.raw?.status }}
          </VChip>
        </template>

        <!-- Joined Column -->
        <template #item.joined_at="{ item }">
          {{ (item.joined_at || item.raw?.joined_at) ? new Date(item.joined_at || item.raw?.joined_at).toLocaleDateString() : '-' }}
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon="tabler-settings"
              variant="text"
              color="info"
              size="small"
              title="Manage Services"
              @click="openManageServices(item.raw || item)"
            />
            <VBtn
              icon="tabler-edit"
              variant="text"
              color="primary"
              size="small"
              title="Edit"
              @click="openDialog(item.raw || item)"
            />
            <VBtn
              v-if="(item.status || item.raw?.status) === 'active'"
              icon="tabler-ban"
              variant="text"
              color="warning"
              size="small"
              title="Suspend"
              @click="updateStatus(item.id || item.raw?.id, 'suspend')"
            />
            <VBtn
              v-if="(item.status || item.raw?.status) === 'suspended'"
              icon="tabler-check"
              variant="text"
              color="success"
              size="small"
              title="Activate"
              @click="updateStatus(item.id || item.raw?.id, 'activate')"
            />
            <VBtn
              icon="tabler-trash"
              variant="text"
              color="error"
              size="small"
              title="Delete"
              @click="deleteEmployee(item.id || item.raw?.id)"
            />
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Register/Edit Drawer -->
    <VNavigationDrawer
      v-model="dialog"
      location="end"
      width="450"
      temporary
      class="employee-drawer"
      elevation="0"
      scrim="rgba(0,0,0,0.3)"
    >
      <div class="d-flex flex-column h-100 bg-grey-lighten-5">
        <!-- Modern Soft Header -->
        <div class="drawer-header px-8 pt-10 pb-6 bg-white elevation-1 position-relative">
          <VBtn 
            icon="tabler-x" 
            variant="text" 
            color="medium-emphasis" 
            class="close-btn"
            @click="dialog = false" 
          />
          
          <div class="d-flex align-center gap-4">
            <div class="header-icon-soft elevation-3">
              <VIcon icon="tabler-user-plus" size="28" color="primary" />
            </div>
            <div>
              <h2 class="text-h5 font-weight-bold text-high-emphasis">
                {{ editingId ? 'Edit Profile' : 'New Employee' }}
              </h2>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ editingId ? 'Update details' : 'Add team member' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Form Content -->
        <div class="flex-grow-1 px-8 py-8 overflow-y-auto">
          <VForm @submit.prevent="handleSubmit">
            <div class="d-flex flex-column gap-6">
              
              <!-- Full Name -->
              <div class="animate-item" style="animation-delay: 0.1s">
                <div class="input-group">
                  <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">Full Name</VLabel>
                  <VTextField
                    v-model="form.full_name"
                    placeholder="e.g. John Doe"
                    variant="solo"
                    flat
                    bg-color="white"
                    class="soft-input elevation-2"
                    rounded="lg"
                    hide-details="auto"
                    required
                  >
                    <template #prepend-inner>
                      <VIcon icon="tabler-user" size="20" class="text-primary opacity-70" />
                    </template>
                  </VTextField>
                </div>
              </div>
              
              <!-- Phone -->
              <div class="animate-item" style="animation-delay: 0.2s">
                <div class="input-group">
                  <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">Phone Number</VLabel>
                  <VTextField
                    v-model="form.phone_number"
                    placeholder="e.g. +1 234 567 8900"
                    variant="solo"
                    flat
                    bg-color="white"
                    class="soft-input elevation-2"
                    rounded="lg"
                    hide-details="auto"
                    required
                  >
                    <template #prepend-inner>
                      <VIcon icon="tabler-phone" size="20" class="text-primary opacity-70" />
                    </template>
                  </VTextField>
                </div>
              </div>
              
              <!-- Email -->
              <div class="animate-item" style="animation-delay: 0.3s">
                <div class="input-group">
                  <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                    Email Address <span class="text-disabled font-weight-regular text-lowercase ms-1">(optional)</span>
                  </VLabel>
                  <VTextField
                    v-model="form.email"
                    placeholder="e.g. john@example.com"
                    variant="solo"
                    flat
                    bg-color="white"
                    class="soft-input elevation-2"
                    rounded="lg"
                    hide-details="auto"
                    type="email"
                  >
                    <template #prepend-inner>
                      <VIcon icon="tabler-mail" size="20" class="text-primary opacity-70" />
                    </template>
                  </VTextField>
                </div>
              </div>
            </div>

            <VAlert 
              v-if="errorMessage" 
              type="error" 
              variant="tonal" 
              class="mt-6 animate-item soft-alert" 
              style="animation-delay: 0.4s" 
              border="start"
              closable
              icon="tabler-alert-circle"
            >
              {{ errorMessage }}
            </VAlert>
            <VAlert 
              v-if="successMessage" 
              type="success" 
              variant="tonal" 
              class="mt-6 animate-item soft-alert" 
              style="animation-delay: 0.4s" 
              border="start"
              closable
              icon="tabler-check"
            >
              {{ successMessage }}
            </VAlert>
          </VForm>
        </div>

        <!-- Footer Actions -->
        <div class="pa-6 bg-white border-t">
          <div class="d-flex gap-4">
            <VBtn 
              variant="text" 
              color="medium-emphasis" 
              class="flex-1-0 rounded-lg"
              height="52"
              @click="dialog = false"
            >
              Cancel
            </VBtn>
            <VBtn 
              color="primary" 
              class="flex-1-0 rounded-lg elevation-4 soft-btn"
              height="52"
              :loading="registering" 
              @click="handleSubmit"
            >
              <span class="font-weight-bold">{{ editingId ? 'Save Changes' : 'Send Invite' }}</span>
              <VIcon icon="tabler-arrow-right" end class="ms-2" />
            </VBtn>
          </div>
        </div>
      </div>
    </VNavigationDrawer>

    <!-- Manage Services Dialog -->
    <VDialog v-model="servicesDialog" max-width="600" scrollable>
      <VCard title="Manage Services">
        <VCardText style="max-height: 60vh;">
          <p class="mb-4">Select services, categories, and facilities that <strong>{{ selectedEmployeeForServices?.full_name }}</strong> can access.</p>
          
          <div v-if="loadingServices" class="d-flex justify-center py-4">
            <VProgressCircular indeterminate color="primary" />
          </div>
          
          <div v-else-if="availableServices.length === 0" class="text-center py-4 text-medium-emphasis">
            No services available to assign.
          </div>

          <div v-else>
            <EmployeePermissionTree
              :available="availableServices"
              :assigned="assignedServices"
              @update:permissions="permissionsPayload = $event"
            />
          </div>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn color="secondary" variant="text" @click="servicesDialog = false">Cancel</VBtn>
          <VBtn color="primary" :loading="savingServices" @click="saveServices">
            Save Assignments
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </ProviderLayout>
</template>
