<script setup>
import { ref, computed, onMounted } from 'vue'
import { veterinaryApi, customerApi } from '@/plugins/axios'
import Navbar from './book/sections/Navbar.vue'
import ReviewDialog from './components/ReviewDialog.vue'
import PetOwnerSidebar from './components/PetOwnerSidebar.vue'

definePage({
  meta: {
    layout: 'blank',
  },
})

const visits = ref([])
const loading = ref(true)
const payingId = ref(null)
const successMessage = ref('')
const activeTab = ref('all')

// Review dialog
const showReviewDialog = ref(false)
const selectedVisitForReview = ref(null)
const selectedProviderForReview = ref(null)

const openReviewDialog = visit => {
  selectedVisitForReview.value = {
    ...visit,
    service_name: visit.display_type,
    service_snapshot: visit.source === 'booking' ? (visit.original?.service_snapshot || {}) : {},
    assigned_employee_id: visit.assigned_employee_id,
  }
  selectedProviderForReview.value = {
    id: visit.provider_id,
    full_name: visit.clinic_name || 'Clinic',
  }
  showReviewDialog.value = true
}

const fetchVisits = async () => {
  loading.value = true
  try {
    const [visitsRes, bookingsRes] = await Promise.all([
      veterinaryApi.get('/api/veterinary/pet-owner/visits/'),
      customerApi.get('/api/pet-owner/bookings/bookings/'),
    ])
    
    // Standardize Veterinary Visits
    const veterinaryVisits = (visitsRes.data || []).map(v => ({
      ...v,
      source: 'veterinary',
      service_id: v.service_id || null,
      service_snapshot: { name: v.visit_type || 'Clinical Visit' },
      assigned_employee_id: v.assigned_employee_id || null, // Ensure ID for review
      assigned_employee_name: v.assigned_employee_name || null,
      display_type: v.service_id || v.visit_type || 'Clinical Visit',
    }))

    // Standardize Customer Bookings (as visits)
    const bookingVisits = (bookingsRes.data.results || bookingsRes.data || []).map(b => ({
      id: b.id,
      status: b.status,
      pet_name: b.pet_name,
      clinic_name: b.provider_name,
      provider_id: b.provider_id,
      service_id: b.service_id || null,
      service_snapshot: b.service_snapshot || {},
      assigned_employee_id: b.assigned_employee_id || null,
      assigned_employee_name: b.assigned_employee_name || null,
      created_at: b.created_at,
      display_type: b.service_name || 'Service Appointment',
      source: 'booking',
      original: b,
    }))

    // Merge and sort by date descending
    visits.value = [...veterinaryVisits, ...bookingVisits].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at),
    )
  } catch (err) {
    console.error('Failed to fetch visits', err)
  } finally {
    loading.value = false
  }
}

