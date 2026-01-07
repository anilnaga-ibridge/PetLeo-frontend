<script setup>
import pages401 from '@images/pages/401.png'
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'

definePage({
  alias: '/pages/misc/not-authorized',
  meta: {
    layout: 'blank',
    public: true,
  },
})

const authThemeMask = useGenerateImageVariant(miscMaskLight, miscMaskDark)

import { useRouter } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'

const router = useRouter()

// Double check authentication on mount
import { onMounted } from 'vue'

onMounted(() => {
  const userCookie = useCookie('userData').value
  const tokenCookie = useCookie('accessToken').value
  const user = userCookie || JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null')
  const token = tokenCookie || localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  
  if (!user || !token) {
    router.replace({ name: 'login', query: { to: router.currentRoute.value.fullPath } })
  }
})
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      status-code="401"
      title="You are not authorized! 🔐"
      description="You don’t have permission to access this page. Go Home!."
    />

    <VBtn
      class="mb-11"
      to="/"
    >
      Back To Home
    </VBtn>

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="pages401"
        alt="not autorized"
        :max-height="$vuetify.display.smAndDown ? 350 : 500"
        class="mx-auto"
      />
    </div>

    <img
      class="misc-footer-img d-none d-md-block"
      :src="authThemeMask"
      alt="misc-footer-img"
      height="320"
    >
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";
</style>
