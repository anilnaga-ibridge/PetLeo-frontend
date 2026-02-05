<script setup>
import { computed } from 'vue'

const props = defineProps({
  queue: {
    type: Array,
    default: () => [],
  },
})

const headers = [
  { title: 'Pet Name', key: 'pet_name' },
  { title: 'Status', key: 'status' },
  { title: 'Since', key: 'time' },
  { title: 'Handled By', key: 'handled_by' },
]

const getStatusColor = (status) => {
  const map = {
    CHECKED_IN: 'warning',
    VITALS_RECORDED: 'info',
    DOCTOR_ASSIGNED: 'primary',
    LAB_REQUESTED: 'purple',
    LAB_COMPLETED: 'indigo',
    PRESCRIPTION_FINALIZED: 'success',
    MEDICINES_DISPENSED: 'success',
  }
  return map[status] || 'secondary'
}
</script>

<template>
  <VCard class="border" elevation="0">
    <VCardItem>
      <VCardTitle>Live Activity Queue</VCardTitle>
      <VCardSubtitle>Real-time patient flow monitoring</VCardSubtitle>
    </VCardItem>

    <VDataTable
      :headers="headers"
      :items="props.queue"
      :items-per-page="5"
      density="compact"
      class="text-no-wrap"
    >
      <template #item.status="{ item }">
        <VChip
          :color="getStatusColor(item.status)"
          size="small"
          label
        >
          {{ item.status }}
        </VChip>
      </template>

      <template #bottom>
        <!-- Hide pagination for compact view -->
      </template>
    </VDataTable>
  </VCard>
</template>
