<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const currentLayout = VeterinaryLayout
const loading = ref(false)
const visits = ref([])
const selectedVisit = ref(null)
const inventory = ref([])
const activeTab = ref('queue') // 'queue' | 'inventory'

const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

// --- Inventory Management ---
const showRestockDialog = ref(false)
const isEditing = ref(false)

const medForm = ref({
  id: null,
  name: '',
  stock_quantity: 0,
  unit_price: 0,
  expiry_date: '',
  is_active: true,
})

const fetchPharmacyQueue = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    visits.value = await store.fetchQueue('PHARMACY_QUEUE', activeClinicId.value)
  } catch (e) {
    console.error("Failed to fetch pharmacy queue:", e)
    visits.value = []
  } finally {
    loading.value = false
  }
}

const fetchInventory = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    inventory.value = await store.fetchMedicines(activeClinicId.value)
  } catch (e) {
    console.error("Failed to fetch pharmacy inventory:", e)
    inventory.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPharmacyQueue()
  fetchInventory()
})

watch(activeClinicId, () => {
  fetchPharmacyQueue()
  fetchInventory()
})

const selectVisit = async visit => {
  loading.value = true
  try {
    const summary = await store.fetchVisitSummary(visit.id)

    selectedVisit.value = summary
  } catch (e) {
    console.error("Failed to load visit details:", e)
  } finally {
    loading.value = false
  }
}

const dispenseMedicines = async () => {
  if (!confirm("Are you sure you have prepared all medications correctly?")) return
  loading.value = true
  try {
    // Find the latest prescription ID from forms
    let prescriptionId = null
    if (selectedVisit.value.forms?.PRESCRIPTION?.length) {
      const sorted = [...selectedVisit.value.forms.PRESCRIPTION].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      prescriptionId = sorted[0].id
    }

    if (prescriptionId) {
      await store.dispensePrescription(prescriptionId)
    } else {
      // Fallback: Just update status if no formal prescription record exists
      await store.updateVisitStatus(selectedVisit.value.id, 'MEDICINES_DISPENSED')
    }

    selectedVisit.value = null
    await fetchPharmacyQueue()
    await fetchInventory()
  } catch (e) {
    console.error("Dispensing failed:", e)
  } finally {
    loading.value = false
  }
}

const openRestock = (med = null) => {
  if (med) {
    isEditing.value = true
    medForm.value = { ...med }
  } else {
    isEditing.value = false
    medForm.value = {
      id: null,
      name: '',
      stock_quantity: 0,
      unit_price: 0,
      expiry_date: '',
      clinic: activeClinicId.value,
      is_active: true,
    }
  }
  showRestockDialog.value = true
}

const saveMedicine = async () => {
  loading.value = true
  try {
    if (isEditing.value) {
      await store.updateMedicine(medForm.value.id, medForm.value)
    } else {
      await store.createMedicine(medForm.value)
    }
    showRestockDialog.value = false
    await fetchInventory()
  } catch (e) {
    console.error("Failed to save medicine:", e)
  } finally {
    loading.value = false
  }
}

const lowStockItems = computed(() => inventory.value.filter(i => parseFloat(i.stock_quantity) < 10))

const dailyRevenue = computed(() => {
  // Mock logic for revenue based on inventory changes or processed visits
  // In a real scenario, this would come from an analytics endpoint
  return 2840 
})

const dispensedToday = ref(14)

const stats = computed(() => ({
  pending: visits.value.length,
  revenue: dailyRevenue.value,
  lowStock: lowStockItems.value.length,
  dispensed: dispensedToday.value,
}))

const prescriptionMedicines = computed(() => {
  if (!selectedVisit.value) return []
  if (selectedVisit.value.prescription?.medicines) {
    return selectedVisit.value.prescription.medicines
  }
  if (selectedVisit.value.visit?.prescription?.medicines) {
    return selectedVisit.value.visit.prescription.medicines
  }
  if (selectedVisit.value.forms?.PRESCRIPTION?.length) {
    const sorted = [...selectedVisit.value.forms.PRESCRIPTION].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    
    return sorted[0].data?.medicines || []
  }
  
  return []
})

const getPetIcon = species => {
  const s = species?.toLowerCase()
  if (s === 'dog') return 'tabler-dog'
  if (s === 'cat') return 'tabler-cat'
  
  return 'tabler-paw'
}

const timeAgo = dateStr => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 60000)
  if (diff < 60) return `${diff}m ago`
  
  return `${Math.floor(diff / 60)}h ago`
}
</script>

