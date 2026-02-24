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
  documents: []
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

const fetchMedicalDetails = async (petId) => {
  if (!petId) return
  fetchingDetails.value = true
  try {
    const [medRes, vacRes, docRes] = await Promise.all([
      customerApi.get(`/api/pet-owner/pets/medications/?pet=${petId}`),
      customerApi.get(`/api/pet-owner/pets/vaccinations/?pet=${petId}`),
      customerApi.get(`/api/pet-owner/pets/documents/?pet=${petId}`)
    ])
    
    medicalData.value = {
      medications: medRes.data,
      vaccinations: vacRes.data,
      documents: docRes.data
    }
  } catch (err) {
    console.error('Failed to fetch medical details:', err)
  } finally {
    fetchingDetails.value = false
  }
}

const handlePetChange = (id) => {
  selectedPetId.value = id
  fetchMedicalDetails(id)
}

onMounted(fetchPets)

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="dashboard-root d-flex">
    <!-- Side Navigation -->
    <PetOwnerSidebar class="d-none d-lg-flex" />

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content-layer">
      <!-- Global Navbar -->
      <Navbar />

      <!-- Page Hero -->
      <div class="page-hero">
        <VContainer>
          <div class="d-flex align-center justify-space-between flex-wrap gap-4">
            <div>
              <div class="d-flex align-center gap-3 mb-3">
                <div class="hero-icon-box">
                  <VIcon icon="tabler-report-medical" size="26" color="white" />
                </div>
                <div class="text-caption font-weight-black text-primary uppercase tracking-widest">Health Hub</div>
              </div>
              <h1 class="page-title mb-2">Medical Reports</h1>
              <p class="text-body-1 text-slate-500 font-weight-medium">
                Comprehensive records of your pets' vaccinations, medications, and clinical documents.
              </p>
            </div>
          </div>
        </VContainer>
      </div>

      <VContainer class="py-10">
        <!-- Pet Selector -->
        <div v-if="pets.length > 1" class="mb-8">
          <div class="text-subtitle-2 font-weight-black text-slate-400 uppercase mb-4 tracking-wider">Select Pet</div>
          <div class="d-flex gap-3 overflow-x-auto pb-2">
            <button
              v-for="pet in pets"
              :key="pet.id"
              class="pet-select-pill"
              :class="{ active: selectedPetId === pet.id }"
              @click="handlePetChange(pet.id)"
            >
              <div class="pet-avatar-mini">{{ pet.name[0] }}</div>
              <span>{{ pet.name }}</span>
            </button>
          </div>
        </div>

        <div v-if="loading" class="d-flex justify-center py-20">
          <VProgressCircular indeterminate color="primary" size="64" />
        </div>

        <div v-else-if="pets.length === 0" class="text-center py-20 bg-white rounded-[40px] border-2 border-dashed">
          <VIcon icon="tabler-paw" size="64" color="slate-200" class="mb-4" />
          <h3 class="text-h5 font-weight-bold text-slate-700">No Pets Found</h3>
          <p class="text-slate-500">Please add your pets first to see their medical reports.</p>
        </div>

        <div v-else class="medical-content">
          <VRow>
            <!-- Vaccinations -->
            <VCol cols="12" md="6">
              <VCard class="rounded-[32px] pa-8 h-100 luxury-card">
                <div class="d-flex align-center mb-8">
                  <div class="section-icon bg-secondary-lighten-5 me-4">
                    <VIcon icon="tabler-vaccine" color="secondary" />
                  </div>
                  <h3 class="text-h5 font-weight-black text-slate-900">Vaccinations</h3>
                </div>

                <div v-if="fetchingDetails" class="d-flex justify-center py-10">
                  <VProgressCircular indeterminate color="secondary" />
                </div>
                <div v-else-if="medicalData.vaccinations.length === 0" class="empty-mini">
                  <p>No vaccination records found.</p>
                </div>
                <div v-else class="records-list">
                  <div v-for="vax in medicalData.vaccinations" :key="vax.id" class="record-item">
                    <div class="record-info">
                      <div class="record-title">{{ vax.vaccine_name }}</div>
                      <div class="record-sub">Administered: {{ formatDate(vax.date_administered) }}</div>
                    </div>
                    <div class="record-status success">
                      Next Due: {{ formatDate(vax.next_due_date) }}
                    </div>
                  </div>
                </div>
              </VCard>
            </VCol>

            <!-- Medications -->
            <VCol cols="12" md="6">
              <VCard class="rounded-[32px] pa-8 h-100 luxury-card">
                <div class="d-flex align-center mb-8">
                  <div class="section-icon bg-primary-lighten-5 me-4">
                    <VIcon icon="tabler-pill" color="primary" />
                  </div>
                  <h3 class="text-h5 font-weight-black text-slate-900">Active Medications</h3>
                </div>

                <div v-if="fetchingDetails" class="d-flex justify-center py-10">
                  <VProgressCircular indeterminate color="primary" />
                </div>
                <div v-else-if="medicalData.medications.length === 0" class="empty-mini">
                  <p>No active medications.</p>
                </div>
                <div v-else class="records-list">
                  <div v-for="med in medicalData.medications" :key="med.id" class="record-item">
                    <div class="record-info">
                      <div class="record-title">{{ med.name }}</div>
                      <div class="record-sub">{{ med.dosage }} • {{ med.frequency }}</div>
                    </div>
                    <VChip size="small" :color="med.is_active ? 'success' : 'slate'" class="font-weight-black text-uppercase">
                      {{ med.is_active ? 'Active' : 'Completed' }}
                    </VChip>
                  </div>
                </div>
              </VCard>
            </VCol>

            <!-- Documents -->
            <VCol cols="12">
              <VCard class="rounded-[32px] pa-8 luxury-card overflow-hidden">
                <div class="d-flex align-center mb-8">
                  <div class="section-icon bg-info-lighten-5 me-4">
                    <VIcon icon="tabler-file-report" color="info" />
                  </div>
                  <h3 class="text-h5 font-weight-black text-slate-900">Diagnostic Reports & Documents</h3>
                </div>

                <div v-if="fetchingDetails" class="d-flex justify-center py-10">
                  <VProgressCircular indeterminate color="info" />
                </div>
                <div v-else-if="medicalData.documents.length === 0" class="empty-mini text-center py-10">
                  <VIcon icon="tabler-file-off" size="48" color="slate-200" class="mb-4" />
                  <p>No lab reports or digital documents uploaded yet.</p>
                </div>
                <div v-else class="documents-grid">
                  <div v-for="doc in medicalData.documents" :key="doc.id" class="doc-item">
                    <div class="doc-icon-wrap">
                      <VIcon icon="tabler-file-type-pdf" color="error" size="32" />
                    </div>
                    <div class="doc-meta">
                      <div class="doc-name">{{ doc.document_name }}</div>
                      <div class="doc-date">Uploaded: {{ formatDate(doc.uploaded_at) }}</div>
                    </div>
                    <VBtn icon="tabler-download" variant="text" color="primary" />
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>
        </div>
      </VContainer>
    </div>
  </div>
