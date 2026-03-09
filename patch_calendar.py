import re

file_path = "/Users/PraveenWorks/Anil Works/PetLeo-frontend/src/components/veterinary/ScheduleCalendar.vue"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Grid and Constants
content = content.replace("const slotDuration = ref(15)", "const slotDuration = 15")
content = content.replace("const TOTAL_SLOTS = computed(() => (END_HOUR - START_HOUR) * 60 / slotDuration.value)", "const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 60 / slotDuration")

# Remove redundant viewMode controls
content = content.replace("const viewMode = ref(props.initialViewMode)", "const viewMode = ref('Week')")
content = re.sub(r'const dayCount = computed\(\(\) => \{.+?return 7\s*\}\)', 'const dayCount = computed(() => 7)', content, flags=re.DOTALL)

# Refactor Positioning Logic
new_position_logic = """
const getGridRow = (timeStr) => {
  if (!timeStr) return 1
  const [h, m] = timeStr.split(':').map(Number)
  const minsFrom7AM = (h - START_HOUR) * 60 + m
  return Math.floor(minsFrom7AM / slotDuration) + 1
}

const getRowSpan = (startTime, endTime) => {
  if (!endTime) return 1
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const durMins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(Math.floor(durMins / slotDuration), 1)
}

const getGridColumn = (dateStr) => {
  if (!dateStr) return 2
  const targetDate = new Date(dateStr)
  // Find which column (index 0-6) it maps to in weekDays
  const index = weekDays.value.findIndex(d => d.toISOString().split('T')[0] === dateStr)
  return index >= 0 ? index + 2 : 2
}
"""

content = re.sub(r'const calculateGridRow =.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'const calculateRowSpan =.*?\}', '', content, flags=re.DOTALL)
content = content.replace("// ─── Appointment Positioning ──────────────────────────────────────────────────", "// ─── Appointment Positioning ──────────────────────────────────────────────────\n" + new_position_logic)

# Replace Grid HTML
grid_old = """          <!-- Scroll Area -->
          <div class="grid-scroll">
            <div
              class="grid-canvas"
              :style="`grid-template-columns: 72px repeat(${dayCount}, 1fr); grid-template-rows: repeat(${TOTAL_SLOTS}, 32px)`"
            >"""

grid_new = """          <!-- Scroll Area -->
          <div class="grid-scroll relative overflow-y-auto">
            <div
              class="grid-canvas grid relative bg-white border-l border-b"
              :style="`grid-template-columns: 80px repeat(7, 1fr); grid-template-rows: repeat(${TOTAL_SLOTS}, 40px)`"
            >"""
content = content.replace(grid_old, grid_new)

# Update Time Column
time_col_old = """              <!-- Time labels -->
              <div class="time-col" :style="`grid-row: 1 / span ${TOTAL_SLOTS}`">
                <div v-for="slot in timeSlots" :key="slot.timeStr" class="time-cell" :class="{ 'time-cell--hour': slot.m === 0 }">
                  <span v-if="slot.m === 0">{{ slot.label }}</span>
                </div>
              </div>"""

time_col_new = """              <!-- Time labels -->
              <div class="time-col border-r border-[#E2E8F0] bg-[#F8FAFC] z-10 sticky left-0" :style="`grid-row: 1 / span ${TOTAL_SLOTS}`">
                <div 
                  v-for="slot in timeSlots" 
                  :key="slot.timeStr" 
                  class="h-[40px] flex items-start justify-end pr-2 text-[11px] font-semibold text-slate-400 border-b border-[#F1F5F9]"
                  :class="{ 'text-slate-500 border-b-slate-200': slot.m === 0 }"
                >
                  <span v-if="slot.m === 0" class="-translate-y-2">{{ slot.label }}</span>
                  <span v-else-if="slot.m === 30" class="-translate-y-2 text-[10px] opacity-60">{{ slot.timeStr }}</span>
                </div>
              </div>"""
content = content.replace(time_col_old, time_col_new)

# Add day columns exactly as CSS Grid requested (not absolute col overlays but true grid lines)
day_cols_old = """              <!-- Day Columns -->
              <div
                v-for="(day, dIdx) in weekDays"
                :key="day.toISOString()"
                class="day-col"
                :class="{ 'day-col--today': isToday(day) }"
                :style="`grid-column: ${dIdx + 2}; grid-row: 1 / span ${TOTAL_SLOTS}`"
              >
                <div v-for="slot in timeSlots" :key="`cell-${slot.timeStr}`" class="grid-cell" :class="{ 'grid-cell--hour': slot.m === 0 }" />

                <div
                  v-for="apt in appointmentsForDay(day)"
                  :key="apt.id"
                  class="apt-block"
                  :class="{ 'apt-block--checked-in': apt.status === 'WAITING' }"
                  :style="{
                    gridRow: `${calculateGridRow(apt.startTime)} / span ${calculateRowSpan(apt.startTime, apt.endTime)}`,
                    '--apt-color': getStatusCfg(apt.status).color,
                  }"
                  @click="openAptDetails(apt, $event)"
                >
                  <div v-if="apt.status === 'WAITING'" class="checked-in-pulse" />
                  <span class="apt-time">{{ apt.startTime }}</span>
                  <span class="apt-name">
                    {{ apt.pet }}
                    <VIcon v-if="apt.status === 'WAITING'" icon="tabler-medical-blood-pressure" size="10" class="ms-1" />
                  </span>
                </div>
              </div>"""

