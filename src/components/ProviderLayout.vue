<script setup>
console.log('🚀 ProviderLayout.vue: Script Setup Start')
import { useTheme } from 'vuetify'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import ProviderUserProfile from '@/components/ProviderUserProfile.vue'
import providerNavItems from '@/navigation/vertical/provider'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import NavBarI18n from '@core/components/I18n.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarNotifications from '@/layouts/components/NavbarNotifications.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { computed, onMounted, ref } from 'vue'
import { api } from '@/plugins/axios'

import { themeConfig } from '@themeConfig'

const theme = useTheme()
const permissionStore = usePermissionStore()
const allowedServices = ref([])

const fetchAllowedServices = async () => {
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/allowed-services/')

    allowedServices.value = res.data
  } catch (err) {
    console.error('Failed to fetch allowed services for sidebar:', err)
  }
}

onMounted(async () => {
  const role = (permissionStore.userData?.role?.name || permissionStore.userData?.role || '').toUpperCase()
  console.log(`⏱️ [${new Date().toISOString()}] ProviderLayout: Mounting... Role: ${role}, Ready: ${permissionStore.isDynamicAccessLoaded}`)
  
  if (!permissionStore.isDynamicAccessLoaded || !permissionStore.isPermissionsLoaded) {
    console.log(`⚠️ ProviderLayout: Data missing on mount! Initializing...`)
    // 1. Fetch Permissions (Standard)
    await permissionStore.fetchPermissions()
    
    // 2. Fetch Dynamic Access (Feature Modules)
    if (['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER'].includes(role)) {
      await permissionStore.fetchDynamicAccess()
    } else {
      permissionStore.isDynamicAccessLoaded = true
    }
  }

  // 3. Fetch Allowed Services (Sidebar)
  await fetchAllowedServices()
  
  console.log(`⏱️ [${new Date().toISOString()}] ProviderLayout: Initialization complete.`)
})

const filteredNavItems = computed(() => {
  // providerNavItems is now a function that returns the dynamic navigation array
  return providerNavItems()
})

console.log('ProviderLayout: themeConfig', themeConfig)
</script>

<template>
  <template v-if="permissionStore.isDynamicAccessLoaded">
    <VerticalNavLayout :nav-items="filteredNavItems">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical Nav Toggle -->
        <IconBtn
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="tabler-menu-2" />
        </IconBtn>

        <!-- 👉 Search -->
        <div
          class="d-flex align-center cursor-pointer"
          style="user-select: none;"
        >
          <IconBtn>
            <VIcon icon="tabler-search" />
          </IconBtn>
          <span class="d-none d-md-flex align-center text-disabled">
            <span class="me-3">Search</span>
            <span class="meta-key">&#8984;K</span>
          </span>
        </div>

        <VSpacer />

        <div class="d-flex align-center">
          <NavBarI18n
            v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
            :languages="themeConfig.app.i18n.langConfig"
            class="me-1"
          />
          <NavbarThemeSwitcher class="me-1" />
          <NavbarShortcuts class="me-1" />
          <NavbarNotifications class="me-2" />
          <ProviderUserProfile />
        </div>
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <!-- Footer content if needed -->
    </template>
  </VerticalNavLayout>
  </template>
  <div v-else class="h-100 d-flex align-center justify-center bg-white" style="position: fixed; inset: 0; z-index: 9999;">
    <div class="text-center">
      <VProgressCircular indeterminate color="primary" size="64" width="6" class="mb-4" />
      <div class="text-h6 text-medium-emphasis">Loading your workspace...</div>
    </div>
  </div>
</template>
