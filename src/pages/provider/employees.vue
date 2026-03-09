<script setup>
import { ref, onMounted, computed } from 'vue'
import { providerApi, veterinaryApi } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'
import { VDataTable } from 'vuetify/components'
import EmployeePermissionTree from '@/components/provider/EmployeePermissionTree.vue'
import ClinicAssignmentDialog from '@/components/provider/ClinicAssignmentDialog.vue'
import ScheduleApprovals from './components/ScheduleApprovals.vue'

definePage({
  meta: {
    layout: 'blank',
    permission: 'manage_employees',
  },
})

// State
const employees = ref([])
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const assignmentDialog = ref(false)
const assignmentEmployee = ref(null)
const registering = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const editingId = ref(null)
const providerRoles = ref([])
const capabilities = ref([])
const activeTab = ref('employees')
const pendingCount = ref(0)

// Role Assignment Dialog State
const roleDialog = ref(false)
const roleDialogEmployee = ref(null)
const roleForm = ref({ provider_role: null, specialization: '', consultation_fee: 0 })
const roleSaving = ref(false)
const roleErrorMessage = ref('')

// Computed: is the selected role in roleForm a doctor type?
const isRoleFormDoctor = computed(() => {
  if (!roleForm.value.provider_role) return false
  const role = providerRoles.value.find(r => r.id === roleForm.value.provider_role)
  
  return role?.name?.toLowerCase().includes('doctor') || false
})

const openRoleDialog = employee => {
  roleDialogEmployee.value = employee
  roleForm.value = {
    provider_role: employee.provider_role || null,
    specialization: employee.specialization || '',
    consultation_fee: employee.consultation_fee || 0,
  }
  roleErrorMessage.value = ''
  roleDialog.value = true
}

const saveRole = async () => {
  if (!roleDialogEmployee.value) return
  roleSaving.value = true
  roleErrorMessage.value = ''
  try {
    const payload = {
      provider_role: roleForm.value.provider_role,
      specialization: isRoleFormDoctor.value ? roleForm.value.specialization : '',
      consultation_fee: isRoleFormDoctor.value ? roleForm.value.consultation_fee : 0,
    }

    await providerApi.patch(`/api/provider/employees/${roleDialogEmployee.value.id || roleDialogEmployee.value.raw?.id}/`, payload)
    roleDialog.value = false
    fetchEmployees()
  } catch (err) {
    roleErrorMessage.value = err.response?.data?.detail || 'Failed to save role.'
  } finally {
    roleSaving.value = false
  }
}

const fetchPendingCount = async () => {
  try {
    const res = await providerApi.get('/api/provider/schedules/pending-approvals/')

    pendingCount.value = Array.isArray(res.data) ? res.data.length : 0
  } catch (e) { pendingCount.value = 0 }
}

// ... (existing code)

// Open Assignment Dialog
const openAssignmentDialog = employee => {
  assignmentEmployee.value = employee
  assignmentDialog.value = true
}


// Form
const form = ref({
  full_name: '',
  email: '',
  phone_number: '',
  role: 'employee',
  provider_role: null,
  specialization: '',
  consultation_fee: 0,
})

const legacyRoles = [
  { title: 'Receptionist', value: 'receptionist' },
  { title: 'Vitals Staff', value: 'vitals staff' },
  { title: 'Doctor', value: 'doctor' },
  { title: 'Lab Tech', value: 'lab tech' },
  { title: 'Pharmacy', value: 'pharmacy' },
  { title: 'General Employee', value: 'employee' },
]

