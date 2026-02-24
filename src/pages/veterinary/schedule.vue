<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref, onMounted, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import MedicalAppointmentDialog from '@/components/veterinary/MedicalAppointmentDialog.vue'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout
const vetStore = useVeterinaryStore()

const selectedDate = ref(new Date())
const appointments = ref([])
const loading = ref(false)
const showAppointmentDialog = ref(false)

const fetchAppointments = async () => {
  if (!vetStore.activeClinicId) return
  loading.value = true
  try {
    const dateStr = selectedDate.value.toISOString().split('T')[0]
    const res = await vetStore.fetchMedicalAppointments({
      clinic: vetStore.activeClinicId,
      appointment_date: dateStr
    })
    appointments.value = res.map(apt => ({
      id: apt.id,
      time: apt.start_time.substring(0, 5),
      patient: apt.pet_name,
      doctor: apt.doctor_name,
      type: apt.service_id,
      status: apt.status
    }))
  } catch (err) {
    console.error('Failed to fetch appointments:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
    vetStore.fetchClinics().then(fetchAppointments)
})

watch(selectedDate, fetchAppointments)
</script>

<template>
  <component :is="currentLayout">
    <div class="schedule-page">
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary">
            Schedule
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Manage your appointments.
          </p>
        </div>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="showAppointmentDialog = true"
        >
          New Appointment
        </VBtn>
      </div>

      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <VCard class="mb-6">
            <VDatePicker
              v-model="selectedDate"
              class="w-100"
            />
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="8"
        >
          <VCard
            title="Appointments"
            class="h-100"
          >
            <VCardText>
              <div v-if="loading" class="d-flex justify-center py-8">
                <VProgressCircular indeterminate color="primary" />
              </div>
              <div
                v-else-if="appointments.length === 0"
                class="text-center py-8 text-medium-emphasis"
              >
                No appointments for this date.
              </div>
              <VTimeline
                v-else
                side="end"
                align="start"
                truncate-line="both"
                density="compact"
                class="v-timeline-density-compact"
              >
                <VTimelineItem
                  v-for="apt in appointments"
                  :key="apt.id"
                  dot-color="primary"
                  size="x-small"
                >
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-h6 font-weight-bold">
                        {{ apt.time }} - {{ apt.patient }}
                      </div>
                      <div class="text-body-2">
                        {{ apt.type }} with Dr. {{ apt.doctor }}
                      </div>
                    </div>
                    <VChip
                      size="small"
                      :color="apt.status === 'Confirmed' ? 'success' : 'warning'"
                    >
                      {{ apt.status }}
                    </VChip>
                  </div>
                </VTimelineItem>
              </VTimeline>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <MedicalAppointmentDialog
      v-if="vetStore.activeClinicId"
      v-model="showAppointmentDialog"
      :clinic-id="vetStore.activeClinicId"
      @success="fetchAppointments"
    />
  </component>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>


