<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { customerApi } from '@/plugins/axios'
import Navbar from './book/sections/Navbar.vue'
import PetOwnerSidebar from './components/PetOwnerSidebar.vue'
import PetFormDialog from './components/PetFormDialog.vue'
import PetMedicalDialog from './components/PetMedicalDialog.vue'

definePage({
  meta: { layout: 'blank' },
})

const router = useRouter()
const pets = ref([])
const loading = ref(true)
const showFormDialog = ref(false)
const showMedicalDialog = ref(false)
const selectedPet = ref(null)
const searchQuery = ref('')
const activeFilter = ref('all')

// Feedback & Management UI
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const showDeleteConfirm = ref(false)
const petToDelete = ref(null)
const deleteLoading = ref(false)

const showMessage = (msg, color = 'success') => {
  snackbarMessage.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

const filteredPets = computed(() => {
  let list = pets.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.breed?.toLowerCase().includes(q) ||
      p.species?.toLowerCase().includes(q)
    )
  }
  if (activeFilter.value !== 'all') {
    list = list.filter(p => (p.species || '').toUpperCase() === activeFilter.value)
  }
  return list
})

const speciesFilters = computed(() => {
  const seen = new Set()
  const filters = [{ key: 'all', label: 'All', emoji: '🐾' }]
  pets.value.forEach(p => {
    const s = (p.species || '').toUpperCase()
    if (!seen.has(s) && s) {
      seen.add(s)
      const emoji = s === 'DOG' ? '🐕' : s === 'CAT' ? '🐱' : s === 'BIRD' ? '🦜' : '🐾'
      filters.push({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase(), emoji })
    }
  })
  return filters
})

const fetchPets = async () => {
  loading.value = true
  try {
    const res = await customerApi.get('/api/pet-owner/pets/pets/')
    pets.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch (err) {
    console.error('Failed to fetch pets', err)
  } finally {
    loading.value = false
  }
}

const handleAddPet = () => { selectedPet.value = null; showFormDialog.value = true }
const handleEditPet = (pet) => { selectedPet.value = pet; showFormDialog.value = true }
const handleOpenMedical = (pet) => { selectedPet.value = pet; showMedicalDialog.value = true }
const handleFormSaved = (msg) => { 
  showFormDialog.value = false; 
  showMedicalDialog.value = false; 
  selectedPet.value = null
  if (msg) showMessage(msg)
  fetchPets() 
}

const handleDeletePet = (pet) => {
  petToDelete.value = pet
  showDeleteConfirm.value = true
}

const confirmDeletePet = async () => {
  if (!petToDelete.value) return
  
  deleteLoading.value = true
  try {
    await customerApi.delete(`/api/pet-owner/pets/pets/${petToDelete.value.id}/`)
    showMessage(`${petToDelete.value.name} has been removed from your family.`, 'info')
    showDeleteConfirm.value = false
    fetchPets()
  } catch (err) {
    console.error('Failed to delete pet:', err)
    showMessage('Failed to remove pet. Please try again.', 'error')
  } finally {
    deleteLoading.value = false
    petToDelete.value = null
  }
}

const getPhotoUrl = (photo) => {
  if (!photo) return null
  if (photo.startsWith('http')) return photo
  return `http://localhost:8005${photo}`
}

const getSpeciesEmoji = (species) => {
  const s = (species || '').toUpperCase()
  if (s === 'DOG') return '🐕'
  if (s === 'CAT') return '🐱'
  if (s === 'BIRD') return '🦜'
  if (s === 'RABBIT') return '🐇'
  return '🐾'
}

const getInitial = (name) => (name || 'P').charAt(0).toUpperCase()

const getNextVaccDate = (pet) => {
  const d = pet.medical_profile?.next_due_date
  if (!d) return null
  const days = Math.ceil((new Date(d) - new Date()) / 86400000)
  return { label: new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), days }
}

