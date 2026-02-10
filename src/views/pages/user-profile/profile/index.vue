<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/stores/permissionStore'
import { storeToRefs } from 'pinia'
import { providerApi } from '@/plugins/axios'
import About from './About.vue'
import ActivityTimeline from './ActivityTimeline.vue'
import Connection from './Connection.vue'
import ProjectList from './ProjectList.vue'
import Teams from './Teams.vue'

const router = useRoute('pages-user-profile-tab')
const permissionStore = usePermissionStore()
const { userData } = storeToRefs(permissionStore)

const fields = ref([])
const fetchProfile = async () => {
  try {
    const roleName = (userData.value?.role_name || userData.value?.role || '').toString().toLowerCase()
    
    const target = userData.value?.provider_type || 
                   (roleName === 'superadmin' ? 'superadmin' : 
                    roleName === 'organization' ? 'organization' : 'individual')
    
    console.log('Fetching Profile for:', { user: userData.value.id, role: roleName, target })

    const res = await providerApi.get(`/api/provider/profile/`, {
      params: { 
        user: userData.value.id,
        target: target,
      },
    })
    fields.value = res.data.fields || []
  } catch (err) {
    console.error('Failed to fetch profile for about section:', err)
  }
}

onMounted(() => {
  fetchProfile()
})

const profileTabData = computed(() => {
  if (!userData.value) return null

  // Map dynamic fields to About section
  // Filter out fields that we handle explicitly
  const dynamicAbout = fields.value
    .filter(f => !['file', 'multiselect'].includes(f.field_type) && 
                 !['first_name', 'last_name', 'email', 'phone_number', 'country'].includes(f.name))
    .map(f => ({
      property: f.label,
      value: f.value || 'Not set',
      icon: 'tabler-info-circle'
    }))

  // Find values from API response (Source of Truth)
  const getFieldValue = (name) => {
    const field = fields.value.find(f => f.name === name)
    return field ? field.value : null
  }

  const apiPhone = getFieldValue('phone_number')
  const apiEmail = getFieldValue('email')
  const apiCountry = getFieldValue('country')

  return {
    about: [
      { property: 'Full Name', value: userData.value.fullName || userData.value.full_name || userData.value.username, icon: 'tabler-user' },
      { property: 'Status', value: userData.value.is_active === false ? 'Inactive' : 'Active', icon: 'tabler-check' },
      { property: 'Role', value: userData.value.role_name || userData.value.role?.name || userData.value.role || 'User', icon: 'tabler-crown' },
      { property: 'Country', value: apiCountry || 'Not set', icon: 'tabler-flag' },
      ...dynamicAbout.map(f => ({
         property: f.property,
         value: f.value,
         icon: f.icon || 'tabler-info-circle'
      }))
    ],
    contacts: [
      { property: 'Contact', value: apiPhone || userData.value.phoneNumber || userData.value.phone_number, icon: 'tabler-phone-call' },
      { property: 'Email', value: apiEmail || userData.value.email, icon: 'tabler-mail' },
    ],
    teams: [],
    overview: [],
    connections: [],
    teamsTech: [],
  }
})
</script>

<template>
  <VRow v-if="profileTabData">
    <VCol
      md="4"
      cols="12"
    >
      <About :data="profileTabData" />
    </VCol>

    <VCol
      cols="12"
      md="8"
    >
      <VRow>
        <VCol cols="12">
          <ActivityTimeline />
        </VCol>

        <VCol
          cols="12"
          md="6"
        >
          <Connection :connections-data="profileTabData.connections" />
        </VCol>

        <VCol
          cols="12"
          md="6"
        >
          <Teams :teams-data="profileTabData.teamsTech" />
        </VCol>

        <VCol cols="12">
          <ProjectList />
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>
