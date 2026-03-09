<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { usePermissionStore } from '@/stores/permissionStore'
import MedicalAppointmentDialog from '@/components/veterinary/MedicalAppointmentDialog.vue'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const vetStore = useVeterinaryStore()
const permStore = usePermissionStore()

// ─── View State ───────────────────────────────────────────────────────────────
const viewMode = ref('Week')      // Day | 4Days | Week
const selectedDate = ref(new Date())
const loading = ref(false)
const appointments = ref([])
const showAppointmentDialog = ref(false)
const selectedDoctorFilter = ref('all')
const showRooms = ref(false)

// ─── Popup ────────────────────────────────────────────────────────────────────
const hoveredApt = ref(null)
const popupX = ref(0)
const popupY = ref(0)

// ─── Time Grid Config ─────────────────────────────────────────────────────────
const START_HOUR = 7   // 7:00 AM
const END_HOUR   = 20  // 8:00 PM
const SLOT_MINS  = 15
const SLOTS_PER_HOUR = 60 / SLOT_MINS

const timeSlots = computed(() => {
  const slots = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINS) {
      slots.push({ h, m, label: m === 0 ? `${String(h).padStart(2, '0')}:00` : '' })
    }
  }
  
  return slots
})

// ─── Week Days ────────────────────────────────────────────────────────────────
const dayCount = computed(() => viewMode.value === 'Day' ? 1 : viewMode.value === '4Days' ? 4 : 7)

const weekDays = computed(() => {
  const base = new Date(selectedDate.value)
  if (viewMode.value === 'Week') {
    const dow = base.getDay()

    base.setDate(base.getDate() - dow) // Sunday start
  }
  
  return Array.from({ length: dayCount.value }, (_, i) => {
    const d = new Date(base)

    d.setDate(base.getDate() + i)
    
    return d
  })
})

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Status Config ────────────────────────────────────────────────────────────
const statusConfig = {
  SCHEDULED: { color: '#3B82F6', bg: '#EFF6FF', label: 'Scheduled' },
  WAITING: { color: '#F59E0B', bg: '#FFFBEB', label: 'Waiting'   },
  ENGAGED: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Engaged'   },
  COMPLETED: { color: '#10B981', bg: '#F0FDF4', label: 'Done'      },
  CONFIRMED: { color: '#3B82F6', bg: '#EFF6FF', label: 'Confirmed' },
}

const getStatusCfg = status => statusConfig[status?.toUpperCase()] || statusConfig.SCHEDULED

// ─── Appointment Positioning ──────────────────────────────────────────────────
const appointmentsForDay = day => {
  const dateStr = day.toISOString().split('T')[0]
  
  return appointments.value.filter(a => a.date === dateStr)
}

const slotTopPx = timeStr => {
  const [h, m] = timeStr.split(':').map(Number)
  const totalMins = (h - START_HOUR) * 60 + m
  
  return (totalMins / SLOT_MINS) * 32  // 32px per slot
}

const aptHeightPx = (startTime, endTime) => {
  if (!endTime) return 64
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const dur = (eh * 60 + em) - (sh * 60 + sm)
  
  return Math.max((dur / SLOT_MINS) * 32, 32)
}