const vaccColor = (pet) => {
  const v = getNextVaccDate(pet)
  if (!v) return '#94a3b8'
  if (v.days <= 3) return '#ef4444'
  if (v.days <= 7) return '#f59e0b'
  return '#10b981'
}

onMounted(fetchPets)
</script>

<template>
  <div class="dashboard-root d-flex">
    <!-- Side Navigation -->
    <PetOwnerSidebar class="d-none d-lg-flex" />

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content-layer">
      <!-- Global Navbar -->
      <Navbar />

      <!-- Feedback Notifications -->
      <VSnackbar
        v-model="snackbar"
        :color="snackbarColor"
        location="top end"
        :timeout="4000"
      >
        {{ snackbarMessage }}
        <template #actions>
          <VBtn variant="text" size="small" @click="snackbar = false">Dismiss</VBtn>
        </template>
      </VSnackbar>

      <!-- Delete Confirmation Dialog -->
      <VDialog v-model="showDeleteConfirm" max-width="420" persistent>
        <VCard class="rounded-3xl pa-8 text-center">
          <div class="delete-icon-bg mb-6 mx-auto">
            <VIcon icon="tabler-alert-triangle" color="error" size="36" />
          </div>
          <h3 class="text-h4 font-weight-black mb-2">Remove {{ petToDelete?.name }}?</h3>
          <p class="text-body-1 text-slate-500 mb-8 px-4">
            This action is permanent and cannot be undone.
          </p>
          <div class="d-flex gap-4">
            <VBtn variant="tonal" color="slate" size="large" class="rounded-2xl flex-grow-1" :disabled="deleteLoading" @click="showDeleteConfirm = false">Cancel</VBtn>
            <VBtn color="error" size="large" class="rounded-2xl flex-grow-1" :loading="deleteLoading" @click="confirmDeletePet">Yes, Remove</VBtn>
          </div>
        </VCard>
      </VDialog>

      <!-- Page Hero -->
      <div class="page-hero">
        <VContainer>
          <VRow align="center">
            <VCol cols="12" md="6">
              <div class="d-flex align-center gap-3 mb-4">
                <div class="hero-icon">
                  <VIcon icon="tabler-heart" size="20" color="white" />
                </div>
                <span class="hero-label">My Family</span>
              </div>
              <h1 class="hero-title">Your Beloved Pets</h1>
              <p class="hero-sub">Manage profiles, health records & appointments all in one place.</p>
            </VCol>
            <VCol cols="12" md="6" class="d-flex justify-md-end mt-4 mt-md-0">
              <div class="d-flex align-center gap-4">
                <div class="summary-pill">
                  <span class="summary-num">{{ pets.length }}</span>
                  <span class="summary-lbl">Pets</span>
                </div>
                <VBtn
                  color="primary"
                  height="50"
                  class="px-8 font-weight-black rounded-2xl"
                  prepend-icon="tabler-plus"
                  @click="handleAddPet"
                >
                  Add Pet
                </VBtn>
              </div>
            </VCol>
          </VRow>
        </VContainer>
      </div>

      <VContainer class="py-10">
        <!-- Search + Filter bar -->
        <div class="toolbar mb-8">
          <div class="search-wrap">
            <VIcon icon="tabler-search" size="18" class="search-icon" />
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="Search by name, breed or species…"
            />
          </div>
          <div class="filter-pills">
            <button
              v-for="f in speciesFilters"
              :key="f.key"
              class="filter-pill"
              :class="{ 'filter-active': activeFilter === f.key }"
              @click="activeFilter = f.key"
            >
              {{ f.emoji }} {{ f.label }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="d-flex flex-column align-center py-20">
          <VProgressCircular indeterminate color="primary" size="52" width="4" />
          <p class="mt-5 text-slate-400 font-weight-medium">Gathering your family…</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="pets.length === 0" class="empty-box">
          <div class="empty-emoji">🐾</div>
          <h2 class="empty-title">No Pets Yet</h2>
          <p class="empty-sub">Add your first pet to start managing their health journey.</p>
          <VBtn color="primary" height="50" class="px-10 font-weight-black rounded-2xl mt-4" @click="handleAddPet">
            Add Your First Pet
          </VBtn>
        </div>

        <!-- No Search Results -->
        <div v-else-if="filteredPets.length === 0" class="empty-box">
          <div class="empty-emoji">🔍</div>
          <h2 class="empty-title">No matches found</h2>
          <p class="empty-sub">Try a different name or reset your filters.</p>
          <button class="reset-btn" @click="searchQuery = ''; activeFilter = 'all'">Reset Filters</button>
        </div>

        <!-- Pet Grid -->
        <div v-else class="pet-grid">
          <div
            v-for="(pet, i) in filteredPets"
            :key="pet.id"
            class="pet-card"
            :style="`animation-delay: ${i * 0.07}s`"
          >
            <!-- Photo / Avatar column -->
            <div class="pet-photo-col">
              <div class="pet-photo-wrap">
                <img v-if="getPhotoUrl(pet.photo)" :src="getPhotoUrl(pet.photo)" class="pet-photo" :alt="pet.name" />
                <div v-else class="pet-initials-circle">{{ getInitial(pet.name) }}</div>
                <div class="pet-species-badge">{{ getSpeciesEmoji(pet.species) }}</div>
              </div>
            </div>

            <!-- Main Info -->
            <div class="pet-info">
              <div class="pet-info-row">
                <div>
                  <h3 class="pet-card-name">{{ pet.name }}</h3>
                  <p class="pet-card-breed">{{ pet.breed || pet.species || 'Pet' }}</p>
                </div>
                <div class="d-flex align-center gap-2">
                  <div class="status-dot-pill">
                    <span class="dot-active" />
                    {{ pet.status || 'Active' }}
                  </div>
                </div>
              </div>

              <!-- Details row -->
              <div class="pet-details-row">
                <div class="detail-chip">
                  <VIcon icon="tabler-clock" size="12" />
                  {{ pet.age_display || 'Unknown' }}
                </div>
                <div class="detail-chip">
                  <VIcon icon="tabler-gender-bigender" size="12" />
                  {{ pet.gender || '—' }}
                </div>
                <div v-if="pet.weight" class="detail-chip">
                  <VIcon icon="tabler-weight" size="12" />
                  {{ pet.weight }} kg
                </div>
                <div v-if="pet.color" class="detail-chip">
                  <VIcon icon="tabler-palette" size="12" />
                  {{ pet.color }}
                </div>
              </div>

              <!-- Vaccination row -->
              <div class="vacc-mini" :style="`border-left-color: ${vaccColor(pet)}`">
                <VIcon icon="tabler-vaccine" size="13" :color="vaccColor(pet)" />
                <span class="vacc-mini-label">Next Vaccine:</span>
                <span class="vacc-mini-val" :style="`color: ${vaccColor(pet)}`">
                  {{ getNextVaccDate(pet) ? getNextVaccDate(pet).label + ` (${getNextVaccDate(pet).days}d)` : 'Not scheduled' }}
                </span>
              </div>
            </div>

            <!-- Actions column -->
            <div class="pet-actions">
              <button class="action-btn primary" @click="handleOpenMedical(pet)">
                <VIcon icon="tabler-stethoscope" size="16" />
                Medical
              </button>
              <button class="action-btn ghost" @click="handleEditPet(pet)" title="Edit">
                <VIcon icon="tabler-pencil" size="16" />
              </button>
              <button class="action-btn ghost text-error" @click="handleDeletePet(pet)" title="Delete">
                <VIcon icon="tabler-trash" size="16" />
              </button>
            </div>
          </div>
        </div>
      </VContainer>

      <!-- Dialogs -->
      <PetFormDialog
        v-model="showFormDialog"
        :pet="selectedPet"
        @saved="handleFormSaved"
        @close="showFormDialog = false"
      />
      <PetMedicalDialog
        v-model="showMedicalDialog"
        :pet="selectedPet"
        @saved="handleFormSaved"
        @close="showMedicalDialog = false"
      />
      <VBtn
        icon="tabler-plus"
        color="primary"
        size="large"
        class="fab-btn d-lg-none"
        @click="handleAddPet"
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

/* Hero */
.page-hero {
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 45%, #fdf2f8 100%);
  padding: 48px 0 52px;
  border-bottom: 1px solid #f1f5f9;
}

.hero-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(236,72,153,0.25);
}

