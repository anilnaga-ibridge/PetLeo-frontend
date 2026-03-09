<script setup>
import { ref, onMounted } from 'vue'
import { customerApi } from '@/plugins/axios'
import Navbar from './book/sections/Navbar.vue'
import PetOwnerSidebar from './components/PetOwnerSidebar.vue'

definePage({
  meta: {
    requiresAuth: true,
    layout: 'blank',
  },
})

const pets = ref([])
const loading = ref(true)
const selectedPetId = ref(null)

const medicalData = ref({
  medications: [],
  vaccinations: [],
  documents: [],
})

const fetchingDetails = ref(false)

const fetchPets = async () => {
  loading.value = true
  try {
    const res = await customerApi.get('/api/pet-owner/pets/pets/')

    pets.value = res.data.results || res.data
    if (pets.value.length > 0) {
      selectedPetId.value = pets.value[0].id
      fetchMedicalDetails(pets.value[0].id)
    }
  } catch (err) {
    console.error('Failed to fetch pets:', err)
  } finally {
    loading.value = false
  }
}

const fetchMedicalDetails = async petId => {
  if (!petId) return
  fetchingDetails.value = true
  try {
    const [medRes, vacRes, docRes] = await Promise.all([
      customerApi.get(`/api/pet-owner/pets/medications/?pet=${petId}`),
      customerApi.get(`/api/pet-owner/pets/vaccinations/?pet=${petId}`),
      customerApi.get(`/api/pet-owner/pets/documents/?pet=${petId}`),
    ])
    
    medicalData.value = {
      medications: medRes.data,
      vaccinations: vacRes.data,
      documents: docRes.data,
    }
  } catch (err) {
    console.error('Failed to fetch medical details:', err)
  } finally {
    fetchingDetails.value = false
  }
}

const handlePetChange = id => {
  if (selectedPetId.value === id) return
  selectedPetId.value = id
  fetchMedicalDetails(id)
}

onMounted(fetchPets)

