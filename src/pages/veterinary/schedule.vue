<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref } from 'vue'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout

const selectedDate = ref(new Date())

const appointments = ref([
  { id: 1, time: '09:00 AM', patient: 'Max (Dog)', owner: 'John Doe', type: 'Vaccination', status: 'Confirmed' },
  { id: 2, time: '10:30 AM', patient: 'Bella (Cat)', owner: 'Jane Smith', type: 'Checkup', status: 'Pending' },
  { id: 3, time: '02:00 PM', patient: 'Charlie (Parrot)', owner: 'Bob Brown', type: 'Consultation', status: 'Confirmed' },
])
</script>

<template>
  <component :is="currentLayout">
    <div class="schedule-page">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">Schedule</h1>
          <p class="text-body-1 text-medium-emphasis">Manage your appointments.</p>
        </div>
        <VBtn color="primary" prepend-icon="tabler-plus" to="/veterinary/visits/new">New Appointment</VBtn>
      </div>

      <VRow>
        <VCol cols="12" md="4">
          <VCard class="mb-6">
            <VDatePicker v-model="selectedDate" class="w-100" />
          </VCard>
        </VCol>

        <VCol cols="12" md="8">
          <VCard title="Appointments" class="h-100">
            <VCardText>
              <div v-if="appointments.length === 0" class="text-center py-8 text-medium-emphasis">
                No appointments for this date.
              </div>
              <VTimeline v-else side="end" align="start" truncate-line="both" density="compact" class="v-timeline-density-compact">
                <VTimelineItem v-for="apt in appointments" :key="apt.id" dot-color="primary" size="x-small">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-h6 font-weight-bold">{{ apt.time }} - {{ apt.patient }}</div>
                      <div class="text-body-2">{{ apt.type }} with {{ apt.owner }}</div>
                    </div>
                    <VChip size="small" :color="apt.status === 'Confirmed' ? 'success' : 'warning'">{{ apt.status }}</VChip>
                  </div>
                </VTimelineItem>
              </VTimeline>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
