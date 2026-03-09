<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { customerApi } from '@/plugins/axios'
import Navbar from './book/sections/Navbar.vue'
import PetFormDialog from './components/PetFormDialog.vue'
import PetMedicalDialog from './components/PetMedicalDialog.vue'
import PetCardPremium from './components/PetCardPremium.vue'
import BookingCardPremium from './components/BookingCardPremium.vue'
import QuickActionCard from './components/QuickActionCard.vue'
import ReminderCard from './components/ReminderCard.vue'

import PetEmptyState from './components/PetEmptyState.vue'
import ManageBookingDialog from './components/ManageBookingDialog.vue'
import PetOwnerSidebar from './components/PetOwnerSidebar.vue'

definePage({
  meta: {
    requiresAuth: true,
    layout: 'blank',
  },
})

const router = useRouter()
const pets = ref([])
const loading = ref(false)
const showFormDialog = ref(false)
const showMedicalDialog = ref(false)
const selectedPet = ref(null)

const showManageDialog = ref(false)
const selectedBooking = ref(null)

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

const userData = JSON.parse(localStorage.getItem('userData') || '{}')
const userName = computed(() => userData.full_name?.split(' ')[0] || 'there')

const fetchPets = async () => {
  loading.value = true
  try {
    const res = await customerApi.get('/api/pet-owner/pets/pets/')

    pets.value = res.data.results || res.data
    generateReminders()
  } catch (err) {
    console.error('Failed to fetch pets:', err)
  } finally {
    loading.value = false
  }
}

// Dynamic Reminders
const reminders = ref([])

const generateReminders = () => {
  const newReminders = []
  
  pets.value.forEach(pet => {
    // Vaccination Reminders
    if (pet.medical_profile?.next_due_date) {
      const dueDate = new Date(pet.medical_profile.next_due_date)
      const diffDays = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 7 && diffDays >= 0) {
        newReminders.push({
          id: `vax-${pet.id}`,
          title: 'Vaccination Due',
          message: `${pet.name} is due for a checkup in ${diffDays} days.`,
          type: 'warning',
          icon: 'tabler-vaccine',
        })
      }
    }
    
    // Grooming Placeholder (Simulated logic for demo)
    if (pet.species === 'DOG' && !newReminders.some(r => r.id === `groom-${pet.id}`)) {
      newReminders.push({
        id: `groom-${pet.id}`,
        title: 'Grooming Time?',
        message: `It's been a month since ${pet.name}'s last grooming. Time for a spa day?`,
        type: 'info',
        icon: 'tabler-scissors',
      })
    }
  })
  
  // Default reminder if empty
  if (newReminders.length === 0) {
    newReminders.push({
      id: 'default-1',
      title: 'Welcome to PetLeo!',
      message: 'Start by adding your pets and their medical records to stay on top of their health.',
      type: 'info',
      icon: 'tabler-confetti',
    })
  }
  
  reminders.value = newReminders
}

// Mock data for new UI elements (since we don't have the full booking/notification systems yet)
const upcomingBookings = ref([])
const pastBookings = ref([])
const bookingTab = ref('upcoming')

const fetchBookings = async () => {
  try {
    const res = await customerApi.get('/api/pet-owner/bookings/bookings/')
    const allBookings = res.data.results || res.data
    
    // Split into upcoming and past
    const now = new Date()

    now.setHours(0, 0, 0, 0) // Compare dates only at midnight for simplicity, or keep full time

    upcomingBookings.value = allBookings.filter(b => {
      const isFinalStatus = ['CANCELLED', 'REJECTED', 'COMPLETED'].includes(b.status?.toUpperCase())
      const bookingDate = new Date(b.selected_time || b.appointment_date)
      
      return !isFinalStatus && bookingDate >= now
    })
    
    pastBookings.value = allBookings.filter(b => {
      const isFinalStatus = ['CANCELLED', 'REJECTED', 'COMPLETED'].includes(b.status?.toUpperCase())
      const bookingDate = new Date(b.selected_time || b.appointment_date)
      
      return isFinalStatus || bookingDate < now
    })
  } catch (err) {
    console.error('Failed to fetch bookings:', err)
  }
}

const handleDismissReminder = id => {
  reminders.value = reminders.value.filter(r => r.id !== id)
}

const handleAddPet = () => {
  selectedPet.value = null
  showFormDialog.value = true
}

