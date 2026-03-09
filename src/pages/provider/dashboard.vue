<script setup>
import { onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'
import { usePermissionStore } from '@/stores/permissionStore'
import ProviderLayout from '@/components/ProviderLayout.vue'

const permissionStore = usePermissionStore()
const vuetifyTheme = useTheme()

onMounted(async () => {
  await permissionStore.fetchPermissions()
  await permissionStore.fetchDashboardSummary()
})

const userData = computed(() => permissionStore.userData || {})
const summary = computed(() => permissionStore.dashboardSummary || {})
const currentThemePrimary = computed(() => vuetifyTheme.current.value.colors.primary)

const roleUpper = computed(() => (permissionStore.userData?.role?.name || permissionStore.userData?.role || '').toUpperCase())

const canViewBilling = computed(() => {
  if (permissionStore.hasCapability('BILLING') || permissionStore.hasCapability('MANAGE_PLAN')) return true
  
  return ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(roleUpper.value)
})

const isEmployee = computed(() => {
  if (roleUpper.value === 'SUPERADMIN') return false
  
  return !['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(roleUpper.value)
})

const hasServices = computed(() => permissionStore.enabledServices && permissionStore.enabledServices.length > 0)

const getServiceRoute = service => {
  const name = service.service_name?.toLowerCase() || ''
  
  // Check if user is a basic employee (not Org/Individual owner)
  const role = (permissionStore.userData?.role?.name || permissionStore.userData?.role || '').toUpperCase()
  const isEmployee = !['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(role) && role !== 'SUPERADMIN'

  // If employee, always redirect to bookings for ANY service they click
  if (isEmployee) {
    return { 
      name: 'provider-customer-bookings',
      query: { search: service.service_name }, // Pre-filter bookings by service name
    }
  }

  if (name.includes('veterinary') || service.service_key === 'VETERINARY_CORE') {
    return { name: 'veterinary-dashboard' }
  }
  
  return { name: 'provider-service-details', params: { serviceId: service.service_id } }
}

const planProgress = computed(() => {
  const daysLeft = permissionStore.planDetails?.days_left || 0
  
  return Math.min(100, Math.max(0, (daysLeft / 30) * 100))
})

// --- CHART DATA ---
import VueApexCharts from 'vue3-apexcharts'

const bookingChartSeries = computed(() => {
  const trend = summary.value.bookings?.trend || []
  
  return [{
    name: 'Bookings',
    data: trend.map(d => d.count),
  }]
})

const bookingChartOptions = computed(() => {
  const trend = summary.value.bookings?.trend || []
  const categories = trend.map(d => new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
  
  return {
    chart: {
      type: 'area',
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3, colors: [currentThemePrimary.value] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontSize: '12px' } },
    },
    yaxis: { show: false },
    grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 10 } },
    tooltip: {
      theme: 'light',
      y: { formatter: val => `${val} Bookings` },
    },
    colors: [currentThemePrimary.value],
  }
})

const getRatingPercentage = star => {
  const total = summary.value.total_ratings || 0
  if (total === 0) return 0
  const count = summary.value.rating_distribution?.[star] || 0
  
  return (count / total) * 100
}

const getStarColor = star => {
  if (star >= 4) return 'success'
  if (star === 3) return 'warning'
  
  return 'error'
}
</script>

