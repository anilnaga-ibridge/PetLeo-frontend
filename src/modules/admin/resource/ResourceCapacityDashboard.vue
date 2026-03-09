<script setup>
import { ref } from 'vue'

// Mock high-density resource data
const resourceCategories = [
  {
    name: 'Operation Rooms',
    icon: 'tabler-medical-step',
    resources: [
      { id: 1, name: 'OR-01', occupancy: 90, status: 'Active', capacity: 1, current: 'Dog Surgery' },
      { id: 2, name: 'OR-02', occupancy: 40, status: 'Active', capacity: 1, current: 'Dental' },
      { id: 3, name: 'OR-03 (Sterile)', occupancy: 0, status: 'Idle', capacity: 1, current: '-' },
    ],
  },
  {
    name: 'Grooming Tables',
    icon: 'tabler-scissors',
    resources: [
      { id: 4, name: 'Table 1', occupancy: 100, status: 'Full', capacity: 1, current: 'Shampoo' },
      { id: 5, name: 'Table 2', occupancy: 100, status: 'Full', capacity: 1, current: 'Trimming' },
      { id: 6, name: 'Table 3', occupancy: 0, status: 'Idle', capacity: 1, current: '-' },
    ],
  },
  {
    name: 'Consultation Units',
    icon: 'tabler-stethoscope',
    resources: [
      { id: 7, name: 'Unit A', occupancy: 60, status: 'Active', capacity: 1, current: 'Consult' },
      { id: 8, name: 'Unit B', occupancy: 20, status: 'Active', capacity: 1, current: 'Checkup' },
    ],
  },
]

const getStatusColor = occupancy => {
  if (occupancy >= 90) return 'error'
  if (occupancy >= 50) return 'warning'
  
  return 'success'
}
</script>

<template>
  <div class="resource-dashboard">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Resource Capacity Hub
        </h4>
        <p class="text-muted mb-0">
          Live utilization across all physical assets
        </p>
      </div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-refresh"
      >
        Sync Status
      </VBtn>
    </div>

    <VRow>
      <VCol
        v-for="cat in resourceCategories"
        :key="cat.name"
        cols="12"
      >
        <div class="d-flex align-center mb-4 ps-2">
          <VIcon
            :icon="cat.icon"
            class="me-2"
            color="primary"
          />
          <h6 class="text-h6">
            {{ cat.name }}
          </h6>
        </div>
            
        <VRow>
          <VCol
            v-for="res in cat.resources"
            :key="res.id"
            cols="12"
            sm="6"
            md="4"
          >
            <VCard
              variant="outlined"
              border
              class="resource-card"
            >
              <VCardText class="pa-4">
                <div class="d-flex justify-space-between align-start mb-4">
                  <div>
                    <div class="font-weight-bold text-body-1">
                      {{ res.name }}
                    </div>
                    <div class="text-caption text-muted">
                      Cap: {{ res.capacity }} Patient
                    </div>
                  </div>
                  <VChip
                    :color="getStatusColor(res.occupancy)"
                    size="x-small"
                    variant="flat"
                  >
                    {{ res.status }}
                  </VChip>
                </div>

                <div class="mb-4">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span class="font-weight-medium">Utilized Capacity</span>
                    <span>{{ res.occupancy }}%</span>
                  </div>
                  <VProgressLinear
                    :model-value="res.occupancy"
                    :color="getStatusColor(res.occupancy)"
                    height="8"
                    rounded
                  />
                </div>

                <div class="bg-var-theme-background pa-3 rounded d-flex align-center">
                  <VIcon
                    icon="tabler-info-circle"
                    size="14"
                    class="me-2 text-muted"
                  />
                  <div class="text-caption">
                    <span class="text-muted">Current:</span> 
                    <span class="ms-1 font-weight-medium">{{ res.current }}</span>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.resource-card {
    transition: all 0.2s ease;
}

.resource-card:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 0.02);
}
</style>
