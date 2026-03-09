<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)
const loading = ref(false)

// ── Reminders State ──────────────────────────────────────────────────────────
const reminders = ref([
  { id: 1, pet: 'Luna', petId: 'PET18823', owner: 'Rahul S.', medicine: 'Amoxicillin 250mg', schedule: 'Morning + Night', time: '08:00 AM', status: 'SENT',    sms: true,  app: true  },
  { id: 2, pet: 'Bruno', petId: 'PET20217', owner: 'Priya K.', medicine: 'Metronidazole', schedule: 'Morning',        time: '09:00 AM', status: 'PENDING', sms: false, app: true  },
  { id: 3, pet: 'Milo',  petId: 'PET31044', owner: 'Suresh M.', medicine: 'Doxycycline 100mg', schedule: 'Night',   time: '08:00 PM', status: 'MISSED',  sms: true,  app: false },
  { id: 4, pet: 'Coco',  petId: 'PET14500', owner: 'Anil P.', medicine: 'Ivermectin',     schedule: 'Weekly',       time: '10:00 AM', status: 'SENT',    sms: true,  app: true  },
])

const showAddDialog = ref(false)
const filterStatus = ref('All')
const searchPet = ref('')

const statusOptions = ['All', 'SENT', 'PENDING', 'MISSED']

const filteredReminders = computed(() => {
  return reminders.value.filter(r => {
    const matchSearch = !searchPet.value || r.pet.toLowerCase().includes(searchPet.value.toLowerCase())
    const matchStatus = filterStatus.value === 'All' || r.status === filterStatus.value
    
    return matchSearch && matchStatus
  })
})

const statusCfg = {
  SENT: { color: 'success', icon: 'tabler-check'        },
  PENDING: { color: 'warning', icon: 'tabler-clock'        },
  MISSED: { color: 'error',   icon: 'tabler-alert-circle' },
}

const upcomingCount = computed(() => reminders.value.filter(r => r.status === 'PENDING').length)
const missedCount   = computed(() => reminders.value.filter(r => r.status === 'MISSED').length)
const sentToday     = computed(() => reminders.value.filter(r => r.status === 'SENT').length)

// New reminder form
const newReminder = ref({ pet: '', medicine: '', schedule: '', time: '', sms: true, app: true })

