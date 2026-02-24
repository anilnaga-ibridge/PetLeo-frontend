<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useCookie } from '@/@core/composable/useCookie'
import { usePetOwnerProviderStore } from '@/stores/petOwnerProvider'
// import PetOwnerTrustDialogs from './PetOwnerTrustDialogs.vue'

const router = useRouter()
const theme = useTheme()
const store = usePetOwnerProviderStore()

const navigation = [
  {
    title: 'Home',
    icon: 'tabler-smart-home',
    to: '/pet-owner/book',
  },
  {
    title: 'My Family',
    icon: 'tabler-paw',
    to: '/pet-owner/pets',
  },
  {
    title: 'Medical Hub',
    icon: 'tabler-report-medical',
    to: '/pet-owner/my-bookings',
  },
  {
    title: 'Find Care',
    icon: 'tabler-search',
    to: '/pet-owner/book',
  },
]

const logout = () => {
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
  router.replace('/login')
}

onMounted(() => {
  console.log('🐾 [PetOwnerLayout] Mounted')
  console.log('🐾 [PetOwnerLayout] Nav items:', navigation)
})
</script>

<template>
  <!-- Use v-layout instead of v-app to avoid nesting conflicts with App.vue -->
  <v-layout class="premium-app h-100">
    <!-- Premium Navbar -->
    <VAppBar
      app
      flat
      class="px-4 glass-nav"
      height="72"
      border="b"
    >
      <VContainer class="d-flex align-center py-0 fill-height max-width-xl">
        <!-- Logo Brand -->
        <div 
          class="d-flex align-center gap-3 me-10 brand-container" 
          @click="router.push('/pet-owner/book')"
        >
          <div class="logo-box elevation-4">
             <VIcon
              icon="tabler-paw-filled"
              color="white"
              size="24"
            />
          </div>
          <span class="text-h4 font-weight-black tracking-tight brand-text">PetLeo</span>
        </div>

        <!-- Desktop Navigation Actions -->
        <div class="d-none d-lg-flex align-center gap-2 nav-links">
          <VBtn
            v-for="item in navigation"
            :key="item.title"
            :to="item.to"
            variant="text"
            rounded="pill"
            class="nav-btn text-subtitle-1 font-weight-black px-6"
            active-class="active-nav-btn"
          >
            <VIcon :icon="item.icon" class="mr-2" size="20" />
            {{ item.title }}
          </VBtn>

          <!-- Extra navigation slot for specific pages -->
          <slot name="nav-append" />
        </div>

        <VSpacer />

        <!-- Right Side Actions -->
        <div class="d-flex align-center gap-3">
          <VBtn
            icon
            variant="tonal"
            color="secondary"
            size="small"
            @click="theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'"
            class="rounded-lg"
          >
            <VIcon :icon="theme.global.current.value.dark ? 'tabler-sun' : 'tabler-moon'" />
          </VBtn>
          
          <VMenu transition="slide-y-transition" offset="10">
            <template #activator="{ props }">
              <VAvatar color="primary" class="elevation-4 border-avatar" v-bind="props" style="cursor: pointer">
                <VIcon icon="tabler-user" color="white" />
              </VAvatar>
            </template>
            <VList class="rounded-xl mt-2 elevation-10 py-2 min-width-150">
               <VListItem 
                 prepend-icon="tabler-user-edit" 
                 title="Edit Profile" 
                 to="/pet-owner/profile"
                 class="px-6 py-3 font-weight-bold"
               />
               <VDivider class="my-2 opacity-10" />
               <VListItem 
                 prepend-icon="tabler-logout-2" 
                 title="Logout" 
                 @click="logout" 
                 color="error" 
                 class="px-6 py-3 font-weight-black"
               />
            </VList>
          </VMenu>
        </div>
      </VContainer>
    </VAppBar>

    <!-- Main Content Area -->
    <VMain class="bg-premium-light">
      <VContainer class="pa-4 pb-16 mt-6 fade-in-up" fluid>
        <div class="max-width-xl mx-auto">
          {{ console.log('🐾 [PetOwnerLayout] Rendering Slot Content') || '' }}
          <slot />
        </div>
      </VContainer>
    </VMain>

    <!-- Site Footer -->
    <VFooter app class="bg-white border-t py-12 pb-20 pb-lg-12 px-4 d-flex flex-column align-center">
       <VContainer class="max-width-xl">
         <VRow>
           <VCol cols="12" md="4">
              <div class="d-flex align-center gap-3 mb-6">
                <div class="logo-box elevation-4">
                   <VIcon icon="tabler-paw-filled" color="white" size="24" />
                </div>
                <span class="text-h4 font-weight-black tracking-tight brand-text">PetLeo</span>
              </div>
              <p class="text-body-2 text-slate-500 max-width-300">
                Premium pet care platform connecting pet owners with the best veterinary professionals and service providers.
              </p>
           </VCol>
           <VCol cols="12" md="2">
              <h4 class="text-subtitle-1 font-weight-black mb-6 text-slate-900">Platform</h4>
              <VList class="pa-0 bg-transparent" density="compact">
                <VListItem to="/pet-owner/book" class="px-0 mb-2 text-body-2 text-slate-600">Find Care</VListItem>
                <VListItem to="/pet-owner/pets" class="px-0 mb-2 text-body-2 text-slate-600">My Family</VListItem>
                <VListItem class="px-0 mb-2 text-body-2 text-slate-600">Services</VListItem>
              </VList>
           </VCol>
           <VCol cols="12" md="2">
              <h4 class="text-subtitle-1 font-weight-black mb-6 text-slate-900">Company</h4>
              <VList class="pa-0 bg-transparent" density="compact">
                <VListItem class="px-0 mb-2 text-body-2 text-slate-600">About Us</VListItem>
                <VListItem class="px-0 mb-2 text-body-2 text-slate-600">Contact</VListItem>
                <VListItem class="px-0 mb-2 text-body-2 text-slate-600">Careers</VListItem>
              </VList>
           </VCol>
           <VCol cols="12" md="4">
              <h4 class="text-subtitle-1 font-weight-black mb-6 text-slate-900">Download Our App</h4>
              <p class="text-body-2 text-slate-500 mb-6">Manage your pet's health on the go with our mobile application.</p>
              <div class="d-flex gap-3 mb-8">
                 <VBtn variant="tonal" color="primary" class="rounded-lg" prepend-icon="tabler-brand-apple">App Store</VBtn>
                 <VBtn variant="tonal" color="primary" class="rounded-lg" prepend-icon="tabler-brand-google-play">Google Play</VBtn>
              </div>

              <!-- Trust Badges (Only when provider is active) -->
              <div v-if="store.activeProvider" class="trust-icons-footer pt-6 border-t">
                <h5 class="text-caption font-weight-black text-slate-400 uppercase mb-4">Trust & Credentials</h5>
                <div class="d-flex align-center gap-4">
                  <VTooltip text="View Certifications" location="top">
                    <template #activator="{ props }">
                      <div 
                        v-bind="props"
                        class="trust-badge-icon d-flex flex-column align-center cursor-pointer" 
                        @click="router.push(`/pet-owner/book/${store.activeProvider.id}/certificates`)"
                      >
                        <div class="icon-circle mb-1">
                          <VIcon icon="tabler-certificate" color="primary" size="24" />
                        </div>
                        <span class="text-tiny font-weight-bold">Certificates</span>
                      </div>
                    </template>
                  </VTooltip>

                  <VTooltip text="View Policies" location="top">
                    <template #activator="{ props }">
                      <div 
                        v-bind="props"
                        class="trust-badge-icon d-flex flex-column align-center cursor-pointer" 
                        @click="router.push(`/pet-owner/book/${store.activeProvider.id}/policies`)"
                      >
                        <div class="icon-circle mb-1">
                          <VIcon icon="tabler-shield-lock" color="success" size="24" />
                        </div>
                        <span class="text-tiny font-weight-bold">Policies</span>
                      </div>
                    </template>
                  </VTooltip>
                </div>
              </div>
           </VCol>
         </VRow>
         <VDivider class="my-12 opacity-10" />
         <div class="d-flex flex-wrap justify-space-between align-center gap-4">
            <div class="text-body-2 text-slate-400">
               © 2026 PetLeo Technologies Inc. All rights reserved.
            </div>
            <div class="d-flex gap-6">
               <VIcon icon="tabler-brand-facebook" size="20" color="slate-400" class="cursor-pointer" />
               <VIcon icon="tabler-brand-instagram" size="20" color="slate-400" class="cursor-pointer" />
               <VIcon icon="tabler-brand-twitter" size="20" color="slate-400" class="cursor-pointer" />
               <VIcon icon="tabler-brand-linkedin" size="20" color="slate-400" class="cursor-pointer" />
            </div>
         </div>
       </VContainer>
    </VFooter>

    <!-- Mobile Bottom Navigation (Enhanced) -->
    <VBottomNavigation
      grow
      color="primary"
      class="d-lg-none glass-bottom-nav px-2"
      height="72"
      elevation="10"
    >
      <VBtn
        v-for="item in navigation"
        :key="item.title"
        :to="item.to"
        :value="item.to"
        class="mobile-nav-btn"
      >
        <VIcon :icon="item.icon" size="24" />
        <span class="text-caption font-weight-black mt-1">{{ item.title }}</span>
      </VBtn>
    </VBottomNavigation>

    <!-- Trust Dialogs (shared state via Pinia) -->
    <!-- <PetOwnerTrustDialogs /> -->
  </v-layout>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;700;900&display=swap');

