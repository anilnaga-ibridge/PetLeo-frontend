<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'

import LockedFeature from '@/components/LockedFeature.vue'
import ProviderFacilitiesManager from './components/ProviderFacilitiesManager.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { useCookie } from '@/@core/composable/useCookie'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'

const route = useRoute()
const permissionStore = usePermissionStore()
const serviceId = computed(() => route.params.serviceId)
const providerId = computed(() => userData.value?.provider_id)

console.log('🛣️ ROUTE DEBUG:')
console.log('  Full route:', route)
console.log('  route.params:', route.params)
console.log('  route.params.serviceId:', route.params.serviceId)
console.log('  serviceId.value:', serviceId.value)

const serviceName = ref('')
const canCreate = ref(false)
const canEdit = ref(false)
const canDelete = ref(false)
const activeTab = ref('overview')

const loadingAnalytics = ref(false)
const analyticsStats = ref([])
const revenueTrend = ref([])

const showBookingsDialog = ref(false)
const dialogTitle = ref('')
const dialogBookings = ref([])
const dialogLoading = ref(false)

const normalize = val => (val || '').toLowerCase().replace(/[- ]/g, '_')

const currentServicePermissions = computed(() => {
  if (!serviceId.value) {
    console.log('🔍 No serviceId from route')
    
    return {}
  }
  
  if (!permissionStore.permissions || permissionStore.permissions.length === 0) {
    console.log('🔍 Permissions not loaded yet')
    
    return {}
  }
  
  const sid = normalize(serviceId.value)
  
  console.log('🔍 PERMISSION DEBUG:')
  console.log('  Route serviceId:', serviceId.value)
  console.log('  Normalized:', sid)
  console.log('  All permissions:', permissionStore.permissions)
  
  const match = permissionStore.permissions.find(p => {
    const match_id = normalize(p.service_id) === sid
    const match_key = normalize(p.service_key) === sid
    const match_name = normalize(p.service_name) === sid
    
    console.log(`  Checking ${p.service_name}: id=${match_id}, key=${match_key}, name=${match_name}`)
    
    if (match_id || match_key || match_name) {
      console.log('  ✅ MATCHED:', p)
    }
    
    return match_id || match_key || match_name
  })
  
  console.log('  Final match:', match || 'NONE')
  
  return match || {}
})

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = ProviderLayout

// Detect Veterinary Service
const isVeterinary = computed(() => {
  if (!serviceName.value) return false
  
  const sn = normalize(serviceName.value)
  const sid = normalize(serviceId.value)
  
  return sn.includes('veterinary') || sid === '2dff446f-c95f-4310-ba4d-05e3395dd7eb'
})

// Feature Mapping (Same as Super Admin)
const featureMapping = {
  'VETERINARY_VISITS': 'Manage Visits',
  'VETERINARY_VITALS': 'Record Vitals',
  'VETERINARY_PRESCRIPTIONS': 'Prescriptions',
  'VETERINARY_LABS': 'Lab Tests',
  'VETERINARY_ONLINE_CONSULT': 'Online Consultation',
  'VETERINARY_OFFLINE_VISIT': 'Offline Visits',
  'VETERINARY_MEDICINE_REMINDERS': 'Medicine Reminders',
}

