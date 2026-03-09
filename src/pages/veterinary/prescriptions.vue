<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted, computed } from 'vue'
import AIMedicineAutocomplete from '@/components/veterinary/AIMedicineAutocomplete.vue'

import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store         = useVeterinaryStore()
const userData      = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

// ── Queue ──────────────────────────────────────────────────────────────────
const prescriptions  = ref([])
const loading        = ref(false)
const selectedVisit  = ref(null)
const queueSearch    = ref('')

const filteredQueue = computed(() => {
  const q = queueSearch.value.toLowerCase()
  if (!q) return prescriptions.value
  
  return prescriptions.value.filter(rx =>
    rx.pet?.name?.toLowerCase().includes(q) ||
    rx.doctor_name?.toLowerCase().includes(q),
  )
})

const fetchPrescriptions = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    const data = await store.fetchQueue('PHARMACY_QUEUE', activeClinicId.value)

    prescriptions.value = data || []
    if (prescriptions.value.length && !selectedVisit.value) {
      selectedVisit.value = prescriptions.value[0]
    }
  } catch (e) {
    console.error('Failed to fetch prescriptions:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPrescriptions)

// ── Medicine Editor ───────────────────────────────────────────────────────
const newMedicines  = ref([])
const medicineInput = ref('')
const advice        = ref('')
const saving        = ref(false)

const addMedicine = () => {
  newMedicines.value.push({
    id: Date.now(),
    name: medicineInput.value.trim(),
    dosage: '',
    morning: false,
    afternoon: false,
    night: false,
    duration: '',
    notes: '',
  })
  medicineInput.value = ''
}


const handleAiSuggestion = suggestion => {
  if (!suggestion) return
  
  const freqStr = (suggestion.frequency || '').toLowerCase()
  const morning = freqStr.includes('morning') || freqStr.includes('od') || freqStr.includes('bid') || freqStr.includes('tid')
  const afternoon = freqStr.includes('afternoon') || freqStr.includes('bid') || freqStr.includes('tid')
  const night = freqStr.includes('night') || freqStr.includes('tid')
  
  const dosageStr = suggestion.dosage || ''
  
  newMedicines.value.push({
    id: Date.now(),
    name: suggestion.medicine_name || medicineInput.value,
    dosage: dosageStr,
    morning: morning,
    afternoon: afternoon,
    night: night,
    duration: suggestion.duration || '',
    notes: suggestion.notes || '',
  })
  
  // Clear input after a tick
  setTimeout(() => {
    medicineInput.value = ''
  }, 100)
}

const handleEnter = e => {
  if (medicineInput.value.trim()) addMedicine()
}

const removeMedicine = id => {
  newMedicines.value = newMedicines.value.filter(m => m.id !== id)
}

const toggleFreq = (med, slot) => {
  med[slot] = !med[slot]
}

const freqLabel = m => {
  const parts = []
  if (m.morning)   parts.push('AM')
  if (m.afternoon) parts.push('PM')
  if (m.night)     parts.push('Night')
  
  return parts.join(' · ') || 'Not set'
}

// ── Helpers ───────────────────────────────────────────────────────────────
const getPetIcon = species => {
  const s = (species || '').toLowerCase()
  if (s === 'cat') return 'tabler-cat'
  if (s === 'dog') return 'tabler-dog'
  
  return 'tabler-paw'
}

const statusColor = s => ({
  DRAFT: 'warning',
  SENT: 'info',
  COMPLETED: 'success',
  QUEUE: 'primary',
}[s] || 'default')

const formatDate = d => {
  if (!d) return '—'
  
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const savePrescription = async () => {
  if (!selectedVisit.value || !newMedicines.value.length) return
  
  saving.value = true
  try {
    const data = {
      medicines: newMedicines.value,
      notes: advice.value,
      doctor_id: userData.value?.id,
    }
    
    await store.submitForm(selectedVisit.value.id, 'PRESCRIPTION', data)
    
    // Transition to FINALIZED so it shows in pharmacy as ready
    await store.updateVisitStatus(selectedVisit.value.id, 'PRESCRIPTION_FINALIZED')
    
    // Refresh
    await fetchPrescriptions()
    
    // Clear form
    newMedicines.value = []
    advice.value = ''
    selectedVisit.value = null
  } catch (e) {
    console.error('Failed to save prescription:', e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <component :is="VeterinaryLayout">
    <div class="rx-shell">
      <!-- ═══════════════════════ HEADER ════════════════════════════════ -->
      <header class="rx-header">
        <div class="rx-header-brand">
          <div class="rx-chip">
            <VIcon
              icon="tabler-pill"
              size="13"
            />
            Pharmacy
          </div>
          <h1 class="rx-title">
            Pharmacy
          </h1>
        </div>

        <div class="rx-header-actions">
          <VBtn
            icon="tabler-refresh"
            variant="tonal"
            color="secondary"
            size="small"
            :loading="loading"
            @click="fetchPrescriptions"
          />
        </div>
      </header>

      <!-- ═══════════════════════ BODY ══════════════════════════════════ -->
      <div class="rx-body">
        <!-- ── EDITOR (left) ─────────────────────────────────────────── -->
        <div class="rx-editor">
          <!-- Patient Card -->
          <div class="section-card">
            <div
              v-if="selectedVisit"
              class="patient-strip"
            >
              <div class="patient-avatar">
                <VIcon
                  :icon="getPetIcon(selectedVisit.pet?.species)"
                  size="22"
                  color="primary"
                />
              </div>
              <div class="patient-details">
                <div class="patient-name">
                  {{ selectedVisit.pet?.name || 'Patient' }}
                </div>
                <div class="patient-meta">
                  <span><VIcon
                    icon="tabler-user"
                    size="12"
                    class="meta-icon"
                  />{{ selectedVisit.owner_name || 'N/A' }}</span>
                  <span class="meta-dot" />
                  <span><VIcon
                    icon="tabler-hash"
                    size="12"
                    class="meta-icon"
                  />{{ (selectedVisit.id || '').toString().slice(0, 8).toUpperCase() }}</span>
                  <span class="meta-dot" />
                  <span>Dr. {{ selectedVisit.doctor_name || '—' }}</span>
                </div>
              </div>
              <span class="ready-badge">
                <VIcon
                  icon="tabler-clock"
                  size="12"
                />
                Ready for Dispensing
              </span>
            </div>
            <div
              v-else
              class="patient-placeholder"
            >
              <VIcon
                icon="tabler-receipt"
                size="32"
                color="#CBD5E1"
              />
              <p>Select a patient from the queue</p>
            </div>
          </div>

          <!-- Medicines -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <VIcon
                  icon="tabler-pill"
                  size="15"
                />
                Medicines
              </div>
              <span
                v-if="newMedicines.length"
                class="med-count"
              >{{ newMedicines.length }}</span>
            </div>

            <!-- Add Row -->
            <div class="add-medicine-row">
              <div class="flex-grow-1">
                <AIMedicineAutocomplete
                  v-model="medicineInput"
                  label="Search Medicine (AI powered)"
                  @suggestion-selected="handleAiSuggestion"
                  @keydown.enter="handleEnter"
                />
              </div>
              <button
                class="add-btn mt-1"
                :disabled="!medicineInput?.trim()"
                @click="addMedicine"
              >
                <VIcon
                  icon="tabler-plus"
                  size="15"
                />
                Add
              </button>
            </div>

            <!-- Medicine Items -->
            <TransitionGroup
              name="med-slide"
              tag="div"
              class="med-list"
            >
              <div
                v-for="med in newMedicines"
                :key="med.id"
                class="med-item"
              >
                <!-- Row 1: Name + Dosage + Duration + Delete -->
                <div class="med-row-top">
                  <div class="med-field med-field--name">
                    <label class="field-label">Medicine</label>
                    <input
                      v-model="med.name"
                      class="field-input"
                      placeholder="Medicine name"
                    >
                  </div>
                  <div class="med-field med-field--dosage">
                    <label class="field-label">Dosage</label>
                    <input
                      v-model="med.dosage"
                      class="field-input"
                      placeholder="e.g. 5mg"
                    >
                  </div>
                  <div class="med-field med-field--dur">
                    <label class="field-label">Days</label>
                    <input
                      v-model="med.duration"
                      class="field-input"
                      placeholder="7"
                      type="number"
                      min="1"
                    >
                  </div>
                  <button
                    class="del-btn"
                    @click="removeMedicine(med.id)"
                  >
                    <VIcon
                      icon="tabler-x"
                      size="14"
                    />
                  </button>
                </div>

                <!-- Row 2: Timing toggles + note -->
                <div class="med-row-bottom">
                  <div class="timing-label">
                    Timing:
                  </div>
                  <div class="timing-pills">
                    <button
                      class="timing-pill"
                      :class="{ 'timing-pill--on timing-pill--am': med.morning }"
                      @click="toggleFreq(med, 'morning')"
                    >
                      <VIcon
                        icon="tabler-sun"
                        size="12"
                      />
                      Morning
                    </button>
                    <button
                      class="timing-pill"
                      :class="{ 'timing-pill--on timing-pill--pm': med.afternoon }"
                      @click="toggleFreq(med, 'afternoon')"
                    >
                      <VIcon
                        icon="tabler-sun-low"
                        size="12"
                      />
                      Afternoon
                    </button>
                    <button
                      class="timing-pill"
                      :class="{ 'timing-pill--on timing-pill--night': med.night }"
                      @click="toggleFreq(med, 'night')"
                    >
                      <VIcon
                        icon="tabler-moon"
                        size="12"
                      />
                      Night
                    </button>
                  </div>
                  <input
                    v-model="med.notes"
                    class="med-notes-input"
                    placeholder="Notes (optional)"
                  >
                </div>
              </div>
            </TransitionGroup>

            <!-- Empty -->
            <div
              v-if="newMedicines.length === 0"
              class="med-empty"
            >
              <VIcon
                icon="tabler-pill-off"
                size="24"
                color="#CBD5E1"
              />
              <p>No medicines added yet. Search and add above.</p>
            </div>
          </div>

          <!-- Clinical Advice -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">
                <VIcon
                  icon="tabler-notes-medical"
                  size="15"
                />
                Clinical Advice
              </div>
            </div>
            <textarea
              v-model="advice"
              class="advice-textarea"
              placeholder="Diet, rest, activity restrictions, follow-up instructions…"
              rows="3"
            />
          </div>

          <!-- Action Buttons -->
          <div class="action-bar">
            <button 
              class="action-btn action-btn--primary" 
              :disabled="saving || !selectedVisit || !newMedicines.length"
              @click="savePrescription"
            >
              <VIcon
                icon="tabler-device-floppy"
                size="16"
              />
              {{ saving ? 'Saving…' : 'Save Prescription' }}
            </button>
            <button class="action-btn action-btn--outline">
              <VIcon
                icon="tabler-printer"
                size="16"
              />
              Print
            </button>
            <button class="action-btn action-btn--outline">
              <VIcon
                icon="tabler-mail"
                size="16"
              />
              Email
            </button>
            <button class="action-btn action-btn--outline">
              <VIcon
                icon="tabler-message"
                size="16"
              />
              SMS
            </button>
          </div>
        </div>

        <!-- ── QUEUE (right) ─────────────────────────────────────────── -->
        <aside class="rx-sidebar">
          <div class="section-title mb-3">
            <VIcon
              icon="tabler-list-check"
              size="15"
            />
            Prescription Queue
          </div>

          <!-- Search -->
          <div class="queue-search">
            <VIcon
              icon="tabler-search"
              size="14"
              class="qs-icon"
            />
            <input
              v-model="queueSearch"
              placeholder="Search patient…"
              class="qs-input"
            >
          </div>

          <!-- Loading -->
          <div
            v-if="loading"
            class="queue-loader"
          >
            <VProgressCircular
              indeterminate
              color="primary"
              size="28"
            />
          </div>

          <!-- Empty -->
          <div
            v-else-if="filteredQueue.length === 0"
            class="queue-empty"
          >
            <VIcon
              icon="tabler-circle-check"
              size="36"
              color="#10B981"
            />
            <p class="queue-empty-title">
              All Clear!
            </p>
            <p class="queue-empty-sub">
              No pending prescriptions in the queue.
            </p>
          </div>

          <!-- List -->
          <div
            v-else
            class="queue-list"
          >
            <div
              v-for="rx in filteredQueue"
              :key="rx.id"
              class="queue-item"
              :class="{ 'queue-item--active': selectedVisit?.id === rx.id }"
              @click="selectedVisit = rx"
            >
              <div class="qi-avatar">
                <VIcon
                  :icon="getPetIcon(rx.pet?.species)"
                  size="17"
                  color="primary"
                />
              </div>
              <div class="qi-info">
                <div class="qi-name">
                  {{ rx.pet?.name || 'Patient' }}
                </div>
                <div class="qi-meta">
                  Dr. {{ rx.doctor_name || '—' }} · {{ formatDate(rx.created_at) }}
                </div>
              </div>
              <div class="qi-right">
                <span
                  class="qi-badge"
                  :class="`qi-badge--${(rx.status || 'queue').toLowerCase()}`"
                >
                  {{ rx.status || 'QUEUE' }}
                </span>
                <VIcon
                  icon="tabler-chevron-right"
                  size="14"
                  class="qi-arrow"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </component>
</template>

<style scoped>
/* ── Shell ── */
.rx-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8FAFC;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1E293B;
  overflow: hidden;
}

/* ── Header ── */
.rx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid #F1F5F9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.rx-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6366F1;
  margin-bottom: 2px;
}
.rx-title {
  font-size: 19px;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1;
}
.rx-header-actions { display: flex; align-items: center; gap: 8px; }

/* ── Body ── */
.rx-body {
  display: grid;
  grid-template-columns: 1fr 300px;
  flex-grow: 1;
  overflow: hidden;
  min-height: 0;
  gap: 0;
}

/* ── Editor ── */
.rx-editor {
  overflow-y: auto;
  padding: 20px 20px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rx-editor::-webkit-scrollbar { width: 4px; }
.rx-editor::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }

/* ── Section Card ── */
.section-card {
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 14px;
  padding: 18px 20px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748B;
}
.mb-3 { margin-bottom: 12px; }

.med-count {
  font-size: 11px;
  font-weight: 800;
  background: #EEF2FF;
  color: #6366F1;
  padding: 2px 8px;
  border-radius: 20px;
}

/* ── Patient Strip ── */
.patient-strip {
  display: flex;
  align-items: center;
  gap: 14px;
}
.patient-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #EEF2FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.patient-details { flex-grow: 1; overflow: hidden; }
.patient-name {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.patient-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94A3B8;
  margin-top: 3px;
  flex-wrap: wrap;
}
.meta-icon { opacity: 0.7; vertical-align: -1px; }
.meta-dot { width: 3px; height: 3px; border-radius: 50%; background: #CBD5E1; }
.ready-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #F59E0B;
  background: #FEF3C7;
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.patient-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: #CBD5E1;
}
.patient-placeholder p { font-size: 13px; font-weight: 600; margin: 0; }

/* ── Add Medicine Row ── */
.add-medicine-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.add-input-wrap {
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 8px 12px;
  transition: border-color 0.15s;
}
.add-input-wrap:focus-within { border-color: #6366F1; background: white; }
.add-icon { color: #94A3B8; flex-shrink: 0; }
.add-input { border: none; background: transparent; outline: none; font-size: 13px; color: #334155; width: 100%; font-family: inherit; }
.add-input::placeholder { color: #94A3B8; }
.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #6366F1;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  height: 40px;
  font-family: inherit;
}
.add-btn:hover:not(:disabled) { background: #4F46E5; }
.add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Medicine List ── */
.med-list { display: flex; flex-direction: column; gap: 10px; }
.med-item {
  background: #FAFAFA;
  border: 1.5px solid #F1F5F9;
  border-radius: 12px;
  padding: 12px 14px;
  transition: border-color 0.15s;
}
.med-item:hover { border-color: #E2E8F0; }

.med-row-top {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}
.med-field { display: flex; flex-direction: column; gap: 4px; }
.med-field--name    { flex: 3; }
.med-field--dosage  { flex: 1.5; }
.med-field--dur     { flex: 1; min-width: 60px; }

.field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; }
.field-input {
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  background: white;
  outline: none;
  width: 100%;
  font-family: inherit;
  transition: border-color 0.15s;
}
.field-input:focus { border-color: #6366F1; }
.field-input::placeholder { color: #CBD5E1; }

.del-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: 1.5px solid #FEE2E2;
  border-radius: 8px;
  background: white;
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.del-btn:hover { background: #FEE2E2; }

.med-row-bottom { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.timing-label { font-size: 11px; font-weight: 700; color: #94A3B8; flex-shrink: 0; }
.timing-pills { display: flex; gap: 6px; flex-shrink: 0; }
.timing-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1.5px solid #E2E8F0;
  background: white;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.timing-pill:hover { border-color: #6366F1; color: #6366F1; }
.timing-pill--on { color: white !important; }
.timing-pill--am    { border-color: #F59E0B !important; background: #F59E0B !important; }
.timing-pill--pm    { border-color: #F97316 !important; background: #F97316 !important; }
.timing-pill--night { border-color: #6366F1 !important; background: #6366F1 !important; }

.med-notes-input {
  flex-grow: 1;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #475569;
  background: white;
  outline: none;
  font-family: inherit;
  min-width: 0;
  transition: border-color 0.15s;
}
.med-notes-input:focus { border-color: #6366F1; }
.med-notes-input::placeholder { color: #CBD5E1; }

/* Med Empty */
.med-empty {
  text-align: center;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #CBD5E1;
}
.med-empty p { font-size: 12px; font-weight: 600; margin: 0; color: #94A3B8; }

/* ── Advice Textarea ── */
.advice-textarea {
  width: 100%;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: #334155;
  background: white;
  outline: none;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.advice-textarea:focus { border-color: #6366F1; }
.advice-textarea::placeholder { color: #CBD5E1; }

/* ── Action Bar ── */
.action-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  border: none;
  white-space: nowrap;
}
.action-btn--primary { background: #6366F1; color: white; }
.action-btn--primary:hover:not(:disabled) { background: #4F46E5; }
.action-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn--outline { background: white; color: #475569; border: 1.5px solid #E2E8F0; }
.action-btn--outline:hover { background: #F8FAFC; border-color: #CBD5E1; }

/* ── Sidebar ── */
.rx-sidebar {
  background: white;
  border-left: 1px solid #F1F5F9;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Queue search */
.queue-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 7px 12px;
  margin-bottom: 14px;
  transition: border-color 0.15s;
}
.queue-search:focus-within { border-color: #6366F1; }
.qs-icon { color: #CBD5E1; flex-shrink: 0; }
.qs-input { border: none; background: transparent; outline: none; font-size: 13px; color: #334155; width: 100%; font-family: inherit; }
.qs-input::placeholder { color: #CBD5E1; }

/* Queue loader */
.queue-loader {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

/* Queue empty */
.queue-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
}
.queue-empty-title { font-size: 15px; font-weight: 700; color: #1E293B; margin: 0; }
.queue-empty-sub   { font-size: 12px; color: #94A3B8; margin: 0; }

/* Queue list */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex-grow: 1;
}
.queue-list::-webkit-scrollbar { width: 4px; }
.queue-list::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  background: #FAFAFA;
}
.queue-item:hover { background: #F0F9FF; border-color: #BFDBFE; }
.queue-item--active { background: #EEF2FF; border-color: #C7D2FE; }

.qi-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #EEF2FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.qi-info { flex-grow: 1; overflow: hidden; }
.qi-name { font-size: 13px; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qi-meta { font-size: 11px; color: #94A3B8; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qi-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.qi-badge {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.qi-badge--draft     { background: #FEF3C7; color: #F59E0B; }
.qi-badge--sent      { background: #DBEAFE; color: #3B82F6; }
.qi-badge--completed { background: #D1FAE5; color: #10B981; }
.qi-badge--queue     { background: #EEF2FF; color: #6366F1; }
.qi-arrow { color: #CBD5E1; }

/* ── Transitions ── */
.med-slide-enter-active, .med-slide-leave-active { transition: all 0.2s ease; }
.med-slide-enter-from, .med-slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