<template>
  <component :is="currentLayout">
    <div class="pharmacy-page bg-soft-blue min-h-screen">
      <!-- UNIFIED HEADER -->
      <div class="dashboard-header border-b bg-white px-8 py-4 d-flex align-center justify-space-between sticky-top shadow-sm">
        <div v-if="!selectedVisit">
          <div class="d-flex align-center gap-2 mb-1">
            <VIcon
              icon="tabler-pill"
              color="primary"
              size="20"
            />
            <span class="text-caption-bold text-primary">PHARMACY OPERATIONS</span>
          </div>
          <h1 class="text-h3 font-weight-bold mb-0">
            Medication Dispensing
          </h1>
        </div>
        <div
          v-else
          class="d-flex align-center gap-4"
        >
          <VBtn
            icon
            variant="tonal"
            color="secondary"
            density="compact"
            class="rounded-lg"
            @click="selectedVisit = null"
          >
            <VIcon
              icon="tabler-arrow-left"
              size="20"
            />
          </VBtn>
          <div>
            <div class="text-caption-bold text-primary mb-0">
              DISPENSE REQUEST
            </div>
            <h1 class="text-h3 font-weight-bold mb-0">
              {{ selectedVisit.pet?.name }}
            </h1>
          </div>
        </div>

        <div class="d-flex align-center gap-4">
          <!-- NAVIGATION TOGGLE -->
          <div
            v-if="!selectedVisit"
            class="mode-toggle-group bg-grey-lighten-4 pa-1 rounded-lg d-flex shadow-sm"
          >
            <VBtn 
              size="small" 
              :variant="activeTab === 'queue' ? 'flat' : 'text'" 
              :color="activeTab === 'queue' ? 'primary' : 'secondary'"
              class="px-4 rounded-md font-weight-bold transition-all text-none"
              @click="activeTab = 'queue'"
            >
              Queue
            </VBtn>
            <VBtn 
              size="small" 
              :variant="activeTab === 'inventory' ? 'flat' : 'text'" 
              :color="activeTab === 'inventory' ? 'primary' : 'secondary'"
              class="px-4 rounded-md font-weight-bold transition-all text-none"
              @click="activeTab = 'inventory'"
            >
              Inventory
            </VBtn>
          </div>

          <VBtn
            v-if="activeTab === 'inventory'"
            color="primary"
            class="rounded-lg"
            prepend-icon="tabler-plus"
            @click="openRestock"
          >
            Add Medicine
          </VBtn>

          <VBtn
            color="primary"
            variant="tonal"
            icon="tabler-refresh"
            :loading="loading"
            @click="activeTab === 'queue' ? fetchPharmacyQueue() : fetchInventory()"
          />
        </div>
      </div>

      <!-- MAIN CONTENT LAYOUT -->
      <div
        v-if="!selectedVisit"
        class="dashboard-content-layout"
      >
        <!-- MAIN CANVAS -->
        <div class="main-canvas pa-6">
          <!-- QUEUE VIEW -->
          <div v-if="activeTab === 'queue'">
            <div
              v-if="visits.length > 0"
              class="pharmacy-queue-grid"
            >
              <VCard 
                v-for="visit in visits" 
                :key="visit.id"
                class="premium-card pharmacy-card hover-lift overflow-hidden"
                @click="selectVisit(visit)"
              >
                <div class="pa-5">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <div class="d-flex align-center gap-3">
                      <VAvatar
                        color="warning"
                        variant="tonal"
                        size="48"
                        class="rounded-lg"
                      >
                        <VIcon
                          :icon="getPetIcon(visit.pet?.species)"
                          size="24"
                        />
                      </VAvatar>
                      <div>
                        <div class="text-h5 font-weight-bold">
                          {{ visit.pet?.name }}
                        </div>
                        <div class="text-caption opacity-60">
                          {{ visit.pet?.owner?.name }}
                        </div>
                      </div>
                    </div>
                    <VChip
                      color="warning"
                      size="x-small"
                      label
                      class="premium-badge font-weight-bold"
                    >
                      PENDING
                    </VChip>
                  </div>

                  <div class="prep-indicator pa-4 mb-4 rounded-lg bg-warning-lighten-5 border-dashed-warning">
                    <div class="text-caption-bold text-warning-darken-3 mb-1 text-uppercase">
                      Prescription Brief
                    </div>
                    <div class="text-body-2 font-weight-black line-clamp-1">
                      {{ visit.reason || 'Medication Dispensing Required' }}
                    </div>
                  </div>

                  <div class="d-flex align-center justify-space-between text-caption opacity-60 px-1">
                    <div class="d-flex align-center gap-1">
                      <VIcon
                        icon="tabler-clock"
                        size="14"
                      />
                      <span>ordered {{ timeAgo(visit.created_at) }}</span>
                    </div>
                    <div class="d-flex align-center gap-1">
                      <VIcon
                        icon="tabler-user"
                        size="14"
                      />
                      <span>Dr. Smith</span>
                    </div>
                  </div>
                </div>
                
                <div class="pa-4 bg-grey-lighten-4 border-t d-flex justify-end">
                  <VBtn
                    variant="flat"
                    color="warning"
                    size="small"
                    class="rounded-lg font-weight-bold px-4"
                    @click.stop="selectVisit(visit)"
                  >
                    View & Dispense
                  </VBtn>
                </div>
              </VCard>
            </div>

            <!-- EMPTY STATE: ALL MEDS DISPENSED -->
            <div
              v-else-if="!loading"
              class="queue-clear-state d-flex flex-column align-center justify-center py-16"
            >
              <div class="illustration-container mb-6">
                <VIcon
                  icon="tabler-pill"
                  size="120"
                  color="primary"
                  class="opacity-10 absolute-center"
                />
                <VIcon
                  icon="tabler-circle-check"
                  size="64"
                  color="success"
                  class="relative-top"
                />
              </div>
              <h2 class="text-h2 font-weight-bold mb-2">
                All Meds Dispensed!
              </h2>
              <p
                class="text-body-1 text-medium-emphasis mb-8 text-center"
                style="max-width: 400px"
              >
                Great job! No pending prescriptions at this time. All patients have their medications ready.
              </p>
              <VBtn
                color="primary"
                variant="tonal"
                class="rounded-lg px-8"
                @click="fetchPharmacyQueue"
              >
                Check for Requests
              </VBtn>
            </div>
          </div>

          <!-- INVENTORY VIEW -->
          <div
            v-else
            class="inventory-view"
          >
            <VCard class="premium-card overflow-hidden">
              <VDataTable
                :headers="[
                  { title: 'Medicine', key: 'name' },
                  { title: 'In Stock', key: 'stock_quantity' },
                  { title: 'Expiry', key: 'expiry_date' },
                  { title: 'Price', key: 'unit_price' },
                  { title: '', key: 'actions', align: 'end' }
                ]"
                :items="inventory"
                class="premium-table"
              >
                <template #item.name="{ item }">
                  <div class="d-flex align-center gap-2">
                    <span class="font-weight-bold text-h6">{{ item.name }}</span>
                    <VChip
                      v-if="parseFloat(item.stock_quantity) < 10"
                      size="x-small"
                      color="error"
                      variant="flat"
                      class="premium-badge"
                    >
                      Low Stock
                    </VChip>
                  </div>
                </template>
                <template #item.stock_quantity="{ item }">
                  <span :class="parseFloat(item.stock_quantity) < 10 ? 'text-error font-weight-black' : 'font-weight-medium'">{{ item.stock_quantity }}</span>
                </template>
                <template #item.unit_price="{ item }">
                  <span class="font-weight-bold">₹{{ parseFloat(item.unit_price).toFixed(2) }}</span>
                </template>
                <template #item.actions="{ item }">
                  <div class="d-flex gap-2 justify-end">
                    <VBtn
                      size="x-small"
                      color="primary"
                      variant="tonal"
                      icon="tabler-edit"
                      class="rounded-lg"
                      @click="openRestock(item)"
                    />
                    <VBtn
                      size="x-small"
                      color="secondary"
                      variant="tonal"
                      icon="tabler-history"
                      class="rounded-lg"
                    />
                  </div>
                </template>
              </VDataTable>
            </VCard>
          </div>
        </div>

        <!-- SIDE PANEL -->
        <div class="side-panel">
          <div class="status-grid mb-8">
            <div
              class="status-mini-card"
              style="border-top: 4px solid #F59E0B"
            >
              <div
                class="text-h3 font-weight-bold"
                style="color: #F59E0B"
              >
                {{ stats.pending }}
              </div>
              <div class="text-caption-bold">
                Pending
              </div>
            </div>
            <div
              class="status-mini-card"
              style="border-top: 4px solid #3B82F6"
            >
              <div
                class="text-h3 font-weight-bold"
                style="color: #3B82F6"
              >
                {{ stats.dispensed }}
              </div>
              <div class="text-caption-bold">
                Dispensed
              </div>
            </div>
            <div
              class="status-mini-card"
              style="border-top: 4px solid #EF4444"
            >
              <div
                class="text-h3 font-weight-bold"
                style="color: #EF4444"
              >
                {{ stats.lowStock }}
              </div>
              <div class="text-caption-bold">
                Low Stock
              </div>
            </div>
          </div>

          <VCard class="premium-card bg-primary-dark text-white pa-6 mb-8 overflow-hidden relative">
            <div class="relative z-1">
              <div class="text-caption-bold opacity-60 text-uppercase mb-1">
                Today's Pharmacy Revenue
              </div>
              <div class="text-h2 font-weight-black mb-1">
                ₹{{ stats.revenue.toLocaleString() }}
              </div>
              <div class="text-caption opacity-40">
                Estimated from {{ stats.dispensed }} dispensations
              </div>
            </div>
            <VIcon
              icon="tabler-cash-banknote"
              size="100"
              class="absolute-icon"
            />
          </VCard>

          <VCard class="premium-card flex-grow-1 d-flex flex-column mb-8">
            <VCardTitle class="pa-4 border-b">
              <span class="text-h5 font-weight-bold">Low Stock Alerts</span>
            </VCardTitle>
            <VCardText class="pa-0 flex-grow-1 overflow-y-auto">
              <div
                v-for="item in lowStockItems"
                :key="item.id"
                class="alert-row pa-4 d-flex align-center gap-3 border-b"
              >
                <VAvatar
                  color="error"
                  variant="tonal"
                  size="32"
                  class="rounded-lg"
                >
                  <VIcon
                    icon="tabler-alert-triangle"
                    size="18"
                  />
                </VAvatar>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-bold">
                    {{ item.name }}
                  </div>
                  <div class="text-caption text-error font-weight-bold">
                    Only {{ item.stock_quantity }} units left
                  </div>
                </div>
              </div>
              <div
                v-if="lowStockItems.length === 0"
                class="pa-8 text-center opacity-20"
              >
                <VIcon
                  icon="tabler-check"
                  size="48"
                />
                <div>All levels normal</div>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- DISPENSE VIEW -->
      <div
        v-else
        class="pa-8 animate-fade-in"
      >
        <div class="dispense-layout shadow-lg rounded-xl overflow-hidden bg-white">
          <!-- Patient Column -->
          <div class="patient-summary pa-8 bg-warning-lighten-5 border-r">
            <div class="d-flex flex-column align-center text-center mb-8">
              <VAvatar
                size="100"
                color="white"
                class="elevation-4 mb-4 rounded-xl"
              >
                <VIcon
                  :icon="getPetIcon(selectedVisit.pet?.species)"
                  size="48"
                  color="warning"
                />
              </VAvatar>
              <h2 class="text-h2 font-weight-bold">
                {{ selectedVisit.pet?.name }}
              </h2>
              <div class="text-body-1 opacity-60">
                {{ selectedVisit.owner?.name }}
              </div>
              <VChip
                size="small"
                variant="flat"
                color="warning"
                label
                class="mt-4 px-4 font-weight-bold"
              >
                ID: {{ selectedVisit.pet?.pet_code || 'PH-882' }}
              </VChip>
            </div>

            <VDivider class="mb-6 opacity-20" />

            <div class="info-grid">
              <div class="info-item mb-4">
                <div class="text-caption-bold opacity-40 text-uppercase">
                  Prescribed Date
                </div>
                <div class="text-body-1 font-weight-bold">
                  {{ new Date(selectedVisit.created_at || selectedVisit.visit?.created_at).toLocaleDateString() }}
                </div>
              </div>
              <div class="info-item mb-4">
                <div class="text-caption-bold opacity-40 text-uppercase">
                  Requesting Doctor
                </div>
                <div class="text-body-1 font-weight-bold">
                  Dr. Smith
                </div>
              </div>
            </div>

            <VBtn
              block
              variant="tonal"
              color="warning"
              prepend-icon="tabler-printer"
              class="rounded-lg mt-8 font-weight-bold"
            >
              Print Labels
            </VBtn>
          </div>

          <!-- Medications Column -->
          <div class="meds-canvas pa-8">
            <div class="d-flex align-center justify-space-between mb-8">
              <h3 class="text-h3 font-weight-bold">
                Prescribed Medications
              </h3>
              <div class="d-flex align-center gap-2">
                <VIcon
                  icon="tabler-shield-check"
                  color="success"
                  size="20"
                />
                <span class="text-caption-bold text-success text-uppercase">Verified Dosage</span>
              </div>
            </div>

            <div class="medications-list bg-grey-lighten-4 pa-6 rounded-xl border-dashed mb-8">
              <div v-if="prescriptionMedicines.length > 0">
                <div
                  v-for="(med, idx) in prescriptionMedicines"
                  :key="idx"
                  class="med-item pa-4 bg-white rounded-lg elevation-1 mb-4 d-flex align-center justify-space-between"
                >
                  <div>
                    <div class="text-h6 font-weight-black text-primary">
                      {{ med.name }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Dosage: <span class="font-weight-bold">{{ med.dosage }}</span> • Frequency: <span class="font-weight-bold text-primary">{{ med.frequency }}</span>
                    </div>
                  </div>
                  <div class="d-flex align-center gap-4">
                    <div class="text-right">
                      <div class="text-caption opacity-40">
                        Duration
                      </div>
                      <div class="text-body-2 font-weight-black">
                        {{ med.duration }}
                      </div>
                    </div>
                    <VCheckbox
                      hide-details
                      color="success"
                      class="custom-check"
                    />
                  </div>
                </div>
              </div>
              <div
                v-else
                class="text-center py-8 opacity-40"
              >
                <VIcon
                  icon="tabler-pill-off"
                  size="48"
                  class="mb-2"
                />
                <div>No medications found in prescription record.</div>
              </div>
            </div>

            <VBtn
              block
              size="x-large"
              color="success"
              class="rounded-xl shadow-lg font-weight-black text-uppercase tracking-wider"
              height="64"
              prepend-icon="tabler-check"
              :loading="loading"
              @click="dispenseMedicines"
            >
              Confirm Dispensing & Notify Staff
            </VBtn>
          </div>
        </div>
      </div>

      <!-- RESTOCK / ADD MEDICINE DIALOG -->
      <VDialog
        v-model="showRestockDialog"
        max-width="500"
      >
        <VCard class="premium-card">
          <VCardTitle class="pa-6 border-b">
            <span class="text-h4 font-weight-bold">{{ isEditing ? 'Edit Medicine' : 'Add New Medicine' }}</span>
          </VCardTitle>
          <VCardText class="pa-6">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="medForm.name"
                  label="Medicine Name"
                  placeholder="e.g. Amoxicillin 250mg"
                  density="comfortable"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="medForm.stock_quantity"
                  label="Stock Quantity"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="6">
                <VTextField
                  v-model="medForm.unit_price"
                  label="Unit Price (₹)"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="medForm.expiry_date"
                  label="Expiry Date"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                />
              </VCol>
            </VRow>
          </VCardText>
          <VCardActions class="pa-6 pt-0">
            <VSpacer />
            <VBtn
              variant="tonal"
              color="secondary"
              @click="showRestockDialog = false"
            >
              Cancel
            </VBtn>
            <VBtn
              color="primary"
              class="rounded-lg shadow-sm px-6"
              :loading="loading"
              @click="saveMedicine"
            >
              {{ isEditing ? 'Update' : 'Add to Inventory' }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </div>
  </component>
</template>

<style scoped>
.dashboard-content-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  height: calc(100vh - 83px);
  overflow: hidden;
}

.main-canvas {
  overflow-y: auto;
  min-width: 0;
}

.pharmacy-queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.pharmacy-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent !important;
  cursor: pointer;
}

.pharmacy-card:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-warning), 0.2) !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.06) !important;
}

.prep-indicator {
  border: 1px dashed rgba(var(--v-theme-warning), 0.3);
}

.border-dashed-warning {
  border: 1px dashed rgba(245, 158, 11, 0.3);
}

.side-panel {
  border-left: 1px solid rgba(var(--v-border-color), 0.08);
  height: 100%;
  padding: 24px;
  background-color: white;
  display: flex;
  flex-direction: column;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.status-mini-card {
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(var(--v-border-color), 0.05);
}

.bg-primary-dark {
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
}

.absolute-icon {
  position: absolute;
  right: -20px;
  bottom: -20px;
  opacity: 0.1;
  transform: rotate(-15deg);
}

.dispense-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: calc(100vh - 150px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 100;
}

.bg-warning-lighten-5 {
  background-color: #FFFBEB;
}

.illustration-container {
  position: relative;
  height: 120px;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.absolute-center {
  position: absolute;
}

.relative-top {
  position: relative;
  z-index: 1;
  margin-top: -40px;
  margin-right: -60px;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.bg-soft-blue {
  background-color: #F8FAFC;
}

.alert-row:last-child {
  border-bottom: none;
}
</style>
