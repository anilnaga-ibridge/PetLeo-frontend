<script setup>
import { ref, onMounted } from 'vue'
import { useVisitStore } from '../visitStore'
import { useRoute } from 'vue-router'

const route = useRoute()
const visitStore = useVisitStore()
const visitId = route.params.id

const getStatusColor = status => {
  const colors = {
    'PENDING': 'warning',
    'CONFIRMED': 'primary',
    'IN_PROGRESS': 'secondary',
    'COMPLETED': 'success',
    'CANCELLED': 'error',
    'NO_SHOW': 'secondary',
  }
  
  return colors[status] || 'secondary'
}

const formatTime = isoString => {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const mockVisit = ref({
  id: 'VG-8829',
  pet_name: 'Buddy',
  owner_name: 'Praveen Works',
  status: 'CONFIRMED',
  created_at: '2026-03-03T10:00:00Z',
  items: [
    { id: 'bi1', service_name: 'Full Grooming', start_time: '2026-03-03T11:00:00Z', end_time: '2026-03-03T12:30:00Z', status: 'COMPLETED', employee: 'Jordan Smith', resource: 'Table 1' },
    { id: 'bi2', service_name: 'Vet Consultation', start_time: '2026-03-03T12:30:00Z', end_time: '2026-03-03T13:00:00Z', status: 'IN_PROGRESS', employee: 'Dr. Praveen', resource: 'Room A' },
    { id: 'bi3', service_name: 'Vaccination', start_time: '2026-03-03T13:00:00Z', end_time: '2026-03-03T13:15:00Z', status: 'PENDING', employee: 'Dr. Praveen', resource: 'Room A' },
  ],
})

onMounted(async () => {
  // await visitStore.fetchVisitDetail(visitId)
})
</script>

<template>
  <div class="visit-detail-container">
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center">
        <VBtn
          icon="tabler-arrow-left"
          variant="text"
          class="me-2"
          @click="$router.back()"
        />
        <div>
          <h4 class="text-h4 mb-0">
            Visit Group #{{ mockVisit.id }}
          </h4>
          <div class="text-caption text-muted">
            Created on {{ new Date(mockVisit.created_at).toLocaleDateString() }}
          </div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <VChip
          :color="getStatusColor(mockVisit.status)"
          label
          class="font-weight-bold"
        >
          {{ mockVisit.status }}
        </VChip>
        <VBtn
          variant="outlined"
          color="secondary"
          prepend-icon="tabler-printer"
        >
          Print Summary
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
        >
          Add Service
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Left: Timeline & Services -->
      <VCol
        cols="12"
        md="8"
      >
        <VCard
          variant="outlined"
          border
          class="mb-6"
        >
          <VCardItem title="Visit Timeline">
            <template #append>
              <VIcon
                icon="tabler-timeline"
                color="primary"
              />
            </template>
          </VCardItem>
          <VDivider />
          <VCardText class="pa-6">
            <div class="timeline-v2">
              <div
                v-for="(item, index) in mockVisit.items"
                :key="item.id"
                class="timeline-v2-item mb-8"
              >
                <div class="timeline-v2-header d-flex justify-space-between align-center mb-3">
                  <div class="d-flex align-center">
                    <div class="time-tag bg-var-theme-background pa-1 px-2 rounded me-3 text-caption font-weight-bold">
                      {{ formatTime(item.start_time) }} – {{ formatTime(item.end_time) }}
                    </div>
                    <h6 class="text-h6 mb-0">
                      {{ item.service_name }}
                    </h6>
                  </div>
                  <VChip
                    :color="getStatusColor(item.status)"
                    size="x-small"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    {{ item.status }}
                  </VChip>
                </div>
                            
                <VCard
                  variant="flat"
                  border
                  class="bg-var-theme-background"
                >
                  <VCardText class="pa-4">
                    <VRow no-gutters>
                      <VCol cols="4">
                        <div class="text-caption text-muted mb-1 uppercase">
                          Staff
                        </div>
                        <div class="d-flex align-center">
                          <VAvatar
                            size="24"
                            color="primary"
                            variant="tonal"
                            class="me-2"
                          >
                            <span class="text-xs">{{ item.employee[0] }}</span>
                          </VAvatar>
                          <span class="text-body-2 font-weight-medium">{{ item.employee }}</span>
                        </div>
                      </VCol>
                      <VCol cols="4">
                        <div class="text-caption text-muted mb-1 uppercase">
                          Resource
                        </div>
                        <div class="d-flex align-center">
                          <VIcon
                            icon="tabler-building-hospital"
                            size="16"
                            class="me-2 text-muted"
                          />
                          <span class="text-body-2">{{ item.resource }}</span>
                        </div>
                      </VCol>
                      <VCol
                        cols="4"
                        class="text-end"
                      >
                        <template v-if="item.status === 'PENDING'">
                          <VBtn
                            size="small"
                            variant="text"
                            color="error"
                            class="me-1"
                          >
                            Cancel
                          </VBtn>
                          <VBtn
                            size="small"
                            color="primary"
                          >
                            Start
                          </VBtn>
                        </template>
                        <template v-else-if="item.status === 'IN_PROGRESS'">
                          <VBtn
                            size="small"
                            color="success"
                          >
                            Complete
                          </VBtn>
                        </template>
                        <VBtn
                          v-else
                          icon="tabler-dots-vertical"
                          variant="text"
                          size="small"
                        />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right: Patient & Info Cards -->
      <VCol
        cols="12"
        md="4"
      >
        <!-- Patient Card -->
        <VCard
          variant="outlined"
          border
          class="mb-6"
        >
          <VCardText class="pa-5">
            <div class="d-flex align-center mb-4">
              <VAvatar
                size="48"
                color="primary"
                variant="tonal"
                class="me-3"
              >
                <VIcon icon="tabler-dog" />
              </VAvatar>
              <div>
                <div class="text-h6 font-weight-bold line-height-1">
                  {{ mockVisit.pet_name }}
                </div>
                <div class="text-caption text-muted">
                  Golden Retriever • 4 yrs
                </div>
              </div>
              <VSpacer />
              <VBtn
                icon="tabler-external-link"
                variant="text"
                size="small"
              />
            </div>
            <VDivider class="my-4" />
            <div class="d-flex align-center mb-2">
              <VIcon
                icon="tabler-user"
                size="16"
                class="me-2 text-muted"
              />
              <span class="text-body-2">Owner: <strong>{{ mockVisit.owner_name }}</strong></span>
            </div>
            <div class="d-flex align-center mb-2">
              <VIcon
                icon="tabler-phone"
                size="16"
                class="me-2 text-muted"
              />
              <span class="text-body-2">+91 98765 43210</span>
            </div>
          </VCardText>
        </VCard>

        <!-- Visit Summary Card -->
        <VCard
          color="primary"
          variant="tonal"
        >
          <VCardText class="pa-5">
            <h6 class="text-h6 mb-4">
              Financial Overview
            </h6>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2">Services (3 items)</span>
              <span class="font-weight-medium">₹ 2,300.00</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2">Taxes</span>
              <span class="font-weight-medium">₹ 140.00</span>
            </div>
            <VDivider
              class="my-3"
              style="border-color: rgba(var(--v-theme-primary), 0.2)"
            />
            <div class="d-flex justify-space-between align-center">
              <span class="text-body-1 font-weight-bold">Estimate Total</span>
              <span class="text-h5 font-weight-bold">₹ 2,440.00</span>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.timeline-v2 {
    position: relative;
    padding-left: 20px;
}

.timeline-v2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 5px;
    bottom: 5px;
    width: 2px;
    background: rgba(var(--v-theme-on-surface), 0.08);
}

.timeline-v2-item {
    position: relative;
}

.timeline-v2-item::after {
    content: '';
    position: absolute;
    left: -24px;
    top: 10px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgb(var(--v-theme-primary));
    border: 2px solid rgb(var(--v-theme-surface));
}
</style>
