<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import DynamicFormRenderer from '@/components/veterinary/DynamicFormRenderer.vue'
import { useCookie } from '@/@core/composable/useCookie'
import { veterinaryApi } from '@/api/veterinary'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const currentLayout = VeterinaryLayout

const loading = ref(false)
const historyLoading = ref(false)

// ── Active queue ──────────────────────────────────────────────────────────────
const visits = ref([])
const selectedVisit = ref(null)

// ── History ───────────────────────────────────────────────────────────────────
const historyVisits = ref([])
const historySearch = ref('')
const historyPage = ref(1)
const historyPageSize = 10

// ── Active tab: 'queue' | 'history' ──────────────────────────────────────────
const activeTab = ref('queue')

// ── Search ────────────────────────────────────────────────────────────────────
const queueSearch = ref('')

const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  pending: visits.value.length,
  completed: historyVisits.value.length,
  urgent: visits.value.filter(v => v.priority === 'HIGH').length,
}))

// ── Filtered queue ────────────────────────────────────────────────────────────
const filteredQueue = computed(() => {
  if (!queueSearch.value.trim()) return visits.value
  const q = queueSearch.value.toLowerCase()
  
  return visits.value.filter(v =>
    v.pet?.name?.toLowerCase().includes(q) ||
    formatLabTests(v.latest_lab_order?.tests).toLowerCase().includes(q),
  )
})

// ── Filtered history ──────────────────────────────────────────────────────────
const filteredHistory = computed(() => {
  if (!historySearch.value.trim()) return historyVisits.value
  const q = historySearch.value.toLowerCase()
  
  return historyVisits.value.filter(v =>
    v.pet?.name?.toLowerCase().includes(q) ||
    formatLabTests(v.latest_lab_order?.tests).toLowerCase().includes(q) ||
    v.pet?.owner?.name?.toLowerCase().includes(q),
  )
})

const paginatedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize
  
  return filteredHistory.value.slice(start, start + historyPageSize)
})

const totalHistoryPages = computed(() =>
  Math.max(1, Math.ceil(filteredHistory.value.length / historyPageSize)),
)

// ── Data Fetch ────────────────────────────────────────────────────────────────
const fetchLabQueue = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    visits.value = await store.fetchQueue('LAB_QUEUE', activeClinicId.value)
  } catch (e) {
    console.error('Failed to fetch lab queue:', e)
    visits.value = []
  } finally {
    loading.value = false
  }
}

const fetchLabHistory = async () => {
  if (!activeClinicId.value) return
  historyLoading.value = true
  try {
    // Fetch visits that have completed lab processing
    const response = await veterinaryApi.get('/api/veterinary/visits/', {
      params: {
        clinic_id: activeClinicId.value,
        status: 'LAB_COMPLETED',
      },
    })

    historyVisits.value = response.data.results || response.data || []
  } catch (e) {
    console.error('Failed to fetch lab history:', e)

    // Fallback: try fetching all and filtering client-side
    try {
      const all = await store.fetchQueue('LAB_QUEUE', activeClinicId.value, { include_completed: true })

      historyVisits.value = all.filter(v => v.status === 'LAB_COMPLETED')
    } catch {
      historyVisits.value = []
    }
  } finally {
    historyLoading.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([fetchLabQueue(), fetchLabHistory()])
}

onMounted(refreshAll)
watch(activeClinicId, refreshAll)
watch(activeTab, tab => {
  if (tab === 'history' && historyVisits.value.length === 0 && !historyLoading.value) {
    fetchLabHistory()
  }
})
watch(historySearch, () => { historyPage.value = 1 })

// Unified search model for the header input
const activeSearch = computed({
  get: () => activeTab.value === 'queue' ? queueSearch.value : historySearch.value,
  set: val => {
    if (activeTab.value === 'queue') queueSearch.value = val
    else historySearch.value = val
  },
})

// ── Visit Detail ──────────────────────────────────────────────────────────────
const selectVisit = async visit => {
  loading.value = true
  try {
    const summary = await store.fetchVisitSummary(visit.id)

    selectedVisit.value = summary
  } catch (e) {
    console.error('Failed to load visit details:', e)
  } finally {
    loading.value = false
  }
}

const onResultsSubmitted = async () => {
  if (!selectedVisit.value) return
  try {
    await store.updateVisitStatus(selectedVisit.value.id, 'LAB_COMPLETED')
  } catch (e) {
    console.error('Failed to transition status:', e)
  }
  selectedVisit.value = null
  await refreshAll()
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatLabTests = tests => {
  if (!tests) return 'General Diagnostic Panel'
  if (Array.isArray(tests)) return tests.join(', ')
  if (typeof tests === 'string' && tests.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(tests)
      if (Array.isArray(parsed)) return parsed.join(', ')
    } catch { return tests }
  }
  
  return tests
}

const getPetIcon = species => {
  const s = species?.toLowerCase()
  if (s === 'dog') return 'tabler-dog'
  if (s === 'cat') return 'tabler-cat'
  
  return 'tabler-paw'
}

const getPriorityColor = priority => {
  if (priority === 'HIGH') return 'error'
  if (priority === 'MEDIUM') return 'warning'
  
  return 'primary'
}

const timeAgo = dateStr => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  
  return `${Math.floor(diff / 1440)}d ago`
}

