
<script setup>
import { onMounted, ref, computed } from 'vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { providerApi } from '@/plugins/axios'

const permissionStore = usePermissionStore()
const subscription = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchSubscription = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/cart/subscription/active/')

    subscription.value = res.data
    
    // 🔗 Sync permission store to match displayed subscription
    await permissionStore.fetchPermissions()
  } catch (err) {
    console.error('Failed to fetch subscription:', err)
    error.value = 'You do not have an active subscription.'
  } finally {
    loading.value = false
  }
}

const formatDate = dateStr => {
  if (!dateStr) return 'N/A'
  
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Calculate progress percentage for total plan duration if possible, 
// otherwise just use days left for a visual gauge.
const daysLeftProgress = computed(() => {
  if (!subscription.value?.plan?.days_left) return 0
  const total = subscription.value.plan.billing_cycle_name?.toUpperCase().includes('YEAR') ? 365 : 30
  
  return Math.min(100, Math.max(0, (subscription.value.plan.days_left / total) * 100))
})

const getStatusColor = daysLeft => {
  if (daysLeft <= 3) return 'error'
  if (daysLeft <= 10) return 'warning'
  
  return 'success'
}

onMounted(() => {
  fetchSubscription()
})
</script>

<template>
  <ProviderLayout>
    <div class="subscription-container pt-6 pb-12 px-4 px-md-8">
      <!-- Loading State -->
      <VRow
        v-if="loading"
        class="fill-height align-center justify-center min-vh-75"
      >
        <VCol
          cols="12"
          class="text-center"
        >
          <div class="loading-animation mb-6">
            <VProgressCircular
              indeterminate
              color="primary"
              size="80"
              width="8"
            />
          </div>
          <h2 class="text-h4 font-weight-light text-medium-emphasis">
            Synchronizing your subscription...
          </h2>
        </VCol>
      </VRow>

      <!-- Error State -->
      <VRow
        v-else-if="error"
        class="fill-height align-center justify-center min-vh-75"
      >
        <VCol
          cols="12"
          md="6"
        >
          <VCard class="glass-card text-center pa-12 border-error">
            <VIcon
              icon="tabler-alert-triangle"
              size="80"
              color="error"
              class="mb-6"
            />
            <h2 class="text-h4 font-weight-bold mb-4">
              Subscription Not Found
            </h2>
            <p class="text-body-1 text-medium-emphasis mb-8">
              {{ error }}
            </p>
            <VBtn 
              color="primary" 
              size="large" 
              prepend-icon="tabler-shopping-cart"
              :to="{ name: 'provider-home' }"
              class="elevation-8 rounded-pill"
            >
              Explore Premium Plans
            </VBtn>
          </VCard>
        </VCol>
      </VRow>

      <div
        v-else-if="subscription"
        class="fade-in"
      >
        <!-- Dashboard Hero Section -->
        <header class="d-flex flex-wrap align-center justify-space-between mb-8 gap-4">
          <div>
            <h1 class="text-h3 font-weight-black d-flex align-center gap-2">
              Management <span class="text-primary">Center</span>
            </h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              Overview of your active license and service capabilities.
            </p>
          </div>
          <div class="d-flex gap-3">
            <VBtn
              color="primary"
              variant="flat"
              size="large"
              prepend-icon="tabler-arrow-up-circle"
              :to="{ name: 'provider-home' }"
            >
              Upgrade License
            </VBtn>
          </div>
        </header>

        <!-- Main Plan Hero -->
        <VCard class="hero-card mb-10 overflow-hidden">
          <div class="hero-gradient-overlay" />
          <VCardText class="pa-0">
            <VRow no-gutters>
              <VCol
                cols="12"
                lg="8"
                class="pa-8 pa-md-12 position-relative z-1"
              >
                <div class="d-flex align-center gap-3 mb-4">
                  <VAvatar
                    color="white"
                    size="48"
                    class="elevation-4"
                  >
                    <VIcon
                      icon="tabler-crown"
                      color="primary"
                      size="28"
                    />
                  </VAvatar>
                  <VChip
                    variant="flat"
                    color="rgba(255,255,255,0.2)"
                    class="text-white font-weight-bold backdrop-blur"
                  >
                    ACTIVE LICENSE
                  </VChip>
                </div>
                
                <h1 class="display-plan text-h1 text-white font-weight-black mb-2">
                  {{ subscription.plan.plan_title }}
                </h1>
                <p class="text-h5 text-white text-opacity-80 mb-8">
                  Premium Tier • Dynamic Scale • Billed {{ subscription.plan.billing_cycle_name }}
                </p>

                <div class="stats-row d-flex flex-wrap gap-6">
                  <div class="stat-box glass-card border-white-10">
                    <span class="label">START DATE</span>
                    <span class="value">{{ formatDate(subscription.plan.start_date) }}</span>
                  </div>
                  <div class="stat-box glass-card border-white-10">
                    <span class="label">EXPIRY DATE</span>
                    <span class="value">{{ formatDate(subscription.plan.end_date) }}</span>
                  </div>
                  <div class="stat-box glass-card border-white-10 highlight">
                    <span class="label">INVESTMENT</span>
                    <span class="value">{{ subscription.plan.price_currency }} {{ subscription.plan.price_amount }}</span>
                  </div>
                </div>
              </VCol>
              
              <VCol
                cols="12"
                lg="4"
                class="pa-8 pa-md-12 bg-white bg-opacity-10 backdrop-blur position-relative overflow-hidden border-left-white-10 d-flex flex-column justify-center align-center"
              >
                <div class="expiration-gauge mb-6">
                  <VProgressCircular
                    :model-value="daysLeftProgress"
                    :size="180"
                    :width="15"
                    :color="getStatusColor(subscription.plan.days_left)"
                    class="gauge-main"
                  >
                    <div class="text-center">
                      <div class="text-h2 font-weight-black">
                        {{ subscription.plan.days_left }}
                      </div>
                      <div class="text-overline font-weight-bold mt-n2">
                        DAYS LEFT
                      </div>
                    </div>
                  </VProgressCircular>
                </div>
                 
                <VAlert
                  v-if="subscription.plan.is_expiring_soon"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mb-0 text-center w-100 rounded-xl border-warning-20 animate-pulse"
                >
                  Renewal Action Required
                </VAlert>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Capabilities Section -->
        <section class="capabilities-section">
          <div class="d-flex align-center gap-3 mb-8">
            <VIcon
              icon="tabler-shield-check"
              color="primary"
              size="32"
            />
            <h2 class="text-h4 font-weight-bold">
              Technical Access & Policies
            </h2>
          </div>

          <VRow>
            <VCol 
              v-for="(svc, index) in subscription.permissions" 
              :key="svc.service_id" 
              cols="12"
            >
              <VCard
                class="permission-card mb-8 border-thin hover-lift fade-in-up"
                :style="{ 'animation-delay': `${index * 0.1}s` }"
              >
                <VCardItem class="pa-6 pa-md-8">
                  <template #prepend>
                    <div class="service-icon-wrapper elevation-6 mr-6">
                      <VIcon
                        :icon="svc.icon || 'tabler-box'"
                        size="32"
                        color="white"
                      />
                    </div>
                  </template>
                  <VCardTitle class="text-h4 font-weight-black text-uppercase tracking-wider">
                    {{ svc.service_name }}
                  </VCardTitle>
                  <VCardSubtitle class="text-body-1 mt-1">
                    Enterprise Service Node Access Information
                  </VCardSubtitle>
                  
                  <template #append>
                    <VChip 
                      :color="svc.can_view ? 'success' : 'error'" 
                      variant="tonal" 
                      class="px-4 font-weight-bold rounded-lg"
                    >
                      {{ svc.can_view ? 'AUTHORIZED' : 'RESTRICTED' }}
                    </VChip>
                  </template>
                </VCardItem>

                <VDivider class="mx-8" />

                <VCardText class="pa-0">
                  <VTable class="permission-table bg-transparent">
                    <thead>
                      <tr>
                        <th class="py-6 px-8 text-uppercase font-weight-black tracking-widest text-overline opacity-60">
                          Entity Module
                        </th>
                        <th class="py-6 text-center text-uppercase font-weight-black text-overline">
                          Review
                        </th>
                        <th class="py-6 text-center text-uppercase font-weight-black text-overline">
                          Draft
                        </th>
                        <th class="py-6 text-center text-uppercase font-weight-black text-overline">
                          Commit
                        </th>
                        <th class="py-6 text-center text-uppercase font-weight-black text-overline">
                          Purge
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="cat in svc.categories"
                        :key="cat.id"
                        class="permission-row"
                      >
                        <td class="py-6 px-8">
                          <div class="d-flex flex-column">
                            <span class="text-h6 font-weight-bold">{{ (cat.name || 'Unknown').replace(/VETERINARY_/g, '').replace(/_/g, ' ') }}</span>
                            <span
                              v-if="cat.facilities?.length"
                              class="text-caption text-primary d-flex align-center gap-1 mt-1"
                            >
                              <VIcon
                                icon="tabler-building"
                                size="14"
                              />
                              {{ cat.facilities.length }} Facility Node(s) Scaled
                            </span>
                          </div>
                        </td>
                        <td class="text-center">
                          <div
                            class="perm-status-circle"
                            :class="[cat.can_view ? 'active' : 'inactive']"
                          >
                            <VIcon
                              :icon="cat.can_view ? 'tabler-eye' : 'tabler-eye-off'"
                              size="18"
                            />
                          </div>
                        </td>
                        <td class="text-center">
                          <div
                            class="perm-status-circle"
                            :class="[cat.can_create ? 'active' : 'inactive']"
                          >
                            <VIcon
                              :icon="cat.can_create ? 'tabler-plus' : 'tabler-lock'"
                              size="18"
                            />
                          </div>
                        </td>
                        <td class="text-center">
                          <div
                            class="perm-status-circle"
                            :class="[cat.can_edit ? 'active' : 'inactive']"
                          >
                            <VIcon
                              :icon="cat.can_edit ? 'tabler-edit' : 'tabler-lock'"
                              size="18"
                            />
                          </div>
                        </td>
                        <td class="text-center">
                          <div
                            class="perm-status-circle"
                            :class="[cat.can_delete ? 'active' : 'inactive']"
                          >
                            <VIcon
                              :icon="cat.can_delete ? 'tabler-trash' : 'tabler-lock'"
                              size="18"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </section>
      </div>
    </div>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');

.subscription-container {
  font-family: 'Outfit', sans-serif;
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.05), transparent 400px),
              radial-gradient(circle at bottom left, rgba(var(--v-theme-primary), 0.03), transparent 300px);
  min-height: 100vh;
}

