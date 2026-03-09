<script setup>
import { inject, ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const provider = inject('provider')
const handleBookNow = inject('handleBookNow')
const activeTab = ref(null)

watch(() => provider.value, newVal => {
  if (newVal?.menu?.length > 0 && !activeTab.value) {
    activeTab.value = newVal.menu[0].service_key
  }
}, { immediate: true })

// Icon map for services
const serviceIconMap = {
  vet: 'tabler-stethoscope',
  groom: 'tabler-scissors',
  train: 'tabler-award',
  board: 'tabler-home-heart',
  day: 'tabler-sun',
  spa: 'tabler-bubble',
  walk: 'tabler-walk',
  default: 'tabler-paw',
}

const getServiceIcon = svc => {
  const key = (svc.service_key || svc.service_name || '').toLowerCase()
  for (const [k, v] of Object.entries(serviceIconMap)) {
    if (key.includes(k)) return v
  }
  
  return serviceIconMap.default
}

// Gradient per service tab (cycles)
const tabGradients = [
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #4f46e5, #6366f1)',
  'linear-gradient(135deg, #0ea5e9, #3b82f6)',
]

const tabGradient = i => tabGradients[i % tabGradients.length]

const getDoctorAvatar = doc => {
  if (!doc || !doc.avatar) return null
  if (doc.avatar.startsWith('http')) return doc.avatar
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8002'
  
  return `${backendUrl}${doc.avatar}`
}

const activeService = computed(() =>
  provider.value?.menu?.find(s => s.service_key === activeTab.value),
)

const getServiceType = svc => {
  const key = (svc?.service_key || svc?.service_name || '').toLowerCase()
  if (key.includes('vet') || key.includes('doctor') || key.includes('clinic')) return 'VETERINARY'
  if (key.includes('day') || key.includes('board')) return 'PACKAGE'
  
  return 'SLOT_BASED'
}

const activeServiceType = computed(() => getServiceType(activeService.value))

const isVeterinary = computed(() => activeServiceType.value === 'VETERINARY')

const doctors = computed(() => {
  if (!isVeterinary.value) return []
  
  return (provider.value?.employees || []).filter(emp => {
    const role = (emp.role || '').toLowerCase()
    const pRole = (emp.provider_role_name || emp.provider_role || '').toLowerCase()
    
    return role.includes('doctor') || role.includes('vet') || pRole.includes('doctor') || pRole.includes('vet')
  })
})

const filteredCategories = computed(() => {
  if (!activeService.value) return []
  if (isVeterinary.value) return []
  
  return activeService.value.categories?.filter(cat => cat.facilities?.length > 0) || []
})

const filteredMenu = computed(() => {
  if (!provider.value?.menu) return []
  
  return provider.value.menu.filter(svc => {
    const key = (svc.service_key || svc.service_name || svc.name || '').toLowerCase()
    const isVet = key.includes('vet') || key.includes('doctor') || key.includes('clinic')
    if (isVet) return true
    
    return svc.categories?.some(c => c.facilities?.length > 0)
  })
})

const totalFacilities = computed(() => {
  if (!activeService.value) return 0
  if (isVeterinary.value) return doctors.value.length
  
  return filteredCategories.value?.reduce((sum, cat) => sum + (cat.facilities?.length || 0), 0) || 0
})

const typeLabels = {
  VETERINARY: { badge: 'Appointment Based', unit: 'Doctors' },
  PACKAGE: { badge: 'Package Plans', unit: 'Options' },
  SLOT_BASED: { badge: 'Slot Based', unit: 'Options' },
}

const doctorConsultationFacility = {
  name: 'Doctor Consultation',
  facility_id: 'doctor-consultation',
  description: 'Professional consultation with our expert veterinary doctor.',
  price: '0.00',
}

const formatPrice = price => {
  if (price === '0.00' || !price) return 'Contact for Price'
  const num = parseFloat(price)
  if (isNaN(num)) return price
  
  return `₹${num.toLocaleString('en-IN')}`
}
</script>

<template>
  <div
    v-if="provider"
    class="services-page"
  >
    <!-- ── Header ── -->
    <div class="services-header">
      <div class="header-text">
        <div class="section-eyebrow">
          Service Menu
        </div>
        <h2 class="header-title">
          Professional Care Options
        </h2>
        <p class="header-sub">
          Tailored services for your pet's health, comfort and happiness
        </p>
      </div>
      <div class="header-stats">
        <div class="hstat">
          <span class="hstat-num">{{ provider.menu?.length || 0 }}</span>
          <span class="hstat-lbl">Services</span>
        </div>
        <div class="hstat">
          <span class="hstat-num">{{ isVeterinary ? doctors.length : totalFacilities }}</span>
          <span class="hstat-lbl">{{ isVeterinary ? 'Doctors' : (activeServiceType === 'PACKAGE' ? 'Plans' : 'Options') }}</span>
        </div>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="services-body">
      <!-- LEFT: Service tabs -->
      <div class="service-tabs-col">
        <button
          v-for="(svc, i) in filteredMenu"
          :key="svc.service_id"
          class="service-tab"
          :class="[{ active: activeTab === svc.service_key }]"
          :style="activeTab === svc.service_key ? `background: ${tabGradient(i)}` : ''"
          @click="activeTab = svc.service_key"
        >
          <div
            class="tab-icon-wrap"
            :class="[{ 'tab-icon-active': activeTab === svc.service_key }]"
          >
            <VIcon
              :icon="getServiceIcon(svc)"
              size="18"
            />
          </div>
          <span class="tab-text">
            <span class="tab-name">{{ svc.service_name }}</span>
            <span class="tab-count">
              <template v-if="getServiceType(svc) === 'VETERINARY'">
                {{ (provider?.employees || []).filter(e => {
                  const r = (e.role || '').toLowerCase();
                  const pr = (e.provider_role_name || e.provider_role || '').toLowerCase();
                  return r.includes('doctor') || r.includes('vet') || pr.includes('doctor') || pr.includes('vet');
                }).length }} doctors
              </template>
              <template v-else-if="getServiceType(svc) === 'PACKAGE'">
                {{ svc.categories?.reduce((s, c) => s + (c.facilities?.length || 0), 0) || 0 }} plans
              </template>
              <template v-else>
                {{ svc.categories?.reduce((s, c) => s + (c.facilities?.length || 0), 0) || 0 }} options
              </template>
            </span>
          </span>
          <VIcon
            v-if="activeTab === svc.service_key"
            icon="tabler-chevron-right"
            size="16"
            color="white"
            class="ml-auto"
          />
        </button>
      </div>

      <!-- RIGHT: Service facilities -->
      <div class="service-content-col">
        <template v-if="activeService">
          <!-- Active service header pill -->
          <div class="active-service-header">
            <div
              class="active-service-icon"
              :style="`background: ${tabGradient(provider.menu?.indexOf(activeService))}`"
            >
              <VIcon
                :icon="getServiceIcon(activeService)"
                size="20"
                color="white"
              />
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-center gap-2 mb-1">
                <h3 class="active-service-name">
                  {{ activeService.service_name }}
                </h3>
                <VChip
                  size="x-small"
                  density="comfortable"
                  color="primary"
                  variant="tonal"
                  class="font-weight-black uppercase"
                >
                  {{ typeLabels[activeServiceType].badge }}
                </VChip>
              </div>
              <span class="active-service-count">{{ isVeterinary ? doctors.length + ' professional doctors' : totalFacilities + ' ' + (activeServiceType === 'PACKAGE' ? 'plans' : 'care options') }} available</span>
            </div>
          </div>

          <!-- Categories and facilities -->
          <div v-if="!isVeterinary">
            <div
              v-for="cat in filteredCategories"
              :key="cat.category_id"
              class="category-group"
            >
              <!-- Category header -->
              <div class="category-header">
                <VIcon
                  icon="tabler-category"
                  size="14"
                  color="#6366f1"
                />
                <span class="category-name">{{ cat.category_name }}</span>
                <div class="category-line" />
              </div>

              <!-- Facility cards -->
              <div class="facility-list">
                <div
                  v-for="fac in cat.facilities"
                  :key="fac.id"
                  class="facility-card"
                >
                  <div class="facility-image-col">
                    <img 
                      v-if="fac.image_url || fac.image" 
                      :src="fac.image_url || fac.image" 
                      class="facility-img"
                      alt="Service Image"
                    >
                    <div
                      v-else
                      class="facility-img-placeholder"
                    >
                      <VIcon
                        icon="tabler-photo-off"
                        size="24"
                        color="#94a3b8"
                      />
                    </div>
                  </div>
                  <div class="facility-body">
                    <div class="facility-top">
                      <div class="facility-meta">
                        <div class="d-flex align-center gap-2 mb-2">
                          <VChip
                            size="x-small"
                            color="indigo"
                            variant="flat"
                            class="font-weight-bold tracking-wider uppercase text-white px-2"
                          >
                            <VIcon
                              icon="tabler-sparkles"
                              size="11"
                              class="mr-1"
                            />
                            Care Option
                          </VChip>
                          <span
                            v-if="fac.duration && fac.duration !== 'null'"
                            class="ftag ftag-time"
                          >
                            <VIcon
                              icon="tabler-clock"
                              size="11"
                              class="mr-1"
                            />
                            {{ (fac.duration >= 60 && fac.duration % 60 === 0) ? `${fac.duration / 60} hour(s)` : `${fac.duration} minutes` }}
                          </span>
                        </div>
                          
                        <h4 class="facility-name">
                          {{ fac.name }}
                        </h4>
                        <p class="facility-desc">
                          {{ (fac.description && fac.description !== 'null') ? fac.description : 'Professional service provided by our verified expert team.' }}
                        </p>
                      </div>

                      <div class="facility-cta">
                        <div
                          v-if="fac.price"
                          class="price-display text-right mb-2"
                        >
                          <span class="d-block text-tiny font-weight-bold text-slate-400 uppercase tracking-widest mb-1">Starting from</span>
                          <span class="text-h5 font-weight-black text-indigo">{{ formatPrice(fac.price) }}</span>
                        </div>
                        <div class="d-flex flex-column gap-2 w-100 mt-auto">
                          <button
                            class="book-btn w-100"
                            @click="handleBookNow(activeService, fac)"
                          >
                            <VIcon
                              icon="tabler-calendar-plus"
                              size="15"
                              class="mr-2"
                            />
                            {{ activeServiceType === 'PACKAGE' ? 'Book Plan' : 'Select Date & Time' }}
                          </button>
                          <button
                            class="view-details-btn w-100"
                            @click="router.push(`/pet-owner/book/${provider.id}/facility/${fac.id}`)"
                          >
                            <VIcon
                              icon="tabler-info-circle"
                              size="14"
                              class="mr-1"
                            />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Doctor Slots View for Veterinary -->
          <div
            v-else
            class="doctor-slots-container"
          >
            <div class="category-header mb-6">
              <VIcon
                icon="tabler-users"
                size="14"
                color="#6366f1"
              />
              <span class="category-name">Available Doctors</span>
              <div class="category-line" />
            </div>

            <div class="doctor-grid">
              <!-- Service-First Option for Veterinary -->
              <div
                class="doctor-card any-specialist-card"
                @click="handleBookNow(activeService, doctorConsultationFacility)"
              >
                <div class="doctor-info">
                  <VAvatar
                    size="64"
                    color="indigo"
                    class="doctor-avatar"
                  >
                    <VIcon
                      icon="tabler-users"
                      color="white"
                    />
                  </VAvatar>
                  <div class="ml-4 flex-grow-1">
                    <h4 class="doctor-name">
                      Any Available Specialist
                    </h4>
                    <p class="doctor-role">
                      SMART ASSIGNMENT
                    </p>
                    <p class="doctor-desc text-caption text-slate-500">
                      Pick this to let our system find the best doctor for your preferred time.
                    </p>
                  </div>
                  <button class="book-btn">
                    <VIcon
                      icon="tabler-bolt"
                      size="15"
                      class="mr-1"
                    />
                    Quick Schedule
                  </button>
                </div>
              </div>

              <!-- Individual Doctor Option -->
              <div
                v-for="doc in doctors"
                :key="doc.id"
                class="doctor-card premium-doc-card"
              >
                <div class="doctor-info-wrap">
                  <div class="doc-avatar-container">
                    <VAvatar
                      size="80"
                      color="primary"
                      class="doctor-avatar"
                    >
                      <VImg
                        v-if="doc.avatar"
                        :src="getDoctorAvatar(doc)"
                        cover
                      />
                      <VIcon
                        v-else
                        icon="tabler-user-heart"
                        color="white"
                        size="32"
                      />
                    </VAvatar>
                  </div>
                  
                  <div class="ml-5 flex-grow-1">
                    <div class="d-flex align-center gap-2 mb-1">
                      <VChip
                        v-if="doc.specialization"
                        size="x-small"
                        color="indigo"
                        variant="flat"
                        class="font-weight-black px-2 uppercase tracking-widest text-white"
                      >
                        {{ doc.specialization }}
                      </VChip>
                    </div>
                    
                    <h4 class="doctor-name text-h5 font-weight-black text-slate-900 mb-1">
                      {{ doc.full_name }}
                    </h4>
                    <p class="doctor-role font-weight-bold text-slate-500 mb-4">
                      {{ doc.role }}
                    </p>

                    <div class="d-flex align-center flex-wrap gap-x-8 gap-y-4">
                      <!-- Rating Block -->
                      <div class="doctor-rating">
                        <div class="text-tiny text-slate-400 font-weight-black uppercase tracking-widest mb-1">
                          Rating
                        </div>
                        <div class="d-flex align-center gap-1">
                          <VIcon
                            icon="tabler-star-filled"
                            size="16"
                            color="#f59e0b"
                          />
                          <span class="rating-val text-slate-800">{{ doc.total_ratings > 0 ? (doc.average_rating || 0).toFixed(1) : '0.0' }}</span>
                          <span class="rating-count">({{ doc.total_ratings || 0 }} reviews)</span>
                        </div>
                      </div>

                      <!-- Fee Block -->
                      <div
                        v-if="doc.consultation_fee > 0"
                        class="doctor-fee"
                      >
                        <div class="text-tiny text-slate-400 font-weight-black uppercase tracking-widest mb-1">
                          Consultation Fee
                        </div>
                        <div class="d-flex align-center gap-1">
                          <VIcon
                            icon="tabler-currency-rupee"
                            size="18"
                            color="#10b981"
                          />
                          <span class="text-h6 font-weight-black text-slate-900 leading-none">{{ formatPrice(doc.consultation_fee) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="doctor-cta ml-auto pl-6">
                    <button
                      class="book-btn w-100"
                      style="height: 100%; min-height: 50px;"
                      @click="handleBookNow(activeService, doctorConsultationFacility, doc)"
                    >
                      <VIcon
                        icon="tabler-calendar-plus"
                        size="18"
                        class="mr-2"
                      />
                      Schedule Appointment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state -->
        <div
          v-else
          class="empty-state"
        >
          <VIcon
            icon="tabler-list-search"
            size="48"
            color="#e2e8f0"
          />
          <p>Select a service from the left to see options</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Page ── */
.services-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Header ── */
.services-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px 28px;
  gap: 16px;
}

.section-eyebrow {
  display: inline-block;
  background: #eef2ff;
  color: #6366f1;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 10px;
  border: 1px solid #c7d2fe;
}

.header-title {
  font-size: 24px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.8px;
  margin: 0 0 4px;
}

.header-sub { font-size: 14px; color: #64748b; margin: 0; font-weight: 500; }

.header-stats { display: flex; gap: 16px; flex-shrink: 0; }

.hstat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 20px;
}

.hstat-num { font-size: 28px; font-weight: 900; color: #6366f1; line-height: 1; letter-spacing: -1px; }
.hstat-lbl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }

/* ── Body Layout ── */
.services-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* ── LEFT: Tabs ── */
.service-tabs-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 220px;
  flex-shrink: 0;
}

.service-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1.5px solid #f1f5f9;
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.25s ease;
  width: 100%;
}

