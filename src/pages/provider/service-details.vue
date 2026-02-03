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

const serviceName = ref('')
const canView = ref(false)
const canCreate = ref(false)
const canEdit = ref(false)
const canDelete = ref(false)
const activeTab = ref('overview')

const currentServicePermissions = computed(() => {
  if (!serviceId.value) return {}
  return permissionStore.permissions.find(p => p.service_id === serviceId.value) || {}
})

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = ProviderLayout

// Detect Veterinary Service
const isVeterinary = computed(() => {
  if (!serviceName.value) return false
  
  return serviceName.value.toUpperCase().includes('VETERINARY') || serviceId.value === '2dff446f-c95f-4310-ba4d-05e3395dd7eb'
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
  const servicePerms = permissionStore.permissions.find(p => p.service_id === serviceId.value)
  if (!servicePerms || !servicePerms.capabilities) return []

  // Filter for VETERINARY_ capabilities
  return servicePerms.capabilities.filter(cap => 
    cap.code && cap.code.startsWith('VETERINARY_'),
  ).map(cap => ({
    id: cap.id,
    name: formatFeatureName(cap.code),
    code: cap.code,
    enabled: true, // If it's in the list, it's enabled for this plan
  }))
})

const checkPermissions = () => {
  if (!serviceId.value) return

  // Find the service in the store permissions
  const service = permissionStore.permissions.find(p => p.service_id === serviceId.value)
  
  if (service) {
    serviceName.value = service.service_name
    canView.value = service.can_view
    canCreate.value = service.can_create
    canEdit.value = service.can_edit
    canDelete.value = service.can_delete
  } else {
    // Service not found in permissions, likely not allowed
    canView.value = false
  }
}

watch(serviceId, () => {
  checkPermissions()
})

onMounted(async () => {
  // Always fetch fresh permissions to ensure we have the latest access rights
  await permissionStore.fetchPermissions()
  checkPermissions()
})

// Placeholder Analytics Data
const analytics = [
  { title: 'Total Revenue', value: '$12,450', change: '+12%', icon: 'tabler-currency-dollar', color: 'primary' },
  { title: 'Bookings', value: '145', change: '+5%', icon: 'tabler-calendar-check', color: 'success' },
  { title: 'Profile Views', value: '1,204', change: '+24%', icon: 'tabler-eye', color: 'info' },
  { title: 'Avg. Rating', value: '4.8', change: '+0.2', icon: 'tabler-star', color: 'warning' },
]

const showUpgradeDialog = ref(false)
const router = useRouter()

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
          <VIcon icon="tabler-category" class="me-2" />
          Categories
        </VTab>
        <VTab
          v-if="!isVeterinary"
          value="facilities"
        >
          <VIcon icon="tabler-building-hospital" class="me-2" />
          Facilities & Pricing
        </VTab>
        <VTab
          v-if="!isVeterinary"
          value="summary"
        >
          <VIcon icon="tabler-list-details" class="me-2" />
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
            <VRow>
              <VCol
                v-for="stat in analytics"
                :key="stat.title"
                cols="12"
                sm="6"
                md="3"
              >
                <VCard
                  elevation="0"
                  class="border"
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
                        color="success"
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
                    class="d-flex align-center justify-center h-100"
                    style="min-height: 300px;"
                  >
                    <div class="text-center text-medium-emphasis">
                      <VIcon
                        icon="tabler-chart-bar"
                        size="48"
                        class="mb-2 opacity-50"
                      />
                      <p>Chart visualization would go here</p>
                    </div>
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
                    <VListItem
                      title="New Booking"
                      subtitle="2 mins ago"
                      prepend-icon="tabler-calendar-plus"
                    />
                    <VDivider inset />
                    <VListItem
                      title="Review Received"
                      subtitle="1 hour ago"
                      prepend-icon="tabler-star"
                    />
                    <VDivider inset />
                    <VListItem
                      title="Pricing Updated"
                      subtitle="Yesterday"
                      prepend-icon="tabler-tag"
                    />
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
                    :to="{ name: 'provider-providerhome', hash: '#plans' }"
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
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
