<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'
import { ref, computed } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const permissionStore = usePermissionStore()
const { userData } = storeToRefs(permissionStore)
const loading = ref(false)
const refInputEl = ref()

const uploadAvatar = async e => {
  const file = e.target.files[0]
  if (!file) return

  loading.value = true

  const fd = new FormData()

  fd.append('avatar', file)
  fd.append('auth_user_id', userData.value.id || userData.value.auth_user_id)

  try {
    const { providerApi } = await import('@/plugins/axios')
    const res = await providerApi.post(`/api/provider/profile/`, fd)
    const newAvatar = res.data.avatar || (res.data.data && res.data.data.avatar)
    if (newAvatar) {
      const userDataCookie = useCookie('userData')
      const updatedData = { ...userData.value, avatar: newAvatar }
      
      permissionStore.userData = updatedData
      userDataCookie.value = updatedData
      localStorage.setItem('userData', JSON.stringify(updatedData))
    }
  } catch (err) {
    console.error('Failed to upload avatar', err)
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const isEmployee = computed(() => {
  const role = (userData.value?.role || '').toUpperCase()
  const providerType = userData.value?.provider_type || userData.value?.providerType
  
  // They are an employee if:
  // 1. They explicitly have an employee role
  const employeeRoles = ['EMPLOYEE', 'DOCTOR', 'RECEPTIONIST', 'LAB TECH', 'PHARMACY', 'VITALS STAFF']
  if (employeeRoles.includes(role)) return true
  
  // 2. Or they do NOT have a provider_type (Owners always have ORGANIZATION or INDIVIDUAL)
  if (!providerType) return true
  
  // 3. Or their role is NOT one of the primary provider roles
  const providerRoles = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER']
  if (!providerRoles.includes(role)) return true

  return false
})

// Human-readable label for the role shown in the profile menu
const roleLabel = computed(() => {
  const role = (userData.value?.role || '').toUpperCase()
  const pType = (userData.value?.provider_type || userData.value?.providerType || '').toUpperCase()

  // Prioritize Provider Type for the label only if they are a primary provider
  const providerRoles = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER']
  if (providerRoles.includes(role)) {
    if (pType === 'ORGANIZATION') return 'Organization'
    if (pType === 'INDIVIDUAL') return 'Individual Provider'
  }

  const ROLE_LABELS = {
    'ORGANIZATION': 'Organization',
    'INDIVIDUAL': 'Individual Provider',
    'PROVIDER': 'Provider',
    'SERVICE_PROVIDER': 'Service Provider',
    'DOCTOR': 'Doctor',
    'RECEPTIONIST': 'Receptionist',
    'EMPLOYEE': 'Employee',
    'LAB TECH': 'Lab Technician',
    'PHARMACY': 'Pharmacist',
    'VITALS STAFF': 'Vitals Staff',
    'PETOWNER': 'Pet Owner',
  }
  
  if (ROLE_LABELS[role]) return ROLE_LABELS[role]

  // Fallback to capitalized role
  return userData.value?.role 
    ? userData.value.role.charAt(0).toUpperCase() + userData.value.role.slice(1).toLowerCase() 
    : 'User'
})

const profileRoute = computed(() => {
  console.log('🚀 [ProviderUserProfile] userData:', userData.value)
  console.log('🚀 [ProviderUserProfile] isEmployee:', isEmployee.value)
  
  return isEmployee.value ? '/employee/profile' : '/provider/profile'
})

const userProfileList = computed(() => {
  const list = [
    { type: 'divider' },
    {
      type: 'navItem',
      icon: 'tabler-user',
      title: 'Profile',
      to: profileRoute.value,
    },
    {
      type: 'navItem',
      icon: 'tabler-camera',
      title: 'Change Avatar',
      onClick: () => refInputEl.value?.click(),
    },
  ]

  // Add provider-specific items only if NOT an employee
  if (!isEmployee.value) {
    list.push(
      {
        type: 'navItem',
        icon: 'tabler-settings',
        title: 'Settings',
        to: { name: 'provider-settings-tab', params: { tab: 'account' } },
      },
      {
        type: 'navItem',
        icon: 'tabler-file-dollar',
        title: 'Billing Plan',
        to: { name: 'provider-settings-tab', params: { tab: 'billing-plans' } },
        badgeProps: {
          color: 'error',
          content: '4',
        },
      },
      { type: 'divider' },
      {
        type: 'navItem',
        icon: 'tabler-currency-dollar',
        title: 'Pricing',
        to: { name: 'provider-pricing' },
      },
      {
        type: 'navItem',
        icon: 'tabler-help',
        title: 'FAQ',
        to: { name: 'provider-faq' },
      },
    )
  }

  // Always show Logout
  list.push(
    { type: 'divider' },
    {
      type: 'navItem',
      icon: 'tabler-logout',
      title: 'Logout',
      onClick: logout,
    },
  )

  return list
})
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
    bordered
    :loading="loading"
  >
    <input
      ref="refInputEl"
      type="file"
      name="file"
      accept=".jpeg,.png,.jpg,gif"
      hidden
      @input="uploadAvatar"
    >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg
        v-if="userData && userData.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="tabler-user"
      />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg
                      v-if="userData && userData.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="tabler-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ userData?.fullName || userData?.username }}
            </VListItemTitle>
            <VListItemSubtitle>
              {{ roleLabel }}
            </VListItemSubtitle>
          </VListItem>

          <PerfectScrollbar
            v-if="userProfileList && userProfileList.length"
            :options="{ wheelPropagation: false }"
          >
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
                @click="item.onClick && item.onClick()"
              >
                <template #prepend>
                  <VIcon
                    class="me-2"
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>

                <template
                  v-if="item.badgeProps"
                  #append
                >
                  <VBadge
                    v-bind="item.badgeProps"
                    inline
                  />
                </template>
              </VListItem>

              <VDivider
                v-else
                class="my-2"
              />
            </template>
          </PerfectScrollbar>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
