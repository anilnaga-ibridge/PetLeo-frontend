<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { usePermissionStore } from '@/stores/permissionStore'
import MedicalAppointmentDialog from '@/components/veterinary/MedicalAppointmentDialog.vue'
import VitalsEntryForm from '@/components/veterinary/VitalsEntryForm.vue'
import VitalsSearchDialog from '@/components/veterinary/VitalsSearchDialog.vue'
import PetHistoryTimeline from '@/components/veterinary/PetHistoryTimeline.vue'

const props = defineProps({
  readonly: { type: Boolean, default: false },
  initialViewMode: { type: String, default: 'Week' },
  title: { type: String, default: 'OPERATIONS COMMAND CENTER' },
  subtitle: { type: String, default: 'Visit Management' },
  showHeader: { type: Boolean, default: true },
  showLeftSidebar: { type: Boolean, default: true },
  showRightSidebar: { type: Boolean, default: true },
})

const vetStore = useVeterinaryStore()
const permStore = usePermissionStore()

// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Constants ────────────────────────────────────────────────────────────────
const START_HOUR = 7
const END_HOUR = 21
const slotDuration = ref(15) // Make it a ref to be reactive
const TOTAL_SLOTS = computed(() => (END_HOUR - START_HOUR) * 60 / slotDuration.value)

// ─── View State ───────────────────────────────────────────────────────────────
const viewMode = ref(props.initialViewMode)
const selectedDate = ref(new Date())
const loading = ref(false)
const appointments = ref([])
const showAppointmentDialog = ref(false)
const showVitalsDialog = ref(false)
const showVitalsSearch = ref(false)
const vitalsApt = ref(null)

// ─── Sidebar collapse ─────────────────────────────────────────────────────────
const sidebarCollapsed = ref(false)

// ─── Filters & Sidebar ────────────────────────────────────────────────────────
const searchPatient = ref('')
const searchDoctorFilter = ref('')
const selectedDoctors = ref([])

const filters = ref({
  showEvents: true,
  cancelled: false,
  missed: true,
  normal: true,
})

// ─── Interaction Popover ──────────────────────────────────────────────────────
const popupX = ref(0)
const popupY = ref(0)
const selectedApt = ref(null) // Kept for vitals dialog reference

// ─── Current Time Line ────────────────────────────────────────────────────────
const currentTime = ref(new Date())
let timeTicker = null

// ─── History Tab State ───
const activeTab = ref('details') // 'details' or 'history'
const petHistoryLoading = ref(false)
const petHistoryData = ref([])

const handlePopoverOpen = (apt) => {
  selectedApt.value = apt
  activeTab.value = 'details'
}

const fetchHistory = async (petId) => {
  petHistoryLoading.value = true
  try {
    petHistoryData.value = await vetStore.fetchPetHistory(petId)
  } catch (e) {
    console.error("Failed to fetch history:", e)
  } finally {
    petHistoryLoading.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'history' && selectedApt.value?.pet_id) {
    fetchHistory(selectedApt.value.pet_id)
  }
})

const updateTime = () => { currentTime.value = new Date() }

onMounted(() => {
  timeTicker = setInterval(updateTime, 60000)
})
onUnmounted(() => {
  if (timeTicker) clearInterval(timeTicker)
})

const currentTimePosition = computed(() => {
  const h = currentTime.value.getHours()
  const m = currentTime.value.getMinutes()
  if (h < START_HOUR || h >= END_HOUR) return null
  const totalMins = (h - START_HOUR) * 60 + m
  const pixelsPerSlot = 40 // Height of one slot in the grid
  const slotsPerMin = 1 / slotDuration.value
  
  return totalMins * (pixelsPerSlot * slotsPerMin)
})

const dayCount = computed(() => {
  if (viewMode.value === 'Day') return 1
  if (viewMode.value === '4Days') return 4
  
  return 7
})

const timeSlots = computed(() => {
  const slots = []
  for (let h = START_HOUR; h < END_HOUR; h++) {
    for (let m = 0; m < 60; m += slotDuration.value) {
      slots.push({
        h, m,
        label: m === 0 ? `${String(h).padStart(2, '0')}:00` : '',
        timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      })
    }
  }
  
  return slots
})

const weekDays = computed(() => {
  const base = new Date(selectedDate.value)
  if (viewMode.value === 'Week') {
    const dow = base.getDay()

    base.setDate(base.getDate() - dow)
  }
  
  return Array.from({ length: dayCount.value }, (_, i) => {
    const d = new Date(base)

    d.setDate(base.getDate() + i)
    
    return d
  })
})

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Status Design System ─────────────────────────────────────────────────────
const statusConfig = {
  SCHEDULED: { color: '#F59E0B', bgClass: 'bg-orange-500 border-orange-400', bg: '#FEF3C7', label: 'Scheduled' },
  WAITING: { color: '#10B981', bgClass: 'bg-emerald-500 border-emerald-400', bg: '#D1FAE5', label: 'Waiting'   },
  ENGAGED: { color: '#8B5CF6', bgClass: 'bg-violet-500 border-violet-400', bg: '#EDE9FE', label: 'Engaged'   },
  DONE: { color: '#3B82F6', bgClass: 'bg-blue-500 border-blue-400', bg: '#DBEAFE', label: 'Done'      },
  CANCELLED: { color: '#EF4444', bgClass: 'bg-red-500 border-red-400', bg: '#FEE2E2', label: 'Cancelled' },
  MISSED: { color: '#6B7280', bgClass: 'bg-gray-500 border-gray-400', bg: '#F3F4F6', label: 'Missed'    },
}