const handleViewPet = pet => {
  router.push(`/pet-owner/pets/${pet.id}`)
}

const handleOpenMedical = pet => {
  selectedPet.value = pet
  showMedicalDialog.value = true
}

const handleEditPet = pet => {
  selectedPet.value = pet
  showFormDialog.value = true
}

const handleManageBooking = booking => {
  selectedBooking.value = booking
  showManageDialog.value = true
}

const handleBookingAction = message => {
  showMessage(message)
  fetchBookings()
}

const handleDeletePet = pet => {
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

const handleFormSaved = (message = 'Success! ✨') => {
  showFormDialog.value = false
  showMedicalDialog.value = false
  selectedPet.value = null
  showMessage(message)
  fetchPets()
}

onMounted(() => {
  fetchPets()
  fetchBookings()
})
</script>

<template>
  <div class="dashboard-root d-flex">
    <!-- Side Navigation -->
    <PetOwnerSidebar class="d-none d-lg-flex" />

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content-layer">
      <!-- Global Navbar -->
      <Navbar hide-brand />

      <!-- Feedback Notifications -->
      <VSnackbar
        v-model="snackbar"
        :color="snackbarColor"
        location="top end"
        :timeout="4000"
      >
        {{ snackbarMessage }}
        <template #actions>
          <VBtn
            variant="text"
            size="small"
            @click="snackbar = false"
          >
            Dismiss
          </VBtn>
        </template>
      </VSnackbar>

      <!-- Delete Confirmation Dialog -->
      <VDialog
        v-model="showDeleteConfirm"
        max-width="420"
        persistent
      >
        <VCard class="rounded-3xl pa-8 text-center">
          <div class="delete-icon-bg mb-6 mx-auto">
            <VIcon
              icon="tabler-alert-triangle"
              color="error"
              size="36"
            />
          </div>
          <h3 class="text-h4 font-weight-black mb-2">
            Remove {{ petToDelete?.name }}?
          </h3>
          <p class="text-body-1 text-slate-500 mb-8 px-4">
            This action is permanent and cannot be undone.
          </p>
          <div class="d-flex gap-4">
            <VBtn
              variant="tonal"
              color="slate"
              size="large"
              class="rounded-2xl flex-grow-1"
              :disabled="deleteLoading"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </VBtn>
            <VBtn
              color="error"
              size="large"
              class="rounded-2xl flex-grow-1"
              :loading="deleteLoading"
              @click="confirmDeletePet"
            >
              Yes, Remove
            </VBtn>
          </div>
        </VCard>
      </VDialog>

      <!-- HERO BANNER -->
      <div class="dashboard-hero">
        <VContainer>
          <VRow align="center">
            <VCol
              cols="12"
              md="7"
            >
              <div class="d-flex align-center gap-3 mb-4">
                <div class="greeting-icon">
                  <VIcon
                    icon="tabler-sparkles"
                    size="22"
                    color="white"
                  />
                </div>
                <span class="text-caption font-weight-black text-primary uppercase tracking-widest">Dashboard</span>
              </div>
              <h1 class="hero-headline mb-3">
                Welcome back, {{ userName }}! 🐾
              </h1>
              <p class="text-h6 text-slate-500 font-weight-medium mb-10">
                Your pets and bookings are all set. Explore what's new.
              </p>
              <div class="d-flex flex-wrap gap-4">
                <VBtn
                  color="primary"
                  height="54"
                  class="px-10 font-weight-black rounded-2xl"
                  prepend-icon="tabler-calendar-plus"
                  @click="router.push('/pet-owner/book')"
                >
                  Book a Service
                </VBtn>
                <VBtn
                  variant="tonal"
                  color="primary"
                  height="54"
                  class="px-8 font-weight-bold rounded-2xl"
                  prepend-icon="tabler-stethoscope"
                  @click="router.push('/pet-owner/book')"
                >
                  Find a Vet
                </VBtn>
              </div>
            </VCol>
            <!-- Stats Cards on the right -->
            <VCol
              cols="12"
              md="5"
              class="d-none d-md-block"
            >
              <div class="d-flex flex-column gap-4">
                <div class="hero-stat-card">
                  <div class="stat-icon-box primary">
                    <VIcon
                      icon="tabler-paw"
                      size="22"
                      color="white"
                    />
                  </div>
                  <div>
                    <div class="stat-card-num">
                      {{ pets.length }}
                    </div>
                    <div class="stat-card-label">
                      Registered Pets
                    </div>
                  </div>
                </div>
                <div class="hero-stat-card">
                  <div class="stat-icon-box success">
                    <VIcon
                      icon="tabler-calendar-check"
                      size="22"
                      color="white"
                    />
                  </div>
                  <div>
                    <div class="stat-card-num">
                      {{ upcomingBookings.length }}
                    </div>
                    <div class="stat-card-label">
                      Active Bookings
                    </div>
                  </div>
                </div>
                <div class="hero-stat-card">
                  <div class="stat-icon-box warning">
                    <VIcon
                      icon="tabler-bell"
                      size="22"
                      color="white"
                    />
                  </div>
                  <div>
                    <div class="stat-card-num">
                      {{ reminders.length }}
                    </div>
                    <div class="stat-card-label">
                      Reminders
                    </div>
                  </div>
                </div>
              </div>
            </VCol>
          </VRow>
        </VContainer>
      </div>

      <div class="dashboard-wrapper">
        <VContainer>
          <!-- MY PETS SECTION: LUXURY FAMILY GALLERY -->
          <section class="section-spacer mb-20 relative overflow-hidden">
            <!-- Background Halo -->
            <div class="family-halo" />

            <div class="family-section-header mb-10">
              <div class="family-header-left">
                <div class="d-flex align-center gap-3 mb-2">
                  <div class="family-section-icon">
                    <VIcon
                      icon="tabler-heart"
                      size="20"
                      color="white"
                    />
                  </div>
                  <div
                    class="text-caption font-weight-black text-primary uppercase"
                    style="letter-spacing: 1.5px"
                  >
                    My Family
                  </div>
                </div>
                <h2 class="family-section-title">
                  Your Beloved Companions
                </h2>
                <p class="family-section-sub">
                  Manage health, records & appointments for each pet.
                </p>
              </div>
              <div class="d-flex align-center gap-3">
                <div class="pet-count-badge">
                  <span class="pet-count-num">{{ pets.length }}</span>
                  <span class="pet-count-label">Pets</span>
                </div>
                <VBtn
                  color="primary"
                  class="rounded-2xl font-weight-black px-6"
                  height="48"
                  prepend-icon="tabler-plus"
                  @click="handleAddPet"
                >
                  Add Pet
                </VBtn>
              </div>
            </div>

            <div
              v-if="loading"
              class="d-flex py-20 justify-center"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="64"
                width="6"
              />
            </div>

            <PetEmptyState
              v-else-if="pets.length === 0"
              @add="handleAddPet"
            />

            <!-- Luxury Scroll Experience -->
            <div
              v-else
              class="luxury-scroll-wrapper"
            >
              <!-- Scroll Fade Mask -->
              <div class="scroll-edge-fade left" />
              <div class="scroll-edge-fade right" />

              <div class="d-flex pb-12 pt-4 px-4 overflow-x-auto hide-scrollbar horizontal-scroll-luxury">
                <PetCardPremium
                  v-for="(pet, index) in pets"
                  :key="pet.id"
                  :pet="pet"
                  :class="`luxury-stagger delay-${(index % 5) + 1}`"
                  @view="handleViewPet"
                  @medical="handleOpenMedical"
                  @edit="handleEditPet"
                  @delete="handleDeletePet"
                />
              
                <!-- Luxury Add Card Explorer -->
                <div 
                  class="luxury-add-explorer d-flex align-center justify-center cursor-pointer luxury-stagger delay-5"
                  @click="handleAddPet"
                >
                  <div class="text-center content-animate">
                    <div class="explorer-icon-glow mb-4">
                      <VIcon
                        icon="tabler-plus"
                        size="32"
                        color="primary"
                      />
                    </div>
                    <div class="text-h6 font-weight-black text-slate-700">
                      Add Another
                    </div>
                    <div class="text-caption font-weight-bold text-slate-400 opacity-80">
                      Expand your family
                    </div>
                  </div>
                
                  <div class="dashed-border" />
                </div>
              </div>
            </div>
          </section>

          <VRow class="section-spacer mb-16">
            <!-- LEFT COLUMN: BOOKINGS -->
            <VCol
              cols="12"
              md="7"
            >
              <div class="d-flex align-center justify-space-between mb-6">
                <h2 class="text-h4 font-weight-bold text-slate-800">
                  My Bookings
                </h2>
              
                <VTabs
                  v-model="bookingTab"
                  color="primary"
                  density="compact"
                  class="booking-tabs"
                >
                  <VTab
                    value="upcoming"
                    class="px-4"
                  >
                    Upcoming
                  </VTab>
                  <VTab
                    value="history"
                    class="px-4"
                  >
                    History
                  </VTab>
                </VTabs>
              </div>
            
              <VWindow v-model="bookingTab">
                <!-- Upcoming Bookings Window -->
                <VWindowItem value="upcoming">
                  <div
                    v-if="upcomingBookings.length === 0"
                    class="pa-12 text-center bg-slate-50 rounded-xl border-dashed border-2 animate-fade-in"
                  >
                    <VIcon
                      icon="tabler-calendar-heart"
                      size="64"
                      color="primary"
                      class="mb-4 opacity-20"
                    />
                    <h3 class="text-h6 font-weight-bold text-slate-700 mb-1">
                      No Upcoming Appointments
                    </h3>
                    <p class="text-slate-500 mb-6">
                      Ready for your pet's next adventure? Book a professional care session today.
                    </p>
                    <VBtn
                      color="primary"
                      variant="tonal"
                      rounded="lg"
                      prepend-icon="tabler-plus"
                      @click="router.push('/pet-owner/book')"
                    >
                      Book Now
                    </VBtn>
                  </div>
                
                  <div
                    v-else
                    class="animate-fade-in"
                  >
                    <BookingCardPremium
                      v-for="booking in upcomingBookings"
                      :key="booking.id"
                      :booking="booking"
                      @manage="handleManageBooking"
                    />
                  </div>
                </VWindowItem>

                <!-- Booking History Window -->
                <VWindowItem value="history">
                  <div
                    v-if="pastBookings.length === 0"
                    class="pa-12 text-center bg-slate-50 rounded-xl border-dashed border-2 animate-fade-in"
                  >
                    <VIcon
                      icon="tabler-history"
                      size="64"
                      color="slate-300"
                      class="mb-4 opacity-20"
                    />
                    <h3 class="text-h6 font-weight-bold text-slate-700 mb-1">
                      No Booking History
                    </h3>
                    <p class="text-slate-500 mb-0">
                      Completed care sessions will appear here as your history built up.
                    </p>
                  </div>
                
                  <div
                    v-else
                    class="animate-fade-in"
                  >
                    <BookingCardPremium
                      v-for="booking in pastBookings"
                      :key="booking.id"
                      :booking="booking"
                      @manage="handleManageBooking"
                    />
                  </div>
                </VWindowItem>
              </VWindow>
            </VCol>

            <!-- RIGHT COLUMN: REMINDERS & ACTIONS -->
            <VCol
              cols="12"
              md="5"
            >
              <div class="mb-12">
                <h2 class="text-h5 font-weight-bold text-slate-800 mb-6">
                  Reminders
                </h2>
                <ReminderCard
                  v-for="reminder in reminders"
                  :key="reminder.id"
                  v-bind="reminder"
                  @dismiss="handleDismissReminder(reminder.id)"
                />
              </div>

              <div>
                <h2 class="text-h5 font-weight-bold text-slate-800 mb-6">
                  Quick Actions
                </h2>
                <VRow dense>
                  <VCol cols="6">
                    <QuickActionCard
                      icon="tabler-stethoscope"
                      label="Book Vet"
                      color="blue"
                    />
                  </VCol>
                  <VCol cols="6">
                    <QuickActionCard
                      icon="tabler-scissors"
                      label="Grooming"
                      color="orange"
                    />
                  </VCol>
                  <VCol cols="6">
                    <QuickActionCard
                      icon="tabler-file-analytics"
                      label="Records"
                      color="success"
                    />
                  </VCol>
                  <VCol cols="6">
                    <QuickActionCard
                      icon="tabler-settings"
                      label="Settings"
                      color="slate"
                    />
                  </VCol>
                </VRow>
              </div>
            </VCol>
          </VRow>
        </VContainer>

        <!-- Form Dialog -->
        <PetFormDialog
          v-model="showFormDialog"
          :pet="selectedPet"
          @saved="handleFormSaved"
          @close="showFormDialog = false"
        />

        <!-- Medical Dialog -->
        <PetMedicalDialog
          v-model="showMedicalDialog"
          :pet="selectedPet"
          @saved="handleFormSaved"
          @close="showMedicalDialog = false"
        />

        <!-- Manage Booking Dialog -->
        <ManageBookingDialog
          v-model="showManageDialog"
          :booking="selectedBooking"
          @saved="handleBookingAction"
          @cancelled="handleBookingAction"
        />
      </div>
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

.dashboard-hero {
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 45%, #fdf2f8 100%);
  padding: 56px 0 64px;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;
}

.dashboard-hero::before {
  content: '';
  position: absolute;
  top: -100px; right: -100px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%);
  border-radius: 50%;
}

