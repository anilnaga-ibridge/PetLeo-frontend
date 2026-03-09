<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const route = useRoute()
const router = useRouter()
const store = useVeterinaryStore()
const petId = route.params.id

const pet = ref(null)
const loading = ref(true)
const activeTab = ref('Patient history')

const tabs = [
  { title: 'Patient history', icon: 'tabler-history' },
  { title: 'Prescription', icon: 'tabler-medical-cross' },
  { title: 'Treatment plan', icon: 'tabler-clipboard-list' },
  { title: 'Progress notes', icon: 'tabler-notes' },
  { title: 'Immunization Schedule', icon: 'tabler-vaccine' },
  { title: 'Investigation Report', icon: 'tabler-flask' },
  { title: 'Health Parameters', icon: 'tabler-activity' },
  { title: 'Care Program', icon: 'tabler-heart-handshake' },
]

const stats = [
  { label: 'Appointments', value: 2 },
  { label: 'Treatments', value: 0 },
  { label: 'Prescriptions', value: 0 },
  { label: 'Progress notes', value: 0 },
  { label: 'Documents', value: 0 },
]

onMounted(async () => {
  loading.value = true
  try {
    // In a real app, we'd fetch by ID. For now, find in store or fetch all
    if (store.pets.length === 0) await store.fetchPets()
    pet.value = store.pets.find(p => String(p.id) === String(petId))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <component :is="VeterinaryLayout">
    <div
      v-if="loading"
      class="d-flex justify-center align-center min-h-screen"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <div
      v-else-if="pet"
      class="patient-profile-page bg-premium-surface min-h-screen pb-12"
    >
      <!-- TOP NAV / BREADCRUMB -->
      <div class="profile-header-bar border-b bg-white px-6 py-3 d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-4">
          <VAvatar
            size="48"
            color="primary"
            variant="tonal"
            class="rounded-lg"
          >
            <span class="text-h4 font-weight-bold">{{ pet.name.charAt(0) }}</span>
          </VAvatar>
          <div class="d-flex flex-column">
            <div class="d-flex align-center gap-2">
              <h1 class="text-h4 font-weight-bold mb-0">
                {{ pet.name }}
              </h1>
              <VBtn
                variant="text"
                size="x-small"
                color="primary"
                class="font-weight-bold"
                @click="router.push(`/veterinary/pets/${petId}/edit`)"
              >
                Edit
              </VBtn>
            </div>
            <span class="text-caption opacity-60">M +91-{{ pet.owner?.phone || '9515628844' }}</span>
          </div>
        </div>

        <div class="header-stats d-flex gap-8">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="header-stat-item d-flex flex-column align-center"
          >
            <span class="text-h4 font-weight-bold">{{ stat.value }}</span>
            <span class="text-caption opacity-60">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="profile-content-layout">
        <!-- LEFT SIDEBAR: TABS -->
        <div class="profile-tabs-sidebar border-e bg-white">
          <div
            v-for="tab in tabs"
            :key="tab.title"
            class="tab-item d-flex align-center gap-3 px-6 py-4 cursor-pointer transition-all"
            :class="{ 'active-tab': activeTab === tab.title }"
            @click="activeTab = tab.title"
          >
            <VIcon
              :icon="tab.icon"
              size="20"
              :color="activeTab === tab.title ? 'primary' : 'secondary'"
            />
            <span
              class="text-body-2 font-weight-medium"
              :class="{ 'text-primary': activeTab === tab.title }"
            >{{ tab.title }}</span>
          </div>

          <VDivider class="my-4" />

          <div class="action-list px-4">
            <VBtn
              variant="text"
              block
              class="justify-start px-2 text-none"
              prepend-icon="tabler-brand-shopee"
            >
              Online Payment
            </VBtn>
            <VBtn
              variant="text"
              block
              class="justify-start px-2 text-none"
              prepend-icon="tabler-plus"
            >
              Add Payment
            </VBtn>
            <VBtn
              variant="text"
              block
              class="justify-start px-2 text-none"
              prepend-icon="tabler-receipt"
            >
              Invoices
            </VBtn>
            <VBtn
              variant="text"
              block
              class="justify-start px-2 text-none"
              prepend-icon="tabler-file-text"
            >
              Receipts
            </VBtn>
          </div>
        </div>

        <!-- MAIN VIEW: CONTENT -->
        <div class="profile-main-area pa-6">
          <div class="d-flex align-center justify-space-between mb-6">
            <h2 class="text-h3 font-weight-bold">
              {{ activeTab }}
            </h2>
            <div class="d-flex gap-2">
              <VBtn
                variant="tonal"
                size="small"
                prepend-icon="tabler-printer"
              >
                Print case history
              </VBtn>
              <VBtn
                variant="tonal"
                size="small"
                prepend-icon="tabler-share"
              >
                Share case history
              </VBtn>
            </div>
          </div>

          <!-- TAB CONTENT: HISTORY (DEFAULT) -->
          <div
            v-if="activeTab === 'Patient history'"
            class="history-timeline d-flex flex-column gap-6"
          >
            <div class="timeline-group">
              <div class="text-overline text-primary mb-4">
                about 10 hours ago, <span class="text-grey">on 09 Sep 2023</span>
              </div>
              <VCard class="premium-card patient-record-card pa-4 d-flex align-center gap-4">
                <div class="record-icon bg-soft-blue pa-2 rounded-lg">
                  <VIcon
                    icon="tabler-calendar-event"
                    color="primary"
                  />
                </div>
                <div class="flex-grow-1">
                  <div class="text-body-1 font-weight-bold">
                    Appointment with Dr. M KIRAN KUMAR at 09:45 AM
                  </div>
                </div>
              </VCard>
            </div>

            <div class="timeline-group">
              <div class="text-overline text-primary mb-4">
                a day ago, <span class="text-grey">on 08 Sep 2023</span>
              </div>
              <VCard class="premium-card patient-record-card pa-0 overflow-hidden">
                <div class="pa-4 d-flex align-center gap-4 border-b">
                  <div class="record-icon bg-soft-blue pa-2 rounded-lg">
                    <VIcon
                      icon="tabler-calendar-event"
                      color="primary"
                    />
                  </div>
                  <div class="text-body-1 font-weight-bold">
                    Appointment with Dr. M KIRAN KUMAR at 09:45 AM
                  </div>
                </div>
                <div class="pa-4 bg-grey-lighten-5 d-flex flex-column gap-2 text-caption">
                  <div class="d-flex align-center gap-2">
                    <span class="font-weight-bold">Checked in</span>
                    <span class="opacity-60">10:31 AM</span>
                  </div>
                  <div class="d-flex align-center gap-2">
                    <span class="font-weight-bold">Checked out</span>
                    <span class="opacity-60">10:31 AM</span>
                  </div>
                </div>
              </VCard>
            </div>

            <div class="text-center py-12 opacity-40">
              <span class="text-body-2">No more data.</span>
            </div>
          </div>

          <!-- TAB CONTENT: PRESCRIPTION (IMAGE 3) -->
          <div
            v-if="activeTab === 'Prescription'"
            class="prescription-builder d-flex flex-column gap-6"
          >
            <VCard class="premium-card">
              <VCardTitle class="pa-4 border-b font-weight-bold">
                Plan
              </VCardTitle>
              <VCardText class="pa-6">
                <div class="prescription-section mb-6">
                  <label class="text-subtitle-2 font-weight-bold mb-4 d-block">Investigations</label>
                  <div class="horizontal-picker d-flex gap-4">
                    <div
                      class="picker-sidebar border rounded-lg overflow-hidden"
                      style="width: 240px;"
                    >
                      <div class="pa-2 border-b bg-grey-lighten-4">
                        <VTextField
                          placeholder="Search tests..."
                          density="compact"
                          hide-details
                          variant="plain"
                          prepend-inner-icon="tabler-search"
                        />
                      </div>
                      <div class="picker-list text-caption">
                        <div
                          v-for="t in ['CBP', 'CBC', 'CBP LFT KFT', '4DX', 'SKIN SCREPPING']"
                          :key="t"
                          class="pa-2 hover-bg-light cursor-pointer border-b"
                        >
                          {{ t }}
                        </div>
                      </div>
                    </div>
                    <div class="picker-main border rounded-lg flex-grow-1 pa-4 text-grey text-caption">
                      Write tests here...
                    </div>
                  </div>
                </div>

                <div class="prescription-section">
                  <div class="d-flex justify-space-between align-center mb-4">
                    <label class="text-subtitle-2 font-weight-bold">Medicines</label>
                    <div class="d-flex gap-4 align-center">
                      <div class="d-flex align-center gap-2">
                        <span class="text-caption">Common Duration:</span>
                        <VTextField
                          density="compact"
                          hide-details
                          variant="outlined"
                          style="width: 60px"
                        />
                        <span class="text-caption">day(s)</span>
                      </div>
                      <div class="d-flex align-center gap-2">
                        <span class="text-caption">Language:</span>
                        <select class="text-caption border rounded px-2 py-1">
                          <option>English</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div class="medicine-picker border rounded-lg overflow-hidden d-flex">
                    <div
                      class="picker-tabs border-e"
                      style="width: 240px;"
                    >
                      <div class="d-flex border-b">
                        <div class="flex-grow-1 text-center py-2 text-caption font-weight-bold border-e bg-white text-primary">
                          Medicines
                        </div>
                        <div class="flex-grow-1 text-center py-2 text-caption font-weight-bold bg-grey-lighten-4">
                          Templates
                        </div>
                      </div>
                      <div class="pa-2 border-b">
                        <VTextField
                          placeholder="Filter medicines..."
                          density="compact"
                          hide-details
                          variant="plain"
                          prepend-inner-icon="tabler-search"
                        />
                      </div>
                      <div
                        class="picker-list text-caption text-primary overflow-y-auto"
                        style="max-height: 200px;"
                      >
                        <div
                          v-for="m in ['SALINE NORMAL', 'INJECTION ineomic', 'INFUSION RINGER LACTATE', 'SHAMPOO Ketochlor', 'SHAMPOO Sebolytic']"
                          :key="m"
                          class="pa-2 hover-bg-light cursor-pointer border-b font-weight-bold"
                        >
                          {{ m }}
                        </div>
                      </div>
                    </div>
                    <div class="picker-content flex-grow-1 bg-grey-lighten-4" />
                  </div>
                </div>
              </VCardText>
              <VDivider />
              <div class="pa-4 d-flex justify-space-between align-center bg-white">
                <VBtn
                  color="primary"
                  class="rounded-lg shadow-sm"
                >
                  Save Prescription
                </VBtn>
                <div class="d-flex gap-4">
                  <VCheckbox
                    label="Print"
                    density="compact"
                    hide-details
                  />
                  <VBtn
                    variant="text"
                    prepend-icon="tabler-plus"
                    color="primary"
                  >
                    Add follow-up
                  </VBtn>
                </div>
              </div>
            </VCard>
          </div>
        </div>

        <!-- RIGHT SIDEBAR: CASE INFO -->
        <div class="profile-info-sidebar border-s bg-white pa-6 d-flex flex-column gap-6">
          <div class="info-group">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-caption-bold text-uppercase opacity-40">Case ID</span>
              <span class="text-caption font-weight-bold">#PPT1398</span>
            </div>
            <div class="text-caption opacity-40">
              CREATED ON: 08 Sep 2023
            </div>
          </div>

          <VDivider />

          <div class="info-group">
            <label class="text-caption-bold text-uppercase opacity-40 d-block mb-2">Private Note</label>
            <VBtn
              variant="text"
              size="x-small"
              color="primary"
              class="pa-0 text-none"
              prepend-icon="tabler-plus"
            >
              Add one now
            </VBtn>
            <div class="mt-3 text-caption">
              <div class="mb-1">
                Next Visit: <VBtn
                  variant="text"
                  size="x-small"
                  color="primary"
                  class="pa-0 text-none"
                >
                  Add one now
                </VBtn>
              </div>
              <div>Prev Visit: <span class="font-weight-bold">about 10 hours ago</span></div>
            </div>
          </div>

          <VDivider />

          <div class="info-group">
            <label class="text-caption-bold text-uppercase opacity-40 d-block mb-2">IPD</label>
            <div class="d-flex flex-column gap-1">
              <VBtn
                variant="text"
                size="x-small"
                color="primary"
                class="justify-start pa-0 text-none"
              >
                Room History
              </VBtn>
              <VBtn
                variant="text"
                size="x-small"
                color="primary"
                class="justify-start pa-0 text-none"
              >
                Assign Room
              </VBtn>
            </div>
          </div>

          <VDivider />

          <div class="info-group">
            <label class="text-caption-bold text-uppercase opacity-40 d-block mb-2">Current Health State</label>
            <select class="view-select w-100 text-caption mb-2">
              <option>ILL</option>
              <option>HEALTHY</option>
              <option>RECOVERING</option>
            </select>
            <VBtn
              variant="text"
              size="x-small"
              color="primary"
              class="pa-0 text-none"
            >
              Health State History
            </VBtn>
          </div>

          <VDivider />

          <div class="info-group">
            <label class="text-caption-bold text-uppercase opacity-40 d-block mb-2">Images</label>
            <div class="dropzone border-dashed rounded-lg pa-4 text-center cursor-pointer">
              <VIcon
                icon="tabler-cloud-upload"
                color="primary"
                class="mb-2"
              />
              <div class="text-caption">
                No files uploaded yet. <span class="text-primary font-weight-bold">Upload file</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </component>
</template>

<style scoped>
.patient-profile-page {
  display: flex;
  flex-direction: column;
}

.profile-header-bar {
  position: sticky;
  top: 0;
  z-index: 100;
}

.profile-content-layout {
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  flex-grow: 1;
}

.profile-tabs-sidebar {
  height: calc(100vh - 73px);
  position: sticky;
  top: 73px;
  overflow-y: auto;
}

.tab-item {
  border-left: 3px solid transparent;
}
.tab-item:hover {
  background-color: rgba(59, 130, 246, 0.05);
}
.tab-item.active-tab {
  background-color: rgba(59, 130, 246, 0.08);
  border-left-color: #3B82F6;
}

.profile-main-area {
  min-width: 0;
}

.profile-info-sidebar {
  height: calc(100vh - 73px);
  position: sticky;
  top: 73px;
  overflow-y: auto;
}

.patient-record-card {
  transition: all 0.2s;
}
.patient-record-card:hover {
  box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
  transform: translateY(-2px);
}

.timeline-group {
  position: relative;
  padding-left: 4px;
}

.view-select {
  padding: 8px 12px;
  border: 1px solid var(--premium-border);
  border-radius: 8px;
  background: white;
  outline: none;
}

.border-dashed {
  border: 2px dashed #E2E8F0;
}

@media (max-width: 1400px) {
  .profile-content-layout {
    grid-template-columns: 240px 1fr;
  }
  .profile-info-sidebar {
    display: none !important;
  }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
