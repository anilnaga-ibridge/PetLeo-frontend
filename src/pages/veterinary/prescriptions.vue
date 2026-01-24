<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const currentLayout = VeterinaryLayout

const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)
const prescriptions = ref([])
const loading = ref(false)

const fetchPrescriptions = async () => {
  if (!activeClinicId.value) return
  loading.value = true
  try {
    // Fetch PHARMACY_QUEUE to see finalized prescriptions waiting for dispensing
    const data = await store.fetchQueue('PHARMACY_QUEUE', activeClinicId.value)

    prescriptions.value = data
  } catch (e) {
    console.error("Failed to fetch prescription queue:", e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPrescriptions)

const formatDate = dateStr => {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <component :is="currentLayout">
    <div class="prescriptions-page pa-6">
      <div class="d-flex justify-space-between align-center mb-8">
        <div class="d-flex align-center gap-4">
          <VAvatar
            color="primary"
            variant="tonal"
            size="56"
            class="rounded-xl"
          >
            <VIcon
              icon="tabler-pill"
              size="32"
            />
          </VAvatar>
          <div>
            <h1 class="text-h2 font-weight-bold text-primary mb-1">
              Prescription Monitor
            </h1>
            <p class="text-body-1 text-medium-emphasis">
              Overview of issued prescriptions waiting for dispensing
            </p>
          </div>
        </div>
        <VBtn
          icon="tabler-refresh"
          variant="tonal"
          color="primary"
          :loading="loading"
          @click="fetchPrescriptions"
        />
      </div>

      <div v-if="prescriptions.length > 0">
        <VRow>
          <VCol
            v-for="visit in prescriptions"
            :key="visit.id"
            cols="12"
            md="6"
            lg="4"
          >
            <VCard
              class="prescription-card border"
              variant="flat"
            >
              <VCardItem>
                <template #prepend>
                  <VAvatar
                    size="48"
                    color="warning"
                    variant="tonal"
                  >
                    <VIcon
                      :icon="visit.pet?.species === 'Cat' ? 'tabler-cat' : 'tabler-dog'"
                      size="28"
                    />
                  </VAvatar>
                </template>
                <VCardTitle>{{ visit.pet?.name }}</VCardTitle>
                <VCardSubtitle class="text-caption">
                  Prescribed by Dr. {{ visit.doctor_name || 'Unknown' }}
                </VCardSubtitle>
              </VCardItem>
              
              <VDivider />

              <VCardText class="pa-4">
                <div class="d-flex align-center gap-2 mb-3">
                  <VIcon
                    icon="tabler-calendar-time"
                    size="18"
                    class="text-medium-emphasis"
                  />
                  <span class="text-body-2 text-medium-emphasis">Issued at {{ formatDate(visit.updated_at || visit.created_at) }}</span>
                </div>

                <div class="bg-warning-lighten-5 pa-3 rounded mb-4">
                  <div class="d-flex align-center gap-2 mb-1">
                    <VIcon
                      icon="tabler-prescription"
                      size="16"
                      color="warning"
                    />
                    <span class="text-caption font-weight-bold text-warning-darken-2">STATUS</span>
                  </div>
                  <div class="text-body-2 font-weight-medium">
                    Ready for Dispensing
                  </div>
                </div>

                <VBtn 
                  block 
                  color="primary" 
                  variant="outlined" 
                  class="rounded-lg"
                  :to="{ name: 'veterinary-visits-id', params: { id: visit.id }, query: { tab: 'prescription' } }"
                >
                  View Details
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <div
        v-else
        class="text-center py-12"
      >
        <VAvatar
          size="120"
          color="success"
          variant="tonal"
          class="mb-6 opacity-50"
        >
          <VIcon
            icon="tabler-circle-check"
            size="64"
          />
        </VAvatar>
        <h2 class="text-h4 font-weight-bold mb-2">
          All Clear
        </h2>
        <p class="text-body-1 text-medium-emphasis">
          No pending prescriptions at this moment.
        </p>
      </div>
    </div>
  </component>
</template>

<style scoped>
.prescription-card {
  transition: all 0.2s ease;
}
.prescription-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px -10px rgba(var(--v-theme-warning), 0.3);
}
.bg-warning-lighten-5 {
    background-color: #fff9c4; 
}
.text-warning-darken-2 {
    color: #f57f17;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
