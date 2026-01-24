<script setup>
import navItems from '@/navigation/vertical'
import getProviderNavigation from '@/navigation/vertical/provider'
import { themeConfig } from '@themeConfig'
import { usePermissionStore } from '@/stores/permissionStore'
import { computed } from 'vue'

const permissionStore = usePermissionStore()

// Get User Role Helper
const getUserRole = () => {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    
    return (userData.role?.name || userData.role || '').toUpperCase()
  } catch (e) {
    return ''
  }
}

import { onMounted } from 'vue'

onMounted(() => {
    if (['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER'].includes(getUserRole())) {
        permissionStore.fetchDynamicAccess()
    }
})

const filteredNavItems = computed(() => {
  console.log('🔄 Sidebar: Re-calculating filteredNavItems')
  const role = getUserRole()
  const isProvider = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER'].includes(role)
  
  // Use Provider Navigation if Provider Role, otherwise Default (SuperAdmin)
  let items = isProvider ? getProviderNavigation() : navItems
  
  // MERGE DYNAMIC ITEMS
  if (permissionStore.dynamicModules && permissionStore.dynamicModules.length) {
      const dynItems = permissionStore.dynamicModules.map(mod => ({
          title: mod.name,
          to: mod.route.startsWith('/') ? { path: mod.route } : { name: mod.route },
          icon: { icon: mod.icon || 'tabler-box' },
          // Ensure they are not filtered out by default logic unless explicit capability check fails
          // But since they are dynamic, they are inherently allowed if present in the list returned by 'my-access'
      }))
      items = [...items, ...dynItems]
  }
  
  console.log('🧭 Sidebar: Raw Items:', items.length)

  return items.filter(item => {
    if (item.canView) {
      const res = item.canView()
      if (!res) console.log(`🚫 Sidebar: Hiding ${item.title} (canView=false)`)
      return res
    }
    
    if (item.capability) {
      return permissionStore.hasCapability(item.capability)
    }
    
    return true
  })
})

import { watch } from 'vue'
watch(
  () => permissionStore.permissions,
  (newVal) => {
    console.log('⚡ PERMISSIONS CHANGED:', newVal)
  },
  { deep: true, immediate: true }
)

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import NavSearchBar from '@/layouts/components/NavSearchBar.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'
</script>

<template>
  <VerticalNavLayout :nav-items="filteredNavItems">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>

        <NavSearchBar class="ms-lg-n3" />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <NavbarThemeSwitcher />
        <NavbarShortcuts />
        <NavBarNotifications class="me-1" />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer />
  </VerticalNavLayout>
</template>
