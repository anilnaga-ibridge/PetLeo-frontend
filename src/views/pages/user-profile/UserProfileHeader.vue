<script setup>
import { usePermissionStore } from '@/stores/permissionStore'
import { providerApi } from '@/plugins/axios'
import { storeToRefs } from 'pinia'
import { avatarText } from '@core/utils/formatters'

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
  fd.append('auth_user_id', userData.value.id)

  try {
    const res = await providerApi.post('/api/provider/profile/', fd)
    const newAvatar = res.data.avatar || (res.data.data && res.data.data.avatar)

    if (newAvatar) {
      // Update store and cookie manually for immediate feedback
      const updatedData = { ...userData.value, avatar: newAvatar }

      permissionStore.userData = updatedData
      userData.value = updatedData
      localStorage.setItem('userData', JSON.stringify(updatedData))
    }
  } catch (err) {
    console.error('Failed to upload avatar', err)
  } finally {
    loading.value = false
  }
}

const profileHeaderData = computed(() => {
  if (!userData.value) return null

  return {
    fullName: userData.value.fullName || userData.value.full_name || userData.value.username,
    designation: (userData.value.role?.name || userData.value.role || 'User').toUpperCase(),
    location: 'India',
    joiningDate: new Date(userData.value.date_joined || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    profileImg: userData.value.avatar,
    coverImg: 'https://demos.pixinvent.com/vuexy-vuejs-admin-template/demo-1/assets/pages/profile-banner.png',
  }
})
</script>

<template>
  <VCard v-if="profileHeaderData">
    <VImg
      :src="profileHeaderData.coverImg"
      min-height="125"
      max-height="250"
      cover
    />

    <VCardText class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6">
      <div class="d-flex h-0 position-relative">
        <input
          ref="refInputEl"
          type="file"
          name="file"
          accept=".jpeg,.png,.jpg,gif"
          hidden
          @input="uploadAvatar"
        >

        <VAvatar
          rounded
          size="130"
          color="primary"
          variant="tonal"
          class="user-profile-avatar mx-auto cursor-pointer"
          @click="refInputEl?.click()"
        >
          <VImg
            v-if="profileHeaderData.profileImg"
            :src="profileHeaderData.profileImg"
          />
          <VIcon
            v-else-if="!loading"
            icon="tabler-user"
            size="48"
          />

          <VProgressCircular
            v-if="loading"
            indeterminate
            color="primary"
          />
          <div
            v-else
            class="avatar-overlay d-flex align-center justify-center"
          >
            <VIcon
              icon="tabler-camera"
              color="white"
            />
          </div>
        </VAvatar>
      </div>

      <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
        <h4 class="text-h4 text-center text-sm-start font-weight-medium mb-2">
          {{ profileHeaderData?.fullName }}
        </h4>

        <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-5">
          <div class="d-flex flex-wrap justify-center justify-sm-start flex-grow-1 gap-6">
            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-palette"
              />
              <div class="text-body-1 font-weight-medium">
                {{ profileHeaderData?.designation }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-map-pin"
              />
              <div class="text-body-1 font-weight-medium">
                {{ profileHeaderData?.location }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-calendar"
              />
              <div class="text-body-1 font-weight-medium">
                {{ profileHeaderData?.joiningDate }}
              </div>
            </span>
          </div>

          <VBtn prepend-icon="tabler-user-check">
            Connected
          </VBtn>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.125rem;
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 40%);
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  &:hover .avatar-overlay {
    opacity: 1;
  }
}
</style>
