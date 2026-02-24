<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { providerApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'
import SlotPreviewDialog from './SlotPreviewDialog.vue'

const permissionStore = usePermissionStore()
const { userData } = storeToRefs(permissionStore)

const providerType = ref('INDIVIDUAL')
const slotDuration = ref(30)

// Watch for userData changes to sync providerType (e.g. after permissions fetch)
watch(userData, newVal => {
  if (newVal?.provider_type) {
    providerType.value = newVal.provider_type
  } else if (newVal?.role) {
    // Fallback to role if provider_type is missing
    const role = newVal.role.toUpperCase()
    if (role.includes('ORGANIZATION')) providerType.value = 'ORGANIZATION'
    else if (role.includes('INDIVIDUAL')) providerType.value = 'INDIVIDUAL'
  }
}, { immediate: true })
const workingHours = ref([
  { day: 0, name: 'Monday', active: true, start: '09:00', end: '18:00' },
  { day: 1, name: 'Tuesday', active: true, start: '09:00', end: '18:00' },
  { day: 2, name: 'Wednesday', active: true, start: '09:00', end: '18:00' },
  { day: 3, name: 'Thursday', active: true, start: '09:00', end: '18:00' },
  { day: 4, name: 'Friday', active: true, start: '09:00', end: '18:00' },
  { day: 5, name: 'Saturday', active: false, start: '09:00', end: '13:00' },
  { day: 6, name: 'Sunday', active: false, start: '09:00', end: '13:00' },
])

const loading = ref(false)
const saving = ref(false)

const showPreview = ref(false)
const previewDate = ref('')

const fetchSettings = async () => {
  loading.value = true
  try {
    // We need to fetch provider type and existing availability
    const profileRes = await providerApi.get('/api/provider/profile/')
    const remoteType = profileRes.data.provider_type || 'INDIVIDUAL'
    providerType.value = remoteType
    
    // Sync store if mismatch
    if (userData.value && userData.value.provider_type !== remoteType) {
      permissionStore.userData = { ...userData.value, provider_type: remoteType }
    }
    
    // Fetch availability rows
    const availRes = await providerApi.get(`/api/provider/availability/active-hours/`)
    if (availRes.data && availRes.data.length > 0) {
      // Reset all to inactive first
      workingHours.value.forEach(h => {
        h.active = false
      })

      // Map existing
      availRes.data.forEach((item, index) => {
        const hour = workingHours.value.find(h => h.day === item.day)
        if (hour) {
          hour.active = true
          hour.start = item.start
          hour.end = item.end
        }
        
        // Use slot duration from the first item (all are synced usually)
        if (index === 0 && item.slot_duration_minutes) {
          slotDuration.value = item.slot_duration_minutes
        }
      })
    }
  } catch (err) {
    console.error('Failed to fetch settings:', err)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const payload = {
      provider_type: providerType.value,
      availability: workingHours.value.filter(h => h.active).map(h => ({
        day_of_week: h.day,
        start_time: h.start,
        end_time: h.end,
        slot_duration_minutes: slotDuration.value
      }))
    }
    await providerApi.post('/api/provider/availability/save-settings/', payload)
    // Show success toast
  } catch (err) {
    console.error('Failed to save settings:', err)
  } finally {
    saving.value = false
  }
}

const openPreview = (hour) => {
  // Generate a dummy date for the chosen weekday to preview slots
  const now = new Date()
  const currentWeekday = now.getDay()
  const diff = (hour.day - (currentWeekday - 1) + 7) % 7 // Assuming Monday is 0 in workingHours
  const target = new Date(now)
  target.setDate(now.getDate() + diff)
  
  previewDate.value = target.toISOString().split('T')[0]
  showPreview.value = true
}

onMounted(fetchSettings)
</script>

<template>
  <VCard flat border class="availability-settings pa-8 rounded-[32px]">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <div class="d-flex align-center gap-3 mb-2">
           <div class="icon-box-soft">
             <VIcon icon="tabler-clock" color="primary" size="24" />
           </div>
           <h2 class="text-h4 font-weight-black text-slate-800 tracking-tighter mb-0">Schedule & Availability</h2>
        </div>
        <p class="text-body-1 text-slate-500 ml-12">Configure your working hours and booking slot durations.</p>
      </div>
      <VBtn
        color="primary"
        height="54"
        class="rounded-2xl px-8 font-weight-black shadow-primary"
        @click="saveSettings"
        :loading="saving"
      >
        <VIcon icon="tabler-device-floppy" class="mr-2" />
        Save Schedule
      </VBtn>
    </div>

    <VRow>
      <VCol cols="12" md="5">
        <label class="label-tiny uppercase mb-2 d-block">Provider Business Type</label>
        <VSelect
          v-model="providerType"
          :items="[
            { title: 'Individual (Solo Practitioner)', value: 'INDIVIDUAL' },
            { title: 'Organization (Clinics & Salons)', value: 'ORGANIZATION' }
          ]"
          variant="outlined"
          class="luxury-input"
          rounded="xl"
          prepend-inner-icon="tabler-building-store"
          bg-color="slate-50"
          readonly
          persistent-hint
          hint="Role-based business type (System Managed)"
        />
      </VCol>

      <VCol cols="12" md="4">
        <label class="label-tiny uppercase mb-2 d-block">Booking Slot Duration</label>
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

      <VCol cols="12" class="mt-8">
        <div class="d-flex align-center justify-space-between mb-6">
           <h3 class="text-h6 font-weight-bold text-slate-700">Weekly Hours</h3>
           <div class="text-caption text-slate-400 font-weight-bold uppercase">
              <VIcon icon="tabler-info-circle" size="14" class="mr-1" />
              Set your standard operating hours
           </div>
        </div>
        
        <div class="hours-list rounded-xl border overflow-hidden">
          <div 
            v-for="hour in workingHours" 
            :key="hour.day" 
            class="hour-row d-flex align-center gap-6 py-4 px-6 border-b border-slate-50 transition-colors hover:bg-slate-50"
            :class="{ 'bg-slate-50 opacity-60': !hour.active }"
          >
            <div class="d-flex align-center gap-4" style="width: 180px">
                <VSwitch
                  v-model="hour.active"
                  color="success"
                  hide-details
                  inset
                  density="compact"
                  class="ma-0"
                />
                <div class="day-label font-weight-black text-slate-700">
                  {{ hour.name }}
                </div>
            </div>

            <div class="flex-grow-1 d-flex align-center gap-4">
                <template v-if="hour.active">
                  <VTextField
                    v-model="hour.start"
                    type="time"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="time-input luxury-input-small"
                    rounded="lg"
                    bg-color="white"
                  />
                  <span class="text-slate-300 font-weight-bold text-caption">TO</span>
                  <VTextField
                    v-model="hour.end"
                    type="time"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="time-input luxury-input-small"
                    rounded="lg"
                    bg-color="white"
                  />
                </template>
                <template v-else>
                  <div class="closed-badge px-4 py-1 rounded-pill bg-slate-200 text-slate-500 text-caption font-weight-black uppercase">
                     Closed / Not Accepting Bookings
                  </div>
                </template>
            </div>
            
            <div v-if="hour.active" class="d-flex align-center gap-4">
                <div class="total-hours text-caption font-weight-bold text-slate-400">
                    9h 00m
                </div>
                <VBtn
                  icon="tabler-eye"
                  size="x-small"
                  variant="text"
                  color="primary"
                  title="Check Slots"
                  @click="openPreview(hour)"
                />
            </div>
          </div>
        </div>
      </VCol>
    </VRow>

    <VAlert
      v-if="providerType === 'ORGANIZATION'"
      icon="tabler-building-skyscraper"
      color="primary"
      variant="tonal"
      class="mt-8 rounded-xl border-dashed border-primary"
      title="Organization Mode Active"
    >
      <div class="text-body-2 text-slate-600 mt-1">
        In Organization mode, overall working hours define your business limits. Individual employee availability can be managed in the Employees section.
      </div>
    </VAlert>

    <!-- Slot Preview Dialog -->
    <SlotPreviewDialog
      v-model="showPreview"
      :employee-id="userData?.auth_user_id"
      :employee-name="userData?.full_name"
      :date="previewDate"
    />
  </VCard>
