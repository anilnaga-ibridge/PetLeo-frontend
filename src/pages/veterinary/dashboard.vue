<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import DoctorPerformanceCard from '@/components/dashboard/DoctorPerformanceCard.vue'
import CasePerformanceChart from '@/components/dashboard/CasePerformanceChart.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import QueueTable from '@/components/dashboard/QueueTable.vue'
import BookingCartPanel from '@/components/dashboard/BookingCartPanel.vue'
import AlertsSection from '@/components/dashboard/AlertsSection.vue'

const permissionStore = usePermissionStore()
const veterinaryStore = useVeterinaryStore()
const userData = computed(() => permissionStore.userData || {})
const isMounted = ref(false)
const isLoading = ref(false)

// Real Data Refs
const liveSummary = ref(null)
const analyticsData = ref(null)

// 'CLINIC' or 'PERSONAL'
const currentScope = ref('CLINIC')

// Only Admins can see the Clinic View
const canSeeClinicView = computed(() => {
  const role = (userData.value.role?.name || userData.value.role || '').toUpperCase()
  const hasAdminSet = permissionStore.hasCapability('VETERINARY_ADMIN_SETTINGS')

  // List of roles that should NEVER see clinic-wide stats by default
  const employeeRoles = ['EMPLOYEE', 'DOCTOR', 'RECEPTIONIST', 'LAB TECH', 'PHARMACY', 'VITALS STAFF']

  if (employeeRoles.includes(role)) return false

  return hasAdminSet || 
         ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER', 'ORGANIZATION_ADMIN', 'ORGANIZATION_PROVIDER'].includes(role)
})

const fetchDashboardData = async () => {
  const clinicId = veterinaryStore.activeClinicId
  if (!clinicId) return

  isLoading.value = true
  try {
    const [summary, analytics] = await Promise.all([
      veterinaryStore.fetchLiveSummary(clinicId),
      veterinaryStore.fetchAnalytics(clinicId),
    ])

    liveSummary.value = summary
    analyticsData.value = analytics
    console.log('📊 Dashboard Data Loaded:', { summary, analytics })
  } catch (e) {
    console.error('Failed to load dashboard data:', e)
  } finally {
    isLoading.value = false
  }
}

// Ensure scope switches automatically when permissions change
watch(canSeeClinicView, (newVal) => {
  if (!newVal) {
    console.log('🔄 Watcher: canSeeClinicView is now FALSE. Forcing PERSONAL scope.')
    currentScope.value = 'PERSONAL'
  }
}, { immediate: true })

onMounted(async () => {
  console.log('🚀 Dashboard Mounted - Initial Scope:', currentScope.value)
  
  if (!permissionStore.isPermissionsLoaded) {
    await permissionStore.fetchPermissions()
  }

  // Ensure we have clinics and an active clinic selected
  if (!veterinaryStore.activeClinicId) {
    await veterinaryStore.fetchClinics()
  }
  
  // Default to PERSONAL if not an admin
  if (!canSeeClinicView.value) {
    currentScope.value = 'PERSONAL'
  }

  // Fetch real data
  await fetchDashboardData()

  // Small delay to let Vuetify layout settle
  setTimeout(() => {
    isMounted.value = true
  }, 100)
})

const stats = computed(() => {
  const s = liveSummary.value || {}
  
  if (currentScope.value === 'PERSONAL') {
    return [
      { title: "Your Appointments", value: s.personal?.appointments || 0, icon: 'tabler-calendar-event', trend: '2%', trendUp: true, color: 'info' },
      { title: 'Your Pending Cases', value: s.personal?.pending || 0, icon: 'tabler-clock', trend: '1', trendUp: false, color: 'warning' },
      { title: 'Your Completed Today', value: s.personal?.completed || 0, icon: 'tabler-clipboard-check', trend: '5%', trendUp: true, color: 'success' },
      { title: 'Your Revenue', value: `$${(s.personal?.revenue || 0).toLocaleString()}`, icon: 'tabler-trending-up', trend: '10%', trendUp: true, color: 'primary' },
      { title: 'Total Patients', value: s.personal?.total_patients || 0, icon: 'tabler-users', trend: '3', trendUp: true, color: 'teal' },
      { title: 'Case Accuracy', value: '98%', icon: 'tabler-target', trend: '0.5%', trendUp: true, color: 'deep-purple' },
    ]
  }

  return [
    { title: "Clinic Appointments", value: s.clinic?.appointments || 0, icon: 'tabler-calendar-event', trend: '4%', trendUp: true, color: 'info' },
    { title: 'Pending Cases', value: s.clinic?.pending || 0, icon: 'tabler-clock', trend: '2%', trendUp: false, color: 'warning' },
    { title: 'Completed Cases', value: s.clinic?.completed || 0, icon: 'tabler-clipboard-check', trend: '12%', trendUp: true, color: 'success' },
    { title: 'Revenue Today', value: `$${(s.clinic?.revenue || 0).toLocaleString()}`, icon: 'tabler-trending-up', trend: '8%', trendUp: true, color: 'primary' },
    { title: 'Avg Wait Time', value: s.clinic?.avg_wait_time || '18m', icon: 'tabler-stethoscope', trend: '3m', trendUp: false, color: 'deep-purple' },
    { title: 'Cancelled', value: s.clinic?.cancelled || 0, icon: 'tabler-circle-x', trend: '1%', trendUp: true, color: 'error' },
  ]
})

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

const caseProportions = computed(() => {
  if (!analyticsData.value) return null
  const data = currentScope.value === 'PERSONAL' ? analyticsData.value.personal : analyticsData.value.clinic
  if (!data) return null
  
  return [
    data.completed_cases || 0,
    data.in_progress_cases || 0,
    data.pending_cases || 0,
  ]
})

