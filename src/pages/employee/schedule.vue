<script setup>
import { ref, computed, onMounted } from 'vue'
import { providerApi } from '@/plugins/axios'
import ProviderLayout from '@/components/ProviderLayout.vue'

definePage({ meta: { layout: 'blank', action: 'read', subject: 'Auth' } })

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const schedules = ref([])

const saving = ref(false)
const loading = ref(false)
const snackbar = ref({ show: false, text: '', color: 'success' })

const showSnack = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const statusColor = status => {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'PENDING') return 'warning'
  
  return 'grey'
}

const addEntry = (dateInput = null) => {
  const isDate = dateInput instanceof Date
  const targetDate = isDate ? dateInput : new Date()

  // If no valid date provided, default to tomorrow
  if (!isDate) targetDate.setDate(targetDate.getDate() + 1)
  
  const dateStr = targetDate.toISOString().substring(0, 10)
  
  // Check if date already exists to avoid duplicates in drafts
  if (schedules.value.some(s => s.date === dateStr && !s.id)) return

  schedules.value.unshift({
    date: dateStr,
    start_time: '09:00',
    end_time: '19:00',
    reason: '',
    off: false,
    status: null,
    id: null,
    rejection_reason: '',
  })
}

const addTomorrow = () => addEntry()

const addNext3Days = () => {
  for (let i = 1; i <= 3; i++) {
    const d = new Date()

    d.setDate(d.getDate() + i)
    addEntry(d)
  }
}

const removeDraft = index => {
  schedules.value.splice(index, 1)
}

const deleteEntry = async (id, index) => {
  if (!confirm('Are you sure you want to delete this schedule entry?')) return
  
  try {
    if (id) {
      await providerApi.delete(`/api/provider/schedules/${id}/`)
      showSnack('Schedule entry deleted.', 'success')
    }
    schedules.value.splice(index, 1)
  } catch (err) {
    showSnack('Failed to delete entry.', 'error')
  }
}

const editEntry = day => {
  day.is_editing = true
}

const fetchMySchedule = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/schedules/')

    schedules.value = res.data.map(d => ({
      ...d,
      start_time: (d.start_time || '09:00').substring(0, 5),
      end_time: (d.end_time || '19:00').substring(0, 5),
      off: d.start_time === d.end_time && d.start_time === '00:00:00',
    }))
  } catch (err) {
    console.error('Failed to load schedule:', err)
  } finally {
    loading.value = false
  }
}

