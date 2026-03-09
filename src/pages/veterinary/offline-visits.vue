<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, computed } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { usePermissionStore } from '@/stores/permissionStore'

const userData = useCookie('userData')
const store = useVeterinaryStore()
const permStore = usePermissionStore()

const isReceptionist = computed(() => {
  const role = (userData.value?.role?.name || userData.value?.role || '').toLowerCase()
  
  return ['receptionist', 'reception', 'admin', 'organization'].some(r => role.includes(r))
})

// ── Walk-in Queue ─────────────────────────────────────────────────────────────
const queue = ref([
  { id: 1, pet: 'Max',   petId: 'PET11021', owner: 'Ravi K.',   species: 'Dog', reason: 'Fever',       status: 'WAITING',  doctor: null,        checkInTime: new Date(Date.now() - 32*60000) },
  { id: 2, pet: 'Kitty', petId: 'PET20045', owner: 'Sita R.',   species: 'Cat', reason: 'Vaccination', status: 'ENGAGED',  doctor: 'Dr. Vinod', checkInTime: new Date(Date.now() - 15*60000) },
  { id: 3, pet: 'Rocky', petId: 'PET30112', owner: 'Mohan L.', species: 'Dog', reason: 'Checkup',     status: 'WAITING',  doctor: null,        checkInTime: new Date(Date.now() - 8*60000)  },
  { id: 4, pet: 'Whiskers', petId: 'PET40318', owner: 'Anita M.', species: 'Cat', reason: 'Injury', status: 'COMPLETED', doctor: 'Dr. Sam',   checkInTime: new Date(Date.now() - 60*60000) },
])

const doctors = ['Dr. Vinod', 'Dr. Sam', 'Dr. Priya']
const showAddDialog = ref(false)
const newPatient = ref({ pet: '', owner: '', species: 'Dog', reason: '' })

// Time waiting
const waitingMins = checkin => Math.floor((Date.now() - checkin.getTime()) / 60000)

const waitColor = mins => {
  if (mins < 15) return 'success'
  if (mins < 30) return 'warning'
  
  return 'error'
}

const statusCfg = {
  WAITING: { color: '#F59E0B', bg: '#FFFBEB', label: 'Waiting'   },
  ENGAGED: { color: '#8B5CF6', bg: '#F5F3FF', label: 'With Doctor' },
  COMPLETED: { color: '#10B981', bg: '#F0FDF4', label: 'Done'       },
}

// Stats
const waitingCount   = computed(() => queue.value.filter(q => q.status === 'WAITING').length)
const engagedCount   = computed(() => queue.value.filter(q => q.status === 'ENGAGED').length)
const completedToday = computed(() => queue.value.filter(q => q.status === 'COMPLETED').length)

const checkIn = patient => {
  patient.status = 'WAITING'
  patient.checkInTime = new Date()
}

const assignDoctor = (patient, doc) => {
  patient.doctor = doc
  patient.status = 'ENGAGED'
}

const complete = patient => { patient.status = 'COMPLETED' }

