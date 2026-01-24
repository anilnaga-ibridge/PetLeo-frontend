<script setup>
import { authApi, superAdminApi } from "@/plugins/axios"
import { useTheme } from 'vuetify'
import { getAreaChartSplineConfig, getDonutChartConfig, getBarChartConfig } from '@core/libs/apex-chart/apexCharConfig'
import { ref, onMounted, computed } from 'vue'

const vuetifyTheme = useTheme()

// --- DATA STATES ---
const stats = ref({
  totalRoles: 0,
  totalServices: 0,
  totalPlans: 0,
  totalPets: 0,
  totalProviders: 0,
  activeSecurity: 'High',
})

const loading = ref(true)

// --- FETCH DATA ---
const fetchData = async () => {
  loading.value = true
  try {
    const [rolesRes, servicesRes, plansRes, petsRes, usersRes] = await Promise.all([
      authApi.get('/auth/roles/').catch(() => ({ data: { count: 0 } })),
      superAdminApi.get('/api/superadmin/services/').catch(() => ({ data: { count: 0 } })),
      superAdminApi.get('/api/superadmin/plans/').catch(() => ({ data: { count: 0 } })),
      superAdminApi.get('/api/superadmin/pet-types/').catch(() => ({ data: { count: 0 } })),
      superAdminApi.get('/api/superadmin/verified-users/').catch(() => ({ data: { count: 0 } })),
    ])

    stats.value.totalRoles = rolesRes.data.count || (Array.isArray(rolesRes.data) ? rolesRes.data.length : 0)
    stats.value.totalServices = servicesRes.data.count || (Array.isArray(servicesRes.data) ? servicesRes.data.length : 0)
    stats.value.totalPlans = plansRes.data.count || (Array.isArray(plansRes.data) ? plansRes.data.length : 0)
    stats.value.totalPets = petsRes.data.count || (Array.isArray(petsRes.data) ? petsRes.data.length : 0)
    stats.value.totalProviders = usersRes.data.count || (Array.isArray(usersRes.data) ? usersRes.data.length : 0)
  } catch (error) {
    console.error("Error fetching dashboard counts:", error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// --- CHART CONFIGS ---
const lineChartConfig = computed(() => getAreaChartSplineConfig(vuetifyTheme.current.value))
const donutChartConfig = computed(() => getDonutChartConfig(vuetifyTheme.current.value))
const barChartConfig = computed(() => getBarChartConfig(vuetifyTheme.current.value))

// Line Chart: Subscription Growth (Mocked Trend)
const balanceSeries = [{
  name: 'New Subscriptions',
  data: [10, 15, 8, 25, 40, 35, 60, 55, 80, 95, 110, 140],
}]

// Donut Chart: Roles Distribution
const rolesDistributionSeries = [35, 25, 20, 20]
const rolesDistributionLabels = ['Clinic Admins', 'Doctors', 'Nurses', 'Receptionists']

const rolesDonutOptions = computed(() => ({
  ...donutChartConfig.value,
  labels: rolesDistributionLabels,
  colors: ['#7367f0', '#00cfe8', '#ff9f43', '#ea5455'],
  stroke: { width: 0 },
  legend: {
    show: true,
    position: 'bottom',
  },
}))

// Bar Chart: Service Capacity
const serviceCapacitySeries = [{
  name: 'Active Modules',
  data: [8, 12, 5, 3],
}]

const serviceBarOptions = computed(() => ({
  ...barChartConfig.value,
  xaxis: {
    categories: ['Veterinary', 'Grooming', 'Daycare', 'Training'],
  },
  colors: ['#7367f0'],
}))
</script>

<template>
  <div class="premium-dashboard-container pa-6">
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-bold mb-2 dashboard-title gradient-text">
          Command Center
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          Platform Overview & Global Analytics
        </p>
      </div>
      <VBtn 
        prepend-icon="tabler-refresh" 
        variant="tonal" 
        color="primary" 
        rounded="xl"
        :loading="loading"
        @click="fetchData"
      >
        Refresh Data
      </VBtn>
    </div>

    <!-- KPI CARDS -->
    <VRow class="mb-8">
      <VCol
        v-for="(card, index) in [
          { label: 'Total Services', value: stats.totalServices, icon: 'tabler-component', color: 'primary' },
          { label: 'Active Roles', value: stats.totalRoles, icon: 'tabler-shield-lock', color: 'info' },
          { label: 'Subscription Plans', value: stats.totalPlans, icon: 'tabler-package', color: 'warning' },
          { label: 'Global Providers', value: stats.totalProviders, icon: 'tabler-users', color: 'success' }
        ]"
        :key="index"
        cols="12"
        sm="6"
        md="3"
      >
        <VCard class="kpi-card glass-morphism pa-2 h-100">
          <VCardText class="d-flex align-center h-100">
            <VAvatar
              :color="card.color"
              variant="tonal"
              size="52"
              class="rounded-lg me-4"
            >
              <VIcon
                :icon="card.icon"
                size="28"
              />
            </VAvatar>
            <div>
              <div class="text-overline text-medium-emphasis font-weight-bold leading-tight">
                {{ card.label }}
              </div>
              <div class="text-h4 font-weight-bold counter-text">
                {{ card.value }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <!-- AREA CHART: SUBSCRIPTION GROWTH -->
      <VCol
        cols="12"
        lg="8"
      >
        <VCard class="chart-card glass-morphism mb-6">
          <VCardItem>
            <VCardTitle>Platform Growth</VCardTitle>
            <VCardSubtitle>Monthly provider registration & subscriptions</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VueApexCharts
              type="area"
              height="350"
              :options="lineChartConfig"
              :series="balanceSeries"
            />
          </VCardText>
        </VCard>

        <!-- TABLE: RECENT PROVIDER SIGNUPS -->
        <VCard class="table-card glass-morphism">
          <VCardItem>
            <VCardTitle>Recent Provider Verifications</VCardTitle>
            <template #append>
              <VBtn
                size="small"
                variant="text"
                to="/superadmin/documents-verification"
              >
                View All
              </VBtn>
            </template>
          </VCardItem>
          <VDivider />
          <VTable class="premium-dashboard-table">
            <thead>
              <tr>
                <th class="text-uppercase">
                  Organization
                </th>
                <th class="text-uppercase">
                  Service Type
                </th>
                <th class="text-uppercase">
                  Status
                </th>
                <th class="text-uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="n in 5"
                :key="n"
              >
                <td class="font-weight-bold text-primary">
                  Clinic Pro {{ n }}
                </td>
                <td>Veterinary</td>
                <td>
                  <VChip
                    size="x-small"
                    color="warning"
                    variant="tonal"
                  >
                    Pending Review
                  </VChip>
                </td>
                <td class="text-caption text-medium-emphasis">
                  2026-01-1{{ n }}
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <!-- SIDEBAR CHARTS -->
      <VCol
        cols="12"
        lg="4"
      >
        <VCard class="chart-card glass-morphism mb-6">
          <VCardItem>
            <VCardTitle>Access Distribution</VCardTitle>
            <VCardSubtitle>System roles breakdown</VCardSubtitle>
          </VCardItem>
          <VCardText class="d-flex justify-center pa-8">
            <VueApexCharts
              type="donut"
              height="300"
              :options="rolesDonutOptions"
              :series="rolesDistributionSeries"
            />
          </VCardText>
        </VCard>

        <VCard class="chart-card glass-morphism h-100">
          <VCardItem>
            <VCardTitle>Service Infrastructure</VCardTitle>
            <VCardSubtitle>Capacity per microservice</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VueApexCharts
              type="bar"
              height="280"
              :options="serviceBarOptions"
              :series="serviceCapacitySeries"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- SYSTEM CAPABILITIES (What Super Admin can do) -->
    <VRow class="mt-4">
      <VCol cols="12">
        <h2 class="text-h4 font-weight-bold mb-6 gradient-text">
          System Capabilities
        </h2>
        <VRow>
          <VCol
            v-for="(cap, index) in [
              { title: 'Identity & Security', desc: 'Manage global roles, granular capabilities, and provider verification gates.', icon: 'tabler-fingerprint', color: 'primary' },
              { title: 'Infrastructure Builder', desc: 'Define core services, service categories, and facility requirements.', icon: 'tabler-building-factory-2', color: 'info' },
              { title: 'Monetization & Plans', desc: 'Build subscription packages, link features to plans, and manage billing.', icon: 'tabler-premium-rights', color: 'warning' },
              { title: 'Global Data Standards', desc: 'Maintain the master registry of pet types and breeds for data consistency.', icon: 'tabler-database-share', color: 'success' },
              { title: 'Compliance & Verification', desc: 'Review professional documents and configure onboarding requirements.', icon: 'tabler-certificate-check', color: 'error' },
              { title: 'System Monitoring', desc: 'Monitor clinic health, provider status, and perform administrative overrides.', icon: 'tabler-presentation-analytics', color: 'secondary' }
            ]"
            :key="index"
            cols="12"
            md="4"
          >
            <VCard class="capability-card glass-morphism h-100 pa-2">
              <VCardText class="d-flex align-start h-100">
                <VAvatar
                  :color="cap.color"
                  variant="tonal"
                  size="44"
                  class="rounded-lg me-4"
                >
                  <VIcon
                    :icon="cap.icon"
                    size="24"
                  />
                </VAvatar>
                <div>
                  <div class="text-h6 font-weight-bold mb-1">
                    {{ cap.title }}
                  </div>
                  <p class="text-caption text-medium-emphasis mb-0 leading-normal">
                    {{ cap.desc }}
                  </p>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.premium-dashboard-container {
  max-width: 1600px;
  margin: 0 auto;
}

.gradient-text {
  background: linear-gradient(135deg, #7367f0 0%, #ce9ffc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.glass-morphism {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(14px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
}

.kpi-card {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.kpi-card:hover, .capability-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 30px rgba(115, 103, 240, 0.15) !important;
  border-color: rgba(115, 103, 240, 0.3);
}

.capability-card {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chart-card {
  overflow: visible;
}

.premium-dashboard-table {
  background: transparent !important;
}

.premium-dashboard-table thead th {
  background: rgba(248, 250, 252, 0.7) !important;
  font-size: 0.725rem !important;
  font-weight: 800 !important;
  color: #64748b !important;
  border: none !important;
}

.premium-dashboard-table td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03) !important;
  height: 52px !important;
}

.counter-text {
  letter-spacing: -1px;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.v-col {
  animation: fadeInUp 0.6s ease forwards;
}

.v-col:nth-child(1) { animation-delay: 0.1s; }
.v-col:nth-child(2) { animation-delay: 0.2s; }
.v-col:nth-child(3) { animation-delay: 0.3s; }
.v-col:nth-child(4) { animation-delay: 0.4s; }
</style>