<script setup>
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
  await permissionStore.fetchPermissions()
  await fetchAllowedServices()
})

const filteredNavItems = computed(() => {
  // Deep copy to avoid mutating original
  const items = JSON.parse(JSON.stringify(providerNavItems))
  
  return items.map(item => {
    // Inject children into 'Services' item
    if (item.title === 'Services' && allowedServices.value.length > 0) {
      item.children = allowedServices.value.map(svc => ({
        title: svc.name,
        to: { name: 'provider-service-details', params: { serviceId: svc.service_id } },
        icon: { icon: svc.icon || 'tabler-circle' },
      }))
    }
    return item
  }).filter(item => {
    if (!item.permission) return true
    return permissionStore.hasPermission(item.permission)
  })
})

console.log('ProviderLayout: themeConfig', themeConfig)
</script>

<template>
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
        <div class="d-flex align-center cursor-pointer" style="user-select: none;">
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
