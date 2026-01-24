<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const store = useVeterinaryStore()
const currentLayout = VeterinaryLayout
const loading = ref(false)
const visits = ref([])
const selectedVisit = ref(null)

const fetchPharmacyQueue = async () => {
  loading.value = true
  try {
    visits.value = await store.fetchQueue('PHARMACY_QUEUE')
  } catch (e) {
    console.error("Failed to fetch pharmacy queue:", e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPharmacyQueue)

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
    await store.updateVisitStatus(selectedVisit.value.id, 'MEDICINES_DISPENSED')
    selectedVisit.value = null
    await fetchPharmacyQueue()
  } catch (e) {
    console.error("Dispensing failed:", e)
  } finally {
    loading.value = false
  }
}

const prescriptionMedicines = computed(() => {
  if (!selectedVisit.value) return []
    
  // Debugging
  console.log("Pharmacy selectedVisit:", selectedVisit.value)
    
  // 1. Direct Summary Shortcut (preferred)
  if (selectedVisit.value.prescription?.medicines) {
    return selectedVisit.value.prescription.medicines
  }

  // 1b. Check inside 'visit' property if nested
  if (selectedVisit.value.visit?.prescription?.medicines) {
    return selectedVisit.value.visit.prescription.medicines
  }
    
  // 2. Forms Array (fallback) - Get latest PRESCRIPTION form
  if (selectedVisit.value.forms?.PRESCRIPTION?.length) {
    // Sort by submitted_at to ensure we get the real latest
    const sorted = [...selectedVisit.value.forms.PRESCRIPTION].sort((a, b) => {
      return new Date(b.submitted_at) - new Date(a.submitted_at)
    })

    const latest = sorted[0]
    
    return latest.data?.medicines || []
  }
    
  return []
})
</script>

