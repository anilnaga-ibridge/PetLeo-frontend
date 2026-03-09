<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const userData = JSON.parse(localStorage.getItem('userData') || '{}')
const userName = computed(() => userData.full_name || 'Pet Parent')
const userEmail = computed(() => userData.email || '')

const avatarText = computed(() => {
  const name = userName.value
  
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
})

const navItems = [
  { label: 'Dashboard', icon: 'tabler-layout-dashboard', to: '/pet-owner/dashboard' },
  { label: 'Discovery', icon: 'tabler-smart-home', to: '/pet-owner/book' },
  { label: 'My Bookings', icon: 'tabler-calendar-check', to: '/pet-owner/my-bookings' },
  { label: 'My Pets', icon: 'tabler-paw', to: '/pet-owner/pets' },
  { label: 'Medical Reports', icon: 'tabler-report-medical', to: '/pet-owner/medical-reports' },
  { label: 'Reminders', icon: 'tabler-bell', to: '/pet-owner/reminders' },
]

const bottomItems = [
  { label: 'Settings', icon: 'tabler-settings', to: '/pet-owner/settings' },
  { label: 'Help', icon: 'tabler-help-circle', to: '/pet-owner/help' },
]

const isActive = to => route.path === to || route.path.startsWith(to + '/')

const logout = async () => {
  await authStore.logout()
}
</script>

<template>
  <aside class="pet-sidebar">
    <!-- Brand -->
    <div class="sidebar-brand">
      <div class="brand-logo">
        <VIcon
          icon="tabler-paw-filled"
          color="white"
          size="20"
        />
      </div>
      <span class="brand-name">PetLeo</span>
    </div>

    <!-- User card -->
    <div class="sidebar-user">
      <div class="user-avatar">
        {{ avatarText }}
      </div>
      <div class="user-info">
        <div class="user-name">
          {{ userName }}
        </div>
        <div class="user-email">
          {{ userEmail }}
        </div>
      </div>
    </div>

    <!-- Label -->
    <div class="nav-label">
      Navigation
    </div>

    <!-- Nav items -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="nav-item"
        :class="[{ active: isActive(item.to) }]"
      >
        <div class="nav-icon">
          <VIcon
            :icon="item.icon"
            size="18"
          />
        </div>
        <span class="nav-lbl">{{ item.label }}</span>
        <div
          v-if="isActive(item.to)"
          class="nav-active-dot"
        />
      </RouterLink>
    </nav>

    <!-- Bottom -->
    <div class="sidebar-bottom">
      <div class="nav-label">
        Account
      </div>
      <RouterLink
        v-for="item in bottomItems"
        :key="item.label"
        :to="item.to"
        class="nav-item"
        :class="[{ active: isActive(item.to) }]"
      >
        <div class="nav-icon">
          <VIcon
            :icon="item.icon"
            size="18"
          />
        </div>
        <span class="nav-lbl">{{ item.label }}</span>
      </RouterLink>

      <button
        class="nav-item logout-btn"
        @click="logout"
      >
        <div class="nav-icon logout-icon">
          <VIcon
            icon="tabler-logout"
            size="18"
          />
        </div>
        <span class="nav-lbl">Sign Out</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.pet-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 20px 12px 20px;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 20px;
  cursor: pointer;
}

.brand-logo {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(99,102,241,0.3);
}

.brand-name {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
}

/* User card */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 38px; height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  font-size: 13px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info { min-width: 0; }

.user-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Nav label */
.nav-label {
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #cbd5e1;
  padding: 0 12px 8px;
}

/* Nav items */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: none;
  background: none;
  width: 100%;
  font-family: inherit;
}

.nav-item:hover:not(.active) {
  background: #f8fafc;
}

.nav-item.active {
  background: #eef2ff;
}

.nav-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.nav-item.active .nav-icon {
  background: #6366f1;
  color: white;
  box-shadow: 0 4px 10px rgba(99,102,241,0.25);
}

.nav-item:hover:not(.active) .nav-icon {
  background: #e2e8f0;
  color: #475569;
}

.nav-lbl {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  flex: 1;
}

.nav-item.active .nav-lbl {
  color: #4f46e5;
}

.nav-active-dot {
  width: 6px; height: 6px;
  background: #6366f1;
  border-radius: 50%;
}

/* Bottom section */
.sidebar-bottom {
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logout-btn {
  text-align: left;
}

.logout-icon { background: #fff0f0 !important; color: #ef4444 !important; }
.logout-btn .nav-lbl { color: #ef4444 !important; }
.logout-btn:hover .logout-icon { background: #fecaca !important; }
</style>
