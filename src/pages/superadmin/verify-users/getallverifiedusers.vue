

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import {
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VTextField, VBtn, VIcon, VChip,
  VAvatar, VSelect, VRow, VCol, VCardItem, VCardSubtitle, VDivider, VNavigationDrawer,
  VSheet, VForm, VProgressCircular, VSnackbar, VDataTable, VSwitch,
} from 'vuetify/components'

// =============================
// 🔹 API Endpoints
// =============================
const API_BASE = 'http://127.0.0.1:8000/auth/users/'
const REGISTER_API = 'http://127.0.0.1:8000/auth/api/auth/register/'
const ROLES_API = 'http://127.0.0.1:8000/auth/roles/'

// =============================
// 🔹 Reactive State
// =============================
const users = ref([])
const roles = ref([])
const totalUsers = ref(0)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const snackColor = ref('success')
const showSnack = ref(false)
const searchQuery = ref('')

// Drawers / Dialogs
const isAddUserDrawerVisible = ref(false)
const isUpdateDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)

// Selected / New
const selectedUser = ref({})
const userToDelete = ref(null)
const newUser = ref({ full_name: '', email: '', phone_number: '', role: '' })

const isRegistering = ref(false)
const isSavingUpdate = ref(false)
const isDeleting = ref(false)

// =============================
// 🔹 Helpers
// =============================
const tokenHeader = () => {
  const token = useCookie('accessToken').value
  
  return { Authorization: `Bearer ${token}` }
}

const openSnack = (msg, color = 'success') => {
  successMessage.value = msg
  snackColor.value = color
  showSnack.value = true
}

const openError = msg => {
  errorMessage.value = msg
  snackColor.value = 'error'
  showSnack.value = true
}

// =============================
// 🔹 Computed Filter
// =============================
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  
  return users.value.filter(u =>
    (u.full_name ?? '').toLowerCase().includes(q) ||
    (u.email ?? '').toLowerCase().includes(q) ||
    String(getRoleName(u.role)).toLowerCase().includes(q) ||
    (u.phone_number ?? '').toLowerCase().includes(q),
  )
})

// =============================
// 🔹 Fetch Roles
// =============================
const fetchRoles = async () => {
  try {
    const res = await axios.get(ROLES_API, { headers: tokenHeader() })

    console.log('📥 Roles fetched:', res.data)
    roles.value = res.data.map(role => ({
      id: role.id,
      title: role.name,
      value: role.id,
    }))
  } catch {
    openError('Failed to load roles.')
  }
}

const getRoleName = roleId => {
  const found = roles.value.find(r => r.id === roleId)
  
  return found ? found.title : 'Unknown'
}

// =============================
// 🔹 Fetch Users
// =============================
const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get(API_BASE, { headers: tokenHeader() })

    users.value = res.data
    totalUsers.value = res.data.length
  } catch {
    openError('Failed to fetch users.')
  } finally {
    loading.value = false
  }
}

// =============================
// 🔹 Add User (NO OTP)
// =============================
const addUser = async () => {
  isRegistering.value = true

  try {
    if (!newUser.value.full_name || !newUser.value.email || !newUser.value.phone_number || !newUser.value.role) {
      openError('⚠️ Please fill all fields before submitting.')
      isRegistering.value = false
      
      return
    }

    const payload = {
      full_name: newUser.value.full_name,
      email: newUser.value.email,
      phone_number: newUser.value.phone_number,
      role: newUser.value.role,   // id (OK)
    }

    const res = await axios.post(REGISTER_API, payload, {
      headers: { "Content-Type": "application/json" },
    })

    openSnack("✅ User registered successfully!")
    isAddUserDrawerVisible.value = false

    newUser.value = { full_name: "", email: "", phone_number: "", role: "" }

    fetchUsers()

  } catch (err) {
    console.error("REG ERR:", err.response?.data)

    const data = err.response?.data || {}
    
    if (data.phone_number) {
      openError(data.phone_number[0])
    } else if (data.email) {
      openError(data.email[0])
    } else if (data.detail) {
      openError(data.detail)
    } else {
      openError("Registration failed. Please check inputs.")
    }
  } finally {
    isRegistering.value = false
  }
}

