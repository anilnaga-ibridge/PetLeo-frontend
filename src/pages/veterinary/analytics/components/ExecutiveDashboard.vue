<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const metricsConfig = [
  { key: 'total_visits', label: 'Total Visits', icon: 'tabler-users', color: 'primary' },
  { key: 'vitals_done', label: 'Vitals Done', icon: 'tabler-activity', color: 'info' },
  { key: 'doctor_consultations', label: 'Doctor Consultations', icon: 'tabler-stethoscope', color: 'success' },
  { key: 'lab_tests', label: 'Lab Tests', icon: 'tabler-microscope', color: 'warning' },
  { key: 'pharmacy_sales', label: 'Pharmacy Sales', icon: 'tabler-receipt', color: 'error' },
]

const getTrendIcon = trend => {
  if (trend > 0) return 'tabler-arrow-up'
  if (trend < 0) return 'tabler-arrow-down'
  
  return 'tabler-minus'
}

const getTrendColor = trend => {
  if (trend > 0) return 'success'
  if (trend < 0) return 'error'
  
  return 'secondary'
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VAlert
        color="primary"
        variant="tonal"
        icon="tabler-chart-bar"
        class="mb-4"
      >
        Today's Snapshot
      </VAlert>
    </VCol>

    <VCol
      v-for="metric in metricsConfig"
      :key="metric.key"
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard>
        <VCardText class="d-flex justify-space-between align-center">
          <div>
            <span class="text-caption">{{ metric.label }}</span>
            <h4 class="text-h4 font-weight-bold my-1">
              {{ props.data[metric.key]?.today || 0 }}
            </h4>
            <div class="d-flex align-center gap-2">
              <VChip
                label
                size="x-small"
                :color="getTrendColor(props.data[metric.key]?.trend)"
              >
                <VIcon
                  :icon="getTrendIcon(props.data[metric.key]?.trend)"
                  start
                  size="12"
                />
                {{ Math.abs(props.data[metric.key]?.trend || 0) }}%
              </VChip>
              <span class="text-caption text-medium-emphasis">vs yesterday ({{ props.data[metric.key]?.yesterday || 0 }})</span>
            </div>
          </div>
            
          <VAvatar
            variant="tonal"
            :color="metric.color"
            rounded
            size="42"
          >
            <VIcon
              :icon="metric.icon"
              size="26"
            />
          </VAvatar>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
