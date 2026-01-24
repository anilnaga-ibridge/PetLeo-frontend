<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const theme = useTheme()
const drawer = ref(true)

const navigation = [
  {
    title: 'Dashboard',
    icon: 'tabler-smart-home',
    to: '/employee/dashboard',
  },
  {
    title: 'Assigned Services',
    icon: 'tabler-list-check',
    to: '/employee/services', // Placeholder
  },
  {
    title: 'Profile',
    icon: 'tabler-user',
    to: '/employee/profile', // Placeholder
  },
]

import { useCookie } from '@/@core/composable/useCookie'

const logout = () => {
  // 1. Clear cookies (triggers reactivity for guards)
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null

  // 2. Clear local/session storage (just in case)
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('userAbilityRules')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userData')

  // 3. Redirect
  router.replace('/login')
}
</script>

<template>
  <VApp>
    <!-- Navigation Drawer -->
    <VNavigationDrawer
      v-model="drawer"
      app
    >
      <div class="d-flex align-center justify-center pa-4">
        <h2 class="text-h5 font-weight-bold text-primary">
          PetLeo Employee Portal
        </h2>
      </div>

      <VList nav>
        <VListItem
          v-for="item in navigation"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          active-class="bg-primary text-white"
          class="mb-1 rounded-lg"
        />
      </VList>

      <template #append>
        <div class="pa-4">
          <VBtn
            block
            color="error"
            variant="tonal"
            prepend-icon="tabler-logout"
            @click="logout"
          >
            Logout
          </VBtn>
        </div>
      </template>
    </VNavigationDrawer>

    <!-- App Bar -->
    <VAppBar
      app
      flat
      border
    >
      <VAppBarNavIcon @click="drawer = !drawer" />
      <VSpacer />
      <VBtn
        icon
        @click="theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'"
      >
        <VIcon :icon="theme.global.current.value.dark ? 'tabler-sun' : 'tabler-moon'" />
      </VBtn>
    </VAppBar>

    <!-- Main Content -->
    <VMain>
      <VContainer
        fluid
        class="pa-6"
      >
        <slot />
      </VContainer>
    </VMain>
  </VApp>
</template>