// ─── Data Fetch ───────────────────────────────────────────────────────────────
const fetchAppointments = async () => {
  if (!vetStore.activeClinicId) return
  loading.value = true
  try {
    const from = weekDays.value[0].toISOString().split('T')[0]
    const to   = weekDays.value[weekDays.value.length - 1].toISOString().split('T')[0]

    const res = await vetStore.fetchMedicalAppointments({
      clinic: vetStore.activeClinicId,
      date_from: from,
      date_to: to,
    })

    appointments.value = (res || []).map(a => ({
      id: a.id,
      date: a.appointment_date || a.start_time?.split('T')[0],
      startTime: a.start_time?.substring(11, 16) || a.time?.substring(0, 5) || '09:00',
      endTime: a.end_time?.substring(11, 16) || null,
      pet: a.pet_name || 'Unknown Pet',
      petId: a.pet_code || '',
      owner: a.owner_name || '',
      doctor: a.doctor_name || 'Unassigned',
      room: a.room || '',
      status: a.status || 'SCHEDULED',
    }))
  } catch (err) {
    console.error('Schedule fetch failed:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => vetStore.fetchClinics().then(fetchAppointments))
watch([selectedDate, viewMode], fetchAppointments)

// ─── Today's Schedule Summary ─────────────────────────────────────────────────
const todayStr = new Date().toISOString().split('T')[0]
const todaysApts = computed(() => appointments.value.filter(a => a.date === todayStr))

const statusCounts = computed(() => {
  const counts = { SCHEDULED: 0, WAITING: 0, ENGAGED: 0, COMPLETED: 0 }

  todaysApts.value.forEach(a => { counts[a.status?.toUpperCase()] = (counts[a.status?.toUpperCase()] || 0) + 1 })
  
  return counts
})

// ─── Navigation ───────────────────────────────────────────────────────────────
const navigate = dir => {
  const d = new Date(selectedDate.value)
  const step = viewMode.value === 'Day' ? 1 : viewMode.value === '4Days' ? 4 : 7

  d.setDate(d.getDate() + dir * step)
  selectedDate.value = d
}

const goToday = () => { selectedDate.value = new Date() }

const formatHeaderDate = () => {
  if (weekDays.value.length === 1) {
    return weekDays.value[0].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }
  const first = weekDays.value[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const last  = weekDays.value[weekDays.value.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  
  return `${first} – ${last}`
}

const isToday = day => day.toISOString().split('T')[0] === todayStr

// ─── Hover Popup ──────────────────────────────────────────────────────────────
const showPopup = (apt, event) => {
  hoveredApt.value = apt

  const rect = event.currentTarget.getBoundingClientRect()

  popupX.value = rect.right + 8
  popupY.value = rect.top
}

const hidePopup = () => { hoveredApt.value = null }

// ─── RBAC helpers ─────────────────────────────────────────────────────────────
const canManageSchedule = computed(() => permStore.hasPermission('VETERINARY_SCHEDULE') || permStore.hasPermission('VETERINARY_VISITS'))
const isDoctor = computed(() => ['doctor', 'veterinarian', 'vet'].some(r => userRole.value.includes(r)))
const isReceptionist = computed(() => ['receptionist', 'reception', 'admin', 'organization'].some(r => userRole.value.includes(r)))
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="schedule-wrap">
      <!-- ── Top Header ─────────────────────────────────────────────────── -->
      <div class="sched-header d-flex align-center justify-space-between mb-4 flex-wrap gap-3">
        <div class="d-flex align-center gap-3">
          <h1 class="text-h4 font-weight-bold">
            Schedule
          </h1>
          <VChip
            v-if="isToday(new Date())"
            color="primary"
            size="small"
            variant="tonal"
          >
            Live
          </VChip>
        </div>

        <div class="d-flex align-center gap-2 flex-wrap">
          <!-- View Toggle -->
          <VBtnGroup
            density="compact"
            variant="outlined"
            class="view-toggle"
          >
            <VBtn
              v-for="v in ['Day','4Days','Week']"
              :key="v"
              :class="{ 'v-btn--active bg-primary text-white': viewMode === v }"
              size="small"
              @click="viewMode = v"
            >
              {{ v }}
            </VBtn>
          </VBtnGroup>

          <!-- Rooms toggle -->
          <VBtn
            :variant="showRooms ? 'flat' : 'outlined'"
            :color="showRooms ? 'primary' : 'default'"
            size="small"
            prepend-icon="tabler-door"
            @click="showRooms = !showRooms"
          >
            Rooms
          </VBtn>

          <!-- Nav Arrows + date label -->
          <div class="d-flex align-center gap-1">
            <VBtn
              icon
              variant="text"
              size="small"
              @click="navigate(-1)"
            >
              <VIcon icon="tabler-chevron-left" />
            </VBtn>
            <span
              class="text-body-2 font-weight-medium px-2"
              style="white-space:nowrap"
            >{{ formatHeaderDate() }}</span>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="navigate(1)"
            >
              <VIcon icon="tabler-chevron-right" />
            </VBtn>
          </div>

          <VBtn
            variant="outlined"
            size="small"
            @click="goToday"
          >
            Today
          </VBtn>

          <!-- New Appointment -->
          <VBtn
            v-if="canManageSchedule"
            color="primary"
            size="small"
            prepend-icon="tabler-plus"
            @click="showAppointmentDialog = true"
          >
            New Appointment
          </VBtn>
        </div>
      </div>

      <!-- ── Main Layout: Calendar + Right Panel ────────────────────────── -->
      <div class="sched-layout">
        <!-- ── Calendar Panel ─────────────────────────────────────────── -->
        <VCard
          class="sched-card"
          elevation="0"
          border
        >
          <VCardText class="pa-0">
            <!-- Day Headers -->
            <div
              class="day-header-row"
              :style="`grid-template-columns: 56px repeat(${dayCount}, 1fr)`"
            >
              <div class="time-gutter" />
              <div
                v-for="day in weekDays"
                :key="day.toISOString()"
                class="day-header-cell"
                :class="{ 'day-header-today': isToday(day) }"
              >
                <span class="day-label">{{ dayLabels[day.getDay()] }}</span>
                <span
                  class="day-num"
                  :class="{ 'today-badge': isToday(day) }"
                >
                  {{ day.getDate() }}
                </span>
              </div>
            </div>

            <!-- Loading Overlay -->
            <div
              v-if="loading"
              class="d-flex justify-center align-center"
              style="height:400px"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="40"
              />
            </div>

            <!-- Time Grid -->
            <div
              v-else
              class="time-grid-scroll"
            >
              <div
                class="time-grid"
                :style="`grid-template-columns: 56px repeat(${dayCount}, 1fr)`"
              >
                <!-- Time Gutter -->
                <div class="gutter-col">
                  <div
                    v-for="slot in timeSlots"
                    :key="`${slot.h}-${slot.m}`"
                    class="gutter-slot"
                  >
                    <span
                      v-if="slot.m === 0"
                      class="time-label"
                    >{{ slot.label }}</span>
                  </div>
                </div>

                <!-- Day Columns -->
                <div
                  v-for="day in weekDays"
                  :key="day.toISOString()"
                  class="day-col"
                  :class="{ 'day-col-today': isToday(day) }"
                >
                  <!-- Slot grid lines -->
                  <div
                    v-for="slot in timeSlots"
                    :key="`slot-${slot.h}-${slot.m}`"
                    class="grid-slot"
                    :class="{ 'hour-line': slot.m === 0 }"
                  />

                  <!-- Appointments -->
                  <div
                    v-for="apt in appointmentsForDay(day)"
                    :key="apt.id"
                    class="apt-block"
                    :style="{
                      top: `${slotTopPx(apt.startTime)}px`,
                      height: `${aptHeightPx(apt.startTime, apt.endTime)}px`,
                      backgroundColor: getStatusCfg(apt.status).bg,
                      borderLeftColor: getStatusCfg(apt.status).color,
                    }"
                    @mouseenter="showPopup(apt, $event)"
                    @mouseleave="hidePopup"
                  >
                    <span class="apt-time">{{ apt.startTime }}</span>
                    <span class="apt-name">{{ apt.pet }}</span>
                    <span
                      v-if="showRooms && apt.room"
                      class="apt-room"
                    >Rm {{ apt.room }}</span>
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- ── Right Panel: Today's Schedule ─────────────────────────── -->
        <div class="right-panel">
          <VCard
            elevation="0"
            border
            class="mb-4"
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Today's Summary
              </div>
              <!-- Status counters -->
              <div class="status-counters">
                <div
                  v-for="(cfg, key) in statusConfig"
                  :key="key"
                  class="status-counter-card"
                  :style="{ borderLeftColor: cfg.color, backgroundColor: cfg.bg }"
                >
                  <span
                    class="counter-count"
                    :style="{ color: cfg.color }"
                  >{{ statusCounts[key] || 0 }}</span>
                  <span class="counter-label">{{ cfg.label }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>

          <VCard
            elevation="0"
            border
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Appointments — {{ new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}) }}
              </div>

              <div
                v-if="todaysApts.length === 0"
                class="text-center py-6 text-medium-emphasis text-body-2"
              >
                No appointments today.
              </div>

              <div class="apt-list">
                <div
                  v-for="apt in todaysApts"
                  :key="apt.id"
                  class="apt-list-item"
                >
                  <div
                    class="apt-list-dot"
                    :style="{ backgroundColor: getStatusCfg(apt.status).color }"
                  />
                  <div class="apt-list-info">
                    <div class="font-weight-medium text-body-2">
                      {{ apt.pet }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ apt.startTime }} · Dr. {{ apt.doctor }}
                    </div>
                  </div>
                  <VChip
                    size="x-small"
                    :color="getStatusCfg(apt.status).color"
                    variant="tonal"
                  >
                    {{ getStatusCfg(apt.status).label }}
                  </VChip>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- ── Hover Popup ───────────────────────────────────────────────── -->
      <Teleport to="body">
        <Transition name="popup-fade">
          <div
            v-if="hoveredApt"
            class="apt-popup"
            :style="{ left: `${popupX}px`, top: `${popupY}px` }"
          >
            <div class="popup-header">
              <VAvatar
                color="primary"
                variant="tonal"
                size="36"
                class="me-2"
              >
                <span class="text-caption font-weight-bold">{{ hoveredApt.pet?.charAt(0) }}</span>
              </VAvatar>
              <div>
                <div class="text-subtitle-2 font-weight-bold">
                  {{ hoveredApt.pet }}
                  <span
                    v-if="hoveredApt.petId"
                    class="text-caption text-medium-emphasis"
                  >&nbsp;{{ hoveredApt.petId }}</span>
                </div>
                <VChip
                  size="x-small"
                  :color="getStatusCfg(hoveredApt.status).color"
                  variant="flat"
                  class="mt-1"
                >
                  {{ getStatusCfg(hoveredApt.status).label }}
                </VChip>
              </div>
            </div>

            <VDivider class="my-2" />

            <div class="popup-meta">
              <div class="popup-meta-row">
                <VIcon
                  icon="tabler-user"
                  size="14"
                  class="me-1"
                />
                Owner: <strong>{{ hoveredApt.owner || '—' }}</strong>
              </div>
              <div class="popup-meta-row">
                <VIcon
                  icon="tabler-stethoscope"
                  size="14"
                  class="me-1"
                />
                Dr. <strong>{{ hoveredApt.doctor }}</strong>
              </div>
              <div
                v-if="hoveredApt.room"
                class="popup-meta-row"
              >
                <VIcon
                  icon="tabler-door"
                  size="14"
                  class="me-1"
                />
                Room: <strong>{{ hoveredApt.room }}</strong>
              </div>
              <div class="popup-meta-row">
                <VIcon
                  icon="tabler-clock"
                  size="14"
                  class="me-1"
                />
                {{ hoveredApt.startTime }}{{ hoveredApt.endTime ? ` – ${hoveredApt.endTime}` : '' }}
              </div>
            </div>

            <VDivider class="my-2" />

            <div class="popup-actions">
              <VBtn
                v-if="isReceptionist"
                size="x-small"
                color="error"
                variant="tonal"
              >
                Cancel
              </VBtn>
              <VBtn
                size="x-small"
                color="warning"
                variant="tonal"
              >
                Missed
              </VBtn>
              <VBtn
                size="x-small"
                color="info"
                variant="tonal"
              >
                Follow-up
              </VBtn>
              <VBtn
                v-if="isReceptionist"
                size="x-small"
                color="success"
                variant="tonal"
              >
                Payment
              </VBtn>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ── New Appointment Dialog ────────────────────────────────────── -->
      <MedicalAppointmentDialog
        v-if="vetStore.activeClinicId"
        v-model="showAppointmentDialog"
        :clinic-id="vetStore.activeClinicId"
        @success="fetchAppointments"
      />
    </div>
  </component>
</template>

<style scoped>
/* ── Outer Wrapper ────────────────────────────────────────────────────────── */
.schedule-wrap {
  padding: 24px;
  height: 100%;
}

/* ── Layout ──────────────────────────────────────────────────────────────── */
.sched-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
}

.sched-card { border-radius: 12px; overflow: hidden; }

/* ── Day Header Row ──────────────────────────────────────────────────────── */
.day-header-row {
  display: grid;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  position: sticky;
  top: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 2;
}

.time-gutter { border-right: 1px solid rgba(var(--v-border-color), 0.1); }

.day-header-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
  gap: 2px;
}

