<script setup>
import { kFormatter, avatarText } from '@/@core/utils/formatters'
import { authApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'
import { useCookie } from '@/@core/composable/useCookie'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
  providerProfile: {
    type: Array,
    default: () => [],
  },
})

const permissionStore = usePermissionStore()

// Filter out fields already shown in standard UI
const extendedFields = computed(() => {
  const ignoredFields = [
    'first_name', 'last_name', 'email', 'phone_number', 'country', 'language', 'profile_image'
  ]
  
  return props.providerProfile.filter(
    f => !ignoredFields.includes(f.name) && 
         !['file', 'section'].includes(f.field_type) &&
         f.value
  ).map(f => ({
    label: f.label,
    value: f.value
  }))
})

// Transform API response into UI-friendly data
const user = computed(() => ({
  id: props.userData.id || props.userData.auth_user_id,
  fullName: props.userData.fullName || props.userData.full_name || '',
  email: props.userData.email || '',
  avatar: props.userData.avatar || null,
  role: props.userData.role || 'user',
  status: props.userData.status || 'active',
  taxId: props.userData.taxId || props.userData.tax_id || 'N/A',
  contact: props.userData.contact || props.userData.phone || props.userData.phoneNumber || '',
  language: props.userData.language || 'English',
  country: props.userData.country || '',
  taskDone: props.userData.taskDone || props.userData.task_done || 0,
  projectDone: props.userData.projectDone || props.userData.project_done || 0,
}))

const isUserInfoEditDialogVisible = ref(false)
const isUpgradePlanDialogVisible = ref(false)

const updateUser = async (updatedData) => {
  try {
    const payload = {
      full_name: updatedData.fullName,
      email: updatedData.email,
      // Add other fields as supported by UserUpdateSerializer
    }
    
    await authApi.patch(`/users/${user.value.id}/`, payload)
    
    // Update local state
    const userDataCookie = useCookie('userData')
    const finalData = { ...props.userData, ...updatedData }
    
    permissionStore.userData = finalData
    userDataCookie.value = finalData
    localStorage.setItem('userData', JSON.stringify(finalData))
    
    console.log("✅ UserBioPanel: Profile updated successfully")
  } catch (err) {
    console.error("❌ UserBioPanel: Failed to update profile", err)
  }
}

const standardPlan = {
  plan: 'Standard',
  price: 99,
  benefits: ['10 Users', 'Up to 10GB storage', 'Basic Support'],
}

const resolveUserRoleVariant = role => {
  const map = {
    subscriber: { color: 'warning', icon: 'tabler-user' },
    author: { color: 'success', icon: 'tabler-circle-check' },
    maintainer: { color: 'primary', icon: 'tabler-chart-pie-2' },
    editor: { color: 'info', icon: 'tabler-pencil' },
    admin: { color: 'secondary', icon: 'tabler-server-2' },
  }

  
  return map[role] || { color: 'primary', icon: 'tabler-user' }
}
</script>

<template>
  <VRow>
    <!-- SECTION User Details -->
    <VCol cols="12">
      <VCard v-if="user">
        <VCardText class="text-center pt-12">
          <!-- Avatar -->
          <VAvatar
            rounded
            :size="100"
            :color="!user.avatar ? 'primary' : undefined"
            :variant="!user.avatar ? 'tonal' : undefined"
          >
            <VImg
              v-if="user.avatar"
              :src="user.avatar"
            />

            <span
              v-else
              class="text-5xl font-weight-medium"
            >
              {{ avatarText(user.fullName) }}
            </span>
          </VAvatar>

          <!-- Full Name -->
          <h5 class="text-h5 mt-4">
            {{ user.fullName }}
          </h5>

          <!-- Role -->
          <VChip
            label
            :color="resolveUserRoleVariant(user.role).color"
            size="small"
            class="text-capitalize mt-4"
          >
            {{ user.role }}
          </VChip>
        </VCardText>

        <VCardText>
          <!-- Task / Project -->
          <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
            <div class="d-flex align-center me-8">
              <VAvatar
                size="40"
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
              >
                <VIcon
                  icon="tabler-checkbox"
                  size="24"
                />
              </VAvatar>

              <div>
                <h5 class="text-h5">
                  {{ kFormatter(user.taskDone) }}
                </h5>
                <span class="text-sm">Task Done</span>
              </div>
            </div>

            <div class="d-flex align-center me-4">
              <VAvatar
                size="38"
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
              >
                <VIcon
                  icon="tabler-briefcase"
                  size="24"
                />
              </VAvatar>

              <div>
                <h5 class="text-h5">
                  {{ kFormatter(user.projectDone) }}
                </h5>
                <span class="text-sm">Project Done</span>
              </div>
            </div>
          </div>

          <!-- Details -->
          <h5 class="text-h5">
            Details
          </h5>

          <VDivider class="my-4" />

          <!-- List -->
          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Username:
                  <span class="text-body-1">{{ user.fullName }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="text-h6">Billing Email:</span>
                <span class="text-body-1">{{ user.email }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Status: <span class="text-body-1">{{ user.status }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Role: <span class="text-body-1">{{ user.role }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Contact: <span class="text-body-1">{{ user.contact }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Country: <span class="text-body-1">{{ user.country }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <!-- Extended / Dynamic Fields -->
            <template
              v-for="field in extendedFields"
              :key="field.label"
            >
              <VListItem>
                <VListItemTitle>
                  <h6 class="text-h6">
                    {{ field.label }}: <span class="text-body-1">{{ field.value }}</span>
                  </h6>
                </VListItemTitle>
              </VListItem>
            </template>
          </VList>
        </VCardText>

        <VCardText class="d-flex justify-center gap-x-4">
          <VBtn
            variant="elevated"
            @click="isUserInfoEditDialogVisible = true"
          >
            Edit
          </VBtn>

          <VBtn
            variant="tonal"
            color="error"
          >
            Suspend
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <UserInfoEditDialog
    v-model:is-dialog-visible="isUserInfoEditDialogVisible"
    :user-data="user"
    @submit="updateUser"
  />

  <UserUpgradePlanDialog v-model:is-dialog-visible="isUpgradePlanDialogVisible" />
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}
.text-capitalize {
  text-transform: capitalize !important;
}
</style>