const toggleStatus = async user => {
  try {
    // Optimistic UI update
    user.is_active = !user.is_active
    
    await axios.patch(`${API_BASE}${user.id}/`, 
      { is_active: user.is_active }, 
      { headers: tokenHeader() },
    )
    openSnack(`User ${user.is_active ? 'activated' : 'deactivated'} successfully!`)
  } catch (err) {
    // Revert on failure
    user.is_active = !user.is_active
    openError('Failed to update status.')
  }
}


// =============================
// 🔹 Update / Delete
// =============================
const openUpdateDialog = user => {
  selectedUser.value = { ...user }
  isUpdateDialogVisible.value = true
}

const saveUpdatedUser = async () => {
  isSavingUpdate.value = true
  try {
    const payload = {
      full_name: selectedUser.value.full_name,
      email: selectedUser.value.email,
      phone_number: selectedUser.value.phone_number,
      role: selectedUser.value.role,
    }

    await axios.patch(`${API_BASE}${selectedUser.value.id}/`, payload, {
      headers: { ...tokenHeader(), 'Content-Type': 'application/json' },
    })
    openSnack('✅ User updated successfully!', 'success')
    fetchUsers()
    isUpdateDialogVisible.value = false
  } catch (err) {
    openError(err.response?.data?.detail || 'Failed to update user.')
  } finally {
    isSavingUpdate.value = false
  }
}

const confirmDelete = user => {
  userToDelete.value = user
  isDeleteDialogVisible.value = true
}

const deleteUser = async () => {
  isDeleting.value = true
  try {
    await axios.delete(`${API_BASE}${userToDelete.value.id}/`, { headers: tokenHeader() })
    users.value = users.value.filter(u => u.id !== userToDelete.value.id)
    openSnack('✅ User deleted successfully!', 'success')
  } catch (err) {
    openError('Failed to delete user.')
  } finally {
    isDeleting.value = false
    isDeleteDialogVisible.value = false
  }
}

// =============================
// 🔹 Lifecycle
// =============================
onMounted(() => {
  fetchRoles()
  fetchUsers()
})