const addWalkIn = () => {
  queue.value.unshift({
    id: Date.now(),
    ...newPatient.value,
    petId: 'PET' + Math.floor(Math.random()*90000 + 10000),
    status: 'WAITING',
    doctor: null,
    checkInTime: new Date(),
  })
  showAddDialog.value = false
  newPatient.value = { pet: '', owner: '', species: 'Dog', reason: '' }
}
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="walkin-page pa-6">
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold">
            Offline Visits
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            Walk-in patient queue and check-in management
          </p>
        </div>
        <VBtn
          v-if="isReceptionist"
          color="primary"
          prepend-icon="tabler-plus"
          @click="showAddDialog = true"
        >
          Walk-in Patient
        </VBtn>
      </div>

      <div class="walkin-layout">
        <!-- Queue Cards -->
        <div class="queue-grid">
          <TransitionGroup name="queue-list">
            <VCard
              v-for="patient in queue"
              :key="patient.id"
              elevation="0"
              border
              class="queue-card"
              :style="{ borderLeftColor: statusCfg[patient.status]?.color, borderLeftWidth: '4px' }"
            >
              <VCardText>
                <div class="d-flex align-center gap-3 mb-3">
                  <VAvatar
                    size="44"
                    color="primary"
                    variant="tonal"
                  >
                    <VIcon
                      :icon="patient.species === 'Cat' ? 'tabler-cat' : 'tabler-dog'"
                      size="22"
                    />
                  </VAvatar>
                  <div class="flex-grow-1">
                    <div class="text-subtitle-1 font-weight-bold">
                      {{ patient.pet }}
                      <span class="text-caption text-disabled ms-1">{{ patient.petId }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <VIcon
                        icon="tabler-user"
                        size="11"
                        class="me-1"
                      />{{ patient.owner }}
                    </div>
                  </div>
                  <VChip
                    size="small"
                    :color="statusCfg[patient.status]?.color"
                    variant="flat"
                    class="font-weight-bold"
                  >
                    {{ statusCfg[patient.status]?.label }}
                  </VChip>
                </div>

                <div class="d-flex justify-space-between align-center mb-3">
                  <VChip
                    size="x-small"
                    color="secondary"
                    variant="tonal"
                  >
                    {{ patient.reason }}
                  </VChip>
                  <VChip
                    size="x-small"
                    :color="waitColor(waitingMins(patient.checkInTime))"
                    variant="tonal"
                    prepend-icon="tabler-clock"
                  >
                    {{ waitingMins(patient.checkInTime) }} min
                  </VChip>
                </div>

                <div
                  v-if="patient.doctor"
                  class="text-caption text-medium-emphasis mb-3"
                >
                  <VIcon
                    icon="tabler-stethoscope"
                    size="13"
                    class="me-1"
                  />
                  {{ patient.doctor }}
                </div>

                <!-- Receptionist Actions -->
                <div
                  v-if="isReceptionist && patient.status !== 'COMPLETED'"
                  class="d-flex gap-2 flex-wrap"
                >
                  <VMenu
                    v-if="!patient.doctor && patient.status === 'WAITING'"
                    location="bottom start"
                  >
                    <template #activator="{ props }">
                      <VBtn
                        size="x-small"
                        color="primary"
                        variant="tonal"
                        prepend-icon="tabler-stethoscope"
                        v-bind="props"
                      >
                        Assign Doctor
                      </VBtn>
                    </template>
                    <VList density="compact">
                      <VListItem
                        v-for="doc in doctors"
                        :key="doc"
                        :title="doc"
                        @click="assignDoctor(patient, doc)"
                      />
                    </VList>
                  </VMenu>
                  <VBtn
                    v-if="patient.status === 'ENGAGED'"
                    size="x-small"
                    color="success"
                    variant="tonal"
                    @click="complete(patient)"
                  >
                    Mark Done
                  </VBtn>
                  <VBtn
                    size="x-small"
                    color="error"
                    variant="text"
                  >
                    Cancel
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </TransitionGroup>
        </div>

        <!-- Right Panel -->
        <div class="walkin-right">
          <VCard
            elevation="0"
            border
            class="mb-4"
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Today's Walk-ins
              </div>
              <div class="d-flex flex-column gap-3">
                <div class="stat-box warning">
                  <span class="stat-num text-warning">{{ waitingCount }}</span>
                  <span class="stat-lbl">Waiting</span>
                </div>
                <div class="stat-box purple">
                  <span
                    class="stat-num"
                    style="color:#8B5CF6"
                  >{{ engagedCount }}</span>
                  <span class="stat-lbl">With Doctor</span>
                </div>
                <div class="stat-box success">
                  <span class="stat-num text-success">{{ completedToday }}</span>
                  <span class="stat-lbl">Completed</span>
                </div>
              </div>
            </VCardText>
          </VCard>

          <VCard
            elevation="0"
            border
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Waiting List
              </div>
              <div
                v-for="p in queue.filter(x => x.status === 'WAITING')"
                :key="p.id"
                class="waiting-item"
              >
                <VAvatar
                  size="28"
                  color="warning"
                  variant="tonal"
                >
                  <VIcon
                    size="14"
                    icon="tabler-paw"
                  />
                </VAvatar>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-bold">
                    {{ p.pet }}
                  </div>
                  <div class="text-caption text-disabled">
                    {{ waitingMins(p.checkInTime) }} min waiting
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- Add Walk-in Dialog -->
      <VDialog
        v-model="showAddDialog"
        max-width="440"
      >
        <VCard>
          <VCardTitle class="pa-6 pb-2">
            Quick Walk-in Check-in
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-3">
              <VTextField
                v-model="newPatient.pet"
                label="Pet Name"
                density="compact"
                variant="outlined"
              />
              <VTextField
                v-model="newPatient.owner"
                label="Owner Name"
                density="compact"
                variant="outlined"
              />
              <VSelect
                v-model="newPatient.species"
                :items="['Dog','Cat','Rabbit','Bird','Other']"
                label="Species"
                density="compact"
                variant="outlined"
              />
              <VTextField
                v-model="newPatient.reason"
                label="Reason for visit"
                density="compact"
                variant="outlined"
              />
            </div>
          </VCardText>
          <VCardActions class="pa-6 pt-0">
            <VSpacer />
            <VBtn
              variant="outlined"
              @click="showAddDialog = false"
            >
              Cancel
            </VBtn>
            <VBtn
              color="primary"
              prepend-icon="tabler-login"
              @click="addWalkIn"
            >
              Check In
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </div>
  </component>
</template>

<style scoped>
.walkin-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 16px;
  align-items: start;
}

.queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.queue-card {
  border-radius: 12px;
  border-left-style: solid;
  transition: box-shadow 0.2s, transform 0.2s;
}

.queue-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
  transform: translateY(-2px);
}

/* Queue animation */
.queue-list-enter-active, .queue-list-leave-active { transition: all 0.3s ease; }
.queue-list-enter-from, .queue-list-leave-to { opacity: 0; transform: scale(0.97); }

.stat-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.stat-num { font-size: 24px; font-weight: 800; line-height: 1; }
.stat-lbl { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }

.waiting-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
