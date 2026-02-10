<script setup>
import UserBioPanel from '@/views/apps/user/view/UserBioPanel.vue'
import UserTabAccount from '@/views/apps/user/view/UserTabAccount.vue'
import UserTabBillingsPlans from '@/views/apps/user/view/UserTabBillingsPlans.vue'
import UserTabConnections from '@/views/apps/user/view/UserTabConnections.vue'
import UserTabNotifications from '@/views/apps/user/view/UserTabNotifications.vue'
import UserTabSecurity from '@/views/apps/user/view/UserTabSecurity.vue'

const route = useRoute('apps-user-view-id')
const userTab = ref(null)

const tabs = [
  {
    icon: 'tabler-users',
    title: 'Account',
  },
  {
    icon: 'tabler-lock',
    title: 'Securitys',
  },
  {
    icon: 'tabler-bookmark',
    title: 'Billing & Plan',
  },
  {
    icon: 'tabler-bell',
    title: 'Notifications',
  },
  {
    icon: 'tabler-link',
    title: 'Connections',
  },
]

const { data: userData, error } = await useApi(`http://127.0.0.1:8000/auth/users/${ route.params.id }/`)

if (error.value) {
  console.error("User Profile API Error:", error.value)
}

// FETCH PROVIDER PROFILE DATA (Dynamic Fields)
// This is needed for fields not in Auth Service (e.g., Country, Language)
const roleName = (userData.value?.role_name || userData.value?.role || '').toString().toLowerCase()
const target = userData.value?.provider_type || (roleName === 'organization' ? 'organization' : 'individual')

console.log('Fetching SA User Profile for:', { user: route.params.id, role: roleName, target })

// Use providerApi directly to ensure correct token handling (useApi might miss non-cookie tokens)
import { providerApi } from '@/plugins/axios'

const providerProfileFields = ref([])

try {
  const res = await providerApi.get(`/api/provider/profile/`, {
    params: { 
      user: route.params.id,
      target: target
    }
  })
  
  if (res.data && res.data.fields) {
    const fields = res.data.fields
    providerProfileFields.value = fields
    
    const getFieldValue = (name) => {
      const field = fields.find(f => f.name === name)
      return field ? field.value : null
    }
    
    // MERGE INTO USER DATA (For standard fields)
    userData.value = {
      ...userData.value,
      country: getFieldValue('country') || userData.value.country,
      language: getFieldValue('language') || userData.value.language,
      phone_number: getFieldValue('phone_number') || userData.value.phone_number,
    }
  }
} catch (err) {
  console.error("Failed to fetch provider profile:", err)
}

console.log("DEBUG: Final UserData passed to BioPanel:", userData.value)
console.log("DEBUG: Provider Profile Fields:", providerProfileFields.value)
</script>

<template>
  <VRow v-if="userData">
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <UserBioPanel 
        :user-data="userData" 
        :provider-profile="providerProfileFields"
      />
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

        <VWindowItem>
          <UserTabConnections />
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      User with ID  {{ route.params.id }} not found!
    </VAlert>
  </div>
</template>