</template>

<style scoped>
.availability-settings {
  background: white;
  border-color: #f1f5f9 !important;
  box-shadow: 0 0 0 4px rgba(241, 245, 249, 0.5);
}

.icon-box-soft {
  width: 48px;
  height: 48px;
  background: #f0fdf4;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--v-theme-primary);
}

.label-tiny {
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: #94a3b8;
}

.shadow-primary {
  box-shadow: 0 10px 25px rgba(var(--v-theme-primary), 0.25) !important;
  transition: transform 0.2s ease;
}

.shadow-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(var(--v-theme-primary), 0.35) !important;
}

/* Luxury Input Overrides */
:deep(.luxury-input .v-field__outline) {
  --v-field-border-opacity: 0.08;
}

:deep(.luxury-input .v-field--focused) {
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1);
}

/* Small Inputs for Time */
.luxury-input-small :deep(.v-field) {
  border-radius: 12px !important;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.luxury-input-small :deep(.v-field__input) {
  padding-top: 6px;
  padding-bottom: 6px;
  min-height: 36px;
}

/* Hour Row Hover Effect */
.transition-colors {
  transition: background-color 0.2s ease;
}

.hour-row:last-child {
  border-bottom: none !important;
}

/* Closed Badge */
.closed-badge {
  letter-spacing: 0.5px;
  font-size: 11px;
}

.tracking-tighter {
  letter-spacing: -1px !important;
}
</style>