// =============================
// 🔹 Table Headers
// =============================
const headers = [
  { title: 'Full Name', key: 'full_name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone_number' },
  { title: 'Role', key: 'role' },
  { title: 'Verified', key: 'is_verified', align: 'center' },
  { title: 'Status', key: 'is_active', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script>

<template>
  <section>
    <!-- 🧾 User Table -->
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>User Management</VCardTitle>
        <VCardSubtitle>Register & manage users</VCardSubtitle>
      </VCardItem>

      <VCardText class="d-flex justify-space-between align-center px-5 py-4 bg-grey-lighten-5">
        <VTextField
          v-model="searchQuery"
          variant="outlined"
          placeholder="Search users..."
          prepend-inner-icon="tabler-search"
          class="rounded-xl bg-white elevation-1"
          style="max-width: 320px;"
        />
        <VBtn
          color="primary"
          prepend-icon="tabler-user-plus"
          class="rounded-xl"
          @click="isAddUserDrawerVisible = true"
        >
          Register User
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        item-key="id"
        class="text-no-wrap"
      >
        <template #item.full_name="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VAvatar
              color="primary"
              size="32"
            >
              <span>{{ item.full_name ? item.full_name[0] : '?' }}</span>
            </VAvatar>
            <strong>{{ item.full_name }}</strong>
          </div>
        </template>

        <template #item.role="{ item }">
          <VChip
            color="primary"
            label
            size="small"
          >
            {{ getRoleName(item.role) }}
          </VChip>
        </template>

        <template #item.is_verified="{ item }">
          <VChip
            :color="item.is_verified ? 'success' : 'error'"
            label
            size="small"
            class="font-weight-bold"
          >
            {{ item.is_verified ? 'VERIFIED' : 'NOT VERIFIED' }}
          </VChip>
        </template>

        <template #item.is_active="{ item }">
          <VSwitch
            v-model="item.is_active"
            color="success"
            density="compact"
            hide-details
            inset
            @click.stop="toggleStatus(item)"
          />
        </template>

        <template #item.actions="{ item }">
          <VBtn
            icon
            color="primary"
            variant="text"
            @click="openUpdateDialog(item)"
          >
            <VIcon icon="tabler-pencil" />
          </VBtn>
          <VBtn
            icon
            color="error"
            variant="text"
            @click="confirmDelete(item)"
          >
            <VIcon icon="tabler-trash" />
          </VBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- 🟢 Register Drawer -->
    <VNavigationDrawer
      v-model="isAddUserDrawerVisible"
      location="right"
      width="420"
      temporary
      class="elevation-10 rounded-l-xl"
    >
      <VSheet
        color="primary"
        class="pa-5 text-white d-flex align-center justify-space-between"
      >
        <div>
          <div class="text-h6 font-weight-bold">
            Register New User
          </div>
          <div class="text-caption text-white text-opacity-80">
            Fill in all details below
          </div>
        </div>
        <VBtn
          icon
          color="white"
          variant="text"
          @click="isAddUserDrawerVisible = false"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
      </VSheet>

      <VCard
        flat
        class="pa-6"
      >
        <VForm
          class="d-flex flex-column gap-y-4"
          @submit.prevent="addUser"
        >
          <VTextField
            v-model="newUser.full_name"
            label="Full Name"
            prepend-inner-icon="tabler-user"
            variant="outlined"
          />
          <VTextField
            v-model="newUser.email"
            label="Email"
            prepend-inner-icon="tabler-mail"
            variant="outlined"
          />
          <VTextField
            v-model="newUser.phone_number"
            label="Phone Number"
            prepend-inner-icon="tabler-phone"
            variant="outlined"
          />
          <VSelect
            v-model="newUser.role"
            :items="roles"
            item-title="title"
            item-value="value"
            label="Select Role"
            prepend-inner-icon="tabler-id"
            variant="outlined"
          />
          <VBtn
            type="submit"
            color="primary"
            block
            class="mt-2 text-white elevation-2"
            prepend-icon="tabler-check"
            :loading="isRegistering"
            :disabled="isRegistering"
          >
            Register User
          </VBtn>
        </VForm>
      </VCard>
    </VNavigationDrawer>

    <!-- 🟣 Update Dialog -->
    <VDialog
      v-model="isUpdateDialogVisible"
      max-width="560px"
      persistent
    >
      <VCard class="rounded-xl shadow-xl">
        <VCardTitle
          class="text-center py-5 text-white"
          style="background: #6366f1;"
        >
          <div class="d-flex flex-column align-center w-100">
            <VAvatar
              color="white"
              size="56"
              class="mb-2 elevation-3"
            >
              <VIcon
                color="primary"
                icon="tabler-edit"
                size="32"
              />
            </VAvatar>
            <span class="text-h5 font-weight-bold">Edit User Details</span>
          </div>
        </VCardTitle>

        <VCardText class="pt-6 px-6">
          <VRow dense>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="selectedUser.full_name"
                label="Full Name"
                variant="outlined"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="selectedUser.email"
                label="Email"
                variant="outlined"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="selectedUser.phone_number"
                label="Phone Number"
                variant="outlined"
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VSelect
                v-model="selectedUser.role"
                :items="roles"
                item-title="title"
                item-value="value"
                label="Select Role"
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="justify-end py-4 px-6">
          <VBtn
            variant="outlined"
            color="error"
            @click="isUpdateDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            :loading="isSavingUpdate"
            :disabled="isSavingUpdate"
            @click="saveUpdatedUser"
          >
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- 🔴 Delete Confirmation -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="460px"
      persistent
    >
      <VCard class="rounded-xl shadow-lg">
        <VCardTitle
          class="text-center py-5 text-white"
          style="background: #ef4444;"
        >
          <div class="d-flex flex-column align-center w-100">
            <VAvatar
              color="white"
              size="56"
              class="mb-2 elevation-3"
            >
              <VIcon
                color="error"
                icon="tabler-alert-triangle"
                size="32"
              />
            </VAvatar>
            <span class="text-h5 font-weight-bold">Confirm Deletion</span>
          </div>
        </VCardTitle>

        <VCardText class="text-center py-6 px-6">
          Are you sure you want to permanently delete
          <strong class="text-error">{{ userToDelete?.full_name }}</strong>?
        </VCardText>

        <VCardActions class="justify-end py-4 px-6">
          <VBtn
            variant="outlined"
            color="secondary"
            @click="isDeleteDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="deleteUser"
          >
            Yes, Delete User
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- 🔔 Snackbar -->
    <VSnackbar
      v-model="showSnack"
      :color="snackColor"
      timeout="2800"
      location="top right"
    >
      {{ successMessage || errorMessage }}
    </VSnackbar>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