const submitSchedule = async () => {
  const drafts = schedules.value.filter(s => !s.status || s.status === 'REJECTED' || s.is_editing)
  if (drafts.length === 0) {
    showSnack('No new or rejected entries to submit.', 'info')
    
    return
  }

  // Validate reasons (only required for OFF days)
  if (drafts.some(d => d.off && !d.reason)) {
    showSnack('Please provide a reason for all your "Off" day requests.', 'error')
    
    return
  }

  saving.value = true
  try {
    const payload = {
      schedule: drafts.map(d => ({
        date: d.date,
        off: d.off,
        start_time: d.off ? '00:00' : d.start_time,
        end_time: d.off ? '00:00' : d.end_time,
        reason: d.reason,
      })),
    }

    await providerApi.post('/api/provider/schedules/bulk-submit/', payload)
    showSnack('Availability submitted successfully!', 'success')
    await fetchMySchedule()
  } catch (err) {
    showSnack(err.response?.data?.error || 'Submission failed.', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(fetchMySchedule)
</script>

<template>
  <ProviderLayout>
    <div class="pa-8 schedule-page mx-auto">
      <!-- Header Section -->
      <div class="d-flex align-center justify-space-between mb-10 header-container">
        <div>
          <div class="d-flex align-center gap-2 mb-2">
            <VIcon
              icon="tabler-calendar-heart"
              color="primary"
              size="24"
            />
            <span class="text-overline font-weight-bold text-primary tracking-widest uppercase">Planning & Availability</span>
          </div>
          <h1 class="text-h2 font-weight-black text-slate-800 tracking-tightest mb-2">
            My Availability
          </h1>
          <p class="text-subtitle-1 text-slate-500 max-w-2xl">
            Design your working week. Submit specific dates with clear reasons to help your manager optimize the team schedule.
          </p>
        </div>
        <div class="d-flex align-center gap-3">
          <VBtn
            color="primary"
            height="56"
            elevation="8"
            class="px-8 font-weight-black rounded-2xl glow-button"
            :loading="saving"
            @click="submitSchedule"
          >
            <VIcon
              icon="tabler-cloud-upload"
              class="mr-2"
            />
            Submit All Drafts
          </VBtn>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions-bar d-flex align-center gap-4 mb-8 pa-4 rounded-2xl glass-panel">
        <span class="text-caption font-weight-black text-slate-400 uppercase tracking-wider ml-2">Quick Add:</span>
        <VBtn
          variant="tonal"
          size="small"
          color="secondary"
          prepend-icon="tabler-calendar-plus"
          class="rounded-lg"
          @click="addTomorrow"
        >
          Tomorrow
        </VBtn>
        <VBtn
          variant="tonal"
          size="small"
          color="secondary"
          prepend-icon="tabler-calendar-plus"
          class="rounded-lg"
          @click="addNext3Days"
        >
          Next 3 Days
        </VBtn>
        <VSpacer />
        <VBtn
          variant="text"
          size="small"
          color="primary"
          prepend-icon="tabler-plus"
          class="rounded-lg font-weight-bold"
          @click="addEntry"
        >
          Custom Date
        </VBtn>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-20"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="64"
          width="6"
        />
        <div class="mt-4 text-slate-400 font-weight-medium">
          Fetching your schedule...
        </div>
      </div>

      <!-- Empty State -->
      <VCard
        v-else-if="schedules.length === 0"
        flat
        border
        class="pa-16 text-center rounded-[40px] border-dashed glass-card empty-state"
      >
        <div class="empty-icon-container mb-6">
          <VIcon
            icon="tabler-calendar-stats"
            size="80"
            color="primary"
            class="opacity-30"
          />
        </div>
        <h3 class="text-h4 font-weight-black text-slate-800 mb-3">
          Your calendar is open
        </h3>
        <p class="text-slate-500 mb-8 max-w-md mx-auto">
          Start building your availability by adding specific dates you're able to work or need to be off.
        </p>
        <VBtn
          variant="flat"
          color="primary"
          size="large"
          class="rounded-xl px-10"
          @click="addEntry"
        >
          Start Adding Dates
        </VBtn>
      </VCard>

      <!-- Schedule List with Transitions -->
      <div
        v-else
        class="schedule-list"
      >
        <TransitionGroup name="list">
          <VCard 
            v-for="(day, idx) in schedules" 
            :key="day.id || (day.date + idx)" 
            flat 
            class="mb-4 availability-card rounded-[28px] overflow-hidden"
            :class="[
              `status-${(day.status || 'draft').toLowerCase()}`,
              { 'is-off': day.off, 'is-draft': !day.status }
            ]"
          >
            <div class="card-glass-overlay" />
            <div class="pa-6 relative z-10">
              <div class="d-flex align-center flex-wrap gap-6">
                <!-- Date Section -->
                <div
                  class="input-group"
                  style="width: 180px"
                >
                  <div class="d-flex align-center gap-1 mb-1">
                    <VIcon
                      icon="tabler-calendar-event"
                      size="14"
                      class="text-slate-400"
                    />
                    <span class="text-caption-2 font-weight-bold text-slate-400 uppercase tracking-widest">Selection Date</span>
                  </div>
                  <VTextField
                    v-model="day.date"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="!!day.status && day.status !== 'REJECTED' && !day.is_editing"
                    class="custom-field"
                  />
                </div>

                <!-- Status Select -->
                <div
                  class="input-group"
                  style="width: 140px"
                >
                  <div class="d-flex align-center gap-1 mb-1">
                    <VIcon
                      icon="tabler-activity"
                      size="14"
                      class="text-slate-400"
                    />
                    <span class="text-caption-2 font-weight-bold text-slate-400 uppercase tracking-widest">Status</span>
                  </div>
                  <VSelect
                    v-model="day.off"
                    :items="[{text: 'Working', value: false}, {text: 'Off', value: true}]"
                    item-title="text"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="!!day.status && day.status !== 'REJECTED' && !day.is_editing"
                    class="custom-field status-select"
                  />
                </div>

                <!-- Hours Section -->
                <div
                  v-if="!day.off"
                  class="d-flex gap-4"
                >
                  <div
                    class="input-group"
                    style="width: 130px"
                  >
                    <div class="d-flex align-center gap-1 mb-1">
                      <VIcon
                        icon="tabler-clock-start"
                        size="14"
                        class="text-slate-400"
                      />
                      <span class="text-caption-2 font-weight-bold text-slate-400 uppercase tracking-widest">Starts</span>
                    </div>
                    <VTextField
                      v-model="day.start_time"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      :disabled="!!day.status && day.status !== 'REJECTED' && !day.is_editing"
                      class="custom-field"
                    />
                  </div>
                  <div
                    class="input-group"
                    style="width: 130px"
                  >
                    <div class="d-flex align-center gap-1 mb-1">
                      <VIcon
                        icon="tabler-clock-end"
                        size="14"
                        class="text-slate-400"
                      />
                      <span class="text-caption-2 font-weight-bold text-slate-400 uppercase tracking-widest">Ends</span>
                    </div>
                    <VTextField
                      v-model="day.end_time"
                      type="time"
                      variant="outlined"
                      density="compact"
                      hide-details
                      :disabled="!!day.status && day.status !== 'REJECTED' && !day.is_editing"
                      class="custom-field"
                    />
                  </div>
                </div>

                <!-- Off Reason (Inline for brevity) -->
                <div
                  v-else
                  class="flex-grow-1"
                >
                  <div class="d-flex align-center gap-1 mb-1">
                    <VIcon
                      icon="tabler-note"
                      size="14"
                      class="text-slate-400"
                    />
                    <span class="text-caption-2 font-weight-bold text-slate-400 uppercase tracking-widest">Off reason</span>
                  </div>
                  <VTextField
                    v-model="day.reason"
                    placeholder="e.g. Vacation, Medical Leave"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="!!day.status && day.status !== 'REJECTED'"
                    class="custom-field"
                  />
                </div>

                <!-- Final Action Area -->
                <div class="ml-auto d-flex align-center gap-2">
                  <div
                    v-if="day.status && !day.is_editing"
                    class="status-badge-container d-flex align-center gap-2"
                  >
                    <VChip
                      :color="statusColor(day.status)"
                      size="small"
                      variant="flat"
                      class="px-4 font-weight-black text-white rounded-lg status-chip"
                    >
                      <VIcon
                        :icon="day.status === 'APPROVED' ? 'tabler-circle-check' : day.status === 'REJECTED' ? 'tabler-circle-x' : 'tabler-hourglass-high'"
                        size="14"
                        class="mr-2"
                      />
                      {{ day.status }}
                    </VChip>
                    
                    <VTooltip
                      v-if="day.status === 'REJECTED' && day.rejection_reason"
                      offset="10"
                    >
                      <template #activator="{ props }">
                        <VIcon
                          v-bind="props"
                          icon="tabler-alert-circle"
                          color="error"
                          size="20"
                          class="ml-2 icon-pulse"
                        />
                      </template>
                      <div class="pa-2 font-weight-bold">
                        {{ day.rejection_reason }}
                      </div>
                    </VTooltip>

                    <VBtn
                      icon="tabler-pencil"
                      variant="tonal"
                      color="secondary"
                      size="x-small"
                      class="rounded-lg ml-2"
                      @click="editEntry(day)"
                    />
                    <VBtn
                      icon="tabler-trash"
                      variant="tonal"
                      color="error"
                      size="x-small"
                      class="rounded-lg"
                      @click="deleteEntry(day.id, idx)"
                    />
                  </div>
                  
                  <div
                    v-else-if="day.is_editing"
                    class="d-flex align-center gap-2"
                  >
                    <VChip
                      color="primary"
                      variant="tonal"
                      size="small"
                      class="px-3"
                    >
                      Editing Mode
                    </VChip>
                    <VBtn
                      icon="tabler-x"
                      variant="text"
                      color="medium-emphasis"
                      size="small"
                      @click="fetchMySchedule"
                    />
                  </div>

                  <VBtn
                    v-else
                    icon="tabler-trash-x"
                    variant="tonal"
                    color="error"
                    size="small"
                    class="rounded-xl delete-btn"
                    @click="removeDraft(idx)"
                  />
                </div>
              </div>

              <!-- Expanded Reason field for Working -->
              <div
                v-if="!day.off"
                class="mt-5 pt-4 border-t border-slate-100/50"
              >
                <div class="d-flex align-center gap-1 mb-2">
                  <VIcon
                    icon="tabler-message-2"
                    size="14"
                    class="text-slate-400"
                  />
                  <span class="text-caption-2 font-weight-bold text-slate-400 uppercase tracking-widest">Submission Context</span>
                </div>
                <VTextField
                  v-model="day.reason"
                  placeholder="Optional: Tell your manager about this shift (e.g. Regular shift, Overtime request)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="!!day.status && day.status !== 'REJECTED'"
                  class="custom-field reason-field"
                />
              </div>
            </div>
          </VCard>
        </TransitionGroup>
      </div>

      <!-- Footer Help -->
      <VAlert
        border="start"
        color="primary"
        variant="tonal"
        class="mt-12 rounded-2xl glass-alert"
      >
        <template #prepend>
          <div class="alert-icon-bg mr-4">
            <VIcon
              icon="tabler-info-hexagon"
              size="24"
            />
          </div>
        </template>
        <div class="text-subtitle-2 font-weight-black mb-1">
          Submission Guide
        </div>
        <p class="text-body-2 text-slate-600 mb-0">
          Entries marked as <strong>Working</strong> will generate bookable slots for pet owners upon approval.
          Entries marked as <strong>Off</strong> effectively block your calendar for that period.
        </p>
      </VAlert>
    </div>

    <!-- Feedback Snackbar -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
      location="top right"
      class="custom-snack"
    >
      <div class="d-flex align-center gap-3">
        <VIcon :icon="snackbar.color === 'success' ? 'tabler-circle-check' : 'tabler-alert-triangle'" />
        <span class="font-weight-bold">{{ snackbar.text }}</span>
      </div>
    </VSnackbar>
  </ProviderLayout>
</template>

<style scoped>
.schedule-page {
  max-width: 1000px;
  background: radial-gradient(circle at 0% 0%, rgba(var(--v-theme-primary), 0.03) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgba(var(--v-theme-secondary), 0.03) 0%, transparent 50%);
  min-height: 100vh;
}

.tracking-tightest { letter-spacing: -2px; }
.tracking-widest { letter-spacing: 1px; }

/* Glassmorphism Styles */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05);
}