html, body, .v-application {
  font-family: 'Outfit', sans-serif !important;
}
</style>

<style scoped>
.premium-app {
  background-color: #F8FAFC !important;
}

.max-width-xl {
  max-width: 1400px;
}

.tracking-tight {
  letter-spacing: -2px !important;
}

/* Glassmorphism Navbar */
.glass-nav {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid rgba(0,0,0,0.05) !important;
}

.brand-container {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.brand-container:hover {
  transform: scale(1.02);
}

.logo-box {
  background: linear-gradient(135deg, #7367f0 0%, #a098f6 100%);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  color: #1e293b;
}

/* Nav Buttons */
.nav-links {
  gap: 8px;
}

.nav-btn {
  color: #64748b !important;
  transition: all 0.3s ease;
}

.active-nav-btn {
  color: #7367f0 !important;
  background-color: rgba(115, 103, 240, 0.08) !important;
}

.max-width-300 {
  max-width: 300px;
}

.cursor-pointer {
  cursor: pointer;
}

.trust-badge-icon {
  transition: all 0.2s ease;
}

.trust-badge-icon:hover {
  transform: translateY(-2px);
}

.trust-badge-icon .icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.trust-badge-icon:hover .icon-circle {
  border-color: #7367f0;
  background: #f5f3ff;
  box-shadow: 0 4px 12px rgba(115, 103, 240, 0.1);
}

.text-tiny {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
}

.border-avatar {
  border: 2px solid rgba(115, 103, 240, 0.2);
}

.bg-premium-light {
  background-color: #F8FAFC !important;
}

/* Animations */
.fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Nav */
.glass-bottom-nav {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(0,0,0,0.08) !important;
}

.mobile-nav-btn :deep(.v-btn__content) {
  flex-direction: column !important;
}

.min-width-150 {
  min-width: 180px;
}
</style>