const getStatusCfg = status => statusConfig[status?.toUpperCase()] || statusConfig.SCHEDULED

// ─── Appointment Positioning ──────────────────────────────────────────────────

const getGridRow = startTimeStr => {
  if (!startTimeStr) return 1
  const [h, m] = startTimeStr.split(':').map(Number)
  const minsFrom7AM = (h - START_HOUR) * 60 + m
  
  return Math.floor(minsFrom7AM / slotDuration.value) + 1
}

const getRowSpan = (startTimeStr, endTimeStr) => {
  if (!endTimeStr) return 1
  const [sh, sm] = startTimeStr.split(':').map(Number)
  const [eh, em] = endTimeStr.split(':').map(Number)
  const durMins = (eh * 60 + em) - (sh * 60 + sm)
  
  return Math.max(Math.floor(durMins / slotDuration.value), 1)
}

const getGridColumn = dateStr => {
  if (!dateStr) return 2

  // Find which column it maps to in weekDays
  const index = weekDays.value.findIndex(d => d.toLocaleDateString('en-CA') === dateStr)
  
  return index >= 0 ? index + 2 : 2
}

// ─── Consultants List ──────────────────────────────────────────────────────────
const doctors = ref([])

const filteredDoctors = computed(() => {
  return doctors.value.map(d => {
    const count = appointments.value.filter(a =>
      a.doctor_id === d.id ||
      a.doctor_name?.toLowerCase() === d.name?.toLowerCase(),
    ).length

    
    return { ...d, count }
  }).filter(d => d.name?.toLowerCase().includes(searchDoctorFilter.value.toLowerCase()))
})

// ─── Summary Stats ────────────────────────────────────────────────────────────
const todayStr = computed(() => new Date().toLocaleDateString('en-CA'))
const todaysAptsDisplay = computed(() => appointments.value.filter(a => a.date === todayStr.value))

const summaryStats = computed(() => {
  const apts = todaysAptsDisplay.value
  
  return [
    { label: 'Total',     count: apts.length,                                                                  color: '#F59E0B', icon: 'tabler-calendar' },
    { label: 'Waiting',   count: apts.filter(a => a.status === 'WAITING').length,                              color: '#10B981', icon: 'tabler-clock' },
    { label: 'Engaged',   count: apts.filter(a => a.status === 'ENGAGED').length,                              color: '#8B5CF6', icon: 'tabler-activity' },
    { label: 'Completed', count: apts.filter(a => ['COMPLETED', 'DONE'].includes(a.status)).length,             color: '#3B82F6', icon: 'tabler-circle-check' },
  ]
})

const fetchConsultants = async () => {
  if (!vetStore.activeClinicId) return
  try {
    const res = await vetStore.fetchClinicConsultants(vetStore.activeClinicId)

    doctors.value = res
  } catch (err) {
    console.error('Failed to fetch consultants:', err)
  }
}

// ─── Data Fetch ───────────────────────────────────────────────────────────────
const fetchAppointments = async () => {
  if (!vetStore.activeClinicId) return
  loading.value = true
  try {
    const from = weekDays.value[0].toLocaleDateString('en-CA')
    const to = weekDays.value[weekDays.value.length - 1].toLocaleDateString('en-CA')

    const res = await vetStore.fetchMedicalAppointments({
      clinic: vetStore.activeClinicId,
      date_from: from,
      date_to: to,
    })

    appointments.value = (res || []).map(a => {
      const start = a.start_datetime ? new Date(a.start_datetime) : null
      const end = a.end_datetime ? new Date(a.end_datetime) : null
      
      const startTime = start ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}` : '09:00'
      const endTime = end ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}` : null
      const date = start ? start.toLocaleDateString('en-CA') : a.appointment_date

      return {
        ...a,
        date,
        startTime,
        endTime,
        pet: a.pet_name || 'Pet',
        pet_id: a.pet_details?.id || a.pet,
        pet_photo: a.pet_details?.pet_photo,
        species: a.pet_details?.species || 'Dog',
        doctor: a.doctor_name || 'Unassigned',
        status: a.status || 'SCHEDULED',
      }
    })
  } catch (err) {
    console.error('Schedule fetch failed:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAppointments()
  fetchConsultants()
})

watch([selectedDate, viewMode, slotDuration], fetchAppointments)
watch(() => vetStore.activeClinicId, () => {
  fetchAppointments()
  fetchConsultants()
})

const goToday = () => { selectedDate.value = new Date() }
const isToday = day => day.toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')

const navigate = dir => {
  const d = new Date(selectedDate.value)
  const step = viewMode.value === 'Day' ? 1 : viewMode.value === '4Days' ? 4 : 7

  d.setDate(d.getDate() + dir * step)
  selectedDate.value = d
}

const handleAction = async (apt, actionType) => {
  console.log('Action triggered:', actionType, 'on appointment', apt.id)

  // Backend patch integration placeholder
  hidePopup()
}

const handleCheckIn = async apt => {
  if (!apt) return
  loading.value = true
  try {
    const res = await vetStore.checkInAppointment(apt.id)
    if (res.status === 'success') {
      // Refresh
      await fetchAppointments()
    }
  } catch (err) {
    console.error('Check-in failed:', err)
  } finally {
    loading.value = false
  }
}