.glass-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}

.availability-card {
  position: relative;
  border: 1px solid rgba(226, 232, 240, 0.7) !important;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.03);
}

.availability-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.08);
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
}

.card-glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
}

/* Status Accents */
.status-approved { border-left: 6px solid #10b981 !important; border-color: rgba(16, 185, 129, 0.1) !important; }
.status-approved .card-glass-overlay { background: linear-gradient(90deg, #10b981, transparent); }

.status-rejected { border-left: 6px solid #ef4444 !important; border-color: rgba(239, 68, 68, 0.1) !important; }
.status-rejected .card-glass-overlay { background: linear-gradient(90deg, #ef4444, transparent); }

.status-pending { border-left: 6px solid #f59e0b !important; border-color: rgba(245, 158, 11, 0.1) !important; }
.status-pending .card-glass-overlay { background: linear-gradient(90deg, #f59e0b, transparent); }

.status-draft { border-left: 6px solid #6366f1 !important; border-color: rgba(99, 102, 241, 0.1) !important; }
.status-draft .card-glass-overlay { background: linear-gradient(90deg, #6366f1, transparent); }

.is-off { opacity: 0.85; background: rgba(248, 250, 252, 0.8); }

/* Custom Field Styles */
:deep(.custom-field .v-field) {
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.5) !important;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

:deep(.custom-field .v-field--focused) {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1);
}

.text-caption-2 {
  font-size: 0.65rem;
  letter-spacing: 0.05rem;
}

/* Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-move {
  transition: transform 0.4s ease;
}

/* Animations */
@keyframes pulse-soft {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}
.icon-pulse {
  animation: pulse-soft 2s infinite ease-in-out;
}

.glow-button {
  box-shadow: 0 8px 16px -4px rgba(var(--v-theme-primary), 0.3);
}

.glass-alert {
  background: rgba(var(--v-theme-primary), 0.05);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(var(--v-theme-primary), 0.1) !important;
}

.alert-icon-bg {
  padding: 10px;
  background: white;
  border-radius: 12px;
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.empty-state {
  border-width: 2px !important;
  transition: all 0.4s ease;
}

.empty-state:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgb(var(--v-theme-primary)) !important;
}
</style>

