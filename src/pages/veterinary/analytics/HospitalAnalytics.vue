<script setup>
import { ref, onMounted, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

// Components
import ExecutiveDashboard from './components/ExecutiveDashboard.vue'
import ReceptionAnalytics from './components/ReceptionAnalytics.vue'
import VitalsAnalytics from './components/VitalsAnalytics.vue'
import DoctorAnalytics from './components/DoctorAnalytics.vue'
import LabAnalytics from './components/LabAnalytics.vue'
import PharmacyAnalytics from './components/PharmacyAnalytics.vue'

const store = useVeterinaryStore()
const activeTab = ref('executive')
const selectedDate = ref(new Date().toISOString().substr(0, 10))
const isLoading = ref(false)
const analyticsData = ref(null)

const tabs = [
  { title: 'Executive', value: 'executive', icon: 'tabler-layout-dashboard' },
  { title: 'Reception', value: 'reception', icon: 'tabler-user-check' },
  { title: 'Vitals', value: 'vitals', icon: 'tabler-heart-rate-monitor' },
  { title: 'Doctor', value: 'doctor', icon: 'tabler-stethoscope' },
  { title: 'Lab', value: 'lab', icon: 'tabler-flask' },
  { title: 'Pharmacy', value: 'pharmacy', icon: 'tabler-pill' },
]

const fetchData = async () => {
  if (!store.activeClinicId) return
  isLoading.value = true
  try {
    analyticsData.value = await store.fetchAnalytics(store.activeClinicId, selectedDate.value)
  } catch (e) {
    console.error("Error fetching analytics", e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

watch(selectedDate, () => {
  fetchData()
})
</script>

<template>
  <div>
    <!-- Header & Date Picker -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-4">
      <div>
        <h4 class="text-h4 font-weight-bold mb-1">
          Hospital Analytics
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Track performance across all departments
        </p>
      </div>
      
      <div style="min-width: 200px;">
        <AppDateTimePicker
          v-model="selectedDate"
          label="Select Date"
          density="compact"
          :config="{ position: 'auto right' }"
        />
      </div>
    </div>

    <!-- Tabs -->
    <VCard class="mb-6">
      <VTabs
        v-model="activeTab"
        grow
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
        >
          <VIcon
            :icon="tab.icon"
            class="me-2"
          />
          {{ tab.title }}
        </VTab>
      </VTabs>
    </VCard>

    <!-- Content -->
    <div
      v-if="isLoading"
      class="d-flex justify-center pa-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
    </div>
    
    <div v-else-if="analyticsData">
      <VWindow
        v-model="activeTab"
        class="disable-tab-transition"
      >
        <VWindowItem value="executive">
          <ExecutiveDashboard :data="analyticsData.executive" />
        </VWindowItem>
            
        <VWindowItem value="reception">
          <ReceptionAnalytics :data="analyticsData.reception" />
        </VWindowItem>
            
        <VWindowItem value="vitals">
          <VitalsAnalytics :data="analyticsData.vitals" />
        </VWindowItem>

        <VWindowItem value="doctor">
          <DoctorAnalytics :data="analyticsData.doctor" />
        </VWindowItem>

        <VWindowItem value="lab">
          <LabAnalytics :data="analyticsData.lab" />
        </VWindowItem>

        <VWindowItem value="pharmacy">
          <PharmacyAnalytics :data="analyticsData.pharmacy" />
        </VWindowItem>
      </VWindow>
    </div>
  </div>
</template>

<style scoped>
.disable-tab-transition :deep(.v-window__container) {
  block-size: auto;
}
</style>
