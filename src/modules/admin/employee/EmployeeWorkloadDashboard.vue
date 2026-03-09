<script setup>
import { ref } from 'vue'

const employees = ref([
  { 
    id: 1, 
    name: 'Dr. Praveen', 
    role: 'Senior Surgeon', 
    bookedMinutes: 420, 
    totalMinutes: 480, 
    rating: 4.9, 
    upcoming: 3,
    avatar: 'P',
  },
  { 
    id: 2, 
    name: 'Dr. Anil', 
    role: 'Vet Surgeon', 
    bookedMinutes: 120, 
    totalMinutes: 480, 
    rating: 4.7, 
    upcoming: 1,
    avatar: 'A',
  },
  { 
    id: 3, 
    name: 'Jordan Smith', 
    role: 'Senior Groomer', 
    bookedMinutes: 450, 
    totalMinutes: 540, 
    rating: 4.8, 
    upcoming: 4,
    avatar: 'J',
  },
])

const getLoadColor = percentage => {
  if (percentage > 85) return 'error'
  if (percentage > 70) return 'warning'
  
  return 'primary'
}
</script>

<template>
  <div class="workload-dashboard">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          Employee Workload Analysis
        </h4>
        <p class="text-muted mb-0">
          Booked minutes vs capacity metrics
        </p>
      </div>
      <div class="d-flex gap-2">
        <VSelect
          label="View"
          density="compact"
          hide-details
          :items="['Daily', 'Weekly']"
          class="min-w-px-150"
        />
        <VBtn
          color="primary"
          prepend-icon="tabler-file-export"
        >
          Report
        </VBtn>
      </div>
    </div>

    <VRow>
      <VCol
        v-for="emp in employees"
        :key="emp.id"
        cols="12"
        md="6"
        xl="4"
      >
        <VCard
          variant="outlined"
          border
          class="employee-workload-card"
        >
          <VCardText class="pa-5">
            <div class="d-flex align-center mb-5">
              <VAvatar
                color="primary"
                variant="tonal"
                size="44"
                class="me-3"
              >
                <span class="text-h6">{{ emp.avatar }}</span>
              </VAvatar>
              <div class="flex-grow-1">
                <div class="font-weight-bold text-h6 line-height-1 mb-1">
                  {{ emp.name }}
                </div>
                <div class="text-caption text-muted">
                  {{ emp.role }}
                </div>
              </div>
              <div class="text-end">
                <div class="d-flex align-center justify-end text-warning mb-1">
                  <VIcon
                    icon="tabler-star-filled"
                    size="14"
                    class="me-1"
                  />
                  <span class="text-body-2 font-weight-bold">{{ emp.rating }}</span>
                </div>
                <div class="text-caption text-muted">
                  {{ emp.upcoming }} upcoming
                </div>
              </div>
            </div>

            <div class="mb-5">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span class="font-weight-medium">Daily Load</span>
                <span>{{ emp.bookedMinutes }} / {{ emp.totalMinutes }} min</span>
              </div>
              <VProgressLinear
                :model-value="(emp.bookedMinutes / emp.totalMinutes) * 100"
                :color="getLoadColor((emp.bookedMinutes / emp.totalMinutes) * 100)"
                height="10"
                rounded
              />
            </div>

            <VRow no-gutters>
              <VCol
                cols="6"
                class="border-e pa-2"
              >
                <div class="text-center">
                  <div class="text-h6 font-weight-bold">
                    {{ Math.round((emp.bookedMinutes / emp.totalMinutes) * 100) }}%
                  </div>
                  <div class="text-caption text-muted uppercase">
                    Utilization
                  </div>
                </div>
              </VCol>
              <VCol
                cols="6"
                class="pa-2"
              >
                <div class="text-center">
                  <div class="text-h6 font-weight-bold">
                    {{ emp.totalMinutes - emp.bookedMinutes }}
                  </div>
                  <div class="text-caption text-muted uppercase">
                    Idle Mins
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.employee-workload-card {
    transition: all 0.2s ease;
}
.employee-workload-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
    border-color: rgba(var(--v-theme-primary), 0.5) !important;
}
</style>
