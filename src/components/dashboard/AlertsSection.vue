<script setup>
const alerts = [
  { 
    id: 1, 
    title: 'Long Wait Time', 
    message: 'T-042 (Max) is waiting longer than 20 minutes', 
    type: 'warning', 
    icon: 'tabler-clock', 
    time: '2m ago', 
  },
  { 
    id: 2, 
    title: 'Appointment Cancelled', 
    message: 'Mr. Smith cancelled Lucy\'s 14:00 checkup', 
    type: 'error', 
    icon: 'tabler-circle-x', 
    time: '15m ago', 
  },
  { 
    id: 3, 
    title: 'Doctor Unavailable', 
    message: 'Dr. John requested emergency leave for afternoon', 
    type: 'info', 
    icon: 'tabler-alert-circle', 
    time: '1h ago', 
  },
]

const alertStyles = {
  warning: { color: 'warning', bgVariant: 'tonal' },
  error: { color: 'error', bgVariant: 'tonal' },
  info: { color: 'info', bgVariant: 'tonal' },
}
</script>

<template>
  <VCard
    elevation="0"
    border
    class="rounded-xl h-100 d-flex flex-column"
  >
    <VCardTitle class="text-h6 font-weight-bold d-flex justify-space-between align-center px-6 pt-6 pb-4 border-b bg-surface-variant-lighten-1">
      Alerts & Notifications
      <VBtn
        variant="tonal"
        color="primary"
        size="small"
        class="font-weight-bold px-2"
        append-icon="tabler-chevron-right"
      >
        View All
      </VBtn>
    </VCardTitle>

    <VCardText class="flex-grow-1 overflow-y-auto px-6 py-4">
      <div class="d-flex flex-column gap-4">
        <VCard
          v-for="alert in alerts"
          :key="alert.id"
          :color="alertStyles[alert.type].color"
          :variant="alertStyles[alert.type].bgVariant"
          elevation="0"
          border
          class="alert-card rounded-lg pa-4 cursor-pointer"
        >
          <div class="d-flex align-start gap-3">
            <VAvatar
              :color="alertStyles[alert.type].color"
              variant="elevated"
              size="32"
              class="rounded-md elevation-2"
            >
              <VIcon
                :icon="alert.icon"
                size="20"
                color="white"
              />
            </VAvatar>

            <div class="flex-grow-1 min-w-0">
              <div class="d-flex justify-space-between align-start mb-1">
                <div class="text-caption font-weight-bold">
                  {{ alert.title }}
                </div>
                <div class="text-[10px] opacity-70 whitespace-nowrap ms-2">
                  {{ alert.time }}
                </div>
              </div>
              <div class="text-caption opacity-90 text-truncate">
                {{ alert.message }}
              </div>
            </div>
          </div>
        </VCard>
      </div>
    </VCardText>

    <VCardText class="mt-auto px-6 pb-6 pt-4 border-t">
      <VBtn
        block
        variant="outlined"
        color="medium-emphasis"
        class="font-weight-bold border-opacity-100 border rounded-lg"
      >
        Clear All Notifications
      </VBtn>
    </VCardText>
  </VCard>
</template>

<style scoped>
.alert-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.alert-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05) !important;
}

.whitespace-nowrap {
  white-space: nowrap;
}
</style>
