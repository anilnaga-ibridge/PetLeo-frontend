<script setup>
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useCalendarStore } from '../calendarStore'

const calendarStore = useCalendarStore()

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridDay',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek',
  },
  slotDuration: '00:15:00',
  slotMinTime: '07:00:00',
  slotMaxTime: '21:00:00',
  allDaySlot: false,
  height: 'auto',
  events: computed(() => calendarStore.events),
  eventClick: info => {
    console.log('Event clicked:', info.event.extendedProps.item)
  },
  nowIndicator: true,
  editable: false,
  droppable: false,
})

const stats = [
  { title: 'Scheduled', key: 'scheduled', color: 'primary', icon: 'tabler-calendar' },
  { title: 'Waiting', key: 'waiting', color: 'warning', icon: 'tabler-clock' },
  { title: 'Engaged', key: 'engaged', color: 'secondary', icon: 'tabler-dog' },
  { title: 'Completed', key: 'done', color: 'success', icon: 'tabler-check' },
]

const mockUtilization = [
  { name: 'Surgery Room A', usage: 85, capacity: 1 },
  { name: 'Grooming Tables', usage: 45, capacity: 3 },
  { name: 'Consultation 1', usage: 20, capacity: 1 },
]

onMounted(() => {
  calendarStore.fetchCalendarData()
})
</script>

<template>
  <VRow>
    <!-- Left: Calendar Hub -->
    <VCol
      cols="12"
      lg="9"
    >
      <VCard class="calendar-card">
        <VCardText>
          <div class="d-flex align-center justify-space-between mb-6">
            <div>
              <h4 class="text-h4 mb-1">
                Operations Command Center
              </h4>
              <p class="text-muted mb-0">
                Deterministic Scheduling Hub • 15m Precision
              </p>
            </div>
            <div class="d-flex gap-2">
              <VBtn
                prepend-icon="tabler-plus"
                color="primary"
              >
                Manual Booking
              </VBtn>
              <VBtn
                icon="tabler-dots-vertical"
                variant="text"
                color="secondary"
              />
            </div>
          </div>

          <FullCalendar
            :options="calendarOptions"
            class="enterprise-calendar"
          />
        </VCardText>
      </VCard>
    </VCol>

    <!-- Right: Operational Intelligence -->
    <VCol
      cols="12"
      lg="3"
    >
      <!-- Stats Summary -->
      <VRow>
        <VCol
          v-for="stat in stats"
          :key="stat.key"
          cols="6"
          lg="12"
        >
          <VCard
            variant="outlined"
            border
          >
            <VCardText class="pa-4">
              <div class="d-flex align-center mb-1">
                <VAvatar
                  :color="stat.color"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  <VIcon
                    :icon="stat.icon"
                    size="18"
                  />
                </VAvatar>
                <span class="text-caption text-uppercase font-weight-medium">{{ stat.title }}</span>
              </div>
              <div class="text-h4 font-weight-bold">
                {{ calendarStore.stats[stat.key] }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Resource Utilization -->
      <VCard
        class="mt-6"
        variant="outlined"
        border
      >
        <VCardItem title="Resource Load">
          <template #append>
            <VIcon
              icon="tabler-chart-bar"
              color="secondary"
            />
          </template>
        </VCardItem>
        <VCardText>
          <div
            v-for="res in mockUtilization"
            :key="res.name"
            class="mb-4"
          >
            <div class="d-flex justify-space-between text-caption mb-1">
              <span class="font-weight-medium">{{ res.name }}</span>
              <span :class="`text-${res.usage > 80 ? 'error' : res.usage > 50 ? 'warning' : 'success'}`">{{ res.usage }}%</span>
            </div>
            <VProgressLinear
              :model-value="res.usage"
              :color="res.usage > 80 ? 'error' : res.usage > 50 ? 'warning' : 'success'"
              height="6"
              rounded
            />
          </div>
        </VCardText>
      </VCard>

      <!-- Lock Conflict Zone -->
      <VCard
        class="mt-6"
        color="warning"
        variant="tonal"
      >
        <VCardText class="pa-4">
          <div class="d-flex align-center mb-2">
            <VIcon
              icon="tabler-lock-check"
              class="me-2"
            />
            <span class="font-weight-bold">Active Slot Locks</span>
          </div>
          <p class="text-caption mb-0">
            3 slots are temporarily reserved by other receptionists.
          </p>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
.calendar-card {
    border-radius: 12px;
}

.enterprise-calendar {
    --fc-border-color: rgba(var(--v-border-color), var(--v-border-opacity));
    --fc-today-bg-color: rgba(var(--v-theme-primary), 0.05);
    
    .fc-header-toolbar {
        margin-bottom: 2rem !important;
    }

    .fc-col-header-cell {
        padding: 12px 0;
        background: rgba(var(--v-theme-on-surface), 0.02);
        font-weight: 600;
    }

    .fc-timegrid-slot {
        height: 3rem;
    }

    .fc-event {
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 0.8rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
}
</style>