.hero-headline {
  font-size: 52px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2.5px;
  line-height: 1;
}

.greeting-icon {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}

/* Hero stat cards */
.hero-stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 20px 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
}

.hero-stat-card:hover {
  transform: translateX(4px);
  border-color: #c7d2fe;
}

.stat-icon-box {
  width: 46px; height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-box.primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-icon-box.success { background: linear-gradient(135deg, #10b981, #34d399); }
.stat-icon-box.warning { background: linear-gradient(135deg, #f59e0b, #fbbf24); }

.stat-card-num {
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  letter-spacing: -1px;
}

.stat-card-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
  margin-top: 2px;
}

/* LUXURY DASHBOARD CSS */
.dashboard-wrapper {
  background-color: #f8fafc;
  min-height: 60vh;
  padding-bottom: 80px;
}

/* Family Section Header */
.family-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0 4px;
}

.family-header-left { flex: 1; }

.family-section-icon {
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25);
}

.family-section-title {
  font-size: 36px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1.5px;
  line-height: 1.1;
  margin: 0 0 4px;
}

.family-section-sub {
  font-size: 15px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
}

.pet-count-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 18px;
  min-width: 64px;
}

.pet-count-num {
  font-size: 24px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

.pet-count-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Family Gallery Luxury Styling */
.family-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 400px;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.03) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.luxury-icon-box {
  width: 54px;
  height: 54px;
  background: white;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.03);
}

