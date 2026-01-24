<script setup>
import { useCookie } from '@/@core/composable/useCookie'
import About from './About.vue'
import ActivityTimeline from './ActivityTimeline.vue'
import Connection from './Connection.vue'
import ProjectList from './ProjectList.vue'
import Teams from './Teams.vue'

const router = useRoute('pages-user-profile-tab')
const userData = useCookie('userData')

// Mock/Static data to prevent 404s
const profileTabData = computed(() => {
  return {
    fullName: userData.value?.full_name,
    joined: userData.value?.date_joined,
    role: userData.value?.role?.name,
    country: 'India',
    language: 'English',
    contacts: { phone: userData.value?.phone_number, email: userData.value?.email },
    teams: [],
    projects: [],
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
