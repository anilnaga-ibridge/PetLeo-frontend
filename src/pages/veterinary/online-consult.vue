<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, computed } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'
import { usePermissionStore } from '@/stores/permissionStore'

const userData = useCookie('userData')
const permStore = usePermissionStore()

const isDoctor = computed(() => {
  const role = (userData.value?.role?.name || userData.value?.role || '').toLowerCase()
  
  return ['doctor', 'vet', 'veterinarian'].some(r => role.includes(r))
})

// ── Consultations ─────────────────────────────────────────────────────────────
const consultations = ref([
  { id: 1, pet: 'Luna',    petId: 'PET18823', owner: 'Rahul S.', doctor: 'Dr. Vinod', time: '10:00 AM', status: 'LIVE',      joinUrl: '#' },
  { id: 2, pet: 'Bruno',   petId: 'PET22341', owner: 'Priya K.', doctor: 'Dr. Vinod', time: '11:30 AM', status: 'SCHEDULED', joinUrl: '#' },
  { id: 3, pet: 'Whiskers', petId: 'PET30001', owner: 'Suresh M.', doctor: 'Dr. Sam',   time: '09:00 AM', status: 'COMPLETED', joinUrl: null },
  { id: 4, pet: 'Max',     petId: 'PET40521', owner: 'Anita P.', doctor: 'Dr. Vinod', time: '01:00 PM', status: 'SCHEDULED', joinUrl: '#' },
])

const doctorNotes    = ref('')
const activeChat     = ref(null)

const chatMessages   = ref([
  { from: 'owner', text: 'Hello Doctor, Luna has been sneezing a lot.', time: '09:52 AM' },
  { from: 'doctor', text: 'How long has this been going on?', time: '09:53 AM' },
  { from: 'owner', text: 'Since yesterday evening.', time: '09:54 AM' },
])

const statusCfg = {
  LIVE: { color: 'error',   icon: 'tabler-video',      label: 'Live'       },
  SCHEDULED: { color: 'primary', icon: 'tabler-calendar',   label: 'Scheduled'  },
  COMPLETED: { color: 'success', icon: 'tabler-check',      label: 'Completed'  },
}