const formatDate = date => {
  if (!date) return 'N/A'
  
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Check status logic
const isDueSoon = date => {
  if (!date) return false
  const diff = new Date(date) - new Date()
  
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000 // due in next 30 days
}
</script>

<template>
  <div class="dashboard-root d-flex">
    <!-- Side Navigation -->
    <PetOwnerSidebar class="d-none d-lg-flex" />

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content-layer relative">
      <div class="glow-bg" />

      <!-- Global Navbar -->
      <Navbar hide-brand />

      <!-- Page Hero -->
      <div class="page-hero">
        <VContainer class="position-relative z-10">
          <div class="d-flex align-center justify-space-between flex-wrap gap-4">
            <div>
              <div class="d-flex align-center gap-3 mb-3">
                <div class="hero-icon-box bounce-in">
                  <VIcon
                    icon="tabler-health-recognition"
                    size="28"
                    color="white"
                  />
                </div>
                <div class="hero-label fade-in">
                  Health Hub
                </div>
              </div>
              <h1 class="page-title slide-up-text">
                Medical Reports
              </h1>
              <p class="hero-subtitle slide-up-text delay-1">
                Comprehensive records of your pets' vaccinations, medications, and clinical documents.
              </p>
            </div>
            
            <div
              v-if="!loading && pets.length > 0"
              class="stats-pill slide-up-text delay-2"
            >
              <VIcon
                icon="tabler-file-analytics"
                color="primary"
                class="mr-2"
              />
              <span><strong>{{ medicalData.documents.length }}</strong> Files Archived</span>
            </div>
          </div>
        </VContainer>
      </div>

      <VContainer class="py-10 position-relative z-10">
        <!-- Modern Pet Selector -->
        <div
          v-if="pets.length > 0"
          class="mb-10 slide-up-card delay-2"
        >
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-black text-slate-800 tracking-tight">
              Select Family Member
            </h2>
          </div>
          <div class="d-flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            <button
              v-for="pet in pets"
              :key="pet.id"
              class="pet-profile-card snap-center"
              :class="{ 'active': selectedPetId === pet.id }"
              @click="handlePetChange(pet.id)"
            >
              <div class="pet-avatar-lg">
                {{ pet.name[0] }}
                <div
                  v-if="selectedPetId === pet.id"
                  class="active-check"
                >
                  <VIcon
                    icon="tabler-check"
                    size="14"
                    color="white"
                  />
                </div>
              </div>
              <div class="pet-info-stack">
                <span class="pet-name">{{ pet.name }}</span>
                <span class="pet-species">{{ pet.breed || pet.species || 'Pet' }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Global Loader for Page Initial Load -->
        <div
          v-if="loading"
          class="d-flex flex-column align-center justify-center py-20 fade-in"
        >
          <div class="loader-pulse mb-6" />
          <h3 class="text-h5 font-weight-bold text-slate-700">
            Loading Health Records
          </h3>
          <p class="text-slate-500">
            Fetching medical data for your family...
          </p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="pets.length === 0"
          class="empty-state-glass slide-up-card"
        >
          <div class="empty-icon-circle bg-primary-lighten-4 mb-6">
            <VIcon
              icon="tabler-paw"
              size="48"
              color="primary"
            />
          </div>
          <h3 class="text-h4 font-weight-black text-slate-800 mb-2">
            No Pets Found
          </h3>
          <p class="text-body-1 text-slate-500 max-w-md mx-auto mb-8">
            Please add your pets first to start tracking their medical history, vaccinations, and important documents.
          </p>
          <VBtn
            to="/pet-owner/pets"
            color="primary"
            size="x-large"
            class="rounded-xl px-8 font-weight-bold elevation-4"
          >
            Add Your Pet
          </VBtn>
        </div>

        <!-- Content Area for Selected Pet -->
        <div
          v-else
          class="medical-content"
        >
          <VRow>
            <!-- Vaccinations -->
            <VCol
              cols="12"
              lg="6"
            >
              <div
                class="luxury-panel h-100 slide-up-card"
                style="animation-delay: 0.1s;"
              >
                <div class="panel-header d-flex align-center mb-6">
                  <div class="icon-wrap bg-secondary-light">
                    <VIcon
                      icon="tabler-vaccine"
                      color="secondary"
                      size="24"
                    />
                  </div>
                  <div>
                    <h3 class="panel-title">
                      Vaccine History
                    </h3>
                    <p class="panel-subtitle">
                      Immunization records & schedules
                    </p>
                  </div>
                </div>

                <div
                  v-if="fetchingDetails"
                  class="d-flex justify-center py-10"
                >
                  <VProgressCircular
                    indeterminate
                    color="secondary"
                  />
                </div>
                
                <div
                  v-else-if="medicalData.vaccinations.length === 0"
                  class="panel-empty"
                >
                  <VIcon
                    icon="tabler-shield-check"
                    size="40"
                    color="slate-300"
                    class="mb-4"
                  />
                  <p>No vaccination records found.</p>
                </div>
                
                <div
                  v-else
                  class="timeline-container"
                >
                  <div
                    v-for="(vax, index) in medicalData.vaccinations"
                    :key="vax.id"
                    class="timeline-item"
                  >
                    <div class="timeline-node">
                      <div class="node-dot" />
                      <div
                        v-if="index !== medicalData.vaccinations.length - 1"
                        class="node-line"
                      />
                    </div>
                    <div class="timeline-content">
                      <div class="d-flex justify-space-between align-start mb-1 flex-wrap gap-2">
                        <h4 class="vax-name">
                          {{ vax.vaccine_name }}
                        </h4>
                        <div
                          class="status-badge"
                          :class="{ 'warning': isDueSoon(vax.next_due_date), 'success': !isDueSoon(vax.next_due_date) }"
                        >
                          Due: {{ formatDate(vax.next_due_date) }}
                        </div>
                      </div>
                      <p class="vax-date mt-1">
                        Administered: {{ formatDate(vax.date_administered) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </VCol>

            <!-- Medications -->
            <VCol
              cols="12"
              lg="6"
            >
              <div
                class="luxury-panel h-100 slide-up-card"
                style="animation-delay: 0.2s;"
              >
                <div class="panel-header d-flex align-center mb-6">
                  <div class="icon-wrap bg-primary-light">
                    <VIcon
                      icon="tabler-pill"
                      color="primary"
                      size="24"
                    />
                  </div>
                  <div>
                    <h3 class="panel-title">
                      Active Medications
                    </h3>
                    <p class="panel-subtitle">
                      Current prescriptions and treatments
                    </p>
                  </div>
                </div>

                <div
                  v-if="fetchingDetails"
                  class="d-flex justify-center py-10"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                
                <div
                  v-else-if="medicalData.medications.length === 0"
                  class="panel-empty"
                >
                  <VIcon
                    icon="tabler-prescription"
                    size="40"
                    color="slate-300"
                    class="mb-4"
                  />
                  <p>No active medications at this time.</p>
                </div>
                
                <div
                  v-else
                  class="meds-grid"
                >
                  <div
                    v-for="med in medicalData.medications"
                    :key="med.id"
                    class="med-card"
                  >
                    <div class="d-flex align-start justify-space-between mb-3">
                      <div class="med-icon">
                        <VIcon
                          icon="tabler-medicine-syrup"
                          color="primary"
                          size="20"
                        />
                      </div>
                      <VChip
                        size="small"
                        :color="med.is_active ? 'success' : 'slate'"
                        variant="tonal"
                        class="font-weight-black text-xs uppercase letter-spacing-wide"
                      >
                        {{ med.is_active ? 'Active' : 'Completed' }}
                      </VChip>
                    </div>
                    <h4
                      class="med-name text-truncate"
                      :title="med.name"
                    >
                      {{ med.name }}
                    </h4>
                    <div class="med-dosage mt-2">
                      <VIcon
                        icon="tabler-droplet"
                        size="14"
                        class="mr-1 opacity-70"
                      /> {{ med.dosage }}
                    </div>
                    <div class="med-freq">
                      <VIcon
                        icon="tabler-clock"
                        size="14"
                        class="mr-1 opacity-70"
                      /> {{ med.frequency }}
                    </div>
                  </div>
                </div>
              </div>
            </VCol>

            <!-- Documents -->
            <VCol cols="12">
              <div
                class="luxury-panel overflow-hidden slide-up-card"
                style="animation-delay: 0.3s;"
              >
                <div class="d-flex align-center justify-space-between flex-wrap gap-4 mb-8 border-b pb-6">
                  <div class="panel-header d-flex align-center m-0">
                    <div class="icon-wrap bg-info-light">
                      <VIcon
                        icon="tabler-file-report"
                        color="info"
                        size="24"
                      />
                    </div>
                    <div>
                      <h3 class="panel-title">
                        Diagnostic Reports & Documents
                      </h3>
                      <p class="panel-subtitle">
                        Lab results, X-rays, and clinical notes
                      </p>
                    </div>
                  </div>
                  <VBtn
                    color="primary"
                    variant="tonal"
                    prepend-icon="tabler-upload"
                    class="rounded-xl font-weight-bold px-6 border-primary-light"
                  >
                    Upload
                  </VBtn>
                </div>

                <div
                  v-if="fetchingDetails"
                  class="d-flex justify-center py-12"
                >
                  <VProgressCircular
                    indeterminate
                    color="info"
                  />
                </div>
                
                <div
                  v-else-if="medicalData.documents.length === 0"
                  class="panel-empty py-16 border-none"
                >
                  <VIcon
                    icon="tabler-file-off"
                    size="56"
                    color="slate-200"
                    class="mb-4"
                  />
                  <h4 class="text-h6 font-weight-bold text-slate-700 mb-1">
                    No Documents Available
                  </h4>
                  <p>Digital copies of lab reports and documents will appear here.</p>
                </div>
                
                <div
                  v-else
                  class="docs-grid"
                >
                  <div
                    v-for="doc in medicalData.documents"
                    :key="doc.id"
                    class="doc-file-card group"
                  >
                    <div class="doc-icon">
                      <VIcon
                        icon="tabler-file-type-pdf"
                        color="error"
                        size="36"
                      />
                    </div>
                    <div class="doc-info flex-grow-1 min-w-0">
                      <h4
                        class="doc-name text-truncate"
                        :title="doc.document_name"
                      >
                        {{ doc.document_name }}
                      </h4>
                      <p class="doc-meta">
                        Uploaded {{ formatDate(doc.uploaded_at) }}
                      </p>
                    </div>
                    <VBtn
                      icon
                      variant="tonal"
                      color="primary"
                      class="download-btn shadow-hover"
                    >
                      <VIcon
                        icon="tabler-download"
                        size="20"
                      />
                    </VBtn>
                  </div>
                </div>
              </div>
            </VCol>
          </VRow>
        </div>
      </VContainer>
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
  background: transparent;
  z-index: 10;
}

/* Base structural styles */
.position-relative { position: relative; }
.z-10 { z-index: 10; }
.uppercase { text-transform: uppercase; }
.text-xs { font-size: 11px; }

.glow-bg {
  position: fixed;
  top: -100px;
  right: -100px;
  width: 60vw;
  height: 60vh;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(248, 250, 252, 0) 70%);
  z-index: 1;
  pointer-events: none;
}

/* Typography & Hero */
.page-hero {
  background: linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.2));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 48px 0 56px;
  border-bottom: 1px solid rgba(255,255,255,0.8);
  position: relative;
  z-index: 5;
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(99,102,241,0.25);
}