const revenueChartData = computed(() => {
  if (!analyticsData.value || !analyticsData.value.revenue_trends) return null
  return {
    categories: analyticsData.value.revenue_trends.map(t => t.month),
    values: analyticsData.value.revenue_trends.map(t => t.revenue),
  }
})
</script>

<template>
  <VeterinaryLayout>
    <div class="veterinary-dashboard bg-background pa-6 w-100">
      <!-- Welcome Banner / Header -->
      <VCard
        color="primary"
        variant="tonal"
        class="mb-6 rounded-xl border border-primary border-opacity-25 bg-surface"
        elevation="0"
      >
        <VCardText class="d-flex flex-column flex-md-row justify-space-between align-md-center pa-6">
          <div class="mb-4 mb-md-0">
            <div class="d-flex align-center gap-2 mb-1">
              <h2 class="text-h4 font-weight-bold text-high-emphasis">
                Good morning, {{ userData.fullName || 'Doctor' }}! 👋
              </h2>
            </div>
            <p class="text-body-1 text-medium-emphasis mb-0">
              <template v-if="currentScope === 'CLINIC'">
                The clinic has <span class="font-weight-bold text-primary">{{ liveSummary?.clinic?.appointments || 0 }}</span> appointments scheduled for today.
              </template>
              <template v-else>
                You have <span class="font-weight-bold text-primary">{{ liveSummary?.personal?.appointments || 0 }}</span> appointments scheduled for today ({{ today }}).
              </template>
            </p>
          </div>

          <div class="d-flex flex-wrap align-center gap-6">
            <!-- Premium Pill Switcher -->
            <div
              v-if="canSeeClinicView"
              class="pill-switcher-container pa-1 d-flex align-center"
            >
              <div
                class="pill-switcher-item"
                :class="{ 'active': currentScope === 'CLINIC' }"
                @click="currentScope = 'CLINIC'"
              >
                <VIcon
                  icon="tabler-building-hospital"
                  size="18"
                  class="me-2"
                />
                <span class="text-subtitle-2 font-weight-bold">Clinic</span>
              </div>
              <div
                class="pill-switcher-item"
                :class="{ 'active': currentScope === 'PERSONAL' }"
                @click="currentScope = 'PERSONAL'"
              >
                <VIcon
                  icon="tabler-user-circle"
                  size="18"
                  class="me-2"
                />
                <span class="text-subtitle-2 font-weight-bold">Personal</span>
              </div>
            </div>

            <VBtn
              color="primary"
              variant="elevated"
              size="large"
              class="font-weight-bold rounded-xl btn-shadow px-6"
              prepend-icon="tabler-calendar"
            >
              <span class="d-none d-md-inline">View Schedule</span>
              <span class="d-inline d-md-none">Schedule</span>
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Top Metrics Row -->
      <VRow class="mb-6 match-height">
        <VCol
          v-for="(stat, index) in stats"
          :key="index"
          cols="12"
          sm="6"
          md="4"
          lg="2"
        >
          <MetricCard v-bind="stat" />
        </VCol>
      </VRow>

      <!-- Analytics Charts Row (Revenue only for Clinic) -->
      <VRow 
        v-if="isMounted"
        class="mb-6 match-height"
      >
        <VCol
          cols="12"
          :lg="currentScope === 'CLINIC' ? 4 : 12"
        >
          <CasePerformanceChart
            :key="`case-${currentScope}`"
            :scope="currentScope"
            :data="caseProportions"
          />
        </VCol>
        <VCol
          v-if="currentScope === 'CLINIC'"
          cols="12"
          lg="8"
        >
          <RevenueChart 
            :key="`revenue-${currentScope}`" 
            :categories="revenueChartData?.categories"
            :data="revenueChartData?.values"
          />
        </VCol>
      </VRow>

      <!-- Doctors & Alerts Row -->
      <VRow class="mb-6 match-height">
        <VCol
          v-if="currentScope === 'CLINIC'"
          cols="12"
          lg="8"
        >
          <DoctorPerformanceCard />
        </VCol>
        <VCol
          cols="12"
          :lg="currentScope === 'CLINIC' ? 4 : 12"
        >
          <AlertsSection />
        </VCol>
      </VRow>

      <!-- Queue & Cart Row -->
      <VRow class="match-height">
        <VCol
          cols="12"
          lg="8"
        >
          <QueueTable
            :scope="currentScope"
            :current-doctor="userData.fullName"
          />
        </VCol>
        <VCol
          cols="12"
          lg="4"
        >
          <BookingCartPanel />
        </VCol>
      </VRow>
    </div>
  </VeterinaryLayout>
</template>

<style scoped>
.veterinary-dashboard {
  min-height: 100vh;
}

.pill-switcher-container {
  background: rgba(var(--v-theme-primary), 0.08);
  border-radius: 50px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  min-width: 240px;
}

.pill-switcher-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: rgba(var(--v-theme-on-surface), 0.6);
  white-space: nowrap;
}

.pill-switcher-item:hover {
  color: var(--v-theme-primary);
}

.pill-switcher-item.active {
  background: white;
  color: var(--v-theme-primary);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.15);
}

.btn-shadow {
  box-shadow: 0 4px 14px 0 rgba(var(--v-theme-primary), 0.3) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-shadow:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(var(--v-theme-primary), 0.4) !important;
}

/* Ensure equal heights for VCols holding VCards with h-100 */
.match-height > .v-col > .v-card {
  height: 100%;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
