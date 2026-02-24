<script setup>
import { ref, watch, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  employee: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const saving = ref(false)
const slotDuration = ref(30)
const workingHours = ref([
  { day: 0, name: 'Monday', active: true, start: '09:00', end: '18:00' },
  { day: 1, name: 'Tuesday', active: true, start: '09:00', end: '18:00' },
  { day: 2, name: 'Wednesday', active: true, start: '09:00', end: '18:00' },
  { day: 3, name: 'Thursday', active: true, start: '09:00', end: '18:00' },
  { day: 4, name: 'Friday', active: true, start: '09:00', end: '18:00' },
  { day: 5, name: 'Saturday', active: false, start: '09:00', end: '13:00' },
  { day: 6, name: 'Sunday', active: false, start: '09:00', end: '13:00' },
])

const fetchEmployeeHours = async () => {
  if (!props.employee?.id) return
  
  loading.value = true
  try {
    const res = await providerApi.get(`/api/provider/availability/employee-hours/`, {
      params: { employee_id: props.employee.id }
    })
    
    if (res.data && res.data.length > 0) {
      // Reset all to inactive first
      workingHours.value.forEach(h => {
        h.active = false
      })

      // Map existing
      res.data.forEach((item, index) => {
        const hour = workingHours.value.find(h => h.day === item.day)
        if (hour) {
          hour.active = true
          hour.start = item.start
          hour.end = item.end
        }
        
        if (index === 0 && item.slot_duration_minutes) {
          slotDuration.value = item.slot_duration_minutes
        }
      })
    }
  } catch (err) {
    console.error('Failed to fetch employee hours:', err)
  } finally {
    loading.value = false
  }
}

const saveHours = async () => {
  saving.value = true
  try {
    const payload = {
      employee_id: props.employee.id,
      availability: workingHours.value.filter(h => h.active).map(h => ({
        day_of_week: h.day,
        start_time: h.start,
        end_time: h.end,
        slot_duration_minutes: slotDuration.value
      }))
    }
    await providerApi.post('/api/provider/availability/save-employee-hours/', payload)
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Failed to save employee hours:', err)
  } finally {
    saving.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    fetchEmployeeHours()
  }
})
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    max-width="800"
    persistent
  >
    <VCard class="pa-6 rounded-[32px]">
      <VCardItem class="pb-0">
        <template #prepend>
          <VAvatar
            size="48"
            color="primary"
            variant="tonal"
            class="rounded-xl"
          >
            <VIcon icon="tabler-calendar-time" size="24" />
          </VAvatar>
        </template>
        <VCardTitle class="text-h5 font-weight-black text-slate-800">
          {{ props.employee?.fullName || 'Employee' }}'s Schedule
        </VCardTitle>
        <VCardSubtitle class="text-slate-500">
          Set individual working hours for this staff member.
        </VCardSubtitle>
        
        <template #append>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="secondary"
            @click="emit('update:modelValue', false)"
          />
        </template>
      </VCardItem>

      <VCardText class="pt-8">
        <div v-if="loading" class="d-flex flex-column align-center py-12">
          <VProgressCircular indeterminate color="primary" />
          <span class="text-caption text-slate-400 mt-2">Fetching schedule...</span>
        </div>

        <div v-else>
          <!-- Slot Duration -->
          <VRow class="mb-6">
            <VCol cols="12" md="6">
              <label class="label-tiny uppercase mb-2 d-block">Default Slot Duration</label>
              <VSelect
                v-model="slotDuration"
                :items="[
                  { title: '15 Minutes', value: 15 },
                  { title: '30 Minutes', value: 30 },
                  { title: '45 Minutes', value: 45 },
                  { title: '1 Hour', value: 60 }
                ]"
                variant="outlined"
                class="luxury-input"
                rounded="xl"
                prepend-inner-icon="tabler-hourglass"
                bg-color="slate-50"
              />
            </VCol>
          </VRow>

          <div class="hours-list rounded-xl border overflow-hidden">
            <div 
              v-for="hour in workingHours" 
              :key="hour.day" 
              class="hour-row d-flex align-center gap-4 py-3 px-6 border-b border-slate-50 transition-colors"
              :class="{ 'bg-slate-50 opacity-60': !hour.active }"
            >
              <div class="d-flex align-center gap-3" style="width: 150px">
                  <VSwitch
                    v-model="hour.active"
                    color="success"
                    hide-details
                    inset
                    density="compact"
                  />
                  <div class="day-label font-weight-bold text-slate-700">
                    {{ hour.name }}
                  </div>
              </div>

              <div class="flex-grow-1 d-flex align-center gap-3">
                  <template v-if="hour.active">
                    <VTextField
                      v-model="hour.start"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="time-input"
                      rounded="lg"
                    />
                    <span class="text-slate-300 font-weight-bold text-caption">TO</span>
                    <VTextField
                      v-model="hour.end"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="time-input"
                    />
                  </template>
                  <div v-else class="text-caption text-slate-400 font-italic">
                    Not working / Unavailable
                  </div>
              </div>
            </div>
          </div>
        </div>
      </VCardText>

      <VCardActions class="pa-6 pt-2">
        <VSpacer />
        <VBtn
          color="secondary"
          variant="tonal"
          rounded="xl"
          class="px-6"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          rounded="xl"
          class="px-8 font-weight-bold"
          :loading="saving"
          @click="saveHours"
        >
          Save Schedule
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.hour-row:last-child {
  border-bottom: none !important;
}

.label-tiny {
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: #94a3b8;
}

.time-input {
  max-width: 120px;
}

:deep(.v-field) {
  border-radius: 12px !important;
}
</style>