// Headers
const headers = [
  { title: 'Employee', key: 'full_name' },
  { title: 'Rating', key: 'average_rating' },
  { title: 'Role (Custom)', key: 'provider_role_name' },
  { title: 'Type', key: 'role' },
  { title: 'Contact', key: 'contact' },
  { title: 'Status', key: 'status' },
  { title: 'Joined', key: 'joined_at' },
  { title: 'Clinics', key: 'assigned_clinics' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Fetch Employees
const fetchEmployees = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [empRes, rolesRes, capsRes, assignmentsRes] = await Promise.all([
      providerApi.get('/api/provider/employees/'),
      providerApi.get('/api/provider/roles/'),
      providerApi.get('/api/provider/capabilities/'),
      veterinaryApi.get('/api/veterinary/assignments/'),
    ])

    // DRF pagination may wrap results in a "results" key
    const assignments = (assignmentsRes.data && assignmentsRes.data.results) ? assignmentsRes.data.results : (assignmentsRes.data || [])


    employees.value = (empRes.data || []).map(emp => {
      const staffAssignments = assignments.filter(a => a.staff_auth_id === emp.auth_user_id)
      
      return {
        ...emp,
        assigned_clinics: staffAssignments.map(a => a.clinic_name || 'Unknown Clinic'),
      }
    })
    providerRoles.value = rolesRes.data
    capabilities.value = capsRes.data
  } catch (err) {
    console.error('Failed to fetch data', err)
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
      phone_number: employee.phone_number || employee.raw?.phone_number,
      role: (employee.role || employee.raw?.role || 'employee').toLowerCase(),
      provider_role: employee.provider_role || employee.raw?.provider_role,
      specialization: employee.specialization || employee.raw?.specialization || '',
      consultation_fee: employee.consultation_fee || employee.raw?.consultation_fee || 0,
    }
  } else {
    editingId.value = null
    form.value = {
      full_name: '',
      email: '',
      phone_number: '',
      role: 'employee',
      provider_role: null,
      specialization: '',
      consultation_fee: 0,
    }
  }
  dialog.value = true
}


// Role Permission Preview
const selectedRolePermissions = computed(() => {
  if (!form.value.provider_role) return []
  const role = providerRoles.value.find(r => r.id === form.value.provider_role)
  if (!role) return []
  
  // Map keys to labels
  return (role.capabilities || []).map(key => {
    const cap = capabilities.value.find(c => c.key === key)
    
    return cap ? cap.label : key
  })
})

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
      role: form.value.role,
      provider_role: form.value.provider_role,
      specialization: form.value.specialization,
      consultation_fee: form.value.consultation_fee,
    }

    await providerApi.patch(`/api/provider/employees/${editingId.value}/`, payload)
    
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
    const payload = {
      full_name: form.value.full_name,
      email: form.value.email,
      phone_number: form.value.phone_number,
      role: form.value.role,
      provider_role: form.value.provider_role,
    }

    // Use Provider Service Proxy for registration
    const res = await providerApi.post('/api/provider/employees/', payload)
    
    successMessage.value = 'Invitation sent successfully!'
    fetchEmployees()
    setTimeout(() => {
      dialog.value = false
    }, 1500)
  } catch (err) {
    console.error('Registration Error:', err)
    errorMessage.value = err.response?.data?.detail || err.response?.data?.message || 'Registration failed.'
  } finally {
    registering.value = false
  }
}


// Actions
const updateStatus = async (id, action) => {
  try {
    await providerApi.post(`/api/provider/employees/${id}/${action}/`)
    fetchEmployees()
  } catch (err) {
    console.error(`Failed to ${action} employee`, err)
  }
}

const deleteEmployee = async id => {
  if (!confirm('Are you sure you want to remove this employee?')) return
  try {
    await providerApi.delete(`/api/provider/employees/${id}/`)
    fetchEmployees()
  } catch (err) {
    console.error('Failed to delete employee', err)
  }
}

const getStatusColor = status => {
  const s = (status || '').toUpperCase()
  switch (s) {
  case 'ACTIVE': return 'success'
  case 'PENDING': return 'warning'
  case 'DISABLED': return 'error'
  default: return 'grey'
  }
}

onMounted(() => {
  fetchEmployees()
  fetchPendingCount()
})
</script>