const formatFeatureName = name => {
  if (!name) return ''
  if (featureMapping[name]) return featureMapping[name]
  const upper = name.toUpperCase()
  if (featureMapping[upper]) return featureMapping[upper]
  if (upper.includes('_')) {
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  
  return name
}

// Get Features from Permission Store (for Veterinary)
const veterinaryFeatures = computed(() => {
  if (!isVeterinary.value) return []
  
  // Find the service permissions
  const servicePerms = currentServicePermissions.value
  if (!servicePerms || !servicePerms.categories) return []

  // For veterinary_core, categories ARE the features
  return (servicePerms.categories || []).map(cat => ({
    id: cat.category_id,
    name: cat.category_name || formatFeatureName(cat.category_key),
    code: cat.category_key,
    enabled: !!cat.can_view,
  }))
})

// Reactive Permission Calculation
const servicePermissions = computed(() => currentServicePermissions.value)

// Unified canView check
const canView = computed(() => {
  console.log('🔒 CANVIEW CHECK:')
  console.log('  servicePermissions.value:', servicePermissions.value)
  console.log('  can_view:', servicePermissions.value?.can_view)
  
  if (servicePermissions.value?.can_view) {
    console.log('  ✅ GRANTED via servicePermissions')
    
    return true
  }
  
  // Fallback to capability check
  const fallback = !!serviceId.value && permissionStore.hasCapability(serviceId.value)

  console.log('  Fallback check:', fallback)
  
  return fallback
})

// Update other refs
watch(servicePermissions, newPerms => {
  if (newPerms) {
    serviceName.value = newPerms.service_name
    canCreate.value = newPerms.can_create
    canEdit.value = newPerms.can_edit
    canDelete.value = newPerms.can_delete
  }
}, { immediate: true })

import { customerApi, providerApi } from '@/plugins/axios'
import VueApexCharts from 'vue3-apexcharts'

const fetchServiceStats = async () => {
  if (!serviceId.value) return
  
  loadingAnalytics.value = true
  try {
    const res = await providerApi.get('/api/provider/dashboard-summary/', {
      params: { service_id: serviceId.value },
    })
    
    const data = res.data
    const bookings = data.bookings || {}
    
    analyticsStats.value = [
      {
        title: 'Total Bookings',
        value: bookings.total_bookings || 0,
        change: '+0%', // Backend could provide this later
        icon: 'tabler-calendar-event',
        color: 'primary',
        trend: bookings.trend || [],
      },
      {
        title: 'Pending Bookings',
        value: bookings.pending_bookings || 0,
        change: 'Active',
        icon: 'tabler-clock',
        color: 'warning',
      },
      {
        title: 'Total Revenue',
        value: `₹${parseFloat(bookings.total_revenue || 0).toLocaleString()}`,
        change: '+0%',
        icon: 'tabler-currency-rupee',
        color: 'success',
      },
      {
        title: 'Avg. Rating',
        value: data.average_rating || '0.0',
        change: `${data.total_ratings || 0} reviews`,
        icon: 'tabler-star',
        color: 'info',
      },
    ]
    
    revenueTrend.value = bookings.trend || []
  } catch (err) {
    console.error('Failed to fetch service stats:', err)
  } finally {
    loadingAnalytics.value = false
  }
}

const fetchRecentActivity = async () => {
  if (!serviceId.value) return

  try {
    // Use providerApi (port 8002) - this page is provider-authenticated.
    // The customer bookings endpoint (/api/pet-owner/bookings/) requires a pet-owner JWT
    // and cannot be called from a provider session. Instead, use our dashboard-summary
    // which already carries recent booking data.
    const res = await providerApi.get('/api/provider/dashboard-summary/', {
      params: { service_id: serviceId.value },
    })

    const bookings = res.data?.bookings?.recent || []

    if (bookings.length > 0) {
      recentActivity.value = bookings.map(b => ({
        title: b.pet_name || 'Unknown Pet',
        subtitle: `${b.status} • ${new Date(b.selected_time || b.created_at).toLocaleDateString()}`,
        icon: b.status === 'COMPLETED' ? 'tabler-circle-check' : 'tabler-circle-dotted',
        color: b.status === 'COMPLETED' ? 'success' : 'warning',
      }))
    } else {
      // Fallback: show a summary note derived from analyticsStats (already fetched)
      recentActivity.value = []
    }
  } catch (err) {
    // Non-critical: recent activity is complementary data; fail silently
    console.warn('Recent activity unavailable (non-critical):', err?.message)
    recentActivity.value = []
  }
}

const chartOptions = computed(() => {
  const categories = revenueTrend.value.map(d => new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))
  
  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: categories,
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: {
      labels: { 
        formatter: val => `₹${val}`,
        style: { fontSize: '12px' },
      },
    },
    tooltip: {
      y: { formatter: val => `₹${val}` },
    },
    colors: ['#7367F0'],
  }
})

