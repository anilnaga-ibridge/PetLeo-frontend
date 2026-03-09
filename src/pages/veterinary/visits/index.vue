<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import ScheduleCalendar from '@/components/veterinary/ScheduleCalendar.vue'
import VisitEditDialog from '@/components/veterinary/VisitEditDialog.vue'
import { useRouter } from 'vue-router'

const userData = useCookie('userData')
const userRole = computed(() => (userData.value?.role?.name || userData.value?.role || '').toLowerCase())
const currentLayout = VeterinaryLayout
const router = useRouter()

const veterinaryStore = useVeterinaryStore()
const visits = computed(() => veterinaryStore.visitList)
const loading = computed(() => veterinaryStore.loading)

const showEditDialog = ref(false)
const selectedVisit = ref(null)
const displayMode = ref('WORKFLOW')

const stats = computed(() => {
  const list = visits.value
  
  return {
    active: list.filter(v => v.status !== 'CLOSED').length,
    checkedIn: list.filter(v => v.status === 'CREATED').length,
    completed: list.filter(v => ['PRESCRIPTION_FINALIZED', 'CLOSED'].includes(v.status)).length,
    total: list.length,
  }
})

const refreshVisits = async () => {
  const clinicId = userData.value?.clinic_id || veterinaryStore.activeClinicId

  await veterinaryStore.fetchPendingVisits(userRole.value, clinicId)
}

onMounted(async () => {
  await refreshVisits()
  if (veterinaryStore.pets.length === 0) await veterinaryStore.fetchPets()
})

const editVisit = item => { selectedVisit.value = item; showEditDialog.value = true }

const deleteVisit = async visitId => {
  if (confirm('Are you sure you want to delete this visit?')) {
    try { await veterinaryStore.deleteVisit(visitId); await refreshVisits() }
    catch (e) { console.error('Failed to delete visit:', e) }
  }
}

const checkInVisit = async visitId => {
  try { await veterinaryStore.checkInVisit(visitId); await refreshVisits() }
  catch (e) { console.error('Failed to check in visit:', e) }
}

const getStatusColor = status => ({
  CREATED: 'primary',
  VITALS_RECORDED: 'info',
  DOCTOR_ASSIGNED: 'warning',
  PRESCRIPTION_FINALIZED: 'success',
  CLOSED: 'secondary',
}[status] || 'default')

const tableHeaders = [
  { title: 'Pet / Patient',   key: 'pet.name'    },
  { title: 'Visit Type',      key: 'visit_type'  },
  { title: 'Current Status',  key: 'status'      },
  { title: 'Checked In',      key: 'created_at'  },
  { title: '',                key: 'actions', align: 'end', sortable: false },
]
</script>