const hidePopup = () => { selectedApt.value = null }

defineExpose({ fetchAppointments, goToday })
</script>

<template>
  <div class="occ-shell">
    <!-- ═══════════════════════════ TOP HEADER ══════════════════════════ -->
    <header
      v-if="showHeader"
      class="occ-header"
    >
      <div class="header-brand">
        <div class="brand-label">
          <VIcon
            icon="tabler-command"
            size="14"
          />
          {{ title }}
        </div>
        <h1 class="brand-title">
          {{ subtitle }}
        </h1>
      </div>

      <div class="header-center">
        <div class="search-pill">
          <VIcon
            icon="tabler-search"
            size="16"
            class="search-icon"
          />
          <input
            v-model="searchPatient"
            placeholder="Search patient or appointment…"
            class="search-input"
          >
        </div>
        <VBtn 
          color="primary" 
          variant="flat" 
          size="small" 
          class="ms-4 rounded-lg font-weight-black text-none"
          prepend-icon="tabler-bolt"
          @click="showVitalsSearch = true"
        >
          Quick Vitals
        </VBtn>
      </div>

      <div class="header-actions">
        <VBtn
          icon="tabler-bell"
          variant="text"
          color="secondary"
          density="compact"
          class="header-btn"
        />
        <VBtn
          icon="tabler-refresh"
          variant="text"
          :loading="loading"
          color="secondary"
          density="compact"
          class="header-btn"
          @click="fetchAppointments"
        />
        <VAvatar
          size="36"
          color="primary"
          variant="tonal"
          class="cursor-pointer"
        >
          <VIcon
            icon="tabler-user"
            size="20"
          />
        </VAvatar>
      </div>
    </header>

    <!-- ═══════════════════════════ BODY ════════════════════════════════ -->
    <div
      class="occ-body"
      :class="{ 'no-left': !showLeftSidebar, 'no-right': !showRightSidebar }"
    >
      <!-- ── LEFT SIDEBAR ─────────────────────────────────────────────── -->
      <aside
        v-if="showLeftSidebar"
        class="sidebar-left"
      >
        <!-- Consultants -->
        <div class="sb-section">
          <div class="sb-section-header">
            <div class="sb-section-title">
              <VIcon
                icon="tabler-stethoscope"
                size="15"
              />
              Consultants
            </div>
            <VBtn
              variant="text"
              color="primary"
              size="x-small"
              icon="tabler-settings-2"
              density="compact"
            />
          </div>
          <div class="search-mini">
            <VIcon
              icon="tabler-search"
              size="14"
              class="mini-search-icon"
            />
            <input
              v-model="searchDoctorFilter"
              placeholder="Search doctor..."
              class="mini-search-input"
            >
          </div>
          <div class="doctor-list">
            <div
              v-if="doctors.length === 0"
              class="empty-state-sm"
            >
              <VIcon
                icon="tabler-users-off"
                size="28"
                class="empty-icon"
              />
              <p>No staff found</p>
            </div>
            <div
              v-for="doc in filteredDoctors"
              :key="doc.id"
              class="doc-row"
              :class="{ 'doc-row--active': selectedDoctors.includes(doc.id) }"
              @click="selectedDoctors.includes(doc.id) ? selectedDoctors = selectedDoctors.filter(id => id !== doc.id) : selectedDoctors.push(doc.id)"
            >
              <div
                class="doc-avatar"
                :style="{ background: selectedDoctors.includes(doc.id) ? '#3B82F6' : '#CBD5E1' }"
              >
                {{ (doc.name || 'D').split(' ').pop()?.charAt(0) }}
              </div>
              <span class="doc-name">{{ doc.name }}</span>
              <span
                class="doc-badge"
                :style="{ background: selectedDoctors.includes(doc.id) ? '#EFF6FF' : '#F8FAFC', color: selectedDoctors.includes(doc.id) ? '#3B82F6' : '#94A3B8' }"
              >
                {{ doc.count }}
              </span>
            </div>
          </div>
        </div>

        <div class="sb-divider" />

        <!-- Filters -->
        <div class="sb-section">
          <div class="sb-section-title">
            <VIcon
              icon="tabler-filter"
              size="15"
            />
            Filters
          </div>
          <div class="filter-list">
            <label class="filter-row">
              <input
                v-model="filters.showEvents"
                type="checkbox"
                class="filter-check"
              >
              <span
                class="filter-dot"
                style="background:#3B82F6"
              />
              Show Events
            </label>
            <label class="filter-row">
              <input
                v-model="filters.cancelled"
                type="checkbox"
                class="filter-check"
              >
              <span
                class="filter-dot"
                style="background:#EF4444"
              />
              Cancelled
            </label>
            <label class="filter-row">
              <input
                v-model="filters.missed"
                type="checkbox"
                class="filter-check"
              >
              <span
                class="filter-dot"
                style="background:#F59E0B"
              />
              Missed
            </label>
          </div>
        </div>

        <div class="sb-divider" />

        <!-- Settings -->
        <div class="sb-section">
          <div class="sb-section-title">
            <VIcon
              icon="tabler-adjustments-horizontal"
              size="15"
            />
            Settings
          </div>
          <div class="setting-row">
            <span class="setting-label">Slot Duration</span>
            <select
              v-model="slotDuration"
              class="slot-select"
            >
              <option :value="15">
                15 mins
              </option>
              <option :value="30">
                30 mins
              </option>
              <option :value="60">
                60 mins
              </option>
            </select>
          </div>
        </div>
      </aside>

      <!-- ── CALENDAR CENTER ───────────────────────────────────────────── -->
      <main class="cal-main">
        <!-- Nav Bar -->
        <div class="cal-nav">
          <div class="cal-nav-left">
            <div class="nav-btn-group">
              <button
                class="nav-arrow"
                @click="navigate(-1)"
              >
                <VIcon
                  icon="tabler-chevron-left"
                  size="16"
                />
              </button>
              <button
                class="nav-today"
                @click="goToday"
              >
                Today
              </button>
              <button
                class="nav-arrow"
                @click="navigate(1)"
              >
                <VIcon
                  icon="tabler-chevron-right"
                  size="16"
                />
              </button>
            </div>
            <span class="cal-date-range">
              {{ weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
              –
              {{ weekDays[weekDays.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
            </span>
          </div>
          <div class="cal-nav-right">
            <VBtnToggle
              v-model="viewMode"
              mandatory
              density="compact"
              variant="flat"
              class="view-toggle"
              color="primary"
            >
              <VBtn
                value="Day"
                class="view-btn"
              >
                Day
              </VBtn>
              <VBtn
                value="4Days"
                class="view-btn"
              >
                4 Days
              </VBtn>
              <VBtn
                value="Week"
                class="view-btn"
              >
                Week
              </VBtn>
            </VBtnToggle>
          </div>
        </div>

        <!-- Grid -->
        <div class="grid-wrapper">
          <!-- Day Headers -->
          <div
            class="grid-day-headers grid bg-white border-b border-[#F1F5F9] sticky top-0 z-20 shadow-sm"
            :style="{ gridTemplateColumns: `80px repeat(${dayCount}, 1fr)` }"
          >
            <div class="corner" />
            <div
              v-for="day in weekDays"
              :key="day.toISOString()"
              class="day-header-cell"
              :class="{ 'day-header-cell--today': isToday(day) }"
            >
              <span class="day-name">{{ dayLabels[day.getDay()] }}</span>
              <span class="day-num">{{ day.getDate() }}/{{ day.getMonth() + 1 }}</span>
            </div>
          </div>

          <!-- Scroll Area -->
          <div class="grid-scroll relative overflow-y-auto">
            <div
              class="grid-canvas grid relative bg-white border-l border-b"
              :style="{
                gridTemplateColumns: `80px repeat(${dayCount}, 1fr)`,
                gridTemplateRows: `repeat(${TOTAL_SLOTS}, 40px)`
              }"
            >
              <!-- Now line -->
              <div
                v-if="currentTimePosition !== null"
                class="now-line"
                :style="{ top: `${currentTimePosition}px` }"
              >
                <div class="now-dot" />
              </div>

              <!-- Time labels (Y-axis) -->
              <div
                class="time-col border-r border-[#E2E8F0] bg-[#F8FAFC] z-10 sticky left-0"
                :style="{ gridRow: `1 / span ${TOTAL_SLOTS}` }"
              >
                <div 
                  v-for="slot in timeSlots" 
                  :key="slot.timeStr" 
                  class="h-[40px] flex items-start justify-end pr-2 text-[11px] font-semibold text-slate-400 border-b border-[#F8FAFC]"
                  :class="{ 'text-slate-500 border-b-slate-200': slot.m === 0 }"
                >
                  <span
                    v-if="slot.m === 0"
                    class="-translate-y-2"
                  >{{ slot.label }}</span>
                  <span
                    v-else-if="slot.m === 30"
                    class="-translate-y-2 text-[10px] opacity-60"
                  >{{ slot.timeStr }}</span>
                </div>
              </div>

              <!-- Vertical Day Dividers (X-axis) -->
              <div
                v-for="dayIdx in dayCount"
                :key="`divider-${dayIdx}`"
                class="border-r border-[#F1F5F9] pointer-events-none"
                :style="{
                  gridColumn: dayIdx + 1,
                  gridRow: `1 / span ${TOTAL_SLOTS}`
                }"
              />

              <!-- Horizontal Time Lines (Spanning all days) -->
              <div
                v-for="(slot, idx) in timeSlots"
                :key="`line-${idx}`"
                class="border-b border-[#F8FAFC] pointer-events-none"
                :style="{
                  gridRow: idx + 1,
                  gridColumn: `2 / span ${dayCount}`
                }"
                :class="{ 'border-b-[#F1F5F9]': slot.m === 0 }"
              />

              <!-- Appointments (Absolute positioning strictly using grid lines) -->
              <VMenu
                v-for="apt in appointments"
                :key="apt.id"
                open-on-hover
                open-delay="100"
                close-delay="200"
                location="end"
                :offset="10"
              >
                <template #activator="{ props }">
                  <div
                    v-bind="props"
                    class="absolute left-1 right-2 rounded-lg shadow-sm text-white px-2 py-1 cursor-pointer hover:scale-[1.02] hover:shadow-md hover:z-50 transition-all duration-200 overflow-hidden border-l-4"
                    :class="[
                      getStatusCfg(apt.status).bgClass
                    ]"
                    :style="{
                      gridRow: `${getGridRow(apt.startTime)} / span ${getRowSpan(apt.startTime, apt.endTime)}`,
                      gridColumn: getGridColumn(apt.date),
                      zIndex: 20
                    }"
                  >
                    <div class="font-bold text-[11px] truncate leading-tight flex items-center gap-1">
                      {{ apt.pet }}
                      <VIcon
                        v-if="apt.status === 'WAITING'"
                        icon="tabler-medical-blood-pressure"
                        size="10"
                      />
                    </div>
                    <div class="text-[9px] font-semibold opacity-90 truncate">
                      {{ apt.startTime }} - {{ apt.endTime || '...' }}
                    </div>
                    <div
                      v-if="getRowSpan(apt.startTime, apt.endTime) > 1 && apt.room"
                      class="text-[9px] opacity-80 truncate"
                    >
                      Rm: {{ apt.room }}
                    </div>
                  </div>
                </template>

                <VCard
                  class="elevation-12 rounded-xl overflow-hidden"
                  min-width="380"
                  max-width="400"
                  border
                >
                  <!-- Premium Header matching mockup -->
                  <div class="pa-4 bg-premium-surface d-flex align-center gap-4">
                    <VAvatar
                      size="60"
                      class="rounded-xl border-2 border-white shadow-sm"
                    >
                      <VImg :src="apt.pet_photo || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=150'" />
                    </VAvatar>
                    <div class="flex-grow-1">
                      <div class="text-overline text-primary font-weight-black mb-n1">
                        Pet History: {{ apt.pet }}
                      </div>
                      <div class="text-h6 font-weight-black leading-tight">
                        {{ apt.pet }}
                        <span class="text-subtitle-2 font-weight-medium text-medium-emphasis">({{ apt.species || 'Golden Retriever' }})</span>
                      </div>
                    </div>
                    <VBtn
                      icon="tabler-x"
                      variant="text"
                      size="small"
                      color="secondary"
                      density="comfortable"
                    />
                  </div>

                  <!-- Tabs -->
                  <VTabs
                    v-model="activeTab"
                    grow
                    color="primary"
                    density="compact"
                    class="border-b"
                  >
                    <VTab value="details" class="text-none font-weight-bold">Details</VTab>
                    <VTab value="history" class="text-none font-weight-bold" @click="handlePopoverOpen(apt)">History</VTab>
                  </VTabs>

                  <VWindow v-model="activeTab" class="pa-0">
                    <VWindowItem value="details">
                      <div class="pa-4 d-flex flex-column gap-3">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center gap-2">
                            <VChip
                              size="x-small"
                              :color="getStatusCfg(apt.status).color"
                              variant="flat"
                              class="font-weight-black text-uppercase"
                            >
                              {{ getStatusCfg(apt.status).label }}
                            </VChip>
                            <span class="text-caption text-medium-emphasis font-weight-bold">
                              {{ apt.startTime }} - {{ apt.endTime }}
                            </span>
                          </div>
                          <div class="d-flex gap-1">
                            <VBtn icon="tabler-edit" size="x-small" variant="text" color="primary" />
                            <VBtn icon="tabler-trash" size="x-small" variant="text" color="error" />
                          </div>
                        </div>

                        <div class="d-flex align-center gap-3 bg-slate-50 pa-3 rounded-lg border">
                          <VAvatar size="32" color="primary" variant="tonal">
                            <VIcon icon="tabler-stethoscope" size="16" />
                          </VAvatar>
                          <div>
                            <div class="text-caption font-weight-black text-slate-500 uppercase leading-none mb-1">Assigned Doctor</div>
                            <div class="text-subtitle-2 font-weight-bold">Dr. {{ apt.doctor }}</div>
                          </div>
                        </div>

                        <div class="text-caption text-slate-500 font-weight-medium italic px-1">
                          "{{ apt.notes || 'No specific notes for this appointment.' }}"
                        </div>

                        <VDivider />

                        <!-- Actions -->
                        <div class="d-flex align-center justify-space-between pt-1">
                          <VBtn
                            variant="tonal"
                            color="error"
                            size="small"
                            class="rounded-lg font-weight-bold text-none"
                            @click="handleAction(apt, 'cancel')"
                          >Cancel</VBtn>
                          
                          <VBtn
                            variant="tonal"
                            color="warning"
                            size="small"
                            class="rounded-lg font-weight-bold text-none"
                            @click="handleAction(apt, 'missed')"
                          >Missed</VBtn>

                          <VBtn
                            v-if="['WAITING', 'ENGAGED'].includes(apt.status)"
                            color="success"
                            size="small"
                            class="rounded-lg font-weight-bold text-none"
                            @click="vitalsApt = apt; showVitalsDialog = true"
                          >Vitals</VBtn>

                          <VBtn
                            color="primary"
                            size="small"
                            class="rounded-lg font-weight-bold text-none shadow-sm"
                          >Start Visit</VBtn>
                        </div>
                      </div>
                    </VWindowItem>

                    <VWindowItem value="history">
                      <div class="pa-4" style="max-height: 400px; overflow-y: auto;">
                        <div class="sb-section-title mb-4">
                          <VIcon icon="tabler-history" size="15" />
                          Timeline
                        </div>
                        <PetHistoryTimeline 
                          :history="petHistoryData" 
                          :loading="petHistoryLoading" 
                        />
                      </div>
                    </VWindowItem>
                  </VWindow>
                </VCard>
              </VMenu>
            </div>
          </div>
        </div>
      </main>

      <!-- ── RIGHT SIDEBAR ─────────────────────────────────────────────── -->
      <aside
        v-if="showRightSidebar"
        class="sidebar-right"
      >
        <div class="sb-section-title mb-4">
          <VIcon
            icon="tabler-chart-bar"
            size="15"
          />
          Today's Schedule
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div
            v-for="stat in summaryStats"
            :key="stat.label"
            class="stat-card"
            :style="{ '--sc': stat.color }"
          >
            <VIcon
              :icon="stat.icon"
              size="18"
              :color="stat.color"
            />
            <span class="stat-val">{{ stat.count }}</span>
            <span class="stat-lbl">{{ stat.label }}</span>
          </div>
        </div>

        <div class="sb-divider mt-4" />

        <!-- Visit Logs -->
        <div class="logs-header">
          <div class="sb-section-title">
            <VIcon
              icon="tabler-list-details"
              size="15"
            />
            Visit Logs
          </div>
          <button class="logs-all-btn">
            All
          </button>
        </div>

        <div class="logs-list">
          <div
            v-if="todaysAptsDisplay.length === 0"
            class="empty-state-lg"
          >
            <div class="empty-icon-wrap">
              <VIcon
                icon="tabler-clipboard-off"
                size="32"
                color="#CBD5E1"
              />
            </div>
            <p class="empty-title">
              No logs yet
            </p>
            <p class="empty-sub">
              Appointments will appear here as patients arrive
            </p>
          </div>

          <div
            v-for="apt in todaysAptsDisplay"
            :key="apt.id"
            class="log-item"
          >
            <div
              class="log-dot"
              :style="{ background: getStatusCfg(apt.status).color }"
            />
            <div class="log-info">
              <span class="log-name">{{ apt.pet }}</span>
              <span class="log-meta">{{ apt.startTime }} · Dr. {{ apt.doctor.split(' ').pop() }}</span>
            </div>
            <span
              class="log-badge"
              :style="{ background: getStatusCfg(apt.status).bg, color: getStatusCfg(apt.status).color }"
            >
              {{ apt.status?.toLowerCase() }}
            </span>
            
            <div class="log-actions ms-2">
              <VBtn 
                v-if="['SCHEDULED', 'CONFIRMED'].includes(apt.status)" 
                icon="tabler-door-enter" 
                size="x-small" 
                color="success" 
                variant="tonal" 
                class="rounded-md"
                title="Check In"
                @click.stop="handleCheckIn(apt)"
              />
              <VBtn 
                v-if="['WAITING', 'ENGAGED'].includes(apt.status)" 
                icon="tabler-medical-blood-pressure" 
                size="x-small" 
                color="primary" 
                variant="flat" 
                class="rounded-md"
                title="Record Vitals"
                @click.stop="vitalsApt = apt; showVitalsDialog = true"
              />
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- POPUP HAS BEEN REPLACED BY VUETIFY VMENU IN THE TEMPLATE ABOVE, SAFE TO REMOVE TELEPORT -->

    <MedicalAppointmentDialog
      v-model="showAppointmentDialog"
      :clinic-id="vetStore.activeClinicId"
      @success="fetchAppointments"
    />

    <VDialog
      v-model="showVitalsDialog"
      max-width="800"
    >
      <VCard class="rounded-xl overflow-hidden">
        <VCardTitle class="pa-6 border-b d-flex align-center justify-space-between bg-premium-surface">
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="primary"
              variant="tonal"
              size="44"
            >
              <VIcon icon="tabler-medical-blood-pressure" />
            </VAvatar>
            <div>
              <div class="text-h5 font-weight-black">
                Collect Vitals
              </div>
              <div class="text-caption font-weight-bold opacity-60">
                Patient: {{ vitalsApt?.pet }}
              </div>
            </div>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="secondary"
            @click="showVitalsDialog = false"
          />
        </VCardTitle>
        <VCardText class="pa-6">
          <VitalsEntryForm 
            v-if="vitalsApt?.visit_id" 
            :visit-id="vitalsApt.visit_id" 
            :pet="vitalsApt.pet_details || {}"
            @submitted="showVitalsDialog = false; fetchAppointments()"
            @cancel="showVitalsDialog = false"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <VitalsSearchDialog
      v-model="showVitalsSearch"
      @selected="vitalsApt = $event; showVitalsDialog = true; showVitalsSearch = false"
    />
  </div>
