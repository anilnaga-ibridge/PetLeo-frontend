<!-- <script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import AddNewUserDrawer from '@/views/apps/user/list/AddNewUserDrawer.vue'

// =========================================
// 🔹 Reactive State
// =========================================
const users = ref([])
const totalUsers = ref(0)
const searchQuery = ref('')
const selectedRole = ref(null)
const page = ref(1)
const itemsPerPage = ref(10)
const isAddNewUserDrawerVisible = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// =========================================
// 🔹 API Configuration
// =========================================
const API_BASE = 'http://localhost:8000/auth/users/'

// =========================================
// 🔹 Fetch All Users
// =========================================
const fetchUsers = async () => {
  const token = useCookie('accessToken').value
  loading.value = true
  try {
    const response = await axios.get(API_BASE, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    users.value = response.data
    totalUsers.value = response.data.length
  } catch (err) {
    console.error('❌ Error fetching users:', err)
    errorMessage.value = err.response?.data?.detail || 'Failed to fetch users.'
  } finally {
    loading.value = false
  }
}

// =========================================
// 🔹 Fetch User by ID
// =========================================
const fetchUserById = async id => {
  const token = useCookie('accessToken').value
  try {
    const response = await axios.get(`${API_BASE}${id}/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (err) {
    console.error(`❌ Error fetching user ${id}:`, err)
  }
}

// =========================================
// 🔹 Delete User
// =========================================
const deleteUser = async id => {
  const token = useCookie('accessToken').value
  try {
    await axios.delete(`${API_BASE}${id}/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    users.value = users.value.filter(u => u.id !== id)
    totalUsers.value = users.value.length
    successMessage.value = '✅ User deleted successfully!'
  } catch (err) {
    console.error('❌ Error deleting user:', err)
    errorMessage.value = err.response?.data?.detail || 'Failed to delete user.'
  }
}

// =========================================
// 🔹 Update User
// =========================================
const updateUser = async user => {
  const token = useCookie('accessToken').value
  try {
    const response = await axios.patch(`${API_BASE}${user.id}/`, user, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = response.data
    successMessage.value = '✅ User updated successfully!'
  } catch (err) {
    console.error('❌ Error updating user:', err)
    errorMessage.value = err.response?.data?.detail || 'Failed to update user.'
  }
}

// =========================================
// 🔹 Add New User
// =========================================
const addNewUser = async newUser => {
  const token = useCookie('accessToken').value
  try {
    const response = await axios.post(API_BASE, newUser, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    users.value.push(response.data)
    totalUsers.value++
    successMessage.value = '✅ User added successfully!'
  } catch (err) {
    console.error('❌ Error adding user:', err)
    errorMessage.value = err.response?.data?.detail || 'Failed to add user.'
  }
}

// =========================================
// 🔹 Lifecycle
// =========================================
onMounted(fetchUsers)

// =========================================
// 🔹 Table Headers
// =========================================
const headers = [
  { title: 'Full Name', key: 'full_name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone_number' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script> -->
<!-- <script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import AddNewUserDrawer from '@/views/apps/user/list/AddNewUserDrawer.vue'
import { VDialog, VCard, VCardTitle, VCardText, VCardActions, VTextField, VBtn, VIcon, VChip, VAvatar, VImg, VList, VListItem, VListItemTitle, VMenu, VRow, VCol, VCardItem, VCardSubtitle, VDivider } from 'vuetify/components'

// ✅ API base
const API_BASE = 'http://localhost:8000/auth/users/'

// ✅ States
const users = ref([])
const totalUsers = ref(0)
const itemsPerPage = ref(10)
const page = ref(1)
const searchQuery = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// ✅ Drawers / Dialogs
const isAddNewUserDrawerVisible = ref(false)
const isUpdateDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)

// ✅ Selected User
const selectedUser = ref({})
const userToDelete = ref(null)

// ✅ Roles (Filter Dropdown)
const roles = [
  { title: 'Admin', value: 1 },
  { title: 'Super Admin', value: 2 },
  { title: 'Individual', value: 4 },
  { title: 'Organization', value: 5 },
  { title: 'Provider', value: 6 },
]

// ✅ Fetch Users
const fetchUsers = async () => {
  const token = useCookie('accessToken').value
  loading.value = true
  try {
    const res = await axios.get(API_BASE, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    users.value = res.data
    totalUsers.value = res.data.length
  } catch (err) {
    console.error(err)
    errorMessage.value = err.response?.data?.detail || 'Failed to fetch users.'
  } finally {
    loading.value = false
  }
}

// ✅ Add User
const addNewUser = async newUser => {
  const token = useCookie('accessToken').value
  try {
    const res = await axios.post(API_BASE, newUser, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    users.value.push(res.data)
    totalUsers.value++
    successMessage.value = '✅ User added successfully!'
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to add user.'
  }
}

// ✅ Open Update Dialog
const openUpdateDialog = user => {
  selectedUser.value = { ...user }
  isUpdateDialogVisible.value = true
}

// ✅ Save Update
const saveUpdatedUser = async () => {
  const token = useCookie('accessToken').value
  try {
    const res = await axios.patch(`${API_BASE}${selectedUser.value.id}/`, selectedUser.value, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const idx = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (idx !== -1) users.value[idx] = res.data
    successMessage.value = '✅ User updated successfully!'
    isUpdateDialogVisible.value = false
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to update user.'
  }
}

// ✅ Confirm Delete
const confirmDelete = user => {
  userToDelete.value = user
  isDeleteDialogVisible.value = true
}

// ✅ Delete User
const deleteUser = async () => {
  const token = useCookie('accessToken').value
  try {
    await axios.delete(`${API_BASE}${userToDelete.value.id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    users.value = users.value.filter(u => u.id !== userToDelete.value.id)
    successMessage.value = '✅ User deleted successfully!'
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to delete user.'
  } finally {
    isDeleteDialogVisible.value = false
  }
}

// ✅ Lifecycle
onMounted(fetchUsers)

// ✅ Table Headers
const headers = [
  { title: 'Full Name', key: 'full_name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone_number' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script> -->
<!-- <script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { 
  VDialog, VCard, VCardTitle, VCardText, VCardActions, 
  VTextField, VBtn, VIcon, VChip, VAvatar, VSelect,
  VRow, VCol, VCardItem, VCardSubtitle, VDivider, VNavigationDrawer, VSheet
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
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')

// Drawers / Dialogs
const isAddUserDrawerVisible = ref(false)
const isUpdateDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)

// Selected
const selectedUser = ref({})
const userToDelete = ref(null)

// New User Form
const newUser = ref({
  full_name: '',
  email: '',
  phone_number: '',
  role: '',
})

// =============================
// 🔹 Fetch Roles from API
// =============================
const fetchRoles = async () => {
  const token = useCookie('accessToken').value
  try {
    const res = await axios.get(ROLES_API, {
      headers: { Authorization: `Bearer ${token}` },
    })
    roles.value = res.data.map(role => ({
      id: role.id,        // keep the numeric id
      title: role.name,   // for display
      value: role.name,   // used in dropdown
    }))
  } catch (err) {
    console.error('❌ Failed to load roles:', err)
  }
}


// 🧩 Computed helper to map role IDs to names
const getRoleName = (roleId) => {
  const found = roles.value.find(r => r.id === roleId || r.value === roleId || r.value === String(roleId))
  return found ? found.title : 'Unknown'
}

// =============================
// 🔹 Fetch All Users
// =============================
const fetchUsers = async () => {
  const token = useCookie('accessToken').value
  loading.value = true
  try {
    const res = await axios.get(API_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    })
    users.value = res.data
    totalUsers.value = res.data.length
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to fetch users.'
  } finally {
    loading.value = false
  }
}

// =============================
// 🔹 Add User
// =============================
const addUser = async () => {
  const token = useCookie('accessToken').value
  try {
    await axios.post(REGISTER_API, newUser.value, {
      headers: { Authorization: `Bearer ${token}` },
    })
    successMessage.value = '✅ User registered successfully!'
    isAddUserDrawerVisible.value = false
    newUser.value = { full_name: '', email: '', phone_number: '', role: '' }
    fetchUsers()
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to register user.'
  }
}

// =============================
// 🔹 Open Update Dialog
// =============================
const openUpdateDialog = user => {
  selectedUser.value = { ...user }
  isUpdateDialogVisible.value = true
}

// =============================
// 🔹 Save Updated User
// =============================
const saveUpdatedUser = async () => {
  const token = useCookie('accessToken').value
  try {
    const res = await axios.patch(`${API_BASE}${selectedUser.value.id}/`, selectedUser.value, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const idx = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (idx !== -1) users.value[idx] = res.data
    successMessage.value = '✅ User updated successfully!'
    isUpdateDialogVisible.value = false
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to update user.'
  }
}

// =============================
// 🔹 Confirm Delete
// =============================
const confirmDelete = user => {
  userToDelete.value = user
  isDeleteDialogVisible.value = true
}

// =============================
// 🔹 Delete User
// =============================
const deleteUser = async () => {
  const token = useCookie('accessToken').value
  try {
    await axios.delete(`${API_BASE}${userToDelete.value.id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    users.value = users.value.filter(u => u.id !== userToDelete.value.id)
    successMessage.value = '✅ User deleted successfully!'
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || 'Failed to delete user.'
  } finally {
    isDeleteDialogVisible.value = false
  }
}

// =============================
// 🔹 Lifecycle
// =============================
onMounted(() => {
  fetchUsers()
  fetchRoles()
})

// =============================
// 🔹 Table Headers
// =============================
const headers = [
  { title: 'Full Name', key: 'full_name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone_number' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false },
]
</script> -->
<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import axios from 'axios'
import confetti from 'canvas-confetti'
import { useCookie } from '@/@core/composable/useCookie'
import {
  VDialog, VCard, VCardTitle, VCardText, VCardActions, VTextField, VBtn, VIcon, VChip,
  VAvatar, VSelect, VRow, VCol, VCardItem, VCardSubtitle, VDivider, VNavigationDrawer,
  VSheet, VForm, VProgressCircular, VSnackbar, VDataTable
} from 'vuetify/components'

// =============================
// 🔹 API Endpoints
// =============================
const API_BASE = 'http://127.0.0.1:8000/auth/users/'
const REGISTER_API = 'http://127.0.0.1:8000/auth/api/auth/register/'
const VERIFY_OTP_API = 'http://127.0.0.1:8000/auth/api/auth/verify-otp/'
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
const isOtpDrawerVisible = ref(false)
const isUpdateDialogVisible = ref(false)
const isDeleteDialogVisible = ref(false)
const showSuccessAnimation = ref(false)

// Selected / New / OTP
const selectedUser = ref({})
const userToDelete = ref(null)
const newUser = ref({ full_name: '', email: '', phone_number: '', role: '' })

const otpData = ref({ session_id: '', otp: '' })
const otpInputs = ref(['', '', '', '', '', ''])
const isVerifying = ref(false)
const isRegistering = ref(false)
const isSavingUpdate = ref(false)
const isDeleting = ref(false)
const countdown = ref(30)
let timer = null

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
    (u.phone_number ?? '').toLowerCase().includes(q)
  )
})

// =============================
// 🔹 Fetch Roles
// =============================
const fetchRoles = async () => {
  try {
    const res = await axios.get(ROLES_API, { headers: tokenHeader() })
    roles.value = res.data.map(role => ({
      id: role.id,
      title: role.name,
      value: role.id, // numeric id
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
// 🔹 Add User + OTP Drawer
// =============================
const addUser = async () => {
  isRegistering.value = true
  try {
    // ✅ Validation
    if (!newUser.value.full_name || !newUser.value.email || !newUser.value.phone_number || !newUser.value.role) {
      openError('⚠️ Please fill all fields before submitting.')
      isRegistering.value = false
      return
    }

    // ✅ Payload
    const payload = {
      phone_number: newUser.value.phone_number,
      full_name: newUser.value.full_name,
      email: newUser.value.email,
      role: newUser.value.role, // numeric ID
    }

    console.log('📤 Sending Payload:', payload)

    // ✅ Register API call
    const res = await axios.post(REGISTER_API, payload, {
      headers: { 'Content-Type': 'application/json' },
    })

    // ✅ Success case
    if (res.data?.session_id) {
      otpData.value.session_id = res.data.session_id
      otpData.value.phone_number = newUser.value.phone_number // 🔹 Save phone for resend OTP later
      openSnack('✅ User registered! Please verify OTP.', 'success')

      // Close drawer and open OTP verification
      isAddUserDrawerVisible.value = false
      otpInputs.value = ['', '', '', '', '', '']
      isOtpDrawerVisible.value = true
      startCountdown()

      // Focus first OTP input
      await nextTick()
      document.querySelector('.otp-input input')?.focus()

      // 🔹 Don’t clear the phone number until verification is done
      newUser.value = { full_name: '', email: '', phone_number: '', role: '' }
    } 
    else {
      openError('⚠️ Unexpected server response. Please try again.')
    }
  } 
  catch (err) {
    console.error('❌ Register Error:', err.response?.data)
    openError(err.response?.data?.detail || JSON.stringify(err.response?.data))
  } 
  finally {
    isRegistering.value = false
  }
}


// =============================
// 🔹 Resend OTP
// =============================
const RESEND_OTP_API = 'http://127.0.0.1:8000/auth/api/auth/resend-otp/'

const resendOtp = async () => {
  try {
    // ✅ Get phone number from wherever available
    const phone =
      otpData.value.phone_number ||
      newUser.value.phone_number ||
      selectedUser.value.phone_number

    if (!phone) {
      openError('⚠️ Missing phone number to resend OTP.')
      return
    }

    console.log('📞 Resending OTP for:', phone)

    // ✅ API call
    const res = await axios.post(
      RESEND_OTP_API,
      { phone_number: phone },
      { headers: { 'Content-Type': 'application/json' } }
    )

    // ✅ Success
    if (res.data?.session_id) {
      otpData.value.session_id = res.data.session_id
      openSnack('📩 OTP resent successfully! Check your phone.', 'success')
      startCountdown()
    } 
    else {
      openError('⚠️ Unexpected response from server. Please try again.')
    }
  } 
  catch (err) {
    console.error('❌ Resend OTP Error:', err.response?.data)
    openError(err.response?.data?.detail || JSON.stringify(err.response?.data))
  }
}


// =============================
// 🔹 OTP Handling
// =============================
const startCountdown = () => {
  clearInterval(timer)
  countdown.value = 30
  timer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else clearInterval(timer)
  }, 1000)
}

const handleOtpInput = (index, event) => {
  const value = event.target.value.replace(/\D/g, '').slice(0, 1)
  otpInputs.value[index] = value
  if (value && index < 5) document.querySelectorAll('.otp-input input')[index + 1]?.focus()
}

const handleOtpBackspace = index => {
  if (index > 0 && !otpInputs.value[index]) document.querySelectorAll('.otp-input input')[index - 1]?.focus()
}

const triggerConfetti = () => {
  const duration = 1600
  const end = Date.now() + duration
  ;(function frame() {
    confetti({
      particleCount: 8,
      startVelocity: 28,
      spread: 360,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

const verifyOtp = async () => {
  const otpValue = otpInputs.value.join('')
  if (otpValue.length !== 6) {
    openError('⚠️ Please enter all 6 digits.')
    return
  }
  isVerifying.value = true
  try {
    await axios.post(VERIFY_OTP_API, {
      session_id: otpData.value.session_id,
      otp: otpValue,
    }, { headers: { 'Content-Type': 'application/json' } })
    openSnack('🎉 User verified successfully!', 'success')
    isOtpDrawerVisible.value = false
    showSuccessAnimation.value = true
    triggerConfetti()
    setTimeout(() => (showSuccessAnimation.value = false), 2200)
    fetchUsers()
  } catch (err) {
    openError(err.response?.data?.detail || 'Invalid OTP. Please try again.')
  } finally {
    isVerifying.value = false
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
  { title: 'Actions', key: 'actions', sortable: false },
]
</script>

<template>
  <section>
    <!-- 🧾 User Table -->
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>User Management</VCardTitle>
        <VCardSubtitle>Register, verify & manage users</VCardSubtitle>
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
            <VAvatar color="primary" size="32">
              <span>{{ item.full_name ? item.full_name[0] : '?' }}</span>
            </VAvatar>
            <strong>{{ item.full_name }}</strong>
          </div>
        </template>

        <template #item.role="{ item }">
          <VChip color="primary" label size="small">
            {{ getRoleName(item.role) }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn icon color="primary" variant="text" @click="openUpdateDialog(item)">
            <VIcon icon="tabler-pencil" />
          </VBtn>
          <VBtn icon color="error" variant="text" @click="confirmDelete(item)">
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
      style="backdrop-filter: blur(12px);"
    >
      <VSheet
        color="primary"
        class="pa-5 text-white d-flex align-center justify-space-between"
        style="background: linear-gradient(135deg, #4f46e5, #6d28d9);"
      >
        <div>
          <div class="text-h6 font-weight-bold">Register New User</div>
          <div class="text-caption text-white text-opacity-80">Fill in all details below</div>
        </div>
        <VBtn icon color="white" variant="text" @click="isAddUserDrawerVisible = false">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VSheet>

      <VCard flat class="pa-6">
        <VForm @submit.prevent="addUser" class="d-flex flex-column gap-y-4">
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

    <!-- 🎉 OTP Verification Drawer -->
    <VNavigationDrawer
      v-model="isOtpDrawerVisible"
      location="right"
      width="420"
      temporary
      class="elevation-10 rounded-l-xl"
      style="backdrop-filter: blur(10px);"
    >
      <VSheet
        class="pa-5 text-white d-flex align-center justify-space-between"
        style="background: linear-gradient(135deg, #16a34a, #15803d);"
      >
        <div>
          <div class="text-h6 font-weight-bold">Verify Account</div>
          <div class="text-caption text-white text-opacity-80">Enter OTP sent to user</div>
        </div>
        <VBtn icon color="white" variant="text" @click="isOtpDrawerVisible = false">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VSheet>

      <VCard flat class="pa-6 text-center">
        <div class="d-flex justify-center gap-3 mb-5 otp-input">
          <VTextField
            v-for="(digit, index) in 6"
            :key="index"
            v-model="otpInputs[index]"
            maxlength="1"
            variant="outlined"
            hide-details
            color="success"
            class="rounded-xl"
            style="width: 50px; height: 58px; text-align: center; font-size: 1.4rem;"
            @input="handleOtpInput(index, $event)"
            @keydown.backspace="handleOtpBackspace(index)"
          />
        </div>

        <VBtn
          color="success"
          block
          size="large"
          class="text-white elevation-2 rounded-lg"
          prepend-icon="tabler-shield-check"
          @click="verifyOtp"
          :disabled="isVerifying"
        >
          <template v-if="!isVerifying">Verify OTP</template>
          <template v-else>
            <VProgressCircular indeterminate color="white" size="18" class="mr-2" />
            Verifying...
          </template>
        </VBtn>

       <div class="mt-5 text-caption text-medium-emphasis text-center">
  Didn’t receive the OTP?

  <VTooltip text="Click to resend OTP" v-if="countdown <= 0">
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        variant="tonal"
        color="primary"
        size="small"
        class="rounded-pill px-4 font-weight-medium resend-btn"
        prepend-icon="tabler-refresh"
        :disabled="countdown > 0"
        @click="resendOtp"
      >
        <template v-if="countdown > 0">
          <VIcon icon="tabler-clock" size="16" class="mr-1" />
          Resend in {{ countdown }}s
        </template>
        <template v-else>
          Resend Now
        </template>
      </VBtn>
    </template>
  </VTooltip>

  <VTooltip v-else text="Wait before resending again">
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        variant="text"
        color="grey"
        size="small"
        disabled
        class="opacity-75 cursor-not-allowed"
      >
        <VIcon icon="tabler-clock" size="16" class="mr-1" />
        Resend in {{ countdown }}s
      </VBtn>
    </template>
  </VTooltip>
</div>




      </VCard>
    </VNavigationDrawer>

    <!-- 🟣 Update Dialog -->
    <VDialog v-model="isUpdateDialogVisible" max-width="560px" transition="dialog-bottom-transition" persistent>
      <VCard class="rounded-xl shadow-xl overflow-hidden" style="background: linear-gradient(145deg, #ffffff, #f9f9ff);">
        <VCardTitle class="text-center py-5 text-white" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-bottom: 4px solid #4f46e5;">
          <div class="d-flex flex-column align-center w-100">
            <VAvatar color="white" size="56" class="mb-2 elevation-3">
              <VIcon color="primary" icon="tabler-edit" size="32" />
            </VAvatar>
            <span class="text-h5 font-weight-bold">Edit User Details</span>
            <span class="text-caption text-white text-opacity-80">Modify user information below</span>
          </div>
        </VCardTitle>

        <VCardText class="pt-6 px-6">
          <VRow dense>
            <VCol cols="12" sm="6">
              <VTextField v-model="selectedUser.full_name" label="Full Name" variant="outlined" density="comfortable" prepend-inner-icon="tabler-user" hide-details />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="selectedUser.email" label="Email" variant="outlined" density="comfortable" prepend-inner-icon="tabler-mail" hide-details />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="selectedUser.phone_number" label="Phone Number" variant="outlined" density="comfortable" prepend-inner-icon="tabler-phone" hide-details />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="selectedUser.role"
                :items="roles"
                item-title="title"
                item-value="value"
                label="Select Role"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-id"
                hide-details
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="justify-end py-4 px-6 bg-grey-lighten-4" style="border-top: 1px solid #e0e0e0;">
          <VBtn variant="outlined" color="error" class="rounded-lg px-5" prepend-icon="tabler-x" @click="isUpdateDialogVisible = false">
            Cancel
          </VBtn>
          <VBtn color="primary" variant="flat" class="rounded-lg px-5 elevation-2" prepend-icon="tabler-check" @click="saveUpdatedUser" :loading="isSavingUpdate" :disabled="isSavingUpdate">
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- 🔴 Delete Confirmation -->
    <VDialog v-model="isDeleteDialogVisible" max-width="460px" transition="dialog-bottom-transition" persistent>
      <VCard class="rounded-xl shadow-lg overflow-hidden" style="background: linear-gradient(145deg, #ffffff, #faf8ff);">
        <VCardTitle class="text-center py-5 text-white" style="background: linear-gradient(135deg, #ef4444, #b91c1c); border-bottom: 3px solid #991b1b;">
          <div class="d-flex flex-column align-center w-100">
            <VAvatar color="white" size="56" class="mb-2 elevation-3">
              <VIcon color="error" icon="tabler-alert-triangle" size="32" />
            </VAvatar>
            <span class="text-h5 font-weight-bold">Confirm Deletion</span>
            <span class="text-caption text-white text-opacity-80">This action cannot be undone.</span>
          </div>
        </VCardTitle>

        <VCardText class="text-center py-6 px-6">
          <div class="text-body-1 text-high-emphasis mb-2">
            Are you sure you want to permanently delete
            <strong class="text-error">{{ userToDelete?.full_name }}</strong>?
          </div>
          <div class="text-caption text-medium-emphasis">
            The user and all associated data will be removed permanently.
          </div>
        </VCardText>

        <VCardActions class="justify-end py-4 px-6 bg-grey-lighten-4" style="border-top: 1px solid #e0e0e0;">
          <VBtn variant="outlined" color="secondary" class="rounded-lg px-5" prepend-icon="tabler-x" @click="isDeleteDialogVisible = false">
            Cancel
          </VBtn>
          <VBtn color="error" variant="flat" class="rounded-lg px-5 elevation-2" prepend-icon="tabler-trash" @click="deleteUser" :loading="isDeleting" :disabled="isDeleting">
            Yes, Delete User
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- ✅ Success Overlay -->
    <transition name="fade">
      <div
        v-if="showSuccessAnimation"
        class="fixed inset-0 d-flex flex-column align-center justify-center"
        style="background: rgba(255,255,255,0.8); backdrop-filter: blur(6px); z-index: 9999;"
      >
        <VAvatar color="success" size="100" class="mb-4">
          <VIcon icon="tabler-check" size="64" />
        </VAvatar>
        <h2 class="text-h5 text-success font-weight-bold mb-2">Verification Successful!</h2>
        <p class="text-body-2 text-medium-emphasis">User account has been verified.</p>
      </div>
    </transition>

    <!-- 🔔 Snackbar -->
    <VSnackbar v-model="showSnack" :color="snackColor" timeout="2800" location="top right">
      {{ successMessage || errorMessage }}
    </VSnackbar>
  </section>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.otp-input input {
  text-align: center;
  font-size: 1.4rem;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.25s ease;
}
.otp-input input:focus {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.3);
  transform: scale(1.05);
}
</style>
