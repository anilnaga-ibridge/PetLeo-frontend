<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const formatDate = (dateString, formatStr = 'MMM dd, yyyy (hh:mm a)') => {
  try {
    return format(new Date(dateString), formatStr)
  } catch (e) {
    return dateString
  }
}

const getStatusColor = (status) => {
  const map = {
    'CLOSED': '#10B981',
    'TREATMENT_COMPLETED': '#10B981',
    'CANCELLED': '#EF4444',
    'NO_SHOW': '#F59E0B'
  }
  return map[status] || '#6366F1'
}

const getStatusLabel = (status) => {
  return status.replace(/_/g, ' ').toLowerCase()
}
</script>

<template>
  <div class="pet-history-timeline">
    <div v-if="loading" class="d-flex justify-center pa-8">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <div v-else-if="history.length === 0" class="empty-history pa-8 text-center">
      <VIcon icon="tabler-clipboard-off" size="48" color="secondary" opacity="0.4" class="mb-2" />
      <p class="text-subtitle-1 font-weight-bold text-medium-emphasis">No past history found</p>
      <p class="text-caption text-disabled">This is the patient's first visit to our clinic.</p>
    </div>

    <div v-else class="timeline-container">
      <div v-for="(item, index) in history" :key="item.id" class="timeline-item">
        <!-- Timeline Line & Node -->
        <div class="timeline-trail">
          <div class="timeline-node" :style="{ background: getStatusColor(item.status) }">
            <VIcon :icon="index === 0 ? 'tabler-star' : 'tabler-circle'" size="10" color="white" />
          </div>
          <div v-if="index !== history.length - 1" class="timeline-line"></div>
        </div>

        <!-- History Card -->
        <div class="history-card">
          <div class="card-header">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="visit-date">{{ formatDate(item.date) }}</span>
              <span 
                class="status-badge" 
                :style="{ background: getStatusColor(item.status) + '15', color: getStatusColor(item.status) }"
              >
                {{ getStatusLabel(item.status) }}
              </span>
            </div>
            <h4 class="visit-reason">{{ item.reason || 'General Consultation' }}</h4>
            <div class="doctor-meta">
              <VIcon icon="tabler-stethoscope" size="14" class="me-1" />
              <span>Dr. {{ item.doctor }}</span>
            </div>
          </div>

          <div v-if="Object.keys(item.vitals).length > 0" class="card-vitals mt-3">
            <div class="vitals-grid">
              <div v-for="(value, key) in item.vitals" :key="key" class="vital-mini">
                <span class="vital-label">{{ key.replace(/_/g, ' ') }}:</span>
                <span class="vital-value">{{ value }}</span>
              </div>
            </div>
          </div>

          <div v-if="item.prescription_count > 0" class="card-footer mt-2">
            <div class="text-caption font-weight-bold text-primary d-flex align-center">
              <VIcon icon="tabler-pill" size="14" class="me-1" />
              {{ item.prescription_count }} medicines prescribed
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-history-timeline {
  padding: 8px 0;
}

.timeline-container {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
}

.timeline-trail {
  display: flex;
  flex-direction: column;
  items-align: center;
  width: 24px;
  flex-shrink: 0;
}

.timeline-node {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 0 0 4px #fff;
}

.timeline-line {
  flex-grow: 1;
  width: 2px;
  background: #F1F5F9;
  margin: 4px 0 4px 9px;
}

.history-card {
  flex-grow: 1;
  background: #FFF;
  border: 1px solid #F1F5F9;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.history-card:hover {
  border-color: #E2E8F0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.visit-date {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
}

.status-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: capitalize;
}

.visit-reason {
  font-size: 14px;
  font-weight: 800;
  color: #1E293B;
  margin: 4px 0;
}

.doctor-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
}

.card-vitals {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 8px 10px;
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 4px 12px;
}

.vital-mini {
  display: flex;
  flex-direction: column;
}

.vital-label {
  font-size: 10px;
  color: #94A3B8;
  text-transform: capitalize;
  font-weight: 600;
}

.vital-value {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}
</style>