.day-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.day-num {
  font-size: 18px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.85);
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.today-badge {
  background: rgb(var(--v-theme-primary));
  color: #fff !important;
}

.day-header-today .day-label { color: rgb(var(--v-theme-primary)); }

/* ── Time Grid ───────────────────────────────────────────────────────────── */
.time-grid-scroll {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.time-grid {
  display: grid;
  position: relative;
}

/* ── Gutter Column ───────────────────────────────────────────────────────── */
.gutter-col {
  border-right: 1px solid rgba(var(--v-border-color), 0.1);
}

.gutter-slot {
  height: 32px;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.time-label {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  padding-right: 6px;
  padding-top: 1px;
  white-space: nowrap;
}

/* ── Day Columns ─────────────────────────────────────────────────────────── */
.day-col {
  position: relative;
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
}

.day-col-today { background: rgba(var(--v-theme-primary), 0.02); }

.grid-slot {
  height: 32px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05);
}

.hour-line { border-bottom-color: rgba(var(--v-border-color), 0.15); }

/* ── Appointment Blocks ──────────────────────────────────────────────────── */
.apt-block {
  position: absolute;
  left: 3px;
  right: 3px;
  border-radius: 6px;
  border-left: 3px solid;
  padding: 4px 6px;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 1;
}

.apt-block:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transform: translateY(-1px) scaleX(1.005);
  z-index: 5;
}