day_cols_new = """              <!-- Grid Background Lines -->
              <div
                v-for="dayIdx in 7"
                :key="`bg-col-${dayIdx}`"
                class="border-r border-[#F1F5F9]"
                :style="`grid-column: ${dayIdx + 1}; grid-row: 1 / span ${TOTAL_SLOTS}; pointer-events: none;`"
              >
                <div v-for="slot in timeSlots" :key="`cell-${slot.timeStr}`" class="h-[40px] border-b border-dashed border-[#F1F5F9]" :class="{'border-solid border-[#E2E8F0]': slot.m === 0}" />
              </div>

              <!-- Appointments (Absolute positioning strictly using grid lines) -->
              <div
                v-for="apt in appointments"
                :key="apt.id"
                class="absolute left-1 right-2 rounded-lg shadow-sm text-white px-2 py-1 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:z-50 transition-all duration-200 overflow-hidden border-l-4"
                :style="{
                  gridRow: `${getGridRow(apt.startTime)} / span ${getRowSpan(apt.startTime, apt.endTime)}`,
                  gridColumn: getGridColumn(apt.date),
                  backgroundColor: getStatusCfg(apt.status).color,
                  borderColor: 'rgba(255,255,255,0.4)',
                  zIndex: 20
                }"
                @click="openAptDetails(apt, $event)"
              >
                <div class="font-bold text-[11px] truncate leading-tight flex items-center gap-1">
                  {{ apt.pet }}
                  <VIcon v-if="apt.status === 'WAITING'" icon="tabler-medical-blood-pressure" size="10" />
                </div>
                <div class="text-[9px] font-semibold opacity-90 truncate">{{ apt.startTime }} - {{ apt.endTime || '...' }}</div>
                <div class="text-[9px] opacity-80 truncate" v-if="getRowSpan(apt.startTime, apt.endTime) > 1 && apt.room">Rm: {{ apt.room }}</div>
              </div>"""

content = content.replace(day_cols_old, day_cols_new)

# Popover updates with RBAC
popup_old = """              <div class="popup-actions">
                <button class="popup-btn popup-btn--cancel">Cancel</button>
                <button 
                  v-if="['WAITING', 'ENGAGED'].includes(selectedApt.status) && selectedApt.visit_id" 
                  class="popup-btn popup-btn--vitals"
                  @click="vitalsApt = selectedApt; showVitalsDialog = true; selectedApt = null"
                >
                  Collect Vitals
                </button>
                <button class="popup-btn popup-btn--missed">Missed</button>
                <button 
                  v-if="['SCHEDULED', 'CONFIRMED'].includes(selectedApt.status)"
                  class="popup-btn popup-btn--checkin"
                  @click="handleCheckIn(selectedApt)"
                  :disabled="loading"
                >
                  <VIcon icon="tabler-door-enter" size="16" class="me-1" />
                  Check In
                </button>
                <button class="popup-btn popup-btn--followup">Follow-up</button>
                <button class="popup-btn popup-btn--payment">Payment</button>
              </div>"""

popup_new = """              <div class="popup-actions" v-if="selectedApt">
                <button v-if="permStore.hasPermission('VETERINARY_RECEPTION')" class="popup-btn popup-btn--cancel" @click="handleAction(selectedApt, 'cancel')">Cancel</button>
                
                <button 
                  v-if="permStore.hasPermission('VETERINARY_VITALS') && ['WAITING', 'ENGAGED'].includes(selectedApt.status)" 
                  class="popup-btn popup-btn--vitals"
                  @click="vitalsApt = selectedApt; showVitalsDialog = true; selectedApt = null"
                >
                  Collect Vitals
                </button>
                <button v-if="permStore.hasPermission('VETERINARY_RECEPTION')" class="popup-btn popup-btn--missed" @click="handleAction(selectedApt, 'missed')">Mark Missed</button>
                <button 
                  v-if="['SCHEDULED', 'CONFIRMED'].includes(selectedApt.status) && permStore.hasPermission('VETERINARY_RECEPTION')"
                  class="popup-btn popup-btn--checkin"
                  @click="handleCheckIn(selectedApt)"
                  :disabled="loading"
                >
                  <VIcon icon="tabler-door-enter" size="16" class="me-1" />
                  Check In
                </button>
                <button v-if="permStore.hasPermission('VETERINARY_DOCTOR')" class="popup-btn popup-btn--followup">Follow-up</button>
                <button v-if="permStore.hasPermission('VETERINARY_BILLING')" class="popup-btn popup-btn--payment">Payment</button>
              </div>"""
content = content.replace(popup_old, popup_new)

action_logic = """
const handleAction = async (apt, actionType) => {
  console.log('Action triggered:', actionType, 'on appointment', apt.id)
  // Backend patch integration placeholder
  hidePopup()
}
"""
content = content.replace("const handleCheckIn = async (apt) => {", action_logic + "\nconst handleCheckIn = async (apt) => {")

# Right sidebar styling
content = content.replace('class="grid-day-headers"', 'class="grid-day-headers grid bg-white border-b border-[#F1F5F9] sticky top-0 z-20 shadow-sm"')
content = content.replace(':style="`grid-template-columns: 72px repeat(${dayCount}, 1fr)`"', ':style="`grid-template-columns: 80px repeat(7, 1fr)`"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Calendar rewritten for CSS Grid Engine.")
