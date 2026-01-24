<script setup>
import { useCookie } from '@/@core/composable/useCookie'
import { avatarText } from '@core/utils/formatters'

const userData = useCookie('userData')

const profileHeaderData = computed(() => {
  if (!userData.value) return null
  
  return {
    fullName: userData.value.full_name || userData.value.username,
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
      <div class="d-flex h-0">
        <VAvatar
          rounded
          size="130"
          :image="profileHeaderData.profileImg"
          class="user-profile-avatar mx-auto"
        />
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
}
</style>