</template>

<style scoped>
/* ── Shell ── */
.occ-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1E293B;
  overflow: hidden;
}

/* ── Header ── */
.occ-header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 68px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-shrink: 0;
  z-index: 10;
}
.header-brand { flex-shrink: 0; }
.brand-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6366F1;
  margin-bottom: 2px;
}
.brand-title {
  font-size: 20px;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1;
}
.header-center { flex-grow: 1; display: flex; justify-content: center; }
.search-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F1F5F9;
  border-radius: 12px;
  padding: 8px 16px;
  width: 320px;
  transition: background 0.2s;
}
.search-pill:focus-within { background: #E2E8F0; box-shadow: 0 0 0 2px #6366F120; }
.search-icon { color: #94A3B8; flex-shrink: 0; }
.search-input { border: none; background: transparent; outline: none; font-size: 14px; color: #334155; width: 100%; }
.search-input::placeholder { color: #94A3B8; }

.header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.header-btn { border-radius: 10px !important; }

/* ── Body Grid ── */
.occ-body {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  flex-grow: 1;
  overflow: hidden;
  min-height: 0;
}
.occ-body.no-left { grid-template-columns: 0 1fr 300px; }
.occ-body.no-right { grid-template-columns: 260px 1fr 0; }

/* ── Sidebars shared ── */
.sidebar-left,
.sidebar-right {
  background: #fff;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.sidebar-left { border-right: 1px solid #F1F5F9; }
.sidebar-right { border-left: 1px solid #F1F5F9; }

.sb-section { padding: 8px 0; }
.sb-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.sb-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748B;
  margin-bottom: 12px;
}
.sb-divider { height: 1px; background: #F1F5F9; margin: 12px 0; }

/* Doctor search mini */
.search-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 7px 12px;
  margin-bottom: 10px;
}
.mini-search-icon { color: #CBD5E1; flex-shrink: 0; }
.mini-search-input { border: none; background: transparent; outline: none; font-size: 13px; color: #334155; width: 100%; }
.mini-search-input::placeholder { color: #CBD5E1; }

/* Doctor list */
.doctor-list { display: flex; flex-direction: column; gap: 4px; }
.doc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;
}
.doc-row:hover { background: #F8FAFC; border-color: #E2E8F0; }
.doc-row--active { background: #EFF6FF; border-color: #BFDBFE; }
.doc-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  transition: background 0.2s;
}
.doc-name { flex-grow: 1; font-size: 13px; font-weight: 600; color: #334155; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.doc-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  flex-shrink: 0;
  transition: all 0.2s;
}

/* Filters */
.filter-list { display: flex; flex-direction: column; gap: 2px; }
.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  transition: background 0.15s;
}
.filter-row:hover { background: #F8FAFC; }
.filter-check { accent-color: #6366F1; cursor: pointer; }
.filter-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Settings */
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
.setting-label { font-size: 13px; font-weight: 500; color: #475569; }
.slot-select {
  padding: 6px 10px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: white;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.slot-select:focus { border-color: #6366F1; }

/* Empty state small */
.empty-state-sm {
  text-align: center;
  padding: 24px 12px;
  border: 1.5px dashed #E2E8F0;
  border-radius: 12px;
  color: #CBD5E1;
}
.empty-state-sm .empty-icon { opacity: 0.4; display: block; margin: 0 auto 6px; }
.empty-state-sm p { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0; }

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 12px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--sc) 8%, white);
  border: 1.5px solid color-mix(in srgb, var(--sc) 18%, transparent);
  transition: transform 0.15s;
  cursor: default;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-val { font-size: 22px; font-weight: 900; color: var(--sc); line-height: 1; }
.stat-lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; text-align: center; }
.mb-4 { margin-bottom: 16px; }

/* Logs */
.logs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.logs-all-btn { font-size: 11px; font-weight: 700; color: #6366F1; background: none; border: none; cursor: pointer; padding: 2px 8px; border-radius: 6px; transition: background 0.15s; }
.logs-all-btn:hover { background: #EEF2FF; }

.logs-list { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex-grow: 1; }

/* Empty state large */
.empty-state-lg {
  text-align: center;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #F8FAFC;
  border: 1.5px dashed #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.empty-title { font-size: 14px; font-weight: 700; color: #94A3B8; margin: 0; }
.empty-sub { font-size: 12px; color: #CBD5E1; margin: 0; line-height: 1.5; text-align: center; }

.log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #FAFAFA;
  border: 1px solid #F1F5F9;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
}
.log-item:hover { background: #F8FAFC; border-color: #E2E8F0; }
.log-dot { width: 4px; border-radius: 4px; align-self: stretch; min-height: 32px; flex-shrink: 0; }
.log-info { flex-grow: 1; overflow: hidden; }
.log-name { display: block; font-size: 13px; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-meta { display: block; font-size: 11px; font-weight: 500; color: #94A3B8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: capitalize;
  flex-shrink: 0;
  white-space: nowrap;
}

/* ── Calendar Main ── */
.cal-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #F8FAFC;
  overflow: hidden;
}

/* Cal Nav */
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #F1F5F9;
  height: 56px;
  flex-shrink: 0;
}
.cal-nav-left { display: flex; align-items: center; gap: 12px; }
.cal-nav-right { display: flex; align-items: center; gap: 8px; }
.nav-btn-group { display: flex; align-items: center; background: #F1F5F9; border-radius: 10px; padding: 3px; gap: 2px; }
.nav-arrow {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #64748B;
  transition: background 0.15s;
}
.nav-arrow:hover { background: #fff; color: #334155; }
.nav-today {
  background: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
  color: #6366F1;
  padding: 4px 12px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  transition: background 0.15s;
}
.nav-today:hover { background: #EEF2FF; }
.cal-date-range { font-size: 14px; font-weight: 700; color: #334155; }

.view-toggle { background: #F1F5F9 !important; border-radius: 10px !important; padding: 3px; }
.view-toggle :deep(.v-btn) { border-radius: 8px !important; font-weight: 800; font-size: 11px !important; height: 28px !important; min-width: 48px; text-transform: none !important; }

/* Grid */
.grid-wrapper { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
.grid-day-headers {
  display: grid;
  background: white;
  border-bottom: 1.5px solid #F1F5F9;
  flex-shrink: 0;
  z-index: 10;
}
.corner { background: white; border-right: 1px solid #F1F5F9; }
.day-header-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  border-right: 1px solid #F8FAFC;
  position: relative;
}
.day-header-cell--today::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  background: #6366F1;
  border-radius: 2px 2px 0 0;
}
.day-name { font-size: 10px; font-weight: 800; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; }
.day-num { font-size: 16px; font-weight: 900; color: #1E293B; line-height: 1.2; }
.day-header-cell--today .day-num { color: #6366F1; }

.grid-scroll { flex-grow: 1; overflow-y: auto; position: relative; }
.grid-canvas { display: grid; position: relative; }

.time-col { background: white; border-right: 1px solid #F1F5F9; z-index: 5; }
.time-cell { height: 40px; display: flex; align-items: flex-start; justify-content: flex-end; padding-right: 10px; font-size: 10px; color: #CBD5E1; font-weight: 600; transform: translateY(-8px); user-select: none; }
.time-cell--hour { color: #94A3B8; font-weight: 700; }

.day-col { position: relative; border-right: 1px solid #F1F5F9; }
.day-col--today { background: rgba(99, 102, 241, 0.01); }
.grid-cell { height: 40px; border-bottom: 1px solid rgba(241, 245, 249, 0.7); }
.grid-cell--hour { border-bottom: 1px solid #F1F5F9; }

/* Appointments */
.apt-block {
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 8px;
  padding: 5px 8px;
  background: var(--apt-color);
  color: white;
  z-index: 10;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  overflow: hidden;
  border-left: 3px solid rgba(255,255,255,0.35);
}
.apt-block--checked-in {
  background: linear-gradient(135deg, var(--apt-color), color-mix(in srgb, var(--apt-color), white 20%)) !important;
  border: 1.5px solid rgba(255,255,255,0.5);
}
.checked-in-pulse {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.2);
  animation: checked-in-pulse-anim 2s infinite;
  pointer-events: none;
}
@keyframes checked-in-pulse-anim {
  0% { opacity: 0.1; }
  50% { opacity: 0.4; }
  100% { opacity: 0.1; }
}
.apt-block:hover { transform: scale(1.02); z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
.apt-time { display: block; font-size: 9px; font-weight: 800; opacity: 0.85; }
.apt-name { display: block; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Now indicator */
.now-line { position: absolute; left: 0; right: 0; height: 2px; background: #6366F1; z-index: 20; pointer-events: none; }
.now-dot { position: absolute; left: 68px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #6366F1; border: 2px solid white; box-shadow: 0 0 8px rgba(99,102,241,0.5); }

/* ── Popover ── */
.apt-popup { position: fixed; z-index: 99999; width: 380px; }
.popup-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04);
  overflow: hidden;
}
.popup-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  position: relative;
}
.popup-avatar { border-radius: 14px !important; border: 2px solid rgba(255,255,255,0.7); }
.popup-hero-info { flex-grow: 1; overflow: hidden; }
.popup-pet-name { font-size: 18px; font-weight: 800; color: #1E293B; margin: 0 0 2px; }
.popup-owner { font-size: 12px; color: #94A3B8; font-weight: 500; margin: 0; }
.popup-close {
  position: absolute;
  top: 16px; right: 16px;
  background: rgba(0,0,0,0.06);
  border: none;
  border-radius: 8px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #64748B;
  transition: background 0.15s;
}
.popup-close:hover { background: rgba(0,0,0,0.1); }

.popup-body { padding: 16px 20px 20px; }
.popup-status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.popup-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.popup-status-label { font-size: 13px; font-weight: 700; flex-grow: 1; }
.popup-time { font-size: 12px; color: #94A3B8; font-weight: 600; }
.pulse-dot { animation: blink 2s ease-in-out infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.popup-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.popup-btn {
  padding: 10px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.popup-btn--cancel   { background: #FEE2E2; color: #EF4444; } .popup-btn--cancel:hover   { background: #FECACA; }
.popup-btn--missed   { background: #FEF3C7; color: #F59E0B; } .popup-btn--missed:hover   { background: #FDE68A; }
.popup-btn--vitals   { background: #D1FAE5; color: #059669; grid-column: span 2; } .popup-btn--vitals:hover   { background: #A7F3D0; }
.popup-btn--followup { background: #E0F2FE; color: #0284C7; } .popup-btn--followup:hover { background: #BAE6FD; }
.popup-btn--payment  { background: #6366F1; color: white;   } .popup-btn--payment:hover  { background: #4F46E5; }

/* Vitals in Popup */
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
  gap: 8px;
  background: #F8FAFC;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #F1F5F9;
}
.vital-chip {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}
.vital-chip :deep(.v-icon) {
  color: #6366F1;
  opacity: 0.7;
}

/* Transitions */
.pop-enter-active, .pop-leave-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.95) translateY(8px); }

/* Scrollbar */
.sidebar-left::-webkit-scrollbar,
.sidebar-right::-webkit-scrollbar,
.grid-scroll::-webkit-scrollbar { width: 4px; }
.sidebar-left::-webkit-scrollbar-track,
.sidebar-right::-webkit-scrollbar-track,
.grid-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-left::-webkit-scrollbar-thumb,
.sidebar-right::-webkit-scrollbar-thumb,
.grid-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
</style>
