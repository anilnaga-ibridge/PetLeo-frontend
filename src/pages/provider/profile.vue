<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import UserBioPanel from '@/views/apps/user/view/UserBioPanel.vue'
import UserTabAccount from '@/views/apps/user/view/UserTabAccount.vue'
import UserTabSecurity from '@/views/apps/user/view/UserTabSecurity.vue'
import UserTabNotifications from '@/views/apps/user/view/UserTabNotifications.vue'
import UserTabBillingsPlans from '@/views/apps/user/view/UserTabBillingsPlans.vue'
import { useCookie } from '@/@core/composable/useCookie'

const userData = useCookie('userData')
const userTab = ref(null)

const tabs = [
  {
    icon: 'tabler-user-check',
    title: 'Account',
  },
  {
    icon: 'tabler-lock',
    title: 'Security',
  },
  {
    icon: 'tabler-currency-dollar',
    title: 'Billing & Plan',
  },
  {
    icon: 'tabler-bell',
    title: 'Notifications',
  },
]
</script>

<template>
  <ProviderLayout>
    <VRow>
      <VCol
        cols="12"
        md="5"
        lg="4"
      >
        <UserBioPanel :user-data="userData" />
      </VCol>

      <VCol
        cols="12"
        md="7"
        lg="8"
      >
        <VTabs
          v-model="userTab"
          class="v-tabs-pill"
        >
          <VTab
            v-for="tab in tabs"
            :key="tab.icon"
          >
            <VIcon
              :size="18"
              :icon="tab.icon"
              class="me-1"
            />
            <span>{{ tab.title }}</span>
          </VTab>
        </VTabs>

        <VWindow
          v-model="userTab"
          class="mt-6 disable-tab-transition"
          :touch="false"
        >
          <VWindowItem>
            <UserTabAccount />
          </VWindowItem>

          <VWindowItem>
            <UserTabSecurity />
          </VWindowItem>

          <VWindowItem>
            <UserTabBillingsPlans />
          </VWindowItem>

          <VWindowItem>
            <UserTabNotifications />
          </VWindowItem>
        </VWindow>
      </VCol>
    </VRow>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
