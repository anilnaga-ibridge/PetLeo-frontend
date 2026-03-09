<script setup>
import { ref, onMounted, computed } from 'vue'
import { customerApi } from '@/plugins/axios'
import Navbar from './book/sections/Navbar.vue'
import PetOwnerSidebar from './components/PetOwnerSidebar.vue'
import ReminderCard from './components/ReminderCard.vue'

definePage({
  meta: {
    requiresAuth: true,
    layout: 'blank',
  },
})

const pets = ref([])
const loading = ref(true)
const reminders = ref([])

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

const generateReminders = () => {
  const newReminders = []
  
  pets.value.forEach(pet => {
    // Vaccination Reminders
    if (pet.medical_profile?.next_due_date) {
      const dueDate = new Date(pet.medical_profile.next_due_date)
      const diffDays = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 30 && diffDays >= 0) {
        newReminders.push({
          id: `vax-${pet.id}`,
          title: 'Vaccination Due Soon',
          message: `${pet.name} is due for a vaccination in ${diffDays} days.`,
          type: diffDays <= 7 ? 'warning' : 'info',
          icon: 'tabler-vaccine',
          petName: pet.name,
          date: dueDate,
        })
      }
    }
    
    // Grooming Placeholder
    if (pet.species === 'DOG') {
      newReminders.push({
        id: `groom-${pet.id}`,
        title: 'Monthly Grooming',
        message: `Time for ${pet.name}'s regular grooming session.`,
        type: 'info',
        icon: 'tabler-scissors',
        petName: pet.name,
        date: new Date(),
      })
    }
  })
  
  // Sort by date or type
  reminders.value = newReminders
}

const handleDismissReminder = id => {
  reminders.value = reminders.value.filter(r => r.id !== id)
}

const urgentReminders = computed(() => reminders.value.filter(r => r.type === 'warning'))
const regularReminders = computed(() => reminders.value.filter(r => r.type === 'info'))

onMounted(fetchPets)
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
                <div class="hero-icon-box orange">
                  <VIcon
                    icon="tabler-bell-ringing"
                    size="26"
                    color="white"
                  />
                </div>
                <div class="text-caption font-weight-black text-primary uppercase tracking-widest">
                  Alerts Hub
                </div>
              </div>
              <h1 class="page-title mb-2">
                My Reminders
              </h1>
              <p class="text-body-1 text-slate-500 font-weight-medium">
                Stay updated on your pets' health schedules, grooming sessions, and important dates.
              </p>
            </div>
          </div>
        </VContainer>
      </div>

      <VContainer class="py-10">
        <div
          v-if="loading"
          class="d-flex justify-center py-20"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="64"
          />
        </div>

        <div
          v-else-if="reminders.length === 0"
          class="text-center py-20 bg-white rounded-[40px] border-2 border-dashed"
        >
          <VIcon
            icon="tabler-bell-off"
            size="64"
            color="slate-200"
            class="mb-4"
          />
          <h3 class="text-h5 font-weight-bold text-slate-700">
            All Caught Up!
          </h3>
          <p class="text-slate-500">
            You have no pending reminders for your pets.
          </p>
        </div>

        <div
          v-else
          class="reminders-content"
        >
          <!-- Urgent Section -->
          <section
            v-if="urgentReminders.length > 0"
            class="mb-12"
          >
            <div class="d-flex align-center mb-6">
              <div class="urgent-dot mr-3" />
              <h2 class="text-h5 font-weight-black text-slate-800">
                Urgent Notifications
              </h2>
            </div>
            <VRow>
              <VCol
                v-for="reminder in urgentReminders"
                :key="reminder.id"
                cols="12"
                md="6"
              >
                <ReminderCard
                  v-bind="reminder"
                  @dismiss="handleDismissReminder(reminder.id)"
                />
              </VCol>
            </VRow>
          </section>

          <!-- Regular Reminders -->
          <section>
            <div class="d-flex align-center mb-6">
              <div class="info-dot mr-3" />
              <h2 class="text-h5 font-weight-black text-slate-800">
                Upcoming Schedule
              </h2>
            </div>
            <VRow>
              <VCol
                v-for="reminder in regularReminders"
                :key="reminder.id"
                cols="12"
                md="6"
              >
                <ReminderCard
                  v-bind="reminder"
                  @dismiss="handleDismissReminder(reminder.id)"
                />
              </VCol>
            </VRow>
          </section>
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
  background: linear-gradient(135deg, #fffcf0 0%, #fff7ed 45%, #fdf2f8 100%);
  padding: 56px 0 64px;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #fed7aa;
}

.hero-icon-box {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(234, 88, 12, 0.2);
}

.page-title {
  font-size: 42px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1.5px;
}

.urgent-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}

.info-dot {
  width: 12px;
  height: 12px;
  background: #6366f1;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

:deep(.reminder-card) {
  height: 100%;
  border-radius: 28px !important;
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

:deep(.reminder-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.05) !important;
}
</style>
