<script setup>
import { useTheme } from 'vuetify'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import ProviderUserProfile from '@/components/ProviderUserProfile.vue'
import veterinaryNavigation from '@/navigation/vertical/veterinary'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import NavBarI18n from '@core/components/I18n.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarNotifications from '@/layouts/components/NavbarNotifications.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { computed, onMounted } from 'vue'
import { themeConfig } from '@themeConfig'
import ClinicSwitcher from '@/components/veterinary/ClinicSwitcher.vue'

import { useCookie } from '@/@core/composable/useCookie'

const theme = useTheme()
const permissionStore = usePermissionStore()
const userData = useCookie('userData')

onMounted(async () => {
  // [FIX] Do NOT fetch global permissions here. 
  // ClinicSwitcher -> veterinaryStore.fetchClinics() handles Clinic-Specific Permission Sync.
  // fetching here would overwrite them with generic provider permissions.
})

const filteredNavItems = computed(() => {
  const user = userData.value || {}
  const rawRole = (user.role?.name || user.role || '').toUpperCase()
  
  console.log(`🏥 VeterinaryLayout: Role = "${rawRole}" | Filtering by capabilities...`)

  // Pure capability-based filtering for ALL roles
  // Each item in veterinaryNavigation has a 'capability' field with a direct VETERINARY_* key
  // hasCapability() does a deep search in permissionStore.permissions for that key
  return veterinaryNavigation.filter(item => {
    if (!item.capability) return true  // No restriction = visible to all vet staff
    
    return permissionStore.hasCapability(item.capability)
  })
})
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

        <!-- 👉 Module Title -->
        <div class="d-flex align-center ms-2">
          <VAvatar
            color="primary"
            variant="tonal"
            size="32"
            class="me-2"
          >
            <VIcon
              icon="tabler-stethoscope"
              size="20"
            />
          </VAvatar>
          <h3 class="text-h6 font-weight-bold text-primary mb-0">
            Veterinary Module
          </h3>
        </div>

        <ClinicSwitcher />

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