const formatDate = dateStr => {
  if (!dateStr) return '—'
  
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <component :is="currentLayout">
    <div class="lab-shell">
      <!-- ══════════════════════ HEADER ══════════════════════════════════ -->
      <header class="lab-header">
        <div
          v-if="!selectedVisit"
          class="header-brand"
        >
          <div class="brand-chip">
            <VIcon
              icon="tabler-flask"
              size="13"
            />
            LAB OPERATIONS
          </div>
          <h1 class="brand-title">
            Diagnostic Queue
          </h1>
        </div>

        <div
          v-else
          class="d-flex align-center gap-3"
        >
          <VBtn
            icon
            variant="tonal"
            color="secondary"
            density="compact"
            class="back-btn"
            @click="selectedVisit = null"
          >
            <VIcon
              icon="tabler-arrow-left"
              size="18"
            />
          </VBtn>
          <div>
            <div class="brand-chip">
              RESULTS ENTRY
            </div>
            <h1 class="brand-title">
              {{ selectedVisit.pet?.name }}
            </h1>
          </div>
        </div>

        <div class="header-actions">
          <div
            v-if="!selectedVisit"
            class="search-pill"
          >
            <VIcon
              icon="tabler-search"
              size="15"
              class="search-icon-pill"
            />
            <input
              v-model="activeSearch"
              :placeholder="activeTab === 'queue' ? 'Filter by patient or test...' : 'Search history...'"
              class="search-input-pill"
            >
          </div>
          <VBtn
            variant="tonal"
            color="secondary"
            icon="tabler-refresh"
            size="small"
            :loading="loading"
            @click="refreshAll"
          />
        </div>
      </header>

      <!-- ══════════════════════ RESULTS ENTRY VIEW ══════════════════════ -->
      <div
        v-if="selectedVisit"
        class="entry-view"
      >
        <div class="results-layout">
          <!-- Patient Summary sidebar -->
          <div class="patient-panel">
            <div class="patient-panel-header">
              <VAvatar
                size="80"
                color="white"
                class="entry-avatar mb-4"
              >
                <VIcon
                  :icon="getPetIcon(selectedVisit.pet?.species)"
                  size="40"
                  color="primary"
                />
              </VAvatar>
              <h2 class="patient-name">
                {{ selectedVisit.pet?.name }}
              </h2>
              <p class="patient-meta">
                {{ selectedVisit.pet?.breed }} · {{ selectedVisit.pet?.species }}
              </p>
              <VChip
                size="small"
                variant="flat"
                color="primary"
                label
                class="mt-3 px-4 font-weight-bold"
              >
                ID: {{ selectedVisit.pet?.pet_code || 'LAB-' + selectedVisit.id?.toString().slice(0,5) }}
              </VChip>
            </div>

            <VDivider class="my-5" />

            <div class="info-block">
              <div class="info-label">
                Requested At
              </div>
              <div class="info-value">
                {{ formatDate(selectedVisit.created_at) }}
              </div>
            </div>
            <div class="info-block">
              <div class="info-label">
                Attending Physician
              </div>
              <div class="info-value">
                Dr. Sarah Johnson
              </div>
            </div>
            <div class="info-block">
              <div class="info-label">
                Ordered Tests
              </div>
              <div class="info-value primary-text">
                {{ formatLabTests(selectedVisit.lab_order?.tests) }}
              </div>
            </div>
          </div>

          <!-- Form Canvas -->
          <div class="form-canvas">
            <div class="form-canvas-header">
              <h3 class="form-title">
                Diagnostic Findings
              </h3>
              <div class="d-flex align-center gap-2">
                <VIcon
                  icon="tabler-shield-check"
                  color="success"
                  size="18"
                />
                <span class="verified-label">Verified Interface</span>
              </div>
            </div>
            <div class="form-body">
              <DynamicFormRenderer
                form-code="LAB_RESULTS"
                :visit-id="selectedVisit.id"
                @submitted="onResultsSubmitted"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════ MAIN LAYOUT ════════════════════════════ -->
      <div
        v-else
        class="lab-body"
      >
        <!-- ── MAIN CANVAS ─────────────────────────────────────────────── -->
        <div class="lab-main">
          <!-- Tabs -->
          <div class="tab-bar">
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'queue' }"
              @click="activeTab = 'queue'"
            >
              <VIcon
                icon="tabler-clock-hour-4"
                size="16"
              />
              Active Queue
              <span
                class="tab-badge"
                :class="visits.length > 0 ? 'tab-badge--warn' : 'tab-badge--empty'"
              >
                {{ visits.length }}
              </span>
            </button>
            <button
              class="tab-btn"
              :class="{ 'tab-btn--active': activeTab === 'history' }"
              @click="activeTab = 'history'"
            >
              <VIcon
                icon="tabler-history"
                size="16"
              />
              History
              <span class="tab-badge tab-badge--neutral">{{ historyVisits.length }}</span>
            </button>
          </div>

          <!-- ─── QUEUE TAB ─────────────────────────────────────────────── -->
          <div
            v-if="activeTab === 'queue'"
            class="tab-content"
          >
            <!-- Loading -->
            <div
              v-if="loading"
              class="loading-state"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="40"
              />
              <p>Loading diagnostic queue…</p>
            </div>

            <!-- Cards grid -->
            <div
              v-else-if="filteredQueue.length > 0"
              class="queue-grid"
            >
              <div
                v-for="visit in filteredQueue"
                :key="visit.id"
                class="lab-card"
                @click="selectVisit(visit)"
              >
                <div class="lab-card-body">
                  <div class="lab-card-top">
                    <div class="d-flex align-center gap-3">
                      <div class="pet-avatar-wrap">
                        <VIcon
                          :icon="getPetIcon(visit.pet?.species)"
                          size="22"
                          color="primary"
                        />
                      </div>
                      <div>
                        <div class="pet-name-sm">
                          {{ visit.pet?.name }}
                        </div>
                        <div class="pet-meta-sm">
                          {{ visit.pet?.breed }} · {{ visit.pet?.owner?.name }}
                        </div>
                      </div>
                    </div>
                    <span
                      class="priority-chip"
                      :class="`priority-${(visit.priority || 'normal').toLowerCase()}`"
                    >
                      {{ visit.priority || 'NORMAL' }}
                    </span>
                  </div>

                  <div class="test-panel">
                    <div class="test-panel-label">
                      Ordered Analysis
                    </div>
                    <div class="test-panel-value">
                      {{ formatLabTests(visit.latest_lab_order?.tests) }}
                    </div>
                  </div>

                  <div class="lab-card-footer">
                    <div class="d-flex align-center gap-1 text-muted">
                      <VIcon
                        icon="tabler-clock"
                        size="13"
                      />
                      <span>Req. {{ timeAgo(visit.created_at) }}</span>
                    </div>
                    <div class="d-flex align-center gap-1 text-muted">
                      <VIcon
                        icon="tabler-stethoscope"
                        size="13"
                      />
                      <span>Dr. Smith</span>
                    </div>
                  </div>
                </div>

                <div class="lab-card-action">
                  <button
                    class="enter-results-btn"
                    @click.stop="selectVisit(visit)"
                  >
                    <VIcon
                      icon="tabler-file-pencil"
                      size="15"
                    />
                    Enter Results
                  </button>
                </div>
              </div>
            </div>

            <!-- Queue Clear Empty State -->
            <div
              v-else
              class="empty-state"
            >
              <div class="empty-illustration">
                <VIcon
                  icon="tabler-microscope"
                  size="80"
                  class="empty-bg-icon"
                />
                <VIcon
                  icon="tabler-circle-check"
                  size="48"
                  class="empty-check-icon"
                />
              </div>
              <h2 class="empty-title">
                Queue Clear!
              </h2>
              <p class="empty-desc">
                Fantastic! You've processed all diagnostic requests. Time to prepare for the next batch.
              </p>
              <div class="d-flex gap-3">
                <button
                  class="refresh-btn"
                  @click="fetchLabQueue"
                >
                  <VIcon
                    icon="tabler-refresh"
                    size="15"
                  />
                  Check for Updates
                </button>
                <button
                  class="switch-history-btn"
                  @click="activeTab = 'history'"
                >
                  <VIcon
                    icon="tabler-history"
                    size="15"
                  />
                  View History
                </button>
              </div>
            </div>
          </div>

          <!-- ─── HISTORY TAB ──────────────────────────────────────────── -->
          <div
            v-else
            class="tab-content"
          >
            <div
              v-if="historyLoading"
              class="loading-state"
            >
              <VProgressCircular
                indeterminate
                color="primary"
                size="40"
              />
              <p>Loading history…</p>
            </div>

            <div
              v-else-if="filteredHistory.length === 0"
              class="empty-state"
            >
              <div class="empty-illustration">
                <VIcon
                  icon="tabler-clipboard-data"
                  size="80"
                  class="empty-bg-icon"
                />
              </div>
              <h2 class="empty-title">
                No History Yet
              </h2>
              <p class="empty-desc">
                Processed lab results will appear here once you complete diagnostic requests.
              </p>
            </div>

            <div
              v-else
              class="history-table-wrap"
            >
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Tests Ordered</th>
                    <th>Priority</th>
                    <th>Processed At</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="visit in paginatedHistory"
                    :key="visit.id"
                    class="history-row"
                  >
                    <td>
                      <div class="d-flex align-center gap-2">
                        <div class="history-avatar">
                          <VIcon
                            :icon="getPetIcon(visit.pet?.species)"
                            size="16"
                            color="primary"
                          />
                        </div>
                        <div>
                          <div class="h-pet-name">
                            {{ visit.pet?.name }}
                          </div>
                          <div class="h-pet-owner">
                            {{ visit.pet?.owner?.name || '—' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="test-tag">{{ formatLabTests(visit.latest_lab_order?.tests) }}</span>
                    </td>
                    <td>
                      <span
                        class="priority-chip"
                        :class="`priority-${(visit.priority || 'normal').toLowerCase()}`"
                      >
                        {{ visit.priority || 'NORMAL' }}
                      </span>
                    </td>
                    <td>
                      <span class="history-date">{{ formatDate(visit.updated_at || visit.created_at) }}</span>
                    </td>
                    <td>
                      <span class="status-done">
                        <VIcon
                          icon="tabler-circle-check"
                          size="13"
                        />
                        Completed
                      </span>
                    </td>
                    <td>
                      <VBtn
                        size="x-small"
                        variant="tonal"
                        color="primary"
                        :to="`/veterinary/visits/${visit.id}/summary`"
                        class="view-btn"
                      >
                        View Report
                      </VBtn>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Pagination -->
              <div
                v-if="totalHistoryPages > 1"
                class="pagination-row"
              >
                <button
                  class="page-btn"
                  :disabled="historyPage === 1"
                  @click="historyPage--"
                >
                  <VIcon
                    icon="tabler-chevron-left"
                    size="14"
                  />
                </button>
                <span class="page-info">{{ historyPage }} / {{ totalHistoryPages }}</span>
                <button
                  class="page-btn"
                  :disabled="historyPage === totalHistoryPages"
                  @click="historyPage++"
                >
                  <VIcon
                    icon="tabler-chevron-right"
                    size="14"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── SIDE PANEL ──────────────────────────────────────────────── -->
        <aside class="lab-sidebar">
          <!-- Stats -->
          <div class="sb-label">
            <VIcon
              icon="tabler-chart-bar"
              size="14"
            />
            Today's Overview
          </div>

          <div class="sidebar-stat-list">
            <div
              class="sidebar-stat"
              style="--c:#3B82F6"
            >
              <div class="sidebar-stat-icon">
                <VIcon
                  icon="tabler-clock-hour-4"
                  size="18"
                  color="#3B82F6"
                />
              </div>
              <div class="sidebar-stat-info">
                <span class="sidebar-stat-label">Pending</span>
                <span class="sidebar-stat-val">{{ stats.pending }}</span>
              </div>
            </div>
            <div
              class="sidebar-stat"
              style="--c:#EF4444"
            >
              <div class="sidebar-stat-icon">
                <VIcon
                  icon="tabler-alert-triangle"
                  size="18"
                  color="#EF4444"
                />
              </div>
              <div class="sidebar-stat-info">
                <span class="sidebar-stat-label">Urgent</span>
                <span class="sidebar-stat-val">{{ stats.urgent }}</span>
              </div>
            </div>
            <div
              class="sidebar-stat"
              style="--c:#10B981"
            >
              <div class="sidebar-stat-icon">
                <VIcon
                  icon="tabler-circle-check"
                  size="18"
                  color="#10B981"
                />
              </div>
              <div class="sidebar-stat-info">
                <span class="sidebar-stat-label">Processed</span>
                <span class="sidebar-stat-val">{{ stats.completed }}</span>
              </div>
            </div>
          </div>

          <div class="sb-divider" />

          <!-- Recent History preview in sidebar -->
          <div class="sb-label">
            <VIcon
              icon="tabler-history"
              size="14"
            />
            Recently Processed
          </div>

          <div class="recent-list">
            <div
              v-if="historyVisits.length === 0"
              class="recent-empty"
            >
              <VIcon
                icon="tabler-clipboard-data"
                size="28"
                color="#CBD5E1"
              />
              <p>No records processed yet</p>
            </div>

            <div
              v-for="v in historyVisits.slice(0, 6)"
              :key="v.id"
              class="recent-item"
              @click="activeTab = 'history'"
            >
              <div class="recent-dot" />
              <div class="recent-info">
                <span class="recent-name">{{ v.pet?.name }}</span>
                <span class="recent-test">{{ formatLabTests(v.latest_lab_order?.tests) }}</span>
              </div>
              <span class="recent-time">{{ timeAgo(v.updated_at || v.created_at) }}</span>
            </div>

            <button
              v-if="historyVisits.length > 6"
              class="see-all-btn"
              @click="activeTab = 'history'"
            >
              See all {{ historyVisits.length }} records →
            </button>
          </div>

          <div class="sb-divider" />

          <!-- Info tip -->
          <div class="info-tip">
            <VIcon
              icon="tabler-info-circle"
              size="16"
              color="#6366F1"
            />
            <p>Flag all critical values immediately to the attending physician.</p>
          </div>
        </aside>
      </div>
    </div>
  </component>
</template>

<style scoped>
/* ── Shell ── */
.lab-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1E293B;
  overflow: hidden;
}

/* ── Header ── */
.lab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand-chip {
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
.brand-title {
  font-size: 20px;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1;
}
.header-actions { display: flex; align-items: center; gap: 10px; }
.search-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F1F5F9;
  border-radius: 12px;
  padding: 8px 14px;
  width: 280px;
  transition: background 0.2s;
}
.search-pill:focus-within { background: #E2E8F0; }
.search-icon-pill { color: #94A3B8; flex-shrink: 0; }
.search-input-pill { border: none; background: transparent; outline: none; font-size: 13px; color: #334155; width: 100%; }
.search-input-pill::placeholder { color: #94A3B8; }
.back-btn { border-radius: 10px !important; }

/* ── Body ── */
.lab-body {
  display: grid;
  grid-template-columns: 1fr 280px;
  flex-grow: 1;
  overflow: hidden;
  min-height: 0;
}

/* ── Main ── */
.lab-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Tabs ── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 20px 0;
  background: white;
  border-bottom: 1px solid #F1F5F9;
  flex-shrink: 0;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: none;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #94A3B8;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
  border-radius: 8px 8px 0 0;
}
.tab-btn:hover { color: #64748B; background: #F8FAFC; }
.tab-btn--active { color: #6366F1; border-bottom-color: #6366F1; background: none; }
.tab-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
  line-height: 1.5;
}
.tab-badge--warn    { background: #FEE2E2; color: #EF4444; }
.tab-badge--empty   { background: #F1F5F9; color: #94A3B8; }
.tab-badge--neutral { background: #EEF2FF; color: #6366F1; }

/* ── Tab Content ── */
.tab-content { flex-grow: 1; overflow-y: auto; padding: 20px; }

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px;
  color: #94A3B8;
  font-size: 14px;
  font-weight: 600;
}

/* ── Queue Cards ── */
.queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}
.lab-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #F1F5F9;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
}
.lab-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(0,0,0,0.08);
  border-color: rgba(99, 102, 241, 0.2);
}
.lab-card-body { padding: 18px; }
.lab-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.pet-avatar-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #EEF2FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pet-name-sm { font-size: 15px; font-weight: 700; color: #1E293B; }
.pet-meta-sm { font-size: 12px; color: #94A3B8; margin-top: 1px; }
.priority-chip {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.priority-high   { background: #FEE2E2; color: #EF4444; }
.priority-medium { background: #FEF3C7; color: #F59E0B; }
.priority-normal { background: #EEF2FF; color: #6366F1; }
.priority-low    { background: #F0FDF4; color: #10B981; }

.test-panel {
  background: #F8FAFC;
  border: 1px dashed #E2E8F0;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
}
.test-panel-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6366F1; margin-bottom: 4px; }
.test-panel-value { font-size: 13px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.lab-card-footer { display: flex; justify-content: space-between; font-size: 12px; }
.text-muted { color: #94A3B8; display: flex; align-items: center; gap: 4px; }

.lab-card-action { padding: 12px 18px; background: #F8FAFC; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; }
.enter-results-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #6366F1;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.enter-results-btn:hover { background: #4F46E5; }

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  gap: 12px;
}
.empty-illustration { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
.empty-bg-icon { position: absolute; opacity: 0.08; color: #6366F1; }
.empty-check-icon { position: relative; z-index: 1; color: #10B981; }
.empty-title { font-size: 22px; font-weight: 800; color: #1E293B; margin: 0; }
.empty-desc { font-size: 13px; color: #94A3B8; margin: 0; max-width: 360px; line-height: 1.6; }
.refresh-btn, .switch-history-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid;
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.refresh-btn { border-color: #E2E8F0; background: white; color: #64748B; }
.refresh-btn:hover { background: #F8FAFC; }
.switch-history-btn { border-color: #6366F1; background: #EEF2FF; color: #6366F1; }
.switch-history-btn:hover { background: #E0E7FF; }

/* ── History Table ── */
.history-table-wrap { background: white; border-radius: 16px; border: 1px solid #F1F5F9; overflow: hidden; }
.history-table { width: 100%; border-collapse: collapse; }
.history-table thead tr { background: #F8FAFC; }
.history-table th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94A3B8;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid #F1F5F9;
}
.history-row { transition: background 0.12s; }
.history-row:hover td { background: #FAFBFF; }
.history-row td { padding: 12px 16px; border-bottom: 1px solid #F8FAFC; vertical-align: middle; }
.history-row:last-child td { border-bottom: none; }
.history-avatar {
  width: 32px; height: 32px;
  border-radius: 9px;
  background: #EEF2FF;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.h-pet-name { font-size: 13px; font-weight: 700; color: #1E293B; }
.h-pet-owner { font-size: 11px; color: #94A3B8; }
.test-tag {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 3px 8px;
  white-space: nowrap;
  max-width: 180px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-date { font-size: 12px; color: #475569; font-weight: 600; }
.status-done {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #10B981;
  background: #D1FAE5;
  padding: 3px 8px;
  border-radius: 20px;
}
.view-btn { border-radius: 7px !important; font-weight: 700 !important; font-size: 11px !important; }

/* Pagination */
.pagination-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px;
  border-top: 1px solid #F1F5F9;
}
.page-btn {
  width: 30px; height: 30px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #475569;
  transition: all 0.15s;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { background: #EEF2FF; border-color: #6366F1; color: #6366F1; }
.page-info { font-size: 13px; font-weight: 700; color: #64748B; }

/* ── Sidebar ── */
.lab-sidebar {
  background: white;
  border-left: 1px solid #F1F5F9;
  padding: 20px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.sb-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748B;
  margin-bottom: 12px;
}
.sb-divider { height: 1px; background: #F1F5F9; margin: 16px 0; }

.sidebar-stat-list { display: flex; flex-direction: column; gap: 8px; }
.sidebar-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--c) 6%, white);
  border: 1.5px solid color-mix(in srgb, var(--c) 14%, transparent);
  transition: transform 0.15s;
}
.sidebar-stat:hover { transform: translateX(2px); }
.sidebar-stat-icon { flex-shrink: 0; }
.sidebar-stat-info { display: flex; justify-content: space-between; align-items: center; flex-grow: 1; }
.sidebar-stat-label { font-size: 12px; font-weight: 700; color: #475569; }
.sidebar-stat-val { font-size: 20px; font-weight: 900; color: var(--c); line-height: 1; }

/* Recent list */
.recent-list { display: flex; flex-direction: column; gap: 6px; }
.recent-empty {
  text-align: center;
  padding: 20px 12px;
  color: #CBD5E1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #FAFAFA;
  border: 1px solid #F1F5F9;
  border-radius: 9px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.recent-item:hover { background: #F0F9FF; border-color: #BFDBFE; }
.recent-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; flex-shrink: 0; }
.recent-info { flex-grow: 1; overflow: hidden; }
.recent-name { display: block; font-size: 12px; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.recent-test { display: block; font-size: 10px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.recent-time { font-size: 10px; font-weight: 600; color: #CBD5E1; flex-shrink: 0; }

.see-all-btn {
  font-size: 12px;
  font-weight: 700;
  color: #6366F1;
  background: none;
  border: none;
  cursor: pointer;
  text-align: center;
  padding: 6px 0;
  transition: color 0.15s;
}
.see-all-btn:hover { color: #4F46E5; }

/* Info tip */
.info-tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  border-radius: 12px;
  padding: 12px;
  margin-top: 4px;
}
.info-tip p { font-size: 12px; color: #4338CA; font-weight: 500; margin: 0; line-height: 1.5; }

/* ── Entry View ── */
.entry-view { flex-grow: 1; overflow-y: auto; padding: 24px; }
.results-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  background: white;
  border-radius: 20px;
  border: 1px solid #F1F5F9;
  overflow: hidden;
  min-height: calc(100vh - 120px);
}
.patient-panel { background: #F8FAFC; padding: 32px 24px; border-right: 1px solid #F1F5F9; }
.patient-panel-header { display: flex; flex-direction: column; align-items: center; text-align: center; }
.entry-avatar { border-radius: 18px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important; }
.patient-name { font-size: 22px; font-weight: 800; color: #1E293B; margin: 12px 0 4px; }
.patient-meta { font-size: 13px; color: #94A3B8; margin: 0; }
.info-block { margin-bottom: 16px; }
.info-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; margin-bottom: 4px; }
.info-value { font-size: 14px; font-weight: 700; color: #1E293B; }
.primary-text { color: #6366F1; }
.form-canvas { padding: 32px; }
.form-canvas-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.form-title { font-size: 20px; font-weight: 800; color: #1E293B; margin: 0; }
.verified-label { font-size: 11px; font-weight: 700; color: #10B981; text-transform: uppercase; letter-spacing: 0.06em; }
.form-body { background: #F8FAFC; border-radius: 14px; padding: 24px; border: 1px dashed #E2E8F0; }

/* Scrollbar */
.tab-content::-webkit-scrollbar,
.lab-sidebar::-webkit-scrollbar,
.entry-view::-webkit-scrollbar { width: 4px; }
.tab-content::-webkit-scrollbar-thumb,
.lab-sidebar::-webkit-scrollbar-thumb,
.entry-view::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
</style>
