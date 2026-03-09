<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({}),
  },
})

// Map reference image cards (Department, Doctor, Patient, Patient Appointment, etc.)
// to relevant vet clinic mappings with similar colors.
const metrics = computed(() => {
  const data = props.stats || {}
  
  return [
    { title: 'Appointments', value: data.appointments || 8, icon: 'tabler-calendar-event', color: 'primary' },
    { title: 'Patients Seen', value: data.patients_seen || 14, icon: 'tabler-user-check', color: 'success' },
    { title: 'Pending Patients', value: data.pending_patients || 1, icon: 'tabler-clock', color: 'info' },
    { title: 'Total Visits', value: data.total_visits || 3, icon: 'tabler-users', color: 'warning' },
    
    { title: 'Labs Ordered', value: data.lab_tests_ordered || 0, icon: 'tabler-flask', color: 'warning' },
    { title: 'Invoices', value: data.invoices || 0, icon: 'tabler-receipt', color: 'primary' },
    { title: 'Prescriptions', value: data.prescriptions_written || 0, icon: 'tabler-pill', color: 'success' },
    { title: 'Payments', value: data.payments || 0, icon: 'tabler-businessplan', color: 'info' },
  ]
})
</script>

<template>
  <VRow>
    <VCol
      v-for="(metric, i) in metrics"
      :key="i"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        class="h-100"
        elevation="1"
      >
        <VCardText class="d-flex align-center justify-space-between pb-4 pt-5">
          <div>
            <div class="text-caption text-medium-emphasis mb-1">
              {{ metric.title }}
            </div>
            <div class="text-h5 font-weight-bold text-high-emphasis">
              {{ metric.value }}
            </div>
          </div>
          <VAvatar
            :color="metric.color"
            variant="flat"
            rounded="lg"
            size="48"
          >
            <VIcon
              :icon="metric.icon"
              size="28"
              color="white"
            />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