<template>
  <component :is="currentLayout">
    <div class="vp-shell">
      <!-- ╔═ HEADER ══════════════════════════════════════════════════════╗ -->
      <header class="vp-header">
        <div class="vp-header-brand">
          <div class="vp-brand-chip">
            <VIcon
              icon="tabler-stethoscope"
              size="13"
            />
            Operations Command Center
          </div>
          <h1 class="vp-brand-title">
            Visit Management
          </h1>
        </div>

        <div class="vp-header-controls">
          <!-- Mode toggle -->
          <div class="mode-toggle">
            <button
              class="mode-btn"
              :class="{ 'mode-btn--active': displayMode === 'WORKFLOW' }"
              @click="displayMode = 'WORKFLOW'"
            >
              <VIcon
                icon="tabler-calendar-event"
                size="15"
              />
              Workflow
            </button>
            <button
              class="mode-btn"
              :class="{ 'mode-btn--active': displayMode === 'QUEUE' }"
              @click="displayMode = 'QUEUE'"
            >
              <VIcon
                icon="tabler-list"
                size="15"
              />
              Queue
            </button>
          </div>

          <VBtn
            color="primary"
            variant="flat"
            prepend-icon="tabler-plus"
            class="new-visit-btn"
            :to="{ name: 'veterinary-visits-new' }"
          >
            New Visit
          </VBtn>
          <VBtn
            color="secondary"
            variant="tonal"
            icon="tabler-refresh"
            size="small"
            :loading="loading"
            @click="refreshVisits"
          />
        </div>
      </header>

      <!-- ╔═ BODY ═════════════════════════════════════════════════════════╗ -->
      <div class="vp-body">
        <!-- MAIN CANVAS -->
        <div class="vp-main">
          <!-- Workflow View -->
          <div
            v-if="displayMode === 'WORKFLOW'"
            class="workflow-pane"
          >
            <ScheduleCalendar
              initial-view-mode="Day"
              :show-header="false"
            />
          </div>

          <!-- Queue View -->
          <div
            v-else
            class="queue-pane"
          >
            <VCard
              class="queue-card"
              elevation="0"
            >
              <VDataTable
                :headers="tableHeaders"
                :items="visits"
                :loading="loading"
                class="queue-table"
                hover
              >
                <!-- Pet -->
                <template #item.pet.name="{ item }">
                  <div class="d-flex align-center gap-3 py-2">
                    <VAvatar
                      color="primary"
                      variant="tonal"
                      size="38"
                      class="pet-avatar"
                    >
                      <span class="font-weight-black">{{ item.pet?.name?.charAt(0) }}</span>
                    </VAvatar>
                    <div>
                      <div class="pet-name">
                        {{ item.pet?.name }}
                      </div>
                      <div class="pet-meta">
                        {{ item.pet?.species }} · {{ item.pet?.breed || 'Mixed' }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Visit Type -->
                <template #item.visit_type="{ item }">
                  <div class="visit-type-cell">
                    <VIcon
                      :icon="item.visit_type === 'ONLINE' ? 'tabler-world' : 'tabler-building-hospital'"
                      size="14"
                      color="secondary"
                    />
                    <span>{{ item.visit_type || 'Offline' }}</span>
                  </div>
                </template>

                <!-- Status -->
                <template #item.status="{ item }">
                  <VChip
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="tonal"
                    label
                    class="status-chip"
                  >
                    {{ item.status.replace(/_/g, ' ') }}
                  </VChip>
                </template>

                <!-- Time -->
                <template #item.created_at="{ item }">
                  <span class="time-cell">{{ new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                </template>

                <!-- Actions -->
                <template #item.actions="{ item }">
                  <div class="d-flex align-center justify-end gap-2">
                    <VBtn
                      v-if="item.status === 'CREATED'"
                      variant="flat"
                      size="small"
                      color="success"
                      class="check-in-btn"
                      @click.stop="checkInVisit(item.id)"
                    >
                      Check In
                    </VBtn>
                    <VBtn
                      icon
                      variant="tonal"
                      size="small"
                      color="primary"
                      class="rounded-lg"
                      :to="{ name: 'veterinary-visits-id', params: { id: item.id } }"
                    >
                      <VIcon
                        icon="tabler-chevron-right"
                        size="16"
                      />
                    </VBtn>
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      color="secondary"
                      @click="editVisit(item)"
                    >
                      <VIcon
                        icon="tabler-edit"
                        size="16"
                      />
                    </VBtn>
                  </div>
                </template>

                <!-- Empty -->
                <template #no-data>
                  <div class="queue-empty">
                    <VIcon
                      icon="tabler-clipboard-off"
                      size="36"
                      color="#CBD5E1"
                    />
                    <p class="queue-empty-title">
                      No active visits
                    </p>
                    <p class="queue-empty-sub">
                      New visits will appear here once checked in
                    </p>
                    <VBtn
                      color="primary"
                      variant="tonal"
                      prepend-icon="tabler-plus"
                      size="small"
                      :to="{ name: 'veterinary-visits-new' }"
                    >
                      Create Visit
                    </VBtn>
                  </div>
                </template>
              </VDataTable>
            </VCard>
          </div>
        </div>

        <!-- SIDE PANEL -->
        <aside class="vp-sidebar">
          <!-- Stats -->
          <div class="vp-sidebar-title">
            <VIcon
              icon="tabler-chart-bar"
              size="14"
            />
            Today's Summary
          </div>
          <div class="sidebar-stats">
            <div
              class="sidebar-stat-card"
              style="--c:#3B82F6"
            >
              <VIcon
                icon="tabler-bolt"
                size="18"
                color="#3B82F6"
              />
              <span class="sidebar-stat-val">{{ stats.active }}</span>
              <span class="sidebar-stat-lbl">Active</span>
            </div>
            <div
              class="sidebar-stat-card"
              style="--c:#F59E0B"
            >
              <VIcon
                icon="tabler-door-enter"
                size="18"
                color="#F59E0B"
              />
              <span class="sidebar-stat-val">{{ stats.checkedIn }}</span>
              <span class="sidebar-stat-lbl">Arrivals</span>
            </div>
            <div
              class="sidebar-stat-card"
              style="--c:#10B981"
            >
              <VIcon
                icon="tabler-circle-check"
                size="18"
                color="#10B981"
              />
              <span class="sidebar-stat-val">{{ stats.completed }}</span>
              <span class="sidebar-stat-lbl">Closed</span>
            </div>
          </div>

          <div class="vp-divider" />

          <!-- Visit Logs -->
          <div class="logs-header">
            <div
              class="vp-sidebar-title"
              style="margin-bottom:0"
            >
              <VIcon
                icon="tabler-list-details"
                size="14"
              />
              Visit Logs
            </div>
          </div>

          <div class="vp-logs">
            <div
              v-if="visits.length === 0"
              class="vp-empty"
            >
              <div class="vp-empty-icon">
                <VIcon
                  icon="tabler-clipboard-off"
                  size="28"
                  color="#CBD5E1"
                />
              </div>
              <p class="vp-empty-title">
                No logs found
              </p>
              <p class="vp-empty-sub">
                Patient visits will appear here
              </p>
            </div>

            <div
              v-for="apt in visits.slice(0, 12)"
              :key="apt.id"
              class="vp-log-item"
              @click="router.push({ name: 'veterinary-visits-id', params: { id: apt.id } })"
            >
              <div
                class="vp-log-dot"
                :class="`dot-${getStatusColor(apt.status)}`"
              />
              <div class="vp-log-info">
                <span class="vp-log-name">{{ apt.pet?.name }}</span>
                <span class="vp-log-meta">{{ apt.status.replace(/_/g, ' ') }}</span>
              </div>
              <VChip
                size="x-small"
                :color="getStatusColor(apt.status)"
                variant="tonal"
                class="log-time-chip"
              >
                {{ new Date(apt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </VChip>
            </div>
          </div>
        </aside>
      </div>

      <VisitEditDialog
        v-model="showEditDialog"
        :visit="selectedVisit"
        @saved="refreshVisits"
      />
    </div>
  </component>
</template>

<style scoped>
/* ── Shell ── */
.vp-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}

/* ── Header ── */
.vp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-shrink: 0;
  z-index: 10;
  position: sticky;
  top: 0;
}

.vp-brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6366F1;
  margin-bottom: 3px;
}
.vp-brand-title {
  font-size: 20px;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1;
}

.vp-header-controls { display: flex; align-items: center; gap: 10px; }

/* Mode toggle */
.mode-toggle {
  display: flex;
  background: #F1F5F9;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.15s;
}
.mode-btn--active {
  background: white;
  color: #6366F1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.new-visit-btn { border-radius: 10px !important; font-weight: 700 !important; }

/* ── Body ── */
.vp-body {
  display: grid;
  grid-template-columns: 1fr 300px;
  flex-grow: 1;
  overflow: hidden;
  min-height: 0;
}

/* Main canvas */
.vp-main { overflow-y: auto; min-width: 0; }
.workflow-pane { height: 100%; overflow: hidden; display: flex; flex-direction: column; }
.workflow-pane > * { flex-grow: 1; }
.queue-pane { padding: 20px; }

/* Queue card */
.queue-card {
  border: 1px solid #F1F5F9;
  border-radius: 16px;
  overflow: hidden;
}
.queue-table :deep(.v-data-table__th) {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8 !important;
  background: #F8FAFC;
}
.queue-table :deep(.v-data-table__tr:hover td) { background: #FAFBFF; }

.pet-avatar { border-radius: 10px !important; }
.pet-name { font-size: 14px; font-weight: 700; color: #1E293B; }
.pet-meta { font-size: 12px; color: #94A3B8; margin-top: 1px; }
.visit-type-cell { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #475569; }
.status-chip { font-size: 11px !important; font-weight: 700 !important; }
.time-cell { font-size: 13px; font-weight: 700; color: #0F172A; }
.check-in-btn { border-radius: 8px !important; font-weight: 700 !important; }

/* Queue empty */
.queue-empty {
  text-align: center;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.queue-empty-title { font-size: 16px; font-weight: 700; color: #94A3B8; margin: 0; }
.queue-empty-sub { font-size: 13px; color: #CBD5E1; margin: 0; }

/* ── Sidebar ── */
.vp-sidebar {
  background: white;
  border-left: 1px solid #F1F5F9;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}
.vp-sidebar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #64748B;
  margin-bottom: 12px;
}
.vp-divider { height: 1px; background: #F1F5F9; margin: 16px 0; }

/* Stats */
.sidebar-stats { display: flex; flex-direction: column; gap: 8px; }
.sidebar-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--c) 6%, white);
  border: 1.5px solid color-mix(in srgb, var(--c) 15%, transparent);
  transition: transform 0.15s;
}
.sidebar-stat-card:hover { transform: translateX(2px); }
.sidebar-stat-val { font-size: 22px; font-weight: 900; color: var(--c); line-height: 1; margin-left: auto; }
.sidebar-stat-lbl { font-size: 12px; font-weight: 700; color: #64748B; }

/* Logs */
.logs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.vp-logs { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; overflow-y: auto; }

.vp-empty {
  text-align: center;
  padding: 28px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.vp-empty-icon {
  width: 54px; height: 54px;
  border-radius: 16px;
  background: #F8FAFC;
  border: 1.5px dashed #E2E8F0;
  display: flex; align-items: center; justify-content: center;
}
.vp-empty-title { font-size: 13px; font-weight: 700; color: #94A3B8; margin: 0; }
.vp-empty-sub { font-size: 11px; color: #CBD5E1; margin: 0; }

.vp-log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid #F1F5F9;
  background: #FAFAFA;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.vp-log-item:hover { background: #F8FAFC; border-color: #E2E8F0; }
.vp-log-dot {
  width: 4px;
  border-radius: 4px;
  align-self: stretch;
  min-height: 30px;
  flex-shrink: 0;
}
.dot-primary { background: #3B82F6; }
.dot-info    { background: #06B6D4; }
.dot-warning { background: #F59E0B; }
.dot-success { background: #10B981; }
.dot-secondary { background: #94A3B8; }
.dot-default { background: #CBD5E1; }

.vp-log-info { flex-grow: 1; overflow: hidden; }
.vp-log-name { display: block; font-size: 13px; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vp-log-meta { display: block; font-size: 11px; color: #94A3B8; margin-top: 1px; }
.log-time-chip { font-size: 10px !important; font-weight: 700 !important; }

/* Scrollbar */
.vp-sidebar::-webkit-scrollbar,
.vp-main::-webkit-scrollbar,
.vp-logs::-webkit-scrollbar { width: 4px; }
.vp-sidebar::-webkit-scrollbar-thumb,
.vp-main::-webkit-scrollbar-thumb,
.vp-logs::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
</style>
