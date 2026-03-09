<script setup>
import { computed, ref, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { usePermissionStore } from '@/stores/permissionStore'
import { useCookie } from '@/@core/composable/useCookie'

const vetStore = useVeterinaryStore()
const permStore = usePermissionStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || vetStore.activeClinicId)

const appointments = ref([])
const loading = ref(false)

const statusConfig = {
  SCHEDULED: { color: 'primary', label: 'Scheduled', icon: 'tabler-calendar' },
  WAITING: { color: 'warning', label: 'Waiting', icon: 'tabler-clock' },
  ENGAGED: { color: 'secondary', label: 'Engaged', icon: 'tabler-stethoscope' },
  COMPLETED: { color: 'success', label: 'Done', icon: 'tabler-check' },
  CONFIRMED: { color: 'info', label: 'Confirmed', icon: 'tabler-thumb-up' },
}

const getStatusCfg = status => statusConfig[status?.toUpperCase()] || statusConfig.SCHEDULED

const fetchTodaySchedule = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    const today = new Date().toISOString().split('T')[0]

    const res = await vetStore.fetchMedicalAppointments({
      clinic: activeClinicId.value,
      date_from: today,
      date_to: today,
    })

    appointments.value = (res || []).map(a => ({
      id: a.id,
      time: a.start_time?.substring(11, 16) || a.time?.substring(0, 5) || '09:00',
      pet: a.pet_name || 'Unknown Pet',
      owner: a.owner_name || 'N/A',
      doctor: a.doctor_name || 'Unassigned',
      status: a.status || 'SCHEDULED',
      pet_id: a.pet_code || '',
    })).sort((a, b) => a.time.localeCompare(b.time))
  } catch (err) {
    console.error('Failed to fetch today schedule:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTodaySchedule()
})

const canViewSchedule = computed(() => permStore.hasPermission('VETERINARY_SCHEDULE'))
</script>

<template>
  <VCard
    class="h-100 border overflow-hidden"
    elevation="0"
  >
    <VCardItem class="pb-2">
      <template #title>
        <div class="d-flex align-center">
          <VIcon
            icon="tabler-calendar-event"
            class="me-2 text-primary"
            size="24"
          />
          <span class="text-h5 font-weight-bold">Daily Schedule</span>
        </div>
      </template>
      <template #append>
        <VBtn
          variant="tonal"
          size="small"
          color="primary"
          :to="{ name: 'veterinary-schedule' }"
          prepend-icon="tabler-external-link"
        >
          Full Calendar
        </VBtn>
      </template>
    </VCardItem>

    <VDivider />

    <VCardText
      class="pa-0 position-relative"
      style="min-height: 350px;"
    >
      <div
        v-if="loading"
        class="d-flex justify-center align-center h-100"
        style="min-height: 350px;"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="!activeClinicId"
        class="text-center py-12 px-6"
      >
        <VIcon
          icon="tabler-building-hospital"
          size="48"
          color="medium-emphasis"
          class="mb-2 opacity-50"
        />
        <p class="text-medium-emphasis">
          Select a clinic to view the schedule.
        </p>
      </div>

      <div
        v-else-if="appointments.length === 0"
        class="text-center py-12 px-6"
      >
        <VIcon
          icon="tabler-calendar-off"
          size="48"
          color="medium-emphasis"
          class="mb-2 opacity-50"
        />
        <p class="text-medium-emphasis">
          No appointments scheduled for today.
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          size="small"
          class="mt-4"
          prepend-icon="tabler-plus"
          :to="{ name: 'veterinary-schedule' }"
        >
          Book Appointment
        </VBtn>
      </div>

      <VList
        v-else
        class="py-0 schedule-list"
      >
        <VListItem
          v-for="apt in appointments"
          :key="apt.id"
          class="px-4 py-3 border-b"
        >
          <template #prepend>
            <div
              class="d-flex flex-column align-center me-4"
              style="width: 50px;"
            >
              <span class="text-h6 font-weight-bold text-high-emphasis">{{ apt.time }}</span>
              <span
                class="text-caption text-uppercase font-weight-bold"
                :class="`text-${getStatusCfg(apt.status).color}`"
              >
                {{ apt.status?.charAt(0) }}
              </span>
            </div>
          </template>

          <VListItemTitle class="font-weight-bold text-h6 mb-1">
            {{ apt.pet }}
            <span
              v-if="apt.pet_id"
              class="text-caption text-medium-emphasis ms-1"
            >({{ apt.pet_id }})</span>
          </VListItemTitle>
          <VListItemSubtitle class="text-body-2">
            <VIcon
              icon="tabler-user"
              size="14"
              class="me-1"
            />
            {{ apt.owner }}
            <span class="mx-2">•</span>
            <VIcon
              icon="tabler-stethoscope"
              size="14"
              class="me-1"
            />
            Dr. {{ apt.doctor }}
          </VListItemSubtitle>

          <template #append>
            <VChip
              size="x-small"
              :color="getStatusCfg(apt.status).color"
              variant="tonal"
              label
              class="font-weight-bold"
            >
              {{ getStatusCfg(apt.status).label }}
            </VChip>
          </template>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<style scoped>
.schedule-list :deep(.v-list-item__prepend) {
  align-self: center;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.border-b:last-child {
  border-bottom: none;
}
</style>
