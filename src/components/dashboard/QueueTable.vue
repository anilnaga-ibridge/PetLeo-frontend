<script setup>
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const props = defineProps({
  scope: {
    type: String,
    default: 'CLINIC', // 'CLINIC' or 'PERSONAL'
  },
  currentDoctor: {
    type: String,
    default: '',
  },
})

const veterinaryStore = useVeterinaryStore()
const rawQueue = ref([])
const isLoading = ref(false)

const fetchQueueData = async () => {
  const clinicId = veterinaryStore.activeClinicId
  if (!clinicId) return

  isLoading.value = true
  try {
    const data = await veterinaryStore.fetchQueue('WAITING_ROOM', clinicId)
    // data.results or data if it's already an array
    rawQueue.value = data.results || data || []
  } catch (e) {
    console.error('Failed to fetch queue:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchQueueData)

const headers = computed(() => {
  const baseHeaders = [
    { title: 'TOKEN', key: 'id', align: 'start', sortable: true },
    { title: 'PATIENT', key: 'pet', sortable: true },
    { title: 'OWNER', key: 'owner', sortable: true },
  ]

  if (props.scope === 'CLINIC') {
    baseHeaders.push({ title: 'DOCTOR', key: 'doctor', sortable: true })
  }

  baseHeaders.push(
    { title: 'SERVICE', key: 'service', sortable: false },
    { title: 'STATUS', key: 'status', align: 'center', sortable: true },
    { title: 'ACTION', key: 'actions', align: 'center', sortable: false },
  )

  return baseHeaders
})

const allQueue = computed(() => {
  return rawQueue.value.map(visit => ({
    id: visit.token || `T-${visit.id}`,
    pet: visit.pet_name || (visit.pet?.name) || 'Unknown Pet',
    owner: visit.owner_name || (visit.pet?.owner?.full_name) || 'Unknown Owner',
    doctor: visit.doctor_name || (visit.doctor?.full_name) || 'Waiting Assignment',
    service: visit.reason || 'General Visit',
    status: visit.status, // KEEP RAW STATUS FOR MAPPING
  }))
})

const filteredQueue = computed(() => {
  if (props.scope === 'PERSONAL' && props.currentDoctor) {
    return allQueue.value.filter(item => 
      item.doctor.toLowerCase().includes(props.currentDoctor.toLowerCase()),
    )
  }
  
  return allQueue.value
})


const statusColor = {
  'WAITING': 'warning',
  'IN_PROGRESS': 'info',
  'COMPLETED': 'success',
  'CHECKED_IN': 'primary',
  'CANCELLED': 'error',
}

const statusText = {
  'WAITING': 'Waiting',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'CHECKED_IN': 'Checked In',
  'CANCELLED': 'Cancelled',
}
</script>

<template>
  <VCard
    elevation="0"
    border
    class="rounded-xl h-100 queue-card"
  >
    <VCardItem class="border-b bg-surface-variant-lighten-1">
      <VCardTitle class="text-h6 font-weight-bold d-flex justify-space-between align-center">
        Today's Queue
        <VBtn
          variant="text"
          color="primary"
          size="small"
          class="font-weight-bold"
        >
          View Full Queue
        </VBtn>
      </VCardTitle>
    </VCardItem>

    <VDataTable
      :headers="headers"
      :items="filteredQueue"
      :items-per-page="5"
      class="text-body-2"
      hide-default-footer
    >
      <!-- Token -->
      <template #item.id="{ item }">
        <span class="font-weight-bold text-high-emphasis">{{ item.id }}</span>
      </template>

      <!-- Patient -->
      <template #item.pet="{ item }">
        <span class="font-weight-medium text-high-emphasis">{{ item.pet }}</span>
      </template>

      <!-- Status -->
      <template #item.status="{ item }">
        <VChip
          :color="statusColor[item.status] || 'secondary'"
          :variant="item.status === 'IN_PROGRESS' ? 'elevated' : 'tonal'"
          size="small"
          class="font-weight-bold"
        >
          {{ statusText[item.status] || item.status }}
        </VChip>
      </template>

      <!-- Actions -->
      <template #item.actions>
        <VBtn
          icon
          variant="text"
          size="small"
          color="medium-emphasis"
        >
          <VIcon icon="tabler-dots" />
        </VBtn>
      </template>
    </VDataTable>
  </VCard>
</template>

<style scoped>
.queue-card {
  transition: all 0.3s ease;
}

.queue-card:hover {
  box-shadow: 0 4px 18px -4px rgba(0, 0, 0, 0.08) !important;
}

:deep(.v-data-table-header__content) {
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
}

:deep(.v-data-table tbody tr.v-data-table__tr:hover) {
  background-color: rgba(var(--v-theme-on-surface), 0.02) !important;
}
</style>