<template>
  <component :is="currentLayout">
    <div class="pharmacy-dashboard pa-6">
      <!-- HEADER -->
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-black d-flex align-center gap-2">
            <VIcon
              icon="tabler-pill"
              color="primary"
              size="32"
            />
            Hospital Pharmacy
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Dispensing medications and dosage labels.
          </p>
        </div>
        <VBtn 
          v-if="!selectedVisit"
          prepend-icon="tabler-refresh" 
          variant="tonal" 
          color="primary" 
          :loading="loading" 
          @click="fetchPharmacyQueue"
        >
          Refresh Queue
        </VBtn>
        <VBtn 
          v-else
          prepend-icon="tabler-arrow-left" 
          variant="tonal" 
          color="secondary" 
          @click="selectedVisit = null"
        >
          Back to Queue
        </VBtn>
      </div>

      <!-- QUEUE VIEW -->
      <div v-if="!selectedVisit">
        <VRow v-if="visits.length > 0">
          <VCol
            v-for="visit in visits"
            :key="visit.id"
            cols="12"
            md="6"
            lg="4"
          >
            <VCard
              variant="flat"
              border
              class="pharmacy-visit-card hover-lift"
            >
              <VCardItem>
                <template #prepend>
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    size="48"
                  >
                    <VIcon :icon="visit.pet?.species === 'Cat' ? 'tabler-cat' : 'tabler-dog'" />
                  </VAvatar>
                </template>
                <VCardTitle class="font-weight-bold">
                  {{ visit.pet?.name }}
                </VCardTitle>
                <VCardSubtitle>{{ visit.pet?.owner?.name }} • {{ visit.pet?.breed }}</VCardSubtitle>
              </VCardItem>
              
              <VDivider />
              
              <VCardText class="pa-4">
                <div class="d-flex justify-space-between mb-4">
                  <div class="text-caption text-uppercase font-weight-bold text-disabled">
                    Doctor
                  </div>
                  <div class="text-body-2 font-weight-medium">
                    Dr. Smith
                  </div>
                </div>
                
                <div class="prescription-preview pa-3 bg-warning-lighten-5 rounded mb-4">
                  <div class="text-caption text-warning-darken-2 font-weight-bold mb-1">
                    PRESCRIPTION:
                  </div>
                  <div class="text-body-2 text-truncate">
                    {{ (visit.reason || 'Standard Care Package') }}
                  </div>
                </div>

                <VBtn
                  block
                  color="warning"
                  prepend-icon="tabler-pill"
                  @click="selectVisit(visit)"
                >
                  View & Dispense
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>

        <div
          v-else-if="!loading"
          class="text-center py-12"
        >
          <VIcon
            icon="tabler-check"
            size="48"
            color="success"
            class="mb-2"
          />
          <h3 class="text-h6 font-weight-bold">
            All Meds Dispensed!
          </h3>
          <p class="text-body-1 text-disabled">
            No pending prescriptions at this time.
          </p>
        </div>
      </div>

      <!-- DISPENSE VIEW -->
      <div
        v-else
        class="dispense-view animate-fade-in"
      >
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VCard
              variant="flat"
              border
              class="mb-4"
            >
              <VCardItem class="bg-warning text-white">
                <VCardTitle>Patient Pharmacy File</VCardTitle>
              </VCardItem>
              <VCardText class="pt-4">
                <div class="d-flex align-center gap-3 mb-4">
                  <VAvatar
                    size="64"
                    color="primary"
                    variant="tonal"
                  >
                    <VIcon
                      icon="tabler-pill"
                      size="32"
                    />
                  </VAvatar>
                  <div>
                    <div class="text-h5 font-weight-black">
                      {{ selectedVisit.pet?.name }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      {{ selectedVisit.owner?.name }}
                    </div>
                  </div>
                </div>
                <VDivider class="mb-4" />
                <div class="text-caption text-disabled text-uppercase mb-1">
                  Prescribed By
                </div>
                <div class="text-body-1 font-weight-bold mb-4">
                  Dr. Smith
                </div>
                 
                <div class="text-caption text-disabled text-uppercase mb-1">
                  Visit Date
                </div>
                <div class="text-body-2">
                  {{ new Date(selectedVisit.created_at || selectedVisit.visit?.created_at).toLocaleDateString() }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            cols="12"
            md="8"
          >
            <VCard
              variant="flat"
              border
              class="pa-6 rounded-xl"
            >
              <div class="d-flex justify-space-between align-center mb-6">
                <div class="text-h5 font-weight-black">
                  Final Prescription
                </div>
                <VBtn
                  icon="tabler-printer"
                  variant="text"
                  size="small"
                />
              </div>

              <div class="prescription-details bg-surface-variant pa-5 rounded-lg mb-8">
                <div class="text-h6 font-weight-bold text-primary mb-4">
                  Medications List
                </div>
                  
                <!-- Medicines List (Computed) -->
                <div v-if="prescriptionMedicines.length > 0">
                  <VTable
                    density="compact"
                    class="border rounded-lg mb-4"
                  >
                    <thead>
                      <tr class="bg-grey-50">
                        <th class="text-uppercase text-xs font-weight-bold">
                          Medicine
                        </th>
                        <th class="text-uppercase text-xs font-weight-bold">
                          Dosage
                        </th>
                        <th class="text-uppercase text-xs font-weight-bold">
                          Freq
                        </th>
                        <th class="text-uppercase text-xs font-weight-bold">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(med, idx) in prescriptionMedicines"
                        :key="idx"
                      >
                        <td class="font-weight-medium">
                          {{ med.name }}
                        </td>
                        <td>{{ med.dosage }}</td>
                        <td>
                          <VChip
                            size="x-small"
                            color="primary"
                            label
                          >
                            {{ med.frequency }}
                          </VChip>
                        </td>
                        <td>{{ med.duration }}</td>
                      </tr>
                    </tbody>
                  </VTable>
                </div>

                <!-- Empty State -->
                <div
                  v-else
                  class="text-center text-disabled py-4"
                >
                  No medicines found in this prescription.
                </div>
              </div>

              <div class="d-flex gap-4">
                <VBtn
                  block
                  size="large"
                  color="success"
                  class="rounded-lg shadow-lg"
                  prepend-icon="tabler-check"
                  :loading="loading"
                  @click="dispenseMedicines"
                >
                  Confirm Dispensing & Notify Nurse
                </VBtn>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </div>
    </div>
  </component>
</template>

<style scoped>
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1) !important;
}
.bg-warning-lighten-5 {
    background-color: #fff9c4;
}
.animate-fade-in {
    animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
