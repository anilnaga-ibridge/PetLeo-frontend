<script setup>
console.log('🚀 App.vue: Script Setup Start')
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import {
  initConfigStore,
  useConfigStore,
} from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'

const { global } = useTheme()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()



import AppLockScreen from '@/components/AppLockScreen.vue'
import { useIdleTimer } from '@/composables/useIdleTimer'

// Initialize idle timer
const { isLocked } = useIdleTimer()

import { useCartStore } from '@/stores/cartStore'
import CartDrawer from '@/pages/pet-owner/components/CartDrawer.vue'
import { ref, onBeforeMount } from 'vue'

const cartStore = ref(null)
onBeforeMount(() => {
  cartStore.value = useCartStore()
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
    <div v-show="!isLocked">
      <RouterView />
    </div>
    <AppLockScreen />
      <ScrollToTop />
      <CartDrawer v-if="cartStore" v-model="cartStore.isOpen" />
    </VApp>
  </VLocaleProvider>
</template>