<template>
  <ProviderLayout>
    <div class="pa-4">
      <!-- Tabs: Employees | Schedule Approvals -->
      <VTabs
        v-model="activeTab"
        class="mb-4"
      >
        <VTab value="employees">
          <VIcon
            icon="tabler-users"
            class="mr-2"
          />
          Employees
        </VTab>
        <VTab value="approvals">
          <VIcon
            icon="tabler-calendar-check"
            class="mr-2"
          />
          Schedule Approvals
          <VBadge
            v-if="pendingCount > 0"
            :content="pendingCount"
            color="error"
            class="ml-2"
            inline
          />
        </VTab>
      </VTabs>

      <!-- Employees Tab -->
      <div v-show="activeTab === 'employees'">
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
                <VBtn
                  prepend-icon="tabler-user-plus"
                  @click="openDialog"
                >
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
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  {{ (item.full_name || item.raw?.full_name || 'E').charAt(0) }}
                </VAvatar>
                <div class="d-flex flex-column">
                  <span class="font-weight-medium">{{ item.full_name || item.raw?.full_name }}</span>
                  <span class="text-caption text-disabled">ID: {{ (item.auth_user_id || item.raw?.auth_user_id || '').substring(0,8) }}...</span>
                </div>
              </div>
            </template>
        
            <!-- Rating Column -->
            <template #item.average_rating="{ item }">
              <div class="d-flex align-center">
                <VIcon
                  icon="tabler-star-filled"
                  color="amber"
                  size="14"
                  class="me-1"
                />
                <span class="font-weight-bold">{{ (item.average_rating || item.raw?.average_rating || 0).toFixed(1) }}</span>
                <span class="text-caption text-disabled ms-1">({{ item.total_ratings || item.raw?.total_ratings || 0 }})</span>
              </div>
            </template>

            <!-- Contact Column -->
            <template #item.contact="{ item }">
              <div class="d-flex flex-column">
                <div class="d-flex align-center mb-1">
                  <VIcon
                    icon="tabler-phone"
                    size="14"
                    class="me-1 text-disabled"
                  />
                  <span class="text-body-2">{{ item.phone_number || item.raw?.phone_number }}</span>
                </div>
                <div
                  v-if="item.email || item.raw?.email"
                  class="d-flex align-center"
                >
                  <VIcon
                    icon="tabler-mail"
                    size="14"
                    class="me-1 text-disabled"
                  />
                  <span class="text-caption">{{ item.email || item.raw?.email }}</span>
                </div>
              </div>
            </template>

            <!-- Role Column -->
            <template #item.role="{ item }">
              <span class="text-capitalize">{{ item.role || item.raw?.role || 'Employee' }}</span>
            </template>

            <!-- Status Column -->
            <template #item.status="{ item }">
              <VChip
                :color="getStatusColor(item.status || item.raw?.status)"
                size="small"
                label
                class="text-capitalize"
              >
                {{ item.status || item.raw?.status }}
              </VChip>
            </template>

            <!-- Joined Column -->
            <template #item.joined_at="{ item }">
              {{ (item.joined_at || item.raw?.joined_at) ? new Date(item.joined_at || item.raw?.joined_at).toLocaleDateString() : '-' }}
            </template>

            <!-- Clinics Column -->
            <template #item.assigned_clinics="{ item }">
              <div class="d-flex flex-wrap gap-1">
                <VChip
                  v-for="clinic in (item.assigned_clinics || item.raw?.assigned_clinics || [])"
                  :key="clinic"
                  size="x-small"
                  color="info"
                  variant="tonal"
                >
                  {{ clinic }}
                </VChip>
                <span
                  v-if="!(item.assigned_clinics || item.raw?.assigned_clinics)?.length"
                  class="text-caption text-disabled"
                >
                  No clinics
                </span>
              </div>
            </template>

            <!-- Actions Column -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <VBtn
                  icon="tabler-edit"
                  variant="text"
                  color="primary"
                  size="small"
                  title="Edit"
                  @click="openDialog(item.raw || item)"
                />
                <VBtn
                  v-if="(item.status || item.raw?.status) === 'ACTIVE'"
                  icon="tabler-ban"
                  variant="text"
                  color="warning"
                  size="small"
                  title="Suspend"
                  @click="updateStatus(item.id || item.raw?.id, 'suspend')"
                />
                <VBtn
                  v-if="['DISABLED', 'PENDING'].includes(item.status || item.raw?.status)"
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
                <VBtn
                  icon="tabler-stethoscope"
                  variant="text"
                  color="secondary"
                  size="small"
                  title="Assign Role"
                  @click="openRoleDialog(item.raw || item)"
                />
                <VBtn
                  icon="tabler-building-hospital"
                  variant="text"
                  color="info"
                  size="small"
                  title="Assign Clinics"
                  @click="openAssignmentDialog(item.raw || item)"
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
                  <VIcon
                    icon="tabler-user-plus"
                    size="28"
                    color="primary"
                  />
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
                  <div
                    class="animate-item"
                    style="animation-delay: 0.1s"
                  >
                    <div class="input-group">
                      <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                        Full Name
                      </VLabel>
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
                          <VIcon
                            icon="tabler-user"
                            size="20"
                            class="text-primary opacity-70"
                          />
                        </template>
                      </VTextField>
                    </div>
                  </div>
              
                  <!-- Phone -->
                  <div
                    class="animate-item"
                    style="animation-delay: 0.2s"
                  >
                    <div class="input-group">
                      <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                        Phone Number
                      </VLabel>
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
                          <VIcon
                            icon="tabler-phone"
                            size="20"
                            class="text-primary opacity-70"
                          />
                        </template>
                      </VTextField>
                    </div>
                  </div>
              
                  <!-- Provider Role Selection -->
                  <div
                    class="animate-item"
                    style="animation-delay: 0.3s"
                  >
                    <div class="input-group">
                      <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                        Provider Role (Custom)
                      </VLabel>
                      <VSelect
                        v-model="form.provider_role"
                        :items="providerRoles"
                        item-title="name"
                        item-value="id"
                        placeholder="Select Custom Role"
                        variant="solo"
                        flat
                        bg-color="white"
                        class="soft-input elevation-2"
                        rounded="lg"
                        hide-details="auto"
                        clearable
                      >
                        <template #prepend-inner>
                          <VIcon
                            icon="tabler-user-shield"
                            size="20"
                            class="text-primary opacity-70"
                          />
                        </template>
                      </VSelect>
                    </div>
                  </div>

                  <!-- Role Selection (Legacy/Type) -->
                  <div
                    class="animate-item"
                    style="animation-delay: 0.35s"
                  >
                    <div class="input-group">
                      <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                        Employee Type
                      </VLabel>
                      <VSelect
                        v-model="form.role"
                        :items="legacyRoles"
                        placeholder="Select Type"
                        variant="solo"
                        flat
                        bg-color="white"
                        class="soft-input elevation-2"
                        rounded="lg"
                        hide-details="auto"
                        required
                      >
                        <template #prepend-inner>
                          <VIcon
                            icon="tabler-user-cog"
                            size="20"
                            class="text-primary opacity-70"
                          />
                        </template>
                      </VSelect>
                    </div>
                  </div>

                  <!-- Specialization (Doctor Only + Edit Only) -->
                  <!-- Show when legacy role is 'doctor' OR custom provider_role name contains 'doctor' -->
                  <div
                    v-if="editingId && (form.role === 'doctor' || providerRoles.find(r => r.id === form.provider_role)?.name?.toLowerCase().includes('doctor'))"
                    class="animate-item"
                    style="animation-delay: 0.36s"
                  >
                    <div class="input-group">
                      <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                        Specialization
                      </VLabel>
                      <VTextField
                        v-model="form.specialization"
                        placeholder="e.g. Senior Surgeon"
                        variant="solo"
                        flat
                        bg-color="white"
                        class="soft-input elevation-2"
                        rounded="lg"
                        hide-details="auto"
                      >
                        <template #prepend-inner>
                          <VIcon
                            icon="tabler-certificate"
                            size="20"
                            class="text-primary opacity-70"
                          />
                        </template>
                      </VTextField>
                    </div>
                  </div>

                  <!-- Consultation Fee (Doctor Only + Edit Only) -->
                  <div
                    v-if="editingId && (form.role === 'doctor' || providerRoles.find(r => r.id === form.provider_role)?.name?.toLowerCase().includes('doctor'))"
                    class="animate-item"
                    style="animation-delay: 0.37s"
                  >
                    <div class="input-group">
                      <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                        Consultation Fee (₹)
                      </VLabel>
                      <VTextField
                        v-model.number="form.consultation_fee"
                        type="number"
                        placeholder="e.g. 500"
                        variant="solo"
                        flat
                        bg-color="white"
                        class="soft-input elevation-2"
                        rounded="lg"
                        hide-details="auto"
                      >
                        <template #prepend-inner>
                          <VIcon
                            icon="tabler-currency-rupee"
                            size="20"
                            class="text-primary opacity-70"
                          />
                        </template>
                      </VTextField>
                    </div>
                  </div>

                  <!-- Permission Preview (Read-Only) -->
                  <div
                    v-if="selectedRolePermissions.length > 0"
                    class="animate-item"
                    style="animation-delay: 0.38s"
                  >
                    <div class="pa-4 rounded-lg bg-primary-lighten-5 border-primary border-opacity-25 border">
                      <div class="d-flex align-center gap-2 mb-2">
                        <VIcon
                          icon="tabler-shield-check"
                          size="18"
                          color="primary"
                        />
                        <span class="text-caption font-weight-bold text-primary text-uppercase">Effective Permissions</span>
                      </div>
                      <div class="d-flex flex-wrap gap-2">
                        <VChip
                          v-for="perm in selectedRolePermissions"
                          :key="perm"
                          size="x-small"
                          color="primary"
                          variant="tonal"
                        >
                          {{ perm }}
                        </VChip>
                      </div>
                      <p class="text-caption text-medium-emphasis mt-2 mb-0">
                        Permissions are inherited from the selected role and cannot be modified individually.
                      </p>
                    </div>
                  </div>

                  <!-- Email -->
                  <div
                    class="animate-item"
                    style="animation-delay: 0.4s"
                  >
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
                          <VIcon
                            icon="tabler-mail"
                            size="20"
                            class="text-primary opacity-70"
                          />
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
                  <VIcon
                    icon="tabler-arrow-right"
                    end
                    class="ms-2"
                  />
                </VBtn>
              </div>
            </div>
          </div>
        </VNavigationDrawer>

        <!-- Role Assignment Dialog -->
        <VDialog
          v-model="roleDialog"
          max-width="460"
          persistent
        >
          <VCard
            rounded="xl"
            elevation="4"
          >
            <VCardTitle class="pa-6 pb-4 d-flex align-center gap-3">
              <VIcon
                icon="tabler-stethoscope"
                color="secondary"
                size="28"
              />
              <div>
                <div class="text-h6 font-weight-bold">
                  Assign Role
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ roleDialogEmployee?.full_name }}
                </div>
              </div>
            </VCardTitle>

            <VDivider />

            <VCardText class="pa-6">
              <div class="d-flex flex-column gap-5">
                <!-- Custom Role Selector -->
                <div>
                  <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                    Custom Role
                  </VLabel>
                  <VSelect
                    v-model="roleForm.provider_role"
                    :items="providerRoles"
                    item-title="name"
                    item-value="id"
                    placeholder="Select a role..."
                    variant="outlined"
                    clearable
                    hide-details="auto"
                    prepend-inner-icon="tabler-user-shield"
                  />
                </div>

                <!-- Doctor-only fields -->
                <template v-if="isRoleFormDoctor">
                  <VDivider>
                    <span class="text-caption text-medium-emphasis px-2">Doctor Details</span>
                  </VDivider>

                  <div>
                    <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                      Specialization
                    </VLabel>
                    <VTextField
                      v-model="roleForm.specialization"
                      placeholder="e.g. Senior Surgeon"
                      variant="outlined"
                      hide-details="auto"
                      prepend-inner-icon="tabler-certificate"
                    />
                  </div>

                  <div>
                    <VLabel class="mb-2 text-caption font-weight-bold text-medium-emphasis text-uppercase">
                      Consultation Fee (₹)
                    </VLabel>
                    <VTextField
                      v-model.number="roleForm.consultation_fee"
                      type="number"
                      placeholder="e.g. 500"
                      variant="outlined"
                      hide-details="auto"
                      prepend-inner-icon="tabler-currency-rupee"
                    />
                  </div>
                </template>

                <VAlert
                  v-if="roleErrorMessage"
                  type="error"
                  variant="tonal"
                  density="compact"
                >
                  {{ roleErrorMessage }}
                </VAlert>
              </div>
            </VCardText>

            <VDivider />

            <VCardActions class="pa-4 gap-3">
              <VBtn
                variant="text"
                color="medium-emphasis"
                @click="roleDialog = false"
              >
                Cancel
              </VBtn>
              <VSpacer />
              <VBtn
                color="secondary"
                variant="elevated"
                :loading="roleSaving"
                @click="saveRole"
              >
                <VIcon
                  icon="tabler-check"
                  start
                />
                Save Role
              </VBtn>
            </VCardActions>
          </VCard>
        </VDialog>

        <ClinicAssignmentDialog 
          v-model="assignmentDialog" 
          :employee="assignmentEmployee" 
          @saved="fetchEmployees"
        />
      </div><!-- employees tab -->

      <!-- Schedule Approvals Tab -->
      <div v-show="activeTab === 'approvals'">
        <VCard
          flat
          border
          class="rounded-2xl pa-6"
        >
          <div class="d-flex align-center justify-space-between mb-6">
            <div>
              <h2 class="text-h5 font-weight-black text-slate-800">
                Schedule Approvals
              </h2>
              <p class="text-body-2 text-slate-400 mt-1">
                Review and approve employee weekly schedule submissions.
              </p>
            </div>
            <VBtn
              variant="tonal"
              size="small"
              prepend-icon="tabler-refresh"
              @click="fetchPendingCount"
            >
              Refresh
            </VBtn>
          </div>
          <ScheduleApprovals @approved="fetchPendingCount" />
        </VCard>
      </div>
    </div>
  </ProviderLayout>
</template>
