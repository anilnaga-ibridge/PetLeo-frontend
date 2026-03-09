<script setup>
import { useCookie } from '@/@core/composable/useCookie'
import ScheduleCalendar from '@/components/veterinary/ScheduleCalendar.vue'
import VitalsEntryForm from '@/components/veterinary/VitalsEntryForm.vue'
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { computed, onMounted, ref, watch } from 'vue'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const currentLayout = VeterinaryLayout

const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)
const pendingVisits = ref([])
const loading = ref(false)
const selectedVisit = ref(null)

const displayMode = ref('WORKFLOW')

const stats = computed(() => {
  const pending = pendingVisits.value.filter(v => v.status === 'CHECKED_IN').length
  const completed = pendingVisits.value.filter(v => v.status === 'VITALS_RECORDED').length
  
  return {
    pending,
    completed,
    total: pendingVisits.value.length,
    avgWait: '12 min',
  }
})

const selectedDateStr = ref(new Date().toISOString().substr(0, 10))

const tableHeaders = [
  { title: 'Time', key: 'created_at', width: '100px' },
  { title: 'Patient (ID)', key: 'pet' },
  { title: 'Species', key: 'pet.species' },
  { title: 'Reason for Visit', key: 'reason' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
]

const fetchPending = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    const data = await store.fetchQueue('VITALS_QUEUE', activeClinicId.value, { date: selectedDateStr.value })

    pendingVisits.value = data
  } catch (e) {
    console.error("Failed to fetch vitals queue:", e)
    pendingVisits.value = []
  } finally {
    loading.value = false
  }
}

watch(selectedDateStr, fetchPending)
onMounted(fetchPending)

const onVitalsSubmitted = () => {
  selectedVisit.value = null
  fetchPending()
}

const getPetIcon = species => {
  if (species?.toLowerCase() === 'dog') return 'tabler-dog'
  if (species?.toLowerCase() === 'cat') return 'tabler-cat'
  
  return 'tabler-paw'
}