/* Glassmorphism Classes */
.glass-card {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.backdrop-blur {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.border-white-10 {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.border-left-white-10 {
  border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Hero Plan Card */
.hero-card {
  background: #0f172a !important;
  border-radius: 32px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

.hero-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.9) 0%, rgba(var(--v-theme-primary), 0.4) 100%);
  opacity: 0.85;
}

.display-plan {
  letter-spacing: -2px;
  line-height: 1;
  text-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.stat-box {
  padding: 1rem 1.5rem;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  min-width: 160px;
  background: rgba(255, 255, 255, 0.08) !important;
}

.stat-box.highlight {
  background: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 0 20px rgba(255,255,255,0.05);
}

.stat-box .label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.stat-box .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

/* Expiration Gauge */
.gauge-main {
  filter: drop-shadow(0 0 20px rgba(0,0,0,0.3));
}

.gauge-main :deep(.v-progress-circular__overlay) {
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Permission Cards */
.permission-card {
  border-radius: 24px !important;
  background: white !important;
  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1) !important;
}

.service-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #3b82f6 100%);
  border-radius: 18px;
  display: flex;
  align-center: center;
  justify-content: center;
}

.permission-table {
  border-collapse: separate;
  border-spacing: 0;
}

.permission-row {
  transition: background 0.2s ease;
}

.permission-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.02) !important;
}

.perm-status-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.perm-status-circle.active {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.perm-status-circle.inactive {
  background: rgba(var(--v-theme-error), 0.05);
  color: rgba(var(--v-theme-error), 0.3);
}

.perm-status-circle.active:hover {
  background: rgb(var(--v-theme-success));
  color: white;
  transform: scale(1.1);
}

/* Animations */
.fade-in {
  animation: fadeIn 0.8s ease-out;
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
}

.min-vh-75 {
  min-height: 75vh;
}
</style>