const payInvoice = async invoiceId => {
  payingId.value = invoiceId
  try {
    await veterinaryApi.post(`/api/veterinary/pet-owner/pay/${invoiceId}/`)
    successMessage.value = 'Payment successful! Thank you for your trust.'
    fetchVisits()
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (err) {
    console.error('Payment failed', err)
  } finally {
    payingId.value = null
  }
}

onMounted(fetchVisits)

const formatDate = dateString => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTime = dateString => {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusColor = status => {
  const s = (status || '').toUpperCase()
  if (s === 'COMPLETED' || s === 'CLOSED') return 'success'
  if (s === 'IN_PROGRESS') return 'primary'
  if (s === 'DRAFT' || s === 'PENDING') return 'warning'
  if (s === 'CANCELLED') return 'error'
  
  return 'secondary'
}

const getStatusLabel = status => {
  const s = (status || '').toUpperCase()
  if (s === 'CLOSED' || s === 'COMPLETED') return 'Completed'
  if (s === 'IN_PROGRESS') return 'In Progress'
  if (s === 'DRAFT' || s === 'PENDING') return 'Pending'
  if (s === 'CONFIRMED') return 'Confirmed'
  
  return status
}

const filteredVisits = computed(() => {
  if (activeTab.value === 'all') return visits.value
  const completedStatuses = ['COMPLETED', 'CLOSED', 'CANCELLED']
  if (activeTab.value === 'past') return visits.value.filter(v => completedStatuses.includes((v.status || '').toUpperCase()))
  
  return visits.value.filter(v => !completedStatuses.includes((v.status || '').toUpperCase()))
})

const tabs = [
  { key: 'all', label: 'All Records', icon: 'tabler-list' },
  { key: 'upcoming', label: 'Active', icon: 'tabler-activity' },
  { key: 'past', label: 'Completed', icon: 'tabler-circle-check' },
]
</script>

<template>
  <div class="dashboard-root d-flex">
    <!-- Side Navigation -->
    <PetOwnerSidebar class="d-none d-lg-flex" />

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content-layer">
      <!-- Global Navbar -->
      <Navbar hide-brand />

      <!-- Page Hero -->
      <div class="page-hero">
        <VContainer>
          <div class="d-flex align-center justify-space-between flex-wrap gap-4">
            <div>
              <div class="d-flex align-center gap-3 mb-3">
                <div class="hero-icon-box">
                  <VIcon
                    icon="tabler-clipboard-heart"
                    size="26"
                    color="white"
                  />
                </div>
                <div class="text-caption font-weight-black text-primary uppercase tracking-widest">
                  Medical Hub
                </div>
              </div>
              <h1 class="page-title mb-2">
                Care History
              </h1>
              <p class="text-body-1 text-slate-500 font-weight-medium">
                Your complete record of medical visits and wellness sessions.
              </p>
            </div>
            <div class="d-flex align-center gap-3">
              <div class="stat-pill">
                <span class="stat-num">{{ visits.length }}</span>
                <span class="stat-label">Total Visits</span>
              </div>
              <div class="stat-pill success">
                <span class="stat-num">{{ visits.filter(v => ['COMPLETED','CLOSED'].includes((v.status||'').toUpperCase())).length }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>
          </div>

          <!-- Tab Bar -->
          <div class="tab-bar mt-8">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ 'tab-active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <VIcon
                :icon="tab.icon"
                size="16"
                class="mr-2"
              />
              {{ tab.label }}
              <span class="tab-count">
                {{ tab.key === 'all' ? visits.length : tab.key === 'past'
                  ? visits.filter(v => ['COMPLETED','CLOSED','CANCELLED'].includes((v.status||'').toUpperCase())).length
                  : visits.filter(v => !['COMPLETED','CLOSED','CANCELLED'].includes((v.status||'').toUpperCase())).length
                }}
              </span>
            </button>
          </div>
        </VContainer>
      </div>

      <!-- Snackbar -->
      <VSnackbar
        v-model="successMessage"
        color="success"
        location="top"
        timeout="4000"
      >
        <div class="d-flex align-center gap-3">
          <VIcon
            icon="tabler-circle-check-filled"
            size="22"
          />
          <span class="font-weight-bold">{{ successMessage }}</span>
        </div>
      </VSnackbar>

      <!-- Main Content -->
      <VContainer class="py-10">
        <!-- Loading -->
        <div
          v-if="loading"
          class="d-flex flex-column align-center py-24"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="56"
            width="4"
          />
          <p class="mt-6 text-body-1 text-slate-400 font-weight-medium">
            Fetching your records...
          </p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="filteredVisits.length === 0"
          class="empty-state"
        >
          <div class="empty-icon-box">
            <VIcon
              icon="tabler-clipboard-x"
              size="48"
              color="slate-300"
            />
          </div>
          <h2 class="text-h4 font-weight-black text-slate-900 mb-3">
            No Records Found
          </h2>
          <p class="text-body-1 text-slate-400 font-weight-medium">
            {{ activeTab === 'upcoming' ? "You don't have any active visits right now." : "No completed visits on record yet." }}
          </p>
        </div>

        <!-- Visit Cards -->
        <div
          v-else
          class="visit-list"
        >
          <div
            v-for="(visit, index) in filteredVisits"
            :key="visit.id"
            class="visit-card"
            :style="{ animationDelay: `${index * 0.07}s` }"
          >
            <!-- Card Header -->
            <div class="visit-card-header">
              <div
                class="status-stripe"
                :class="getStatusColor(visit.status)"
              />
              <div class="flex-grow-1">
                <div class="d-flex align-center justify-space-between flex-wrap gap-4">
                  <div>
                    <div class="d-flex align-center gap-3 mb-2">
                      <div class="pet-icon-box">
                        <VIcon
                          icon="tabler-paw"
                          size="18"
                          color="primary"
                        />
                      </div>
                      <div>
                        <h3 class="visit-pet-name">
                          {{ visit.pet_name }}
                        </h3>
                        <div class="text-caption font-weight-bold text-primary">
                          {{ visit.display_type }}
                        </div>
                      </div>
                    </div>
                    <div class="d-flex align-center gap-4 flex-wrap">
                      <div class="d-flex align-center gap-1 text-slate-500 text-caption font-weight-bold">
                        <VIcon
                          icon="tabler-building-hospital"
                          size="14"
                        />
                        {{ visit.clinic_name || 'PetLeo Clinic' }}
                      </div>
                      <div class="d-flex align-center gap-1 text-slate-400 text-caption font-weight-bold">
                        <VIcon
                          icon="tabler-calendar"
                          size="14"
                        />
                        {{ formatDate(visit.created_at) }}
                      </div>
                      <div class="d-flex align-center gap-1 text-slate-400 text-caption font-weight-bold">
                        <VIcon
                          icon="tabler-clock"
                          size="14"
                        />
                        {{ formatTime(visit.created_at) }}
                      </div>
                    </div>
                  </div>

                  <div class="d-flex align-center gap-3">
                    <!-- Invoice amount -->
                    <div
                      v-if="visit.invoice"
                      class="invoice-pill"
                    >
                      <div class="invoice-amount">
                        ₹{{ visit.invoice.total }}
                      </div>
                      <VChip
                        :color="visit.invoice.status === 'PAID' ? 'success' : 'warning'"
                        size="x-small"
                        variant="flat"
                        class="font-weight-black invoice-status-chip"
                      >
                        {{ visit.invoice.status }}
                      </VChip>
                    </div>

                    <!-- Status Badge -->
                    <VChip
                      :color="getStatusColor(visit.status)"
                      variant="tonal"
                      size="small"
                      class="font-weight-black status-chip"
                    >
                      <div
                        class="status-dot"
                        :class="getStatusColor(visit.status)"
                      />
                      {{ getStatusLabel(visit.status) }}
                    </VChip>

                    <!-- Review Button -->
                    <VBtn
                      v-if="['CLOSED', 'COMPLETED'].includes((visit.status || '').toUpperCase())"
                      variant="tonal"
                      color="amber-darken-2"
                      size="small"
                      class="rounded-xl font-weight-bold"
                      prepend-icon="tabler-star"
                      @click="openReviewDialog(visit)"
                    >
                      Review
                    </VBtn>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expandable Details (using VExpansionPanels) -->
            <VExpansionPanels
              variant="accordion"
              flat
            >
              <VExpansionPanel class="expansion-panel">
                <VExpansionPanelTitle class="detail-toggle-btn">
                  <VIcon
                    icon="tabler-chevron-down"
                    size="16"
                    class="mr-2"
                  />
                  {{ visit.source === 'booking' ? 'View Booking Details' : 'View Clinical Details' }}
                </VExpansionPanelTitle>

                <VExpansionPanelText class="pa-0">
                  <div class="detail-body">
                    <!-- Booking specific info -->
                    <div
                      v-if="visit.source === 'booking'"
                      class="detail-section"
                    >
                      <div class="detail-section-title">
                        <VIcon
                          icon="tabler-info-circle"
                          size="16"
                          class="mr-2"
                          color="primary"
                        />
                        Booking Information
                      </div>
                      <div class="d-flex flex-column gap-2 text-body-2 text-slate-600">
                        <div class="d-flex justify-space-between">
                          <span class="font-weight-bold">Service:</span>
                          <span>{{ visit.original?.service_snapshot?.service_name || visit.original?.service_name || visit.display_type }}</span>
                        </div>
                        <div class="d-flex justify-space-between">
                          <span class="font-weight-bold">Category:</span>
                          <span>{{ visit.original?.service_snapshot?.category_name || visit.original?.category_name }}</span>
                        </div>
                        <div class="d-flex justify-space-between">
                          <span class="font-weight-bold">Facility:</span>
                          <span>{{ visit.original?.service_snapshot?.facility_name || visit.original?.facility_name }}</span>
                        </div>
                        <div
                          v-if="visit.original?.notes"
                          class="mt-2"
                        >
                          <div class="font-weight-bold mb-1">
                            Notes:
                          </div>
                          <div class="bg-slate-50 pa-3 rounded-lg border italic">
                            {{ visit.original.notes }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Vitals -->
                    <div
                      v-if="visit.vitals"
                      class="detail-section"
                    >
                      <div class="detail-section-title">
                        <VIcon
                          icon="tabler-activity"
                          size="16"
                          class="mr-2"
                          color="primary"
                        />
                        Patient Vitals
                      </div>
                      <div class="vitals-grid">
                        <div
                          v-for="(val, key) in visit.vitals"
                          :key="key"
                          class="vital-card"
                        >
                          <div class="vital-val">
                            {{ val }}
                          </div>
                          <div class="vital-key">
                            {{ key }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Prescriptions -->
                    <div
                      v-if="visit.prescriptions && visit.prescriptions.length > 0"
                      class="detail-section"
                    >
                      <div class="detail-section-title">
                        <VIcon
                          icon="tabler-pill"
                          size="16"
                          class="mr-2"
                          color="success"
                        />
                        Prescriptions
                      </div>
                      <div class="d-flex flex-wrap gap-2">
                        <VChip
                          v-for="p in visit.prescriptions"
                          :key="p.id"
                          color="primary"
                          variant="tonal"
                          size="small"
                          prepend-icon="tabler-pill"
                          class="rounded-xl font-weight-bold"
                        >
                          {{ p.medicine_name }}
                        </VChip>
                      </div>
                    </div>

                    <!-- Billing -->
                    <div
                      v-if="visit.invoice"
                      class="detail-section"
                    >
                      <div class="detail-section-title">
                        <VIcon
                          icon="tabler-receipt"
                          size="16"
                          class="mr-2"
                          color="warning"
                        />
                        Billing Summary
                      </div>
                      <div class="billing-table">
                        <div
                          v-for="charge in visit.invoice.charges"
                          :key="charge.id"
                          class="billing-row"
                        >
                          <span class="billing-desc">{{ charge.description || charge.charge_type }}</span>
                          <span class="billing-amount">₹{{ charge.amount }}</span>
                        </div>
                        <div class="billing-total-row">
                          <span>Grand Total</span>
                          <span class="billing-total-amount">₹{{ visit.invoice.total }}</span>
                        </div>
                      </div>

                      <!-- Pay CTA -->
                      <div
                        v-if="visit.invoice.status === 'DRAFT' || visit.invoice.status === 'UNPAID'"
                        class="pay-cta"
                      >
                        <VBtn
                          block
                          color="primary"
                          height="52"
                          class="font-weight-black rounded-2xl"
                          prepend-icon="tabler-credit-card"
                          :loading="payingId === visit.invoice.id"
                          @click="payInvoice(visit.invoice.id)"
                        >
                          Proceed to Payment
                        </VBtn>
                        <div class="pay-caption">
                          🔒 Secured by PetLeo Payment Gateway
                        </div>
                      </div>
                      <div
                        v-else
                        class="paid-badge"
                      >
                        <VIcon
                          icon="tabler-circle-check-filled"
                          color="success"
                          size="20"
                          class="mr-2"
                        />
                        Payment Completed
                      </div>
                    </div>
                  </div>
                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </div>
        </div>
      </VContainer>

      <!-- Review Dialog -->
      <ReviewDialog
        v-if="selectedProviderForReview"
        v-model="showReviewDialog"
        :booking-item="selectedVisitForReview"
        :provider="selectedProviderForReview"
        @saved="fetchVisits"
      />
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

* { font-family: 'Outfit', sans-serif !important; }

.dashboard-root {
  background: #f8fafc;
  min-height: 100vh;
  overflow: hidden;
}

.main-content-layer {
  height: 100vh;
  overflow-y: auto;
  background: #f8fafc;
}

.text-slate-900 { color: #0f172a; }

.bookings-page {
  min-height: 100vh;
}

/* Page Hero */
.page-hero {
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 50%, #fdf2f8 100%);
  padding: 40px 0 0;
  border-bottom: 1px solid #f1f5f9;
}

.hero-icon-box {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99,102,241,0.25);
}

.page-title {
  font-size: 42px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2px;
  line-height: 1;
}

/* Stat Pills */
.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  min-width: 90px;
}

.stat-pill.success { border-color: #a7f3d0; background: #f0fdf4; }

.stat-num {
  font-size: 28px;
  font-weight: 900;
  color: #6366f1;
  line-height: 1;
}

.stat-pill.success .stat-num { color: #10b981; }

.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
  margin-top: 4px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.8);
  padding: 6px;
  border-radius: 20px 20px 0 0;
  backdrop-filter: blur(12px);
  border: 1px solid #f1f5f9;
  border-bottom: none;
  width: fit-content;
}

.tab-btn {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #6366f1;
  background: rgba(99,102,241,0.05);
}

.tab-active {
  color: #6366f1 !important;
  background: white !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  background: rgba(99,102,241,0.1);
  color: #6366f1;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  margin-left: 8px;
  padding: 0 6px;
}

.tab-active .tab-count {
  background: #6366f1;
  color: white;
}

/* Visit List */
.visit-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Visit Card */
.visit-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
  animation: slideUp 0.5s cubic-bezier(0.2, 0, 0, 1) forwards;
  opacity: 0;
}

.visit-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 12px 40px rgba(99,102,241,0.07);
  transform: translateY(-2px);
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
  from { opacity: 0; transform: translateY(20px); }
}

.visit-card-header {
  display: flex;
  align-items: stretch;
  padding: 0;
}

.status-stripe {
  width: 5px;
  flex-shrink: 0;
  border-radius: 0;
}
.status-stripe.success { background: linear-gradient(to bottom, #10b981, #34d399); }
.status-stripe.primary { background: linear-gradient(to bottom, #6366f1, #8b5cf6); }
.status-stripe.warning { background: linear-gradient(to bottom, #f59e0b, #fbbf24); }
.status-stripe.error { background: linear-gradient(to bottom, #ef4444, #f87171); }
.status-stripe.secondary { background: linear-gradient(to bottom, #6b7280, #9ca3af); }

.visit-card-header .flex-grow-1 {
  padding: 20px 24px;
}

.pet-icon-box {
  width: 36px;
  height: 36px;
  background: rgba(99,102,241,0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.visit-pet-name {
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
}

/* Invoice Pill */
.invoice-pill {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.invoice-amount {
  font-size: 22px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

/* Status Chip */
.status-chip { border-radius: 12px !important; }

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 6px;
}
.status-dot.success { background: #10b981; }
.status-dot.primary { background: #6366f1; }
.status-dot.warning { background: #f59e0b; }
.status-dot.error { background: #ef4444; }

/* Expansion Panel */
.expansion-panel { background: transparent !important; }

.detail-toggle-btn {
  padding: 12px 24px !important;
  background: #fafafa;
  border-top: 1px solid #f1f5f9;
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #64748b !important;
  min-height: 44px !important;
}

/* Detail Body */
.detail-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: #fafbff;
}

.detail-section { }

.detail-section-title {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #64748b;
  margin-bottom: 12px;
}

/* Vitals */
.vitals-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.vital-card {
  padding: 10px 16px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  text-align: center;
  min-width: 80px;
}

.vital-val {
  font-size: 18px;
  font-weight: 900;
  color: #6366f1;
  line-height: 1.2;
}

.vital-key {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  margin-top: 2px;
}

/* Billing */
.billing-table {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  overflow: hidden;
}

.billing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f8fafc;
}

.billing-desc {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.billing-amount {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.billing-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.billing-total-amount {
  font-size: 26px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
}

/* Pay CTA */
.pay-cta {
  margin-top: 16px;
}

.pay-caption {
  text-align: center;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  margin-top: 10px;
}

/* Paid Badge */
.paid-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #a7f3d0;
  border-radius: 16px;
  font-weight: 800;
  font-size: 15px;
  color: #10b981;
  margin-top: 16px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 24px;
}

.empty-icon-box {
  width: 100px;
  height: 100px;
  background: #f1f5f9;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

/* Helpers */
.tracking-widest { letter-spacing: 1.5px !important; }
.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
</style>