const chartSeries = computed(() => {
  return [{
    name: 'Revenue',
    data: revenueTrend.value.map(d => d.revenue || 0),
  }]
})

onMounted(async () => {
  await permissionStore.fetchPermissions()
  
  if (!isVeterinary.value && canView.value) {
    fetchServiceStats()
    fetchRecentActivity()
  }
})

watch(serviceId, () => {
  if (!isVeterinary.value && canView.value) {
    fetchServiceStats()
    fetchRecentActivity()
  }
})

// ... rest of code ...


const showUpgradeDialog = ref(false)
const router = useRouter()
const recentActivity = ref([])

const handleStatClick = async stat => {
  // Map card titles to statuses used in customer-bookings.vue
  let status = 'ALL'
  if (stat.title === 'Pending Bookings') status = 'PENDING'
  if (stat.title === 'Total Revenue') status = 'COMPLETED'
  if (stat.title === 'Total Bookings') status = 'ALL'
  
  dialogTitle.value = `${stat.title} - ${serviceName.value}`
  showBookingsDialog.value = true
  dialogLoading.value = true
  dialogBookings.value = []
  
  try {
    const res = await customerApi.get('/api/pet-owner/bookings/bookings/', {
      params: { 
        service_id: serviceId.value,
        status: status,
      },
    })
    
    dialogBookings.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch dialog bookings:', err)
  } finally {
    dialogLoading.value = false
  }
}

const getStatusColor = status => {
  switch (status) {
  case 'PENDING': return 'warning'
  case 'CONFIRMED': return 'primary'
  case 'COMPLETED': return 'success'
  case 'REJECTED': return 'error'
  case 'CANCELLED': return 'secondary'
  default: return 'secondary'
  }
}

const getPetPhoto = pet => {
  if (!pet?.photo) return null
  
  return pet.photo.startsWith('http') ? pet.photo : `http://localhost:8005${pet.photo}`
}

const handleOpenDashboard = () => {
  if (permissionStore.hasCapability('VETERINARY_CORE')) {
    router.push({ name: 'veterinary-dashboard' })
  } else {
    showUpgradeDialog.value = true
  }
}
</script>