const formatDate = dateStr => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <component :is="currentLayout">
    <div class="vitals-dashboard-root bg-premium-surface min-h-screen pa-0">
      <!-- MAIN WORKFLOW VIEW (Calendar Centric) -->
      <div
        v-if="!selectedVisit && displayMode === 'WORKFLOW'"
        class="workflow-fullscreen"
      >
        <ScheduleCalendar 
          readonly 
          initial-view-mode="Day"
          title="Vitals Station"
          subtitle="OPERATIONS COMMAND CENTER"
        >
          <template #header-actions>
            <div class="d-flex align-center gap-3">
              <!-- Date Picker -->
              <VTextField 
                v-model="selectedDateStr" 
                type="date" 
                density="compact" 
                hide-details 
                variant="solo" 
                flat 
                bg-color="#F1F5F9"
                class="rounded-lg shadow-sm"
                style="width: 160px"
              />

              <!-- Mode Switcher -->
              <div class="bg-slate-100 pa-1 rounded-lg d-flex shadow-sm">
                <VBtn 
                  size="x-small" 
                  :variant="displayMode === 'WORKFLOW' ? 'flat' : 'text'" 
                  :color="displayMode === 'WORKFLOW' ? 'primary' : 'secondary'"
                  class="rounded-md font-weight-black text-none"
                  @click="displayMode = 'WORKFLOW'"
                >
                  Flow
                </VBtn>
                <VBtn 
                  size="x-small" 
                  :variant="displayMode === 'QUEUE' ? 'flat' : 'text'" 
                  :color="displayMode === 'QUEUE' ? 'primary' : 'secondary'"
                  class="rounded-md font-weight-black text-none"
                  @click="displayMode = 'QUEUE'"
                >
                  Queue
                </VBtn>
              </div>

              <VBtn
                icon="tabler-refresh"
                variant="text"
                color="secondary"
                density="compact"
                :loading="loading"
                @click="fetchPending"
              />
            </div>
          </template>
        </ScheduleCalendar>
      </div>

      <!-- QUEUE / FORM VIEWS (Standard Dashboard Style) -->
      <div
        v-else
        class="standard-dashboard-view"
      >
        <div class="dashboard-header-simple px-8 py-4 bg-white border-b d-flex align-center justify-space-between sticky-top z-10">
          <div>
            <h1 class="text-h3 font-weight-black mb-0">
              Vitals Station
            </h1>
            <div class="text-caption font-weight-bold text-primary uppercase tracking-widest">
              Queue Management
            </div>
          </div>

          <div class="d-flex align-center gap-4">
            <VBtn 
              v-if="!selectedVisit"
              size="small" 
              variant="flat" 
              color="primary"
              class="rounded-lg font-weight-black text-none"
              prepend-icon="tabler-layout-dashboard"
              @click="displayMode = 'WORKFLOW'"
            >
              Back to Workflow
            </VBtn>

            <VBtn
              v-if="selectedVisit"
              variant="text"
              color="secondary"
              prepend-icon="tabler-arrow-left"
              @click="selectedVisit = null"
            >
              Cancel
            </VBtn>
          </div>
        </div>

        <div
          v-if="!selectedVisit"
          class="queue-layout pa-8"
        >
          <VCard class="premium-card overflow-hidden">
            <VDataTable
              :headers="tableHeaders"
              :items="pendingVisits"
              :loading="loading"
              class="premium-table"
              hover
            >
              <template #item.created_at="{ item }">
                <span class="font-weight-bold text-primary">{{ formatDate(item.created_at) }}</span>
              </template>
              <template #item.pet="{ item }">
                <div class="d-flex flex-column py-2">
                  <span class="font-weight-bold text-h6">{{ item.pet?.name }}</span>
                  <span class="text-caption text-medium-emphasis">ID: {{ item.pet?.pet_code || item.id.slice(0, 8).toUpperCase() }}</span>
                </div>
              </template>
              <template #item.status="{ item }">
                <VChip
                  size="small"
                  :color="item.status === 'VITALS_RECORDED' ? 'secondary' : 'primary'"
                  variant="tonal"
                  class="premium-badge"
                  label
                >
                  {{ item.status === 'VITALS_RECORDED' ? 'Recorded' : 'Waiting' }}
                </VChip>
              </template>
              <template #item.actions="{ item }">
                <div class="d-flex gap-2 justify-end">
                  <VBtn
                    color="primary"
                    variant="flat"
                    size="small"
                    class="rounded-lg font-weight-black"
                    @click="selectedVisit = item"
                  >
                    Record Vitals
                  </VBtn>
                </div>
              </template>
            </VDataTable>
          </VCard>
        </div>

        <div
          v-else
          class="vitals-form-container pa-8"
        >
          <VCard class="premium-card overflow-hidden">
            <div class="pa-8 bg-premium-gradient border-b">
              <div class="d-flex align-center gap-6">
                <VAvatar
                  size="80"
                  color="white"
                  class="elevation-3"
                  rounded
                >
                  <VIcon
                    :icon="getPetIcon(selectedVisit.pet.species)"
                    color="primary"
                    size="40"
                  />
                </VAvatar>
                <div>
                  <div class="text-h2 font-weight-bold text-high-emphasis mb-1">
                    {{ selectedVisit.pet.name }}
                  </div>
                  <div class="text-body-1 text-medium-emphasis d-flex align-center gap-4">
                    <span><VIcon
                      icon="tabler-paw"
                      size="16"
                      class="me-1"
                    /> {{ selectedVisit.pet.breed || selectedVisit.pet.species }}</span>
                    <VChip
                      size="x-small"
                      color="primary"
                      variant="flat"
                      label
                      class="premium-badge"
                    >
                      ID: {{ selectedVisit.pet?.pet_code }}
                    </VChip>
                  </div>
                </div>
              </div>
            </div>
            <VCardText class="pa-8">
              <VitalsEntryForm
                :visit-id="selectedVisit.id"
                :pet="selectedVisit.pet"
                @submitted="onVitalsSubmitted"
                @cancel="selectedVisit = null"
              />
            </VCardText>
          </VCard>
        </div>
      </div>
    </div>
  </component>
</template>

<style scoped>
.vitals-dashboard-root {
  overflow: hidden;
  height: 100vh;
}

.workflow-fullscreen {
  height: 100vh;
}

.standard-dashboard-view {
  height: 100vh;
  overflow-y: auto;
  background-color: #F8FAFC;
}

.dashboard-header-simple { height: 72px; }

.premium-card {
  border-radius: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.08);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.bg-premium-gradient {
  background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
}

.sticky-top {
  position: sticky;
  top: 0;
}
</style>
