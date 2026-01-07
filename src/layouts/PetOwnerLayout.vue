<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const theme = useTheme()

const navigation = [
  {
    title: 'Home',
    icon: 'tabler-smart-home',
    to: '/pet-owner/dashboard',
  },
  {
    title: 'My Pets',
    icon: 'tabler-paw',
    to: '/pet-owner/pets',
  },
  {
    title: 'Visits',
    icon: 'tabler-history',
    to: '/pet-owner/visits',
  },
  {
    title: 'Profile',
    icon: 'tabler-user',
    to: '/pet-owner/profile',
  },
]

import { useCookie } from '@/@core/composable/useCookie'

const logout = () => {
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
  router.replace('/login')
}
</script>

<template>
  <VApp>
    <!-- App Bar -->
    <VAppBar app flat border class="px-4">
      <div class="d-flex align-center gap-2">
        <VIcon icon="tabler-paw" color="primary" size="28" />
        <span class="text-h6 font-weight-bold text-primary">PetLeo</span>
      </div>
      <VSpacer />
      <VBtn icon size="small" @click="theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'">
        <VIcon :icon="theme.global.current.value.dark ? 'tabler-sun' : 'tabler-moon'" />
      </VBtn>
    </VAppBar>

    <!-- Main Content -->
    <VMain class="bg-grey-50">
      <VContainer class="pa-4 pb-16">
        <slot />
      </VContainer>
    </VMain>

    <!-- Bottom Navigation (Mobile Only) -->
    <VBottomNavigation
      grow
      color="primary"
      border
      class="d-md-none"
    >
      <VBtn
        v-for="item in navigation"
        :key="item.title"
        :to="item.to"
        :value="item.to"
      >
        <VIcon :icon="item.icon" />
        <span>{{ item.title }}</span>
      </VBtn>
    </VBottomNavigation>

    <!-- Side Navigation (Desktop Only) -->
    <VNavigationDrawer
      permanent
      app
      class="d-none d-md-block"
      width="260"
    >
      <VList nav class="mt-4">
        <VListItem
          v-for="item in navigation"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          active-class="bg-primary text-white"
          class="mb-2 rounded-lg"
        />
      </VList>

      <template #append>
        <div class="pa-4">
          <VBtn block color="error" variant="tonal" prepend-icon="tabler-logout" @click="logout">
            Logout
          </VBtn>
        </div>
      </template>
    </VNavigationDrawer>
  </VApp>
</template>

<style scoped>
.bg-grey-50 {
  background-color: #f8fafc !important;
}
</style>