</template>

<style scoped>
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

.page-hero {
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 45%, #fdf2f8 100%);
  padding: 56px 0 64px;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(99,102,241,0.2);
}

.page-title {
  font-size: 42px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1.5px;
}

.luxury-card {
  border: 1px solid #f1f5f9;
  box-shadow: 0 10px 30px rgba(0,0,0,0.02) !important;
  transition: all 0.3s ease;
}

.luxury-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.05) !important;
}

.section-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
}

.record-title {
  font-weight: 800;
  color: #1e293b;
  font-size: 16px;
}

.record-sub {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  margin-top: 2px;
}

.record-status {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 6px 14px;
  border-radius: 10px;
}

.record-status.success {
  background: #ecfdf5;
  color: #10b981;
}

.empty-mini {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
  font-weight: 600;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 18px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s ease;
}

.doc-item:hover {
  background: white;
  border-color: #6366f1;
}

.doc-name {
  font-weight: 800;
  color: #1e293b;
  font-size: 14px;
}

.doc-date {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

/* Pet Selector */
.pet-select-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 8px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 50px;
  font-weight: 800;
  color: #64748b;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
}

.pet-select-pill.active {
  background: #eef2ff;
  border-color: #6366f1;
  color: #4f46e5;
  box-shadow: 0 4px 12px rgba(99,102,241,0.15);
}

.pet-avatar-mini {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
</style>
