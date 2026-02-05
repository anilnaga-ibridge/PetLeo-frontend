<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref, onMounted, watch } from 'vue' 
import { useVeterinaryStore } from '@/stores/veterinaryStore'

import WaitingRoomWidget from '@/components/veterinary/dashboard/WaitingRoomWidget.vue'
import ScheduleWidget from '@/components/veterinary/dashboard/ScheduleWidget.vue'
import VitalsQueueWidget from '@/components/veterinary/dashboard/VitalsQueueWidget.vue'
import DoctorQueueWidget from '@/components/veterinary/dashboard/DoctorQueueWidget.vue'
import LabQueueWidget from '@/components/veterinary/dashboard/LabQueueWidget.vue'
import PharmacyQueueWidget from '@/components/veterinary/dashboard/PharmacyQueueWidget.vue'
import AnalyticsCards from '@/components/veterinary/dashboard/AnalyticsCards.vue'
import ActiveQueueWidget from '@/components/veterinary/dashboard/ActiveQueueWidget.vue'
import TrendChart from '@/components/veterinary/dashboard/TrendChart.vue' // [NEW]
import StaffProductivityWidget from '@/components/veterinary/dashboard/StaffProductivityWidget.vue' // [NEW]

import { usePermissionStore } from '@/stores/permissionStore'

const permissionStore = usePermissionStore()
const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const can = cap => permissionStore.hasCapability(cap)

const currentLayout = VeterinaryLayout

// [NEW] Date Filtering
const dateFilter = ref('Today')
const customDate = ref(formatDate(new Date()))

const dateOptions = ['Today', 'Yesterday', 'Custom']
// Helper to format YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const targetDate = computed(() => {
    if (dateFilter.value === 'Today') return null // Backend defaults to today
    if (dateFilter.value === 'Yesterday') {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        return formatDate(d)
    }
    return customDate.value
})

// [NEW] Live Summary Data
const summaryData = ref(null)
const fetchSummary = async () => {
    if (activeClinicId.value) {
        try {
            summaryData.value = await store.fetchLiveSummary(activeClinicId.value, targetDate.value)
        } catch (e) {
            console.error("Dashboard Summary Error:", e)
        }
    }
}

let refreshInterval = null

onMounted(() => {
    fetchSummary()
    // Poll every 15 seconds for "Live" experience only if viewing today
    refreshInterval = setInterval(() => {
        if (dateFilter.value === 'Today') {
            fetchSummary()
        }
    }, 15000)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
    if (refreshInterval) clearInterval(refreshInterval)
})

watch([activeClinicId, targetDate], () => fetchSummary())
</script>

<template>
  <component :is="currentLayout">
    <VContainer fluid class="pa-6">
      <div class="veterinary-dashboard">
        <!-- HEADER -->
        <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-4">
          <div>
            <h1 class="text-h3 font-weight-bold text-primary">
              Veterinary Dashboard
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              Overview of your clinic's daily activities.
            </p>
          </div>
          
          <div class="d-flex align-center gap-3">
              <!-- Date Filter -->
              <VSelect
                v-model="dateFilter"
                :items="dateOptions"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 140px"
                prepend-inner-icon="tabler-calendar"
              />

              <VTextField
                v-if="dateFilter === 'Custom'"
                v-model="customDate"
                type="date"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 160px"
              />

               <VBtn
                  v-if="can('VETERINARY_VISITS')"
                  color="primary"
                  prepend-icon="tabler-plus"
                  :to="{ name: 'veterinary-visits-new' }"
              >
                  New Visit
              </VBtn>
          </div>
        </div>

        <!-- ROW 1: SUMMARY CARDS (With Trends) -->
        <AnalyticsCards 
          v-if="can('VETERINARY_CORE')" 
          :metrics="summaryData"
          class="mb-6"
        />

        <!-- ROW 2: TRENDS & PRODUCTIVITY -->
        <VRow v-if="can('VETERINARY_CORE') && summaryData" class="mb-6">
           <!-- Trend Chart (Left) -->
           <VCol cols="12" md="8">
              <TrendChart :data="summaryData.trend" />
           </VCol>
           
           <!-- Staff Stats (Right) -->
           <VCol cols="12" md="4">
              <StaffProductivityWidget :stats="summaryData.my_work" />
           </VCol>
        </VRow>

        <!-- ROW 3: LIVE ACTIVE QUEUE -->
        <VRow class="mb-6">
          <VCol cols="12">
               <ActiveQueueWidget 
                  v-if="summaryData && summaryData.queue && summaryData.queue.length > 0"
                  :queue="summaryData.queue"
              />
          </VCol>
        </VRow>

        <!-- ROW 4: OPERATIONAL QUEUES (Role Based) -->
        <VRow>
          <VCol cols="12">
            <!-- RECEPTION: WAITING ROOM -->
            <WaitingRoomWidget v-if="can('VETERINARY_VISITS')" class="mb-6"/>

            <!-- VITALS STAFF: VITALS QUEUE -->
            <VitalsQueueWidget
              v-if="can('VETERINARY_VITALS')"
              class="mb-6"
            />

            <!-- DOCTOR: PATIENT QUEUE -->
            <DoctorQueueWidget
              v-if="can('VETERINARY_DOCTOR')"
              class="mb-6"
            />

            <!-- LAB: LAB QUEUE -->
            <LabQueueWidget
              v-if="can('VETERINARY_LABS')"
              class="mb-6"
            />

            <!-- PHARMACY: PHARMACY QUEUE -->
            <PharmacyQueueWidget
              v-if="can('VETERINARY_PHARMACY')"
              class="mb-6"
            />

            <!-- SCHEDULE WIDGET -->
            <ScheduleWidget
              v-if="can('VETERINARY_SCHEDULE')"
            />
          </VCol>
        </VRow>
      </div>
    </VContainer>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