.service-tab:hover:not(.active) {
  border-color: #c7d2fe;
  background: #f5f7ff;
}

.service-tab.active {
  background: #eef2ff !important;
  border-color: #c7d2fe;
  box-shadow: 0 4px 12px rgba(99,102,241,0.1);
}

.tab-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #eef2ff;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.tab-icon-active {
  background: #dde3ff;
  color: #4f46e5;
}

.tab-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }

.tab-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-tab.active .tab-name { color: #4f46e5; }

.tab-count {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  margin-top: 1px;
}

.service-tab.active .tab-count { color: #6366f1; }

/* ── RIGHT: Content ── */
.service-content-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Active service header */
.active-service-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 16px 20px;
}

.active-service-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,0.2);
}

.active-service-name {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.4px;
  margin: 0 0 2px;
}

.active-service-count {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

/* Category header */
.category-group { display: flex; flex-direction: column; gap: 10px; }

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.category-name {
  font-size: 12px;
  font-weight: 800;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

.category-line {
  flex: 1;
  height: 1px;
  background: #f1f5f9;
  border-radius: 2px;
}

/* ── Facility Cards ── */
.facility-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.facility-card {
  display: flex;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.facility-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 12px 32px rgba(99,102,241,0.08);
  transform: translateY(-4px);
}

.facility-accent {
  width: 4px;
  background: linear-gradient(180deg, #6366f1, #3b82f6);
  flex-shrink: 0;
}

.facility-body {
  flex: 1;
  min-width: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.facility-top {
  display: flex;
  align-items: stretch;
  gap: 24px;
  height: 100%;
}

.facility-meta { flex: 1; min-width: 0; }

.facility-name {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin: 0 0 6px;
}

.facility-desc {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tags */
.facility-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ftag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

.ftag-time { background: #eff6ff; color: #3b82f6; }
.ftag-inc  { background: #f0fdf4; color: #10b981; }

/* Price + CTA */
.facility-cta {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  min-width: 140px;
  flex-shrink: 0;
  border-left: 1px solid #f1f5f9;
  padding-left: 20px;
}

.price-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.book-btn {
  display: flex;
  align-items: center;
  background: #eef2ff;
  color: #4f46e5;
  border: 1.5px solid #c7d2fe;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.book-btn:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99,102,241,0.25);
}

.view-details-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.view-details-btn:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

/* Facility Image */
.facility-image-col {
  width: 150px;
  min-height: 120px;
  flex-shrink: 0;
  position: relative;
  border-right: 1px solid #f1f5f9;
}

.facility-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.facility-img-placeholder {
  width: 100%;
  height: 100%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
}

/* Doctor Slots Styles */
.doctor-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.doctor-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-doc-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.08);
  transform: translateY(-4px);
}

.any-specialist-card {
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  border: 2px dashed #c7d2fe;
  padding: 24px;
}

.any-specialist-card:hover {
  border-style: solid;
  border-color: #6366f1;
  background: white;
}

.doctor-info-wrap {
  display: flex;
  align-items: center;
  width: 100%;
}

.doc-avatar-container {
  flex-shrink: 0;
}

.doctor-avatar {
  border: 4px solid #f8fafc;
  box-shadow: 0 8px 16px rgba(0,0,0,0.06);
}

.doctor-cta {
  flex-shrink: 0;
  border-left: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}

.doctor-name {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 2px;
}

.doctor-role {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 6px;
}

.doctor-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-val {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.rating-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

@media (max-width: 768px) {
  .services-body { flex-direction: column; }
  .service-tabs-col { flex-direction: row; overflow-x: auto; min-width: 0; }
  .service-tab { min-width: 160px; }
  .services-header { flex-direction: column; align-items: flex-start; }
  
  .facility-card { flex-direction: column; }
  .facility-image-col { width: 100%; height: 200px; border-right: none; border-bottom: 1px solid #f1f5f9; }
  .facility-top { flex-direction: column; gap: 16px; }
  .facility-cta { 
    align-items: flex-start; 
    border-left: none; 
    padding-left: 0; 
    border-top: 1px dashed #e2e8f0; 
    padding-top: 16px; 
    width: 100%; 
    min-width: 0; 
  }
  .price-display { align-items: flex-start; }
  .book-btn { justify-content: center; }

  /* Doctor card responsive */
  .doctor-info-wrap { flex-direction: column; align-items: flex-start; text-align: left; }
  .doc-avatar-container { margin-bottom: 16px; }
  .doctor-info-wrap > .ml-5 { margin-left: 0 !important; width: 100%; }
  .doctor-cta {
    width: 100%;
    margin-left: 0 !important;
    padding-left: 0 !important;
    border-left: none;
    border-top: 1px dashed #e2e8f0;
    padding-top: 20px;
    margin-top: 16px;
  }
}
</style>