const addReminder = () => {
  reminders.value.unshift({
    id: Date.now(),
    ...newReminder.value,
    petId: 'PET' + Math.floor(Math.random()*90000 + 10000),
    owner: '',
    status: 'PENDING',
  })
  showAddDialog.value = false
  newReminder.value = { pet: '', medicine: '', schedule: '', time: '', sms: true, app: true }
}
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="reminders-page pa-6">
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold">
            Medicine Reminders
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            Track and auto-notify patients for medication schedules
          </p>
        </div>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="showAddDialog = true"
        >
          Add Reminder
        </VBtn>
      </div>

      <div class="rem-layout">
        <!-- Main Content -->
        <div>
          <!-- Filters -->
          <div class="d-flex gap-3 mb-4 flex-wrap">
            <VTextField
              v-model="searchPet"
              placeholder="Search pet name..."
              density="compact"
              variant="outlined"
              prepend-inner-icon="tabler-search"
              hide-details
              style="max-width: 220px"
            />
            <VBtnToggle
              v-model="filterStatus"
              density="compact"
              variant="outlined"
              divided
            >
              <VBtn
                v-for="s in statusOptions"
                :key="s"
                :value="s"
                size="small"
              >
                {{ s }}
              </VBtn>
            </VBtnToggle>
          </div>

          <!-- Table -->
          <VCard
            elevation="0"
            border
          >
            <VTable density="comfortable">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medicine</th>
                  <th>Schedule</th>
                  <th>Time</th>
                  <th>Notifications</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in filteredReminders"
                  :key="r.id"
                  class="rem-row"
                >
                  <td>
                    <div class="d-flex align-center gap-2">
                      <VAvatar
                        size="32"
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon
                          icon="tabler-paw"
                          size="16"
                        />
                      </VAvatar>
                      <div>
                        <div class="text-body-2 font-weight-bold">
                          {{ r.pet }}
                        </div>
                        <div class="text-caption text-disabled">
                          {{ r.petId }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="text-body-2 font-weight-medium">
                    {{ r.medicine }}
                  </td>
                  <td>
                    <VChip
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ r.schedule }}
                    </VChip>
                  </td>
                  <td class="text-body-2">
                    {{ r.time }}
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <VChip
                        size="x-small"
                        :color="r.sms ? 'info' : 'default'"
                        :variant="r.sms ? 'flat' : 'outlined'"
                      >
                        SMS
                      </VChip>
                      <VChip
                        size="x-small"
                        :color="r.app ? 'success' : 'default'"
                        :variant="r.app ? 'flat' : 'outlined'"
                      >
                        App
                      </VChip>
                    </div>
                  </td>
                  <td>
                    <VChip
                      size="small"
                      :color="statusCfg[r.status]?.color"
                      variant="tonal"
                      :prepend-icon="statusCfg[r.status]?.icon"
                    >
                      {{ r.status }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </div>

        <!-- Right Panel -->
        <div class="rem-right">
          <VCard
            elevation="0"
            border
            class="mb-4"
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Today's Summary
              </div>
              <div class="d-flex flex-column gap-3">
                <div class="summary-stat sent">
                  <VIcon
                    icon="tabler-check"
                    size="20"
                    color="success"
                  />
                  <div>
                    <div class="stat-num text-success">
                      {{ sentToday }}
                    </div>
                    <div class="stat-lbl">
                      Sent
                    </div>
                  </div>
                </div>
                <div class="summary-stat pending">
                  <VIcon
                    icon="tabler-clock"
                    size="20"
                    color="warning"
                  />
                  <div>
                    <div class="stat-num text-warning">
                      {{ upcomingCount }}
                    </div>
                    <div class="stat-lbl">
                      Upcoming
                    </div>
                  </div>
                </div>
                <div class="summary-stat missed">
                  <VIcon
                    icon="tabler-alert-circle"
                    size="20"
                    color="error"
                  />
                  <div>
                    <div class="stat-num text-error">
                      {{ missedCount }}
                    </div>
                    <div class="stat-lbl">
                      Missed
                    </div>
                  </div>
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
                Upcoming
              </div>
              <div
                v-for="r in reminders.filter(x => x.status === 'PENDING').slice(0,5)"
                :key="r.id"
                class="upcoming-item"
              >
                <div class="upcoming-dot" />
                <div>
                  <div class="text-body-2 font-weight-bold">
                    {{ r.pet }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ r.medicine }} · {{ r.time }}
                  </div>
                </div>
              </div>
              <div
                v-if="upcomingCount === 0"
                class="text-caption text-disabled text-center py-3"
              >
                No upcoming reminders
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- Add Dialog -->
      <VDialog
        v-model="showAddDialog"
        max-width="480"
      >
        <VCard>
          <VCardTitle class="pa-6 pb-2">
            Add Reminder
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-3">
              <VTextField
                v-model="newReminder.pet"
                label="Pet Name"
                density="compact"
                variant="outlined"
              />
              <VTextField
                v-model="newReminder.medicine"
                label="Medicine"
                density="compact"
                variant="outlined"
              />
              <VTextField
                v-model="newReminder.schedule"
                label="Schedule (e.g. Morning + Night)"
                density="compact"
                variant="outlined"
              />
              <VTextField
                v-model="newReminder.time"
                label="Reminder Time"
                density="compact"
                variant="outlined"
                type="time"
              />
              <div class="d-flex gap-4">
                <VCheckbox
                  v-model="newReminder.sms"
                  label="SMS notification"
                  color="primary"
                  hide-details
                />
                <VCheckbox
                  v-model="newReminder.app"
                  label="App notification"
                  color="primary"
                  hide-details
                />
              </div>
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
              @click="addReminder"
            >
              Add Reminder
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </div>
  </component>
</template>

<style scoped>
.rem-layout {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 16px;
  align-items: start;
}

.rem-row { transition: background 0.15s; }
.rem-row:hover { background: rgba(var(--v-theme-primary), 0.03); }

.summary-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.stat-num { font-size: 22px; font-weight: 800; line-height: 1; }
.stat-lbl { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.upcoming-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-warning));
  flex-shrink: 0;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