.apt-time {
  font-size: 9px;
  font-weight: 600;
  opacity: 0.7;
  line-height: 1;
}

.apt-name {
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.apt-room {
  font-size: 9px;
  opacity: 0.6;
}

/* ── Hover Popup ─────────────────────────────────────────────────────────── */
.apt-popup {
  position: fixed;
  z-index: 9999;
  width: 240px;
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  pointer-events: none;
}

.popup-header { display: flex; align-items: center; }

.popup-meta { display: flex; flex-direction: column; gap: 6px; }

.popup-meta-row {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex;
  align-items: center;
}

.popup-actions { display: flex; flex-wrap: wrap; gap: 4px; }

/* ── Popup Animation ─────────────────────────────────────────────────────── */
.popup-fade-enter-active,
.popup-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }

.popup-fade-enter-from,
.popup-fade-leave-to { opacity: 0; transform: translateY(4px) scale(0.97); }

/* ── Right Panel ─────────────────────────────────────────────────────────── */
.right-panel { display: flex; flex-direction: column; }

.status-counters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-counter-card {
  border-radius: 8px;
  border-left: 3px solid;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.counter-count { font-size: 22px; font-weight: 800; line-height: 1; }
.counter-label { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.6); }

/* ── Appointment List ────────────────────────────────────────────────────── */
.apt-list { display: flex; flex-direction: column; gap: 10px; max-height: 480px; overflow-y: auto; }

.apt-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-border-color), 0.08);
  transition: background 0.15s;
}

.apt-list-item:hover { background: rgba(var(--v-theme-primary), 0.05); }

.apt-list-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.apt-list-info { flex: 1; min-width: 0; }

/* ── View Toggle Active ──────────────────────────────────────────────────── */
.view-toggle .v-btn--active {
  background: rgb(var(--v-theme-primary)) !important;
  color: #fff !important;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