.hero-label {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #6366f1;
}

.hero-title {
  font-size: 48px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2.5px;
  line-height: 1;
  margin: 0 0 8px;
}

.hero-sub {
  font-size: 16px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
}

.summary-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 20px;
}

.summary-num {
  font-size: 26px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

.summary-lbl {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 42px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus { border-color: #6366f1; }
.search-input::placeholder { color: #94a3b8; }

.filter-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill {
  padding: 8px 16px;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  background: white;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-pill:hover { border-color: #6366f1; color: #6366f1; background: #f5f3ff; }
.filter-active { border-color: #6366f1 !important; background: #6366f1 !important; color: white !important; }

/* Pet Grid */
.pet-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Pet Card — Horizontal row layout */
.pet-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 16px 20px;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  animation: slideUpCard 0.5s cubic-bezier(0.2, 0, 0, 1) both;
  opacity: 0;
}

@keyframes slideUpCard {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.pet-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 8px 32px rgba(99,102,241,0.08);
  transform: translateX(4px);
}

/* Photo column */
.pet-photo-col { flex-shrink: 0; }

.pet-photo-wrap {
  position: relative;
  width: 72px;
  height: 72px;
}

.pet-photo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  object-fit: cover;
  border: 2px solid #f1f5f9;
}

.pet-initials-circle {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: #6366f1;
}

.pet-species-badge {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 26px;
  height: 26px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border: 1.5px solid #f1f5f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* Info column */
.pet-info { flex: 1; min-width: 0; }

.pet-info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.pet-card-name {
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
  margin: 0 0 2px;
}

.pet-card-breed {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-dot-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 800;
  color: #10b981;
  white-space: nowrap;
}

.dot-active {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
  70% { box-shadow: 0 0 0 4px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}

/* Detail chips */
.pet-details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.detail-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

/* Vacc mini */
.vacc-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-left: 3px solid #94a3b8;
  background: #f8fafc;
  border-radius: 0 10px 10px 0;
  font-size: 12px;
}

.vacc-mini-label {
  color: #94a3b8;
  font-weight: 700;
}

.vacc-mini-val {
  font-weight: 800;
}

/* Actions column */
.pet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  height: 40px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  transition: all 0.2s ease;
}

.action-btn.primary {
  padding: 0 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  box-shadow: 0 4px 12px rgba(99,102,241,0.28);
}

.action-btn.primary:hover {
  filter: brightness(1.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99,102,241,0.35);
}

.action-btn.ghost {
  width: 40px;
  background: #f5f3ff;
  border: 1px solid #e0e7ff;
  color: #6366f1;
}

.action-btn.ghost:hover {
  background: #eef2ff;
  transform: scale(1.08);
}

/* Empty State */
.empty-box {
  text-align: center;
  padding: 80px 24px;
}

.empty-emoji {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 32px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
  margin-bottom: 8px;
}

.empty-sub {
  font-size: 16px;
  font-weight: 500;
  color: #94a3b8;
}

.reset-btn {
  margin-top: 16px;
  padding: 10px 24px;
  border-radius: 12px;
  background: #f5f3ff;
  border: 1px solid #e0e7ff;
  color: #6366f1;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover { background: #eef2ff; }

/* Text helpers */
.text-slate-400 { color: #94a3b8; }
.text-error { color: #ef4444 !important; }

.delete-icon-bg {
  width: 72px;
  height: 72px;
  background: #fef2f2;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