.luxury-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(var(--v-theme-primary), 0.2) !important;
}

/* Luxury Scroll Experience */
.luxury-scroll-wrapper {
  position: relative;
  margin: 0 -16px;
}

.scroll-edge-fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100px;
  z-index: 2;
  pointer-events: none;
}

.scroll-edge-fade.left {
  left: 0;
  background: linear-gradient(to right, #fafbfc 0%, transparent 100%);
}

.scroll-edge-fade.right {
  right: 0;
  background: linear-gradient(to left, #fafbfc 0%, transparent 100%);
}

.horizontal-scroll-luxury {
  gap: 20px;
  scroll-behavior: smooth;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}

/* Luxury Add Explorer Card */
.luxury-add-explorer {
  min-width: 280px;
  width: 280px;
  height: 400px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 40px;
  position: relative;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(255,255,255,0.6);
  margin-right: 40px;
}

.luxury-add-explorer .dashed-border {
  position: absolute;
  inset: 12px;
  border: 2px dashed rgba(var(--v-theme-primary), 0.15);
  border-radius: 32px;
  pointer-events: none;
}

.explorer-icon-glow {
  width: 72px;
  height: 72px;
  background: white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 15px 30px rgba(var(--v-theme-primary), 0.1);
  transition: all 0.4s ease;
}

.luxury-add-explorer:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 40px 80px -20px rgba(0,0,0,0.1) !important;
}

.luxury-add-explorer:hover .explorer-icon-glow {
  transform: rotate(90deg);
  background: var(--v-theme-primary);
}

.luxury-add-explorer:hover .explorer-icon-glow .v-icon {
  color: white !important;
}

/* Luxury Stagger Animations */
.luxury-stagger {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
  animation: luxuryStagger 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes luxuryStagger {
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }

.section-spacer {
  margin-top: 100px !important;
}

/* Global Luxury Tokens */
.shadow-primary-lg {
  box-shadow: 0 15px 35px rgba(var(--v-theme-primary), 0.2) !important;
}

.glass-card {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 30px 60px rgba(0,0,0,0.1) !important;
}

.booking-tabs {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border-radius: 12px;
  padding: 4px;
}

:deep(.booking-tabs .v-btn) {
  border-radius: 8px !important;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.border-dashed {
  border-style: dashed !important;
}
</style>
