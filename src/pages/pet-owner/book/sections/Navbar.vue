<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'

const props = defineProps({
  currentCity: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'app' // 'app' | 'landing'
  }
})

const emit = defineEmits(['update:city'])

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()

// Provider ID for detail page navigation
const providerId = computed(() => route.params.id || '')

const rawData = localStorage.getItem('userData')
const userData = rawData ? JSON.parse(rawData) : {}
const userName = computed(() => (userData.full_name || 'Pet Parent').split(' ')[0])

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad']

// Smooth scroll helper — offsets for fixed navbar
const scrollTo = (id) => {
  const el = document.getElementById(id)
  if (el) {
    const navHeight = 72
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const logout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('userData')
  router.push('/login')
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<template>
  <header class="petleo-nav">
    <div class="nav-inner">
      <!-- LEFT: Brand + City -->
      <div class="nav-left">
        <div class="brand" @click="router.push('/pet-owner/book')">
          <div class="brand-logo">
            <VIcon icon="tabler-paw-filled" color="white" size="20" />
          </div>
          <span class="brand-name">PetLeo</span>
        </div>

        <div class="nav-divider d-none d-sm-block" />

        <!-- City Selector -->
        <VMenu location="bottom start" transition="slide-y-transition" offset="6">
          <template #activator="{ props: menuProps }">
            <div v-bind="menuProps" class="city-pill">
              <VIcon icon="tabler-map-pin" size="16" color="primary" />
              <div>
                <div class="city-label">Deliver to</div>
                <div class="city-value">{{ currentCity || 'Your City' }}</div>
              </div>
              <VIcon icon="tabler-chevron-down" size="14" color="slate-400" />
            </div>
          </template>
          <VList class="mt-1 elevation-10 rounded-2xl py-2" width="200">
            <VListItem
              v-for="city in cities"
              :key="city"
              :title="city"
              :active="city === currentCity"
              active-color="primary"
              class="rounded-xl mx-2 font-weight-bold"
              @click="emit('update:city', city)"
            />
          </VList>
        </VMenu>
      </div>

      <!-- CENTER: Nav Links (Desktop) -->
      <nav class="nav-links d-none d-lg-flex">

        <!-- Landing/Discovery page: public marketing links -->
        <template v-if="mode === 'landing'">
          <button class="nav-link nav-link-btn" @click="scrollTo('about-section')">
            <VIcon icon="tabler-info-circle" size="16" class="mr-2" />
            About Us
          </button>
          <button class="nav-link nav-link-btn" @click="scrollTo('services-section')">
            <VIcon icon="tabler-list-check" size="16" class="mr-2" />
            Services
          </button>
          <button class="nav-link nav-link-btn" @click="scrollTo('how-it-works-section')">
            <VIcon icon="tabler-help-circle" size="16" class="mr-2" />
            How It Works
          </button>
          <button class="nav-link nav-link-btn" @click="scrollTo('contact-section')">
            <VIcon icon="tabler-mail" size="16" class="mr-2" />
            Contact
          </button>
        </template>

        <!-- Provider detail page: provider-specific links -->
        <template v-else-if="mode === 'provider'">
          <router-link
            :to="`/pet-owner/book/${providerId}`"
            class="nav-link"
            active-class="nav-link-active"
            exact
          >
            <VIcon icon="tabler-info-circle" size="16" class="mr-2" />
            About
          </router-link>
          <router-link
            :to="`/pet-owner/book/${providerId}/services`"
            class="nav-link"
            active-class="nav-link-active"
          >
            <VIcon icon="tabler-list-check" size="16" class="mr-2" />
            Services
          </router-link>
          <router-link
            :to="`/pet-owner/book/${providerId}/blogs`"
            class="nav-link"
            active-class="nav-link-active"
          >
            <VIcon icon="tabler-news" size="16" class="mr-2" />
            Blogs
          </router-link>
          <router-link
            :to="`/pet-owner/book/${providerId}/reviews`"
            class="nav-link"
            active-class="nav-link-active"
          >
            <VIcon icon="tabler-star" size="16" class="mr-2" />
            Reviews
          </router-link>
        </template>

        <!-- App pages: Nav links removed as they are now in the Sidebar -->
        <template v-else />

      </nav>

      <!-- RIGHT: Actions -->
      <div class="nav-right">
        <!-- Cart -->
        <VBtn
          icon
          variant="text"
          size="small"
          class="action-btn"
          @click="cartStore.openCart()"
        >
          <VBadge
            v-if="cartStore.itemCount > 0"
            :content="cartStore.itemCount"
            color="primary"
            floating
          >
            <VIcon icon="tabler-shopping-cart" size="22" />
          </VBadge>
          <VIcon v-else icon="tabler-shopping-cart" size="22" />
        </VBtn>

        <!-- Notifications -->
        <VBtn icon variant="text" size="small" class="action-btn d-none d-sm-flex">
          <VIcon icon="tabler-bell" size="22" />
        </VBtn>

        <!-- User Menu -->
        <VMenu location="bottom end" transition="slide-y-transition" offset="8">
          <template #activator="{ props }">
            <div v-bind="props" class="user-chip">
              <VAvatar size="30" color="primary" class="user-avatar">
                <VIcon icon="tabler-user" size="18" color="white" />
              </VAvatar>
              <span class="d-none d-sm-block">{{ userName }}</span>
              <VIcon icon="tabler-chevron-down" size="14" class="d-none d-sm-block" />
            </div>
          </template>
          <VList class="mt-1 elevation-10 rounded-2xl py-2" width="200">
            <VListItem
              to="/pet-owner/dashboard"
              prepend-icon="tabler-layout-dashboard"
              title="Dashboard"
              class="rounded-xl mx-2 font-weight-bold mb-1"
            />
            <VListItem
              to="/pet-owner/profile"
              prepend-icon="tabler-user-circle"
              title="My Profile"
              class="rounded-xl mx-2 font-weight-bold mb-1"
            />
            <VDivider class="my-2 opacity-50" />
            <VListItem
              prepend-icon="tabler-logout"
              title="Sign Out"
              color="error"
              class="rounded-xl mx-2 font-weight-bold"
              @click="logout"
            />
          </VList>
        </VMenu>
      </div>
    </div>
  </header>
</template>

<style scoped>
.petleo-nav {
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.04);
}

.nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.brand:hover {
  transform: scale(1.02);
}

.brand-logo {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.brand-name {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
}

/* City Pill */
.city-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.city-pill:hover {
  background: #f8fafc;
}

.city-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.5px;
  line-height: 1;
}

.city-value {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-top: 2px;
}

.nav-divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
  margin: 0 4px;
}

/* Nav Links */
.nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.06);
}

/* Button variant of nav-link (used for scroll anchors in landing mode) */
.nav-link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.nav-link-active {
  color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.08) !important;
}

/* Right Actions */
.nav-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  color: #64748b !important;
  border-radius: 12px !important;
}

.action-btn:hover {
  color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.06) !important;
}

/* User Chip */
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: 40px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.user-chip:hover {
  border-color: #6366f1;
  background: #f5f3ff;
  color: #6366f1;
}

.user-avatar {
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}
</style>