<template>
  <ProviderLayout>
    <div class="pa-6">
      <!-- HEADER SECTION -->
      <div class="mb-8 d-flex justify-space-between align-center flex-wrap gap-4">
        <div v-if="!isEmployee">
          <h1 class="text-h2 font-weight-bold mb-1">
            Welcome back, <span class="text-primary">{{ userData.fullName?.split(' ')[0] || 'Provider' }}</span> 👋
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Here's what's happening with your business today.
          </p>
        </div>
        <div
          v-else
          class="d-flex gap-3"
        >
          <VBtn
            color="primary"
            prepend-icon="tabler-calendar-star"
            :to="{ name: 'provider-customer-bookings' }"
            size="large"
            elevation="2"
          >
            My Today's Schedule
          </VBtn>
        </div>
      </div>

      <!-- EMPLOYEE WELCOME CARD -->
      <VRow
        v-if="isEmployee"
        class="mb-6"
      >
        <VCol cols="12">
          <VCard
            color="primary"
            class="welcome-banner"
          >
            <VRow no-gutters>
              <VCol
                cols="12"
                md="8"
                class="pa-6"
              >
                <h2 class="text-h3 font-weight-bold text-white mb-2">
                  Ready for your shift?
                </h2>
                <p class="text-body-1 text-white opacity-90 mb-6">
                  Check your assigned bookings for today and manage your pet spa appointments.
                </p>
                <VBtn
                  color="white"
                  class="text-primary font-weight-bold"
                  :to="{ name: 'provider-customer-bookings' }"
                >
                  View Bookings
                </VBtn>
              </VCol>
              <VCol
                cols="12"
                md="4"
                class="d-none d-md-flex align-center justify-center"
              >
                <VIcon
                  icon="tabler-calendar-user"
                  size="120"
                  color="white"
                  class="opacity-20"
                />
              </VCol>
            </VRow>
          </VCard>
        </VCol>
      </VRow>

      <VRow v-if="!isEmployee">
        <!-- ANALYTICS CARDS (ROW 1) -->
        <VCol
          cols="12"
          md="4"
        >
          <VCard class="analytic-card overflow-hidden">
            <div class="pa-5 d-flex align-center gap-4">
              <VAvatar
                color="primary"
                variant="tonal"
                size="58"
                rounded="lg"
              >
                <VIcon
                  icon="tabler-building-hospital"
                  size="28"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ summary.total_clinics || 0 }}
                </div>
                <div class="text-body-1 text-medium-emphasis">
                  Active Clinics
                </div>
              </div>
            </div>
            <VDivider />
            <div
              class="pa-3 bg-light-primary text-center cursor-pointer"
              @click="$router.push({ name: 'provider-settings-tab', params: { tab: 'clinics' } })"
            >
              <span class="text-caption font-weight-medium text-primary">Manage Clinic Locations</span>
            </div>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VCard class="analytic-card overflow-hidden">
            <div class="pa-5 d-flex align-center gap-4">
              <VAvatar
                color="info"
                variant="tonal"
                size="58"
                rounded="lg"
              >
                <VIcon
                  icon="tabler-users"
                  size="28"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ summary.total_employees || 0 }}
                </div>
                <div class="text-body-1 text-medium-emphasis">
                  Total Team Members
                </div>
              </div>
            </div>
            <VDivider />
            <div class="pa-3 bg-light-info text-center">
              <span class="text-caption font-weight-medium text-info">View Staff Records</span>
            </div>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="4"
        >
          <VCard class="analytic-card overflow-hidden">
            <div class="pa-5 d-flex align-center gap-4">
              <VAvatar
                color="success"
                variant="tonal"
                size="58"
                rounded="lg"
              >
                <VIcon
                  icon="tabler-shield-check"
                  size="28"
                />
              </VAvatar>
              <div>
                <div class="text-h3 font-weight-bold">
                  {{ summary.total_roles || 0 }}
                </div>
                <div class="text-body-1 text-medium-emphasis">
                  Configured Roles
                </div>
              </div>
            </div>
            <VDivider />
            <div class="pa-3 bg-light-success text-center">
              <span class="text-caption font-weight-medium text-success">Manage Permissions</span>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <VRow v-if="!isEmployee">
        <!-- ANALYTICS CHARTS (ROW 2 - PREMIUM) -->
        <!-- Booking Trends (Area Chart) -->
        <VCol
          cols="12"
          md="8"
        >
          <VCard
            class="analytic-card h-100"
            elevation="2"
          >
            <VCardItem>
              <template #append>
                <div class="d-flex align-center gap-2">
                  <VChip
                    color="success"
                    size="small"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    <VIcon
                      start
                      icon="tabler-trending-up"
                    />
                    +12.5%
                  </VChip>
                  <VBtn
                    icon="tabler-dots-vertical"
                    variant="text"
                    size="small"
                    color="medium-emphasis"
                  />
                </div>
              </template>
              <VCardTitle class="text-h5 font-weight-bold">
                Booking Trends
              </VCardTitle>
              <VCardSubtitle>Last 7 Days Performance</VCardSubtitle>
            </VCardItem>
            
            <VCardText
              class="pb-0"
              style="min-height: 250px;"
            >
              <VueApexCharts
                type="area"
                height="250"
                :options="bookingChartOptions"
                :series="bookingChartSeries"
              />
            </VCardText>
            
            <VDivider class="mt-4" />
            
            <div class="d-flex justify-space-between pa-4">
              <div class="text-center">
                <div class="text-h4 font-weight-black">
                  {{ summary.bookings?.total_bookings || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis font-weight-bold uppercase">
                  Total
                </div>
              </div>
              <div class="text-center">
                <div class="text-h4 font-weight-black text-warning">
                  {{ summary.bookings?.pending_bookings || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis font-weight-bold uppercase">
                  Pending
                </div>
              </div>
              <div class="text-center">
                <div class="text-h4 font-weight-black text-success">
                  {{ summary.bookings?.completed_bookings || 0 }}
                </div>
                <div class="text-caption text-medium-emphasis font-weight-bold uppercase">
                  Completed
                </div>
              </div>
            </div>
          </VCard>
        </VCol>

        <!-- Rating Distribution (Radial Bar using simple progress for now to save space/complexity, or Donut) -->
        <VCol
          cols="12"
          md="4"
        >
          <VCard
            class="analytic-card h-100"
            elevation="2"
          >
            <VCardItem>
              <VCardTitle class="text-h5 font-weight-bold">
                Client Satisfaction
              </VCardTitle>
              <VCardSubtitle>Based on {{ summary.total_ratings || 0 }} reviews</VCardSubtitle>
            </VCardItem>
            
            <VCardText class="d-flex flex-column align-center justify-center py-6">
              <!-- Average Rating Circle -->
              <div
                class="position-relative d-flex align-center justify-center mb-6"
                style="height: 150px; width: 150px;"
              >
                <VProgressCircular
                  :model-value="(summary.average_rating / 5) * 100"
                  size="150"
                  width="15"
                  color="primary"
                  bg-color="grey-100"
                >
                  <div class="text-center">
                    <div class="text-h3 font-weight-black text-slate-800">
                      {{ summary.average_rating || 0 }}
                    </div>
                    <div class="d-flex justify-center">
                      <VIcon
                        icon="tabler-star-filled"
                        color="warning"
                        size="20"
                      />
                    </div>
                  </div>
                </VProgressCircular>
              </div>
                
              <!-- Star Distribution -->
              <div class="w-100 px-2">
                <div
                  v-for="star in [5, 4, 3, 2, 1]"
                  :key="star"
                  class="d-flex align-center gap-2 mb-2"
                >
                  <div class="text-caption font-weight-bold text-slate-500 min-w-30">
                    {{ star }} Star
                  </div>
                  <VProgressLinear
                    :model-value="getRatingPercentage(star)"
                    height="6"
                    rounded
                    :color="getStarColor(star)"
                    class="flex-grow-1"
                  />
                  <div class="text-caption font-weight-bold text-slate-700 min-w-20 text-end">
                    {{ summary.rating_distribution?.[star] || 0 }}
                  </div>
                </div>
              </div>
                
              <div class="mt-6 w-100">
                <VBtn
                  block
                  variant="outlined"
                  :to="{ name: 'provider-reviews' }"
                >
                  View All Reviews
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>


      <VRow v-if="canViewBilling">
        <VCol cols="12">
          <VCard
            class="plan-card"
            elevation="2"
          >
            <VRow no-gutters>
              <VCol
                cols="12"
                md="8"
                class="pa-6 border-e"
              >
                <div class="d-flex align-center gap-3 mb-4">
                  <VAvatar
                    color="primary"
                    size="40"
                  >
                    <VIcon
                      icon="tabler-crown"
                      color="white"
                    />
                  </VAvatar>
                  <h2 class="text-h4 font-weight-bold">
                    Current Plan: {{ permissionStore.planDetails?.title || 'Basic' }}
                  </h2>
                </div>
                <p class="text-body-1 mb-6">
                  You are currently on the <strong>{{ permissionStore.planDetails?.subtitle || 'Weekly' }}</strong> subscription. 
                  Enjoy access to {{ permissionStore.enabledServices?.length || 0 }} core business modules.
                </p>
                
                <div class="mb-2 d-flex justify-space-between text-body-2">
                  <span>Subscription Progress</span>
                  <span class="font-weight-bold text-primary">{{ permissionStore.planDetails?.days_left }} Days Remaining</span>
                </div>
                <VProgressLinear
                  :model-value="planProgress"
                  height="10"
                  rounded
                  color="primary"
                />
              </VCol>
              
              <VCol
                cols="12"
                md="4"
                class="pa-6 bg-var-theme-background d-flex flex-column justify-center align-center text-center"
              >
                <div class="text-caption mb-1">
                  Plan Expires On
                </div>
                <div class="text-h3 font-weight-black mb-4">
                  {{ permissionStore.planDetails?.end_date ? new Date(permissionStore.planDetails.end_date).toLocaleDateString('en-GB') : 'N/A' }}
                </div>
                <VBtn
                  block
                  color="primary"
                  variant="elevated"
                  :to="{ name: 'provider-subscription' }"
                >
                  Renew or Upgrade
                </VBtn>
              </VCol>
            </VRow>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <!-- ENABLED SERVICES (ROW 3) -->
        <VCol cols="12">
          <div class="d-flex align-center justify-space-between mb-6">
            <h3 class="text-h4 font-weight-bold">
              {{ isEmployee ? 'My Assigned Services' : 'Active Modules' }}
            </h3>
            <span class="text-caption">{{ isEmployee ? 'Click a service to view your assigned bookings' : 'Showing all purchased business services' }}</span>
          </div>

          <VRow>
            <VCol 
              v-for="service in permissionStore.enabledServices" 
              :key="service.service_id"
              cols="12"
              md="6"
              lg="4"
            >
              <VCard
                class="service-module-card h-100 transition-swing"
                variant="outlined"
                hover
                @click="$router.push(getServiceRoute(service))"
              >
                <VCardItem class="pb-2">
                  <template #prepend>
                    <VAvatar
                      color="primary"
                      variant="tonal"
                      size="48"
                      rounded="lg"
                    >
                      <VIcon
                        :icon="service.icon || 'tabler-app-window'"
                        size="24"
                      />
                    </VAvatar>
                  </template>
                  <VCardTitle class="text-h5 font-weight-bold">
                    {{ service.service_name }}
                  </VCardTitle>
                  <VCardSubtitle>{{ service.service_key }}</VCardSubtitle>
                </VCardItem>
                
                <VCardText>
                  <div class="mb-4">
                    <div class="text-overline mb-2">
                      Capabilities
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                      <VChip
                        v-for="action in ['view', 'create', 'edit', 'delete']"
                        v-show="service[`can_${action}`]"
                        :key="action"
                        size="x-small"
                        :color="action === 'view' ? 'success' : action === 'create' ? 'primary' : action === 'edit' ? 'info' : 'error'"
                        variant="flat"
                        class="text-uppercase font-weight-bold"
                      >
                        {{ action }}
                      </VChip>
                    </div>
                  </div>
                  
                  <VDivider class="mb-4" />
                  
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption font-weight-medium">
                      {{ service.categories?.length || 0 }} Specialized Sub-Modules
                    </span>
                    <VIcon
                      icon="tabler-chevron-right"
                      size="18"
                      class="text-medium-emphasis"
                    />
                  </div>
                </VCardText>
              </VCard>
            </VCol>
            
            <VCol
              v-if="!hasServices"
              cols="12"
            >
              <VCard
                variant="tonal"
                color="info"
                class="pa-10 text-center"
              >
                <VIcon
                  icon="tabler-info-circle"
                  size="48"
                  class="mb-4"
                />
                <h3 class="text-h4 mb-2">
                  Configure Your Modules
                </h3>
                <p
                  class="text-body-1 mx-auto"
                  style="max-width: 500px;"
                >
                  You haven't activated any business modules yet. Visit the Plan Builder to select the services that fit your business needs.
                </p>
                <VBtn
                  color="primary"
                  class="mt-4"
                  :to="{ name: 'provider-home' }"
                >
                  Start Building Plan
                </VBtn>
              </VCard>
            </VCol>
          </VRow>
        </VCol>
      </VRow>
    </div>
  </ProviderLayout>
</template>

<style scoped>
.analytic-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.analytic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(var(--v-shadow-key-umbra-opacity), 0.1);
}

.plan-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-primary), 0.03) 100%);
}

.service-module-card {
  border-width: 1px;
  transition: all 0.3s ease;
}
.service-module-card:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.02);
}

.bg-light-primary { background-color: rgba(var(--v-theme-primary), 0.08); }
.bg-light-info { background-color: rgba(var(--v-theme-info), 0.08); }
.bg-light-success { background-color: rgba(var(--v-theme-success), 0.08); }
.bg-light-warning { background-color: rgba(var(--v-theme-warning), 0.08); }
.bg-light-error { background-color: rgba(var(--v-theme-error), 0.08); }
.bg-light-secondary { background-color: rgba(var(--v-theme-secondary), 0.08); }
.min-w-30 { min-width: 45px; }
.min-w-20 { min-width: 20px; }
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
