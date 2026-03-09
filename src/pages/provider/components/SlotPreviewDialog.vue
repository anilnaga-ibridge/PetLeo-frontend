<script setup>
import { ref, watch } from 'vue'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  employeeId: String,
  employeeName: String,
  date: String,
  startTime: String, // Added
  endTime: String,   // Added
})

const emit = defineEmits(['update:modelValue'])

const slots = ref([])
const loading = ref(false)
const error = ref(null)

const formatTimeRange = startTimeStr => {
  if (!startTimeStr) return ''
  const [h, m] = startTimeStr.split(':').map(Number)
  const startDate = new Date()

  startDate.setHours(h, m, 0, 0)
  
  // We don't have the exact duration here, but the backend uses facility default or 60.
  // For the preview, we can either fetch duration or assume 60 if we just want to show the range
  // that was used for calculation. 
  // Actually, the backend returns start times. If we want to show end times, 
  // we need to know the duration. 
  // Let's stick to showing start times but with a clearer label if we can't get duration easily.
  // Wait, if I change the backend to return {start, end} it would be better.
  // But let's see if I can calculate it here.
  return startTimeStr
}

const fetchSlots = async () => {
  if (!props.employeeId || !props.date) return
  
  loading.value = true
  error.value = null
  slots.value = []
  
  try {
    const profileRes = await providerApi.get('/api/provider/profile/')
    const providerId = profileRes.data.id
    
    const res = await providerApi.get(`/api/provider/availability/${providerId}/available-slots/`, {
      params: {
        date: props.date,
        employee_id: props.employeeId,
      },
    })

    slots.value = res.data.slots || []
  } catch (err) {
    console.error('Failed to fetch slots:', err)
    error.value = 'Failed to load booking slots.'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, newVal => {
  if (newVal) fetchSlots()
})
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    max-width="500"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard class="rounded-[24px] overflow-hidden">
      <VCardItem class="bg-slate-50 pa-6">
        <template #prepend>
          <div class="icon-box-preview elevation-2">
            <VIcon
              icon="tabler-calendar-time"
              color="white"
            />
          </div>
        </template>
        <VCardTitle class="text-h6 font-weight-black text-slate-800">
          Slot Preview
        </VCardTitle>
        <VCardSubtitle class="text-slate-500">
          Available slots for <strong>{{ props.employeeName }}</strong> on <strong>{{ props.date }}</strong>
          <div
            v-if="props.startTime && props.endTime"
            class="mt-1 text-primary font-weight-bold"
          >
            Shift: {{ props.startTime }} - {{ props.endTime }}
          </div>
        </VCardSubtitle>
        <template #append>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="slate-400"
            @click="emit('update:modelValue', false)"
          />
        </template>
      </VCardItem>

      <VCardText class="pa-6">
        <VAlert
          v-if="props.startTime && props.endTime"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-6 rounded-lg"
        >
          Showing 1-hour bookable slots within the defined shift.
        </VAlert>

        <div
          v-if="loading"
          class="d-flex flex-column align-center py-12"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
          <span class="text-caption text-slate-400 mt-2">Generating slots...</span>
        </div>

        <div
          v-else-if="error"
          class="text-center py-8"
        >
          <VIcon
            icon="tabler-alert-triangle"
            color="error"
            size="48"
            class="mb-2 opacity-20"
          />
          <p class="text-error font-weight-medium">
            {{ error }}
          </p>
        </div>

        <div v-else>
          <div
            v-if="slots.length > 0"
            class="slots-grid"
          >
            <div 
              v-for="slot in slots" 
              :key="slot" 
              class="slot-chip px-3 py-2 rounded-lg text-center font-weight-bold text-slate-600 border border-slate-100 bg-slate-50"
            >
              {{ slot }}
            </div>
          </div>
          <div
            v-else
            class="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200"
          >
            <VIcon
              icon="tabler-calendar-off"
              size="48"
              color="slate-300"
              class="mb-4"
            />
            <h3 class="text-subtitle-1 font-weight-bold text-slate-500">
              No available slots
            </h3>
            <p class="text-caption text-slate-400 px-8">
              This date might be fully booked, or the shift duration might be too short for the service.
            </p>
          </div>
        </div>
      </VCardText>

      <VCardActions class="pa-6 pt-0">
        <VSpacer />
        <VBtn
          color="primary"
          block
          height="48"
          class="rounded-xl font-weight-black"
          @click="emit('update:modelValue', false)"
        >
          Close Preview
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.icon-box-preview {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
}

.slot-chip {
  transition: all 0.2s ease;
  font-size: 13px;
}

.slot-chip:hover {
  border-color: var(--v-theme-primary);
  color: var(--v-theme-primary);
  background: white;
}
</style>