<template>
  <component :is="currentLayout">
    <!-- LOCKED SCREEN -->
    <LockedFeature 
      v-if="!canView" 
      title="Service Locked"
      message="You do not have permission to view this service. Please upgrade your plan."
    />

    <!-- SERVICE CONTENT -->
    <div
      v-else
      class="service-details-page pa-4"
    >
      <!-- HEADER -->
      <div class="d-flex flex-column flex-md-row justify-space-between align-md-center mb-8 gap-4">
        <div class="d-flex align-center">
          <VAvatar
            color="primary"
            variant="tonal"
            size="64"
            class="me-4 rounded-lg"
          >
            <VIcon
              icon="tabler-box"
              size="32"
            />
          </VAvatar>
          <div>
            <h1 class="text-h3 font-weight-bold text-primary">
              {{ serviceName }}
            </h1>
            <div class="d-flex align-center gap-2 mt-1">
              <VChip
                color="success"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                Active
              </VChip>
              <span class="text-body-2 text-medium-emphasis">Service ID: {{ serviceId }}</span>
            </div>
          </div>
        </div>
        
        <div class="d-flex gap-3">
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="tabler-settings"
          >
            Settings
          </VBtn>
          <VBtn
            color="primary"
            prepend-icon="tabler-eye"
          >
            View Public Page
          </VBtn>
        </div>
      </div>

      <!-- TABS -->
      <VTabs
        v-model="activeTab"
        class="mb-6 border-b"
      >
        <VTab value="overview">
          Overview
        </VTab>
        <VTab
          v-if="!isVeterinary"
          value="categories"
        >
          <VIcon
            icon="tabler-category"
            class="me-2"
          />
          Categories
        </VTab>
        <VTab
          v-if="!isVeterinary"
          value="facilities"
        >
          <VIcon
            icon="tabler-building-hospital"
            class="me-2"
          />
          Facilities & Pricing
        </VTab>
        <VTab
          v-if="!isVeterinary"
          value="summary"
        >
          <VIcon
            icon="tabler-list-details"
            class="me-2"
          />
          Summary
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <!-- 1. OVERVIEW TAB -->
        <VWindowItem value="overview">
          <!-- VETERINARY: Feature Module UI -->
          <div v-if="isVeterinary">
            <VRow>
              <VCol
                cols="12"
                md="8"
              >
                <VCard
                  class="mb-6 border"
                  elevation="0"
                >
                  <VCardItem class="pb-2">
                    <div class="d-flex align-center">
                      <VAvatar
                        color="primary"
                        variant="tonal"
                        class="me-3"
                      >
                        <VIcon icon="tabler-stethoscope" />
                      </VAvatar>
                      <div>
                        <VCardTitle class="text-h5 font-weight-bold">
                          Veterinary Management
                        </VCardTitle>
                        <VCardSubtitle>Feature Module</VCardSubtitle>
                      </div>
                    </div>
                  </VCardItem>
                  
                  <VCardText class="pt-4">
                    <div class="bg-grey-lighten-4 pa-4 rounded-lg mb-4">
                      <div class="d-flex align-center mb-2">
                        <VIcon
                          icon="tabler-info-circle"
                          size="20"
                          class="text-primary me-2"
                        />
                        <span class="font-weight-bold text-primary">Module Active</span>
                      </div>
                      <p class="text-body-2 mb-0">
                        This is a specialized feature module. Features are enabled based on your subscription plan.
                        You do not need to configure categories or facilities for this service.
                      </p>
                    </div>

                    <h3 class="text-h6 font-weight-bold mb-3">
                      Enabled Features
                    </h3>
                    
                    <div
                      v-if="veterinaryFeatures.length === 0"
                      class="text-medium-emphasis font-italic"
                    >
                      No features enabled for your current plan.
                    </div>

                    <VRow v-else>
                      <VCol
                        v-for="feature in veterinaryFeatures"
                        :key="feature.code"
                        cols="12"
                        sm="6"
                      >
                        <div class="d-flex align-center pa-3 border rounded bg-surface">
                          <VIcon
                            icon="tabler-check"
                            color="success"
                            class="me-3"
                          />
                          <span class="font-weight-medium">{{ feature.name }}</span>
                        </div>
                      </VCol>
                    </VRow>

                    <div class="mt-6">
                      <VBtn
                        color="primary"
                        size="large"
                        block
                        prepend-icon="tabler-layout-dashboard"
                        @click="handleOpenDashboard"
                      >
                        Open Veterinary Dashboard
                      </VBtn>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="4"
              >
                <VCard
                  title="Quick Actions"
                  class="border"
                  elevation="0"
                >
                  <VList lines="one">
                    <VListItem
                      title="New Visit"
                      prepend-icon="tabler-plus"
                      link
                      :to="{ name: 'veterinary-visits-new' }"
                    />
                    <VDivider inset />
                    <VListItem
                      title="Register Pet"
                      prepend-icon="tabler-paw"
                      link
                      :to="{ name: 'veterinary-pets-new' }"
                    />
                    <VDivider inset />
                    <VListItem
                      title="View Schedule"
                      prepend-icon="tabler-calendar"
                      link
                      :to="{ name: 'veterinary-schedule' }"
                    />
                  </VList>
                </VCard>
              </VCol>
            </VRow>
          </div>



          <!-- REGULAR: Catalog Service UI -->
          <div v-else>
            <VRow v-if="loadingAnalytics">
              <VCol
                cols="12"
                class="text-center py-10"
              >
                <VProgressCircular
                  indeterminate
                  color="primary"
                />
              </VCol>
            </VRow>
            <VRow v-else>
              <VCol
                v-for="stat in analyticsStats"
                :key="stat.title"
                cols="12"
                sm="6"
                md="3"
              >
                <VCard
                  elevation="0"
                  class="border h-100 cursor-pointer analytics-card transition-all"
                  @click="handleStatClick(stat)"
                >
                  <VCardText>
                    <div class="d-flex justify-space-between align-start mb-4">
                      <VAvatar
                        :color="stat.color"
                        variant="tonal"
                        rounded
                      >
                        <VIcon :icon="stat.icon" />
                      </VAvatar>
                      <VChip
                        :color="stat.change.includes('-') ? 'error' : 'success'"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ stat.change }}
                      </VChip>
                    </div>
                    <div class="text-h4 font-weight-bold mb-1">
                      {{ stat.value }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ stat.title }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
              
              <VCol
                cols="12"
                md="8"
              >
                <VCard
                  title="Revenue Trends"
                  class="h-100"
                >
                  <VCardText
                    class="pa-0"
                    style="min-height: 300px;"
                  >
                    <div
                      v-if="revenueTrend.length === 0"
                      class="d-flex align-center justify-center h-100 text-medium-emphasis py-10"
                    >
                      <div class="text-center">
                        <VIcon
                          icon="tabler-chart-bar"
                          size="48"
                          class="mb-2 opacity-50"
                        />
                        <p>No revenue data available yet</p>
                      </div>
                    </div>
                    <VueApexCharts
                      v-else
                      type="area"
                      height="300"
                      :options="chartOptions"
                      :series="chartSeries"
                    />
                  </VCardText>
                </VCard>
              </VCol>
              
              <VCol
                cols="12"
                md="4"
              >
                <VCard
                  title="Recent Activity"
                  class="h-100"
                >
                  <VList lines="two">
                    <template v-if="recentActivity.length > 0">
                      <template
                        v-for="(activity, index) in recentActivity"
                        :key="index"
                      >
                        <VListItem
                          :title="activity.title"
                          :subtitle="activity.subtitle"
                        >
                          <template #prepend>
                            <VAvatar
                              :color="activity.color"
                              variant="tonal"
                              size="32"
                              class="me-3"
                            >
                              <VIcon
                                :icon="activity.icon"
                                size="18"
                              />
                            </VAvatar>
                          </template>
                        </VListItem>
                        <VDivider
                          v-if="index < recentActivity.length - 1"
                          inset
                        />
                      </template>
                    </template>
                    <template v-else>
                      <VListItem
                        title="No recent activity"
                        subtitle="Bookings will appear here"
                        prepend-icon="tabler-info-circle"
                      />
                    </template>
                  </VList>
                </VCard>
              </VCol>
            </VRow>
          </div>

          <!-- UPGRADE DIALOG -->
          <VDialog
            v-model="showUpgradeDialog"
            max-width="500"
          >
            <VCard>
              <VCardTitle class="text-h5 font-weight-bold pa-4">
                Upgrade Required
              </VCardTitle>
              <VCardText class="pa-4 pt-0">
                <p class="text-body-1 mb-4">
                  Your current plan does not include access to the Veterinary Dashboard. 
                  Please upgrade your plan to unlock these features.
                </p>
                <div class="d-flex justify-end gap-2">
                  <VBtn
                    variant="text"
                    color="secondary"
                    @click="showUpgradeDialog = false"
                  >
                    Cancel
                  </VBtn>
                  <VBtn
                    color="primary"
                    :to="{ name: 'provider-home', hash: '#plans' }"
                  >
                    View Plans
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </VDialog>
        </VWindowItem>

        <!-- 2. CATEGORIES TAB -->
        <VWindowItem value="categories">
          <ProviderFacilitiesManager
            :service-id="serviceId"
            mode="categories"
            :permissions="currentServicePermissions"
          />
        </VWindowItem>

        <!-- 3. FACILITIES TAB -->
        <VWindowItem value="facilities">
          <ProviderFacilitiesManager
            :service-id="serviceId"
            mode="facilities"
            :permissions="currentServicePermissions"
          />
        </VWindowItem>

        <!-- 4. SUMMARY TAB -->
        <VWindowItem value="summary">
          <ProviderFacilitiesManager
            :service-id="serviceId"
            mode="summary"
            :permissions="currentServicePermissions"
          />
        </VWindowItem>
      </VWindow>

      <!-- BOOKINGS LIST DIALOG -->
      <VDialog
        v-model="showBookingsDialog"
        max-width="800"
        scrollable
      >
        <VCard>
          <VCardTitle class="pa-4 d-flex justify-space-between align-center">
            <span class="text-h5 font-weight-bold">{{ dialogTitle }}</span>
            <VBtn
              icon="tabler-x"
              variant="text"
              color="secondary"
              @click="showBookingsDialog = false"
            />
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-4 pt-4">
            <div
              v-if="dialogLoading"
              class="d-flex justify-center py-10"
            >
              <VProgressCircular
                indeterminate
                color="primary"
              />
            </div>
            
            <div
              v-else-if="dialogBookings.length === 0"
              class="text-center py-10"
            >
              <VIcon
                icon="tabler-calendar-off"
                size="64"
                class="mb-4 opacity-50"
              />
              <p class="text-h6 text-medium-emphasis">
                No bookings found for this category
              </p>
            </div>
            
            <VList
              v-else
              lines="two"
            >
              <VListItem
                v-for="booking in dialogBookings"
                :key="booking.id"
                class="mb-3 border rounded-lg"
              >
                <template #prepend>
                  <VAvatar
                    size="48"
                    rounded="lg"
                    class="me-3"
                  >
                    <VImg
                      v-if="getPetPhoto(booking.pet_details)"
                      :src="getPetPhoto(booking.pet_details)"
                      cover
                    />
                    <VIcon
                      v-else
                      icon="tabler-paw"
                    />
                  </VAvatar>
                </template>
                
                <VListItemTitle class="font-weight-bold">
                  {{ booking.pet_name }}
                  <VChip
                    :color="getStatusColor(booking.status)"
                    size="x-small"
                    class="ms-2"
                  >
                    {{ booking.status }}
                  </VChip>
                </VListItemTitle>
                
                <VListItemSubtitle>
                  {{ booking.owner_details?.full_name }} • {{ new Date(booking.selected_time).toLocaleDateString() }} 
                  at {{ new Date(booking.selected_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </VListItemSubtitle>
                
                <template #append>
                  <div class="text-right">
                    <div class="font-weight-black text-primary">
                      ₹{{ parseFloat(booking.total_price || 0).toLocaleString() }}
                    </div>
                    <VBtn
                      variant="tonal"
                      size="x-small"
                      color="primary"
                      class="mt-1"
                      @click="router.push({ name: 'provider-customer-bookings', query: { search: booking.id } })"
                    >
                      View Full Details
                    </VBtn>
                  </div>
                </template>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VDialog>
    </div>
  </component>
</template>

<style scoped>
.category-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border-radius: 12px;
}
.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.08) !important;
}

.facility-chip {
  transition: all 0.2s;
}
.facility-chip:hover {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

.analytics-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
  background-color: rgba(var(--v-theme-primary), 0.02);
}
</style>

<route lang="yaml">
name: provider-service-details
path: /provider/service-details/:serviceId
meta:
  layout: blank
  action: read
  subject: Auth
</route>
