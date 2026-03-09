<script setup>
import navItems from '@/navigation/vertical'
import superAdminNav from '@/navigation/vertical/super-admin'
import getProviderNavigation from '@/navigation/vertical/provider'
import { themeConfig } from '@themeConfig'
import { usePermissionStore } from '@/stores/permissionStore'
import { computed, onMounted, watch, defineAsyncComponent, ref } from 'vue'
import { useSkins } from '@core/composable/useSkins'

const permissionStore = usePermissionStore()

// Get User Role Helper (Reactive & Normalized)
const userRole = computed(() => {
  const data = permissionStore.userData
  if (!data) return ''
  
  // Normalize: Uppercase and handle underscores/dashes
  return (data.role?.name || data.role || '').toUpperCase().replace(/[- ]/g, '_')
})


onMounted(() => {
  const role = userRole.value

  console.log(`⏱️ [${new Date().toISOString()}] Sidebar: Layout Mounted. Role: ${role}, Ready: ${permissionStore.isDynamicAccessLoaded}`)
    
  // Guard: If for some reason the router guard was skipped and we aren't loaded, fetch now.
  const providerRoles = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'EMPLOYEE', 'SERVICE_PROVIDER']
  if (providerRoles.includes(role) && !permissionStore.isDynamicAccessLoaded) {
    console.log(`⚠️ Sidebar: Data missing on mount! Calling fetchDynamicAccess...`)
    permissionStore.fetchDynamicAccess()
  } else {
    permissionStore.isDynamicAccessLoaded = true
  }
})

const filteredNavItems = computed(() => {
  console.log('🔄 Sidebar: Re-calculating filteredNavItems')

  const role = userRole.value
  
  // Roles that use the Provider-specific dynamic navigation
  const providerRoles = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'EMPLOYEE', 'SERVICE_PROVIDER']
  const isProvider = providerRoles.includes(role)
  
  // Roles that use the internal Super Admin navigation
  const isSuperAdmin = ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(role) || permissionStore.userData?.is_superuser
  
  console.log('🔍 Sidebar Debug: Role:', role, 'isProvider:', isProvider, 'isSuperAdmin:', isSuperAdmin)
  
  let items = []

  if (isSuperAdmin) {
    console.log('🛡️ Sidebar: Applying STRICT Super Admin Navigation (is_superuser check passed)')
    items = superAdminNav
  } else if (isProvider) {
    console.log('🏥 Sidebar: Applying Provider Navigation')
    items = getProviderNavigation()
  } else {
    console.log('📦 Sidebar: Applying Default Navigation (Demo/Common)')
    items = navItems
  }
  
  console.log(`🧭 Sidebar: Initial Items: ${items.length}, DynamicLoaded: ${permissionStore.isDynamicAccessLoaded}`)

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

// Computed Property for App Readiness
const isAppReady = computed(() => {
  const role = userRole.value
  const isProvider = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'EMPLOYEE'].includes(role)
  
  if (isProvider) {
    // STRICT: Wait for BOTH dynamic access (modules) AND permissions (capabilities)
    return permissionStore.isDynamicAccessLoaded && permissionStore.isPermissionsLoaded
  }
  
  return true
})

watch(
  () => permissionStore.permissions,
  newVal => {
    console.log('⚡ PERMISSIONS CHANGED:', newVal)
  },
  { deep: true, immediate: true },
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
import { useRoute } from 'vue-router'

const route = useRoute()

const isProviderArea = computed(() => {
  return (route.path && (route.path.includes('/provider/') || route.path.includes('/employee/'))) || 
         (route.name && (String(route.name).startsWith('provider-') || String(route.name).startsWith('employee-'))) ||
         (route.name && (String(route.name).includes('providerhome') || String(route.name).includes('employeehome')))
})
</script>

<template>
  <VerticalNavLayout
    v-if="!isProviderArea"
    :nav-items="filteredNavItems"
  >
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
  <div
    v-else
    class="layout-wrapper layout-blank"
  >
    <slot />
  </div>
</template>
