<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const formatTime = isoString => {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="timeline-preview-container pos-relative">
    <div
      v-if="isLoading"
      class="d-flex align-center justify-center py-10"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
      <span class="ms-3 text-muted">Calculating deterministic time chain...</span>
    </div>

    <div
      v-else-if="items.length > 0"
      class="timeline-wrapper"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="timeline-item d-flex mb-6"
      >
        <!-- Time Column -->
        <div
          class="time-column text-end pe-4"
          style="min-width: 80px"
        >
          <div class="font-weight-bold text-body-1">
            {{ formatTime(item.start_dt) }}
          </div>
          <div class="text-caption text-muted">
            {{ formatTime(item.end_dt) }}
          </div>
        </div>

        <!-- Indicator Column -->
        <div class="indicator-column position-relative d-flex flex-column align-center">
          <div class="dot bg-primary" />
          <div
            v-if="index !== items.length - 1"
            class="line"
          />
        </div>

        <!-- Content Column -->
        <div class="content-column flex-grow-1 ps-6">
          <VCard
            variant="tonal"
            border
            class="service-card"
            color="primary"
          >
            <VCardText class="pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-h6 font-weight-bold text-primary">{{ item.name }}</span>
                <VChip
                  size="x-small"
                  color="primary"
                  variant="flat"
                >
                  {{ item.duration_minutes || 30 }} MIN
                </VChip>
              </div>

              <VRow no-gutters>
                <VCol cols="6">
                  <div class="d-flex align-center mb-1">
                    <VIcon
                      icon="tabler-user-check"
                      size="14"
                      class="me-1"
                    />
                    <span class="text-caption text-truncate">{{ item.employee_name || 'Assigned Staff' }}</span>
                  </div>
                </VCol>
                <VCol cols="6">
                  <div class="d-flex align-center mb-1">
                    <VIcon
                      icon="tabler-building-hospital"
                      size="14"
                      class="me-1"
                    />
                    <span class="text-caption text-truncate">{{ item.facility_name || 'Room A' }}</span>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
          
          <!-- Buffer Indicator -->
          <div
            v-if="item.buffer_minutes"
            class="text-caption text-warning d-flex align-center mt-1"
          >
            <VIcon
              icon="tabler-clock-pause"
              size="12"
              class="me-1"
            />
            {{ item.buffer_minutes }} min facility buffer
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="empty-timeline d-flex flex-column align-center justify-center py-10 bg-var-theme-background rounded"
    >
      <VIcon
        icon="tabler-timeline-event"
        size="48"
        color="secondary"
        class="mb-2"
      />
      <span class="text-muted">Enter details to generate schedule preview</span>
    </div>
  </div>
</template>

<style scoped>
.timeline-item {
  position: relative;
}

.indicator-column {
  width: 20px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 2;
  margin-top: 6px;
}

.line {
  position: absolute;
  top: 18px;
  bottom: -24px;
  width: 2px;
  background-color: rgba(var(--v-theme-primary), 0.2);
  z-index: 1;
}

.service-card {
  transition: transform 0.2s ease;
}

.service-card:hover {
  transform: translateX(4px);
}
</style>