.hero-label {
  font-size: 13px;
  font-weight: 900;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.page-title {
  font-size: 44px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2px;
  line-height: 1.1;
  margin-bottom: 8px;
}

.hero-subtitle {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  max-width: 600px;
}

.stats-pill {
  background: white;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  padding: 12px 24px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #475569;
}

/* Horizontal Pet Profile Selector */
.pet-profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px 12px 12px;
  background: white;
  border: 2px solid transparent;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-width: 220px;
}

.pet-profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
}

.pet-profile-card.active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.03);
  box-shadow: 0 10px 30px rgba(99,102,241,0.12);
}

.pet-avatar-lg {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 800;
  position: relative;
}

.active-check {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.pet-info-stack {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.pet-info-stack .pet-name {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.pet-info-stack .pet-species {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Panels */
.luxury-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  border-radius: 32px;
  padding: 32px;
  transition: all 0.3s;
}

.luxury-panel:hover {
  box-shadow: 0 15px 50px rgba(15, 23, 42, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.bg-secondary-light { background: #fdf2f8; }
.bg-primary-light { background: #eef2ff; }
.bg-info-light { background: #f0f9ff; }

.panel-title {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.panel-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}

.panel-empty {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
  font-weight: 500;
  background: rgba(248, 250, 252, 0.5);
  border-radius: 20px;
  border: 2px dashed #e2e8f0;
}

.border-none { border: none; background: transparent; }

/* Timeline (Vaccinations) */
.timeline-container {
  padding-left: 12px;
  margin-top: 24px;
}

.timeline-item {
  display: flex;
  gap: 24px;
  position: relative;
  padding-bottom: 32px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node-dot {
  width: 16px;
  height: 16px;
  background: #ec4899;
  border: 4px solid #fdf2f8;
  border-radius: 50%;
  box-shadow: 0 0 0 4px white;
  z-index: 2;
}

.node-line {
  width: 2px;
  flex: 1;
  background: #fdf2f8;
  margin-top: 4px;
  margin-bottom: -28px;
}

.timeline-content {
  flex: 1;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  margin-top: -12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.timeline-content:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.05);
  border-color: #fbcfe8;
}

.vax-name {
  font-size: 16px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.status-badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.status-badge.success {
  background: #ecfdf5;
  color: #10b981;
}

.status-badge.warning {
  background: #fffbeb;
  color: #f59e0b;
  border: 1px solid #fde68a;
}

.vax-date {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin: 0;
}

/* Grids */
.meds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.med-card {
  background: white;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.med-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(99,102,241,0.08);
  border-color: #c7d2fe;
}

.med-icon {
  width: 40px;
  height: 40px;
  background: #f5f3ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.med-name {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.med-dosage, .med-freq {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

/* Documents */
.border-b { border-bottom: 1px solid #f1f5f9; }
.border-primary-light { border-color: rgba(99,102,241,0.2) !important; }

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.doc-file-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.2s;
}

.doc-file-card:hover {
  border-color: #38bdf8;
  box-shadow: 0 10px 20px rgba(56,189,248,0.1);
  transform: translateY(-2px) scale(1.01);
}

.doc-file-card:hover .download-btn {
  opacity: 1;
}

.doc-icon {
  width: 52px;
  height: 52px;
  background: #fef2f2;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fee2e2;
}

.download-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.doc-name {
  font-size: 15px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 2px;
}

.doc-meta {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
}

/* Loaders & Empty State */
.loader-pulse {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

.empty-state-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 40px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}

.empty-icon-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.bg-primary-lighten-4 { background: #e0e7ff; }

/* Animations */
.bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.fade-in { animation: fadeIn 0.8s ease forwards; }
.slide-up-text { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 0; transform: translateY(20px); }
.slide-up-card { animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; opacity: 0; transform: translateY(30px); }

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }

@keyframes bounceIn {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUpFade {
  to { opacity: 1; transform: translateY(0); }
}
</style>