const liveCount      = computed(() => consultations.value.filter(c => c.status === 'LIVE').length)
const waitingCount   = computed(() => consultations.value.filter(c => c.status === 'SCHEDULED').length)
const completedToday = computed(() => consultations.value.filter(c => c.status === 'COMPLETED').length)
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="consult-page pa-6">
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold">
            Online Consultations
          </h1>
          <p class="text-body-2 text-medium-emphasis">
            Upcoming and active video consultations
          </p>
        </div>
        <VChip
          v-if="liveCount > 0"
          color="error"
          prepend-icon="tabler-circle-filled"
          class="animate-pulse"
        >
          {{ liveCount }} Live Session{{ liveCount > 1 ? 's' : '' }}
        </VChip>
      </div>

      <div class="consult-layout">
        <!-- Consultations List -->
        <div>
          <div class="d-flex flex-column gap-4">
            <VCard
              v-for="c in consultations"
              :key="c.id"
              elevation="0"
              border
              class="consult-card"
              :class="{ 'consult-card--live': c.status === 'LIVE' }"
            >
              <VCardText>
                <div class="d-flex align-center gap-4">
                  <VAvatar
                    size="48"
                    :color="c.status === 'LIVE' ? 'error' : 'primary'"
                    variant="tonal"
                  >
                    <VIcon
                      :icon="c.status === 'LIVE' ? 'tabler-video' : 'tabler-paw'"
                      size="24"
                    />
                  </VAvatar>

                  <div class="flex-grow-1">
                    <div class="d-flex align-center gap-2 mb-1">
                      <span class="text-subtitle-1 font-weight-bold">{{ c.pet }}</span>
                      <span class="text-caption text-disabled">{{ c.petId }}</span>
                      <VChip
                        size="x-small"
                        :color="statusCfg[c.status]?.color"
                        variant="flat"
                        :prepend-icon="statusCfg[c.status]?.icon"
                      >
                        {{ statusCfg[c.status]?.label }}
                      </VChip>
                    </div>
                    <div class="text-caption text-medium-emphasis d-flex gap-3">
                      <span><VIcon
                        icon="tabler-user"
                        size="12"
                        class="me-1"
                      />{{ c.owner }}</span>
                      <span><VIcon
                        icon="tabler-stethoscope"
                        size="12"
                        class="me-1"
                      />{{ c.doctor }}</span>
                      <span><VIcon
                        icon="tabler-clock"
                        size="12"
                        class="me-1"
                      />{{ c.time }}</span>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <VBtn
                      v-if="c.joinUrl && c.status !== 'COMPLETED'"
                      :color="c.status === 'LIVE' ? 'error' : 'primary'"
                      size="small"
                      prepend-icon="tabler-video"
                    >
                      {{ c.status === 'LIVE' ? 'Join Now' : 'Join Call' }}
                    </VBtn>
                    <VBtn
                      variant="outlined"
                      size="small"
                      icon="tabler-message"
                      @click="activeChat = c"
                    />
                  </div>
                </div>
              </VCardText>
            </VCard>
          </div>

          <!-- Doctor Notes -->
          <VCard
            v-if="isDoctor"
            elevation="0"
            border
            class="mt-4"
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-2">
                Session Notes
              </div>
              <VTextarea
                v-model="doctorNotes"
                placeholder="Add notes for the active consultation..."
                rows="4"
                variant="outlined"
                hide-details
              />
              <div class="d-flex justify-end mt-2">
                <VBtn
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  Save Notes
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Right Panel -->
        <div class="consult-right">
          <!-- Stats -->
          <VCard
            elevation="0"
            border
            class="mb-4"
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Today
              </div>
              <div class="d-flex flex-column gap-3">
                <div class="consult-stat">
                  <VIcon
                    icon="tabler-video"
                    color="error"
                    size="20"
                  />
                  <div>
                    <div class="stat-num text-error">
                      {{ liveCount }}
                    </div>
                    <div class="stat-lbl">
                      Live Now
                    </div>
                  </div>
                </div>
                <div class="consult-stat">
                  <VIcon
                    icon="tabler-clock"
                    color="primary"
                    size="20"
                  />
                  <div>
                    <div class="stat-num text-primary">
                      {{ waitingCount }}
                    </div>
                    <div class="stat-lbl">
                      Scheduled
                    </div>
                  </div>
                </div>
                <div class="consult-stat">
                  <VIcon
                    icon="tabler-check"
                    color="success"
                    size="20"
                  />
                  <div>
                    <div class="stat-num text-success">
                      {{ completedToday }}
                    </div>
                    <div class="stat-lbl">
                      Completed
                    </div>
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- Chat Preview -->
          <VCard
            elevation="0"
            border
          >
            <VCardText>
              <div class="text-overline text-medium-emphasis mb-3">
                Patient Chat
              </div>
              <div class="chat-box">
                <div
                  v-for="(msg, i) in chatMessages"
                  :key="i"
                  class="chat-msg"
                  :class="{ 'chat-msg--doctor': msg.from === 'doctor' }"
                >
                  <div class="chat-bubble">
                    {{ msg.text }}
                  </div>
                  <div class="chat-time">
                    {{ msg.time }}
                  </div>
                </div>
              </div>
              <VTextField
                placeholder="Type a message..."
                density="compact"
                variant="outlined"
                hide-details
                class="mt-3"
                append-inner-icon="tabler-send"
              />
            </VCardText>
          </VCard>
        </div>
      </div>
    </div>
  </component>
</template>

<style scoped>
.consult-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
}

.consult-card {
  border-radius: 12px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.consult-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important;
  transform: translateY(-1px);
}
.consult-card--live {
  border-color: rgba(var(--v-theme-error), 0.4) !important;
  background: rgba(var(--v-theme-error), 0.02);
}

.consult-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.stat-num { font-size: 22px; font-weight: 800; line-height: 1; }
.stat-lbl { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.5); }

/* Chat */
.chat-box { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }

.chat-msg { display: flex; flex-direction: column; max-width: 85%; }
.chat-msg--doctor { align-self: flex-end; align-items: flex-end; }

.chat-bubble {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
}

.chat-msg--doctor .chat-bubble {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.chat-time { font-size: 10px; color: rgba(var(--v-theme-on-surface), 0.4); margin-top: 2px; }

/* Pulse for Live indicator */
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
