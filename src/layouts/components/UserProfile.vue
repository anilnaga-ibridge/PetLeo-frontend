<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useAuthStore } from '@/stores/authStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useRouter } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'
import { storeToRefs } from 'pinia'

const router = useRouter()
// const userData = useCookie('userData') // ❌ Replaced by Store for reactivity
const authStore = useAuthStore()
const permissionStore = usePermissionStore()
const { userData } = storeToRefs(permissionStore)

const logout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const userProfileList = [
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'tabler-user',
    title: 'Profile',
    to: { name: 'pages-user-profile-tab', params: { tab: 'profile' } },
  },
  {
    type: 'navItem',
    icon: 'tabler-settings',
    title: 'Settings',
    to: {
      name: 'pages-account-settings-tab',
      params: { tab: 'account' },
    },
  },
  {
    type: 'navItem',
    icon: 'tabler-file-dollar',
    title: 'Billing Plan',
    to: {
      name: 'pages-account-settings-tab',
      params: { tab: 'billing-plans' },
    },
    badgeProps: {
      color: 'error',
      content: '4',
    },
  },
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'tabler-currency-dollar',
    title: 'Pricing',
    to: { name: 'pages-pricing' },
  },
  {
    type: 'navItem',
    icon: 'tabler-help',
    title: 'FAQ',
    to: { name: 'pages-faq' },
  },
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'tabler-logout',
    title: 'Logout',
    onClick: logout,
  },
]
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    color="success"
    bordered
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg
        v-if="userData && userData.avatar"
        :src="userData.avatar"
      />
      <VIcon
        v-else
        icon="tabler-user"
      />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg
                      v-if="userData && userData.avatar"
                      :src="userData.avatar"
                    />
                    <VIcon
                      v-else
                      icon="tabler-user"
                    />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ userData?.fullName || userData?.username }}
            </VListItemTitle>
            <VListItemSubtitle>
              {{ userData?.role }}
            </VListItemSubtitle>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template
              v-for="item in userProfileList"
              :key="item.title"
            >
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
                @click="item.onClick && item.onClick()"
              >
                <template #prepend>
                  <VIcon
                    class="me-2"
                    :icon="item.icon"
                    size="22"
                  />
                </template>

                <VListItemTitle>{{ item.title }}</VListItemTitle>

                <template
                  v-if="item.badgeProps"
                  #append
                >
                  <VBadge
                    v-bind="item.badgeProps"
                    inline
                  />
                </template>
              </VListItem>

              <VDivider
                v-else
                class="my-2"
              />
            </template>
          </PerfectScrollbar>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
