<script setup>
import { computed, onMounted, ref } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const veterinaryStore = useVeterinaryStore()
const doctors = ref([])
const loading = ref(false)

const fetchDoctors = async () => {
  const clinicId = veterinaryStore.activeClinicId
  if (!clinicId) return

  loading.value = true
  try {
    // 1. Fetch employee list for the clinic
    const employees = await veterinaryStore.fetchClinicConsultants(clinicId)
    
    // 2. Fetch specific analytics if needed, but for now let's map employees
    // Note: In a full implementation, we'd merge this with performance stats
    doctors.value = employees.map((emp, index) => ({
      id: emp.id,
      name: emp.full_name || emp.name || 'Unknown Doctor',
      avatar: emp.avatar || `https://ui-avatars.com/api/?name=${emp.full_name || 'Doc'}&background=random&color=fff&rounded=true&bold=true`,
      cases: emp.cases_today || 0, // Fallback to 0 if not provided by this endpoint
      revenue: emp.revenue_today || 0,
      progress: emp.progress || 0,
      color: ['primary', 'info', 'warning', 'success', 'teal'][index % 5],
    }))
  } catch (e) {
    console.error('Failed to fetch doctor performance:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchDoctors)

const totalRevenue = computed(() => doctors.value.reduce((acc, curr) => acc + curr.revenue, 0))
</script>

<template>
  <VCard
    elevation="0"
    border
    class="rounded-xl h-100"
  >
    <VCardItem>
      <VCardTitle class="text-h6 font-weight-bold d-flex justify-space-between align-center">
        Doctor Performance
        <VBtn
          variant="text"
          color="primary"
          size="small"
          class="font-weight-bold px-2"
        >
          View All
        </VBtn>
      </VCardTitle>
    </VCardItem>

    <template v-if="loading">
      <div class="pa-6 d-flex flex-column gap-4">
        <VSkeletonLoader
          v-for="n in 3"
          :key="n"
          type="list-item-avatar-two-line"
        />
      </div>
    </template>
    <VCardText
      v-else-if="doctors.length"
      class="d-flex flex-column gap-6 pt-2"
    >
      <div
        v-for="doctor in doctors"
        :key="doctor.id"
        class="doctor-row group"
      >
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="d-flex align-center gap-3">
            <VAvatar
              :image="doctor.avatar"
              size="40"
              class="elevation-1"
            />
            <div>
              <div class="font-weight-bold text-body-1 text-high-emphasis">
                {{ doctor.name }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ doctor.cases }} Cases Today
              </div>
            </div>
          </div>
          <div class="text-end">
            <div class="font-weight-bold text-body-1 text-high-emphasis">
              ${{ doctor.revenue.toLocaleString() }}
            </div>
            <div class="text-caption text-primary font-weight-bold">
              Revenue
            </div>
          </div>
        </div>

        <VProgressLinear
          :model-value="doctor.progress"
          :color="doctor.color"
          height="6"
          rounded
          class="doctor-progress transition-all"
        />
      </div>
    </VCardText>
    <VCardText
      v-else
      class="pa-10 text-center text-medium-emphasis"
    >
      No consultants found for this clinic.
    </VCardText>

    <VDivider class="mt-4" />

    <VCardText class="d-flex justify-space-between align-center py-5">
      <div>
        <div class="text-caption font-weight-medium text-medium-emphasis mb-1">
          Total Consultant Revenue
        </div>
        <div class="text-h4 font-weight-bold text-high-emphasis">
          ${{ totalRevenue.toLocaleString() }}
        </div>
      </div>
      <VChip
        color="success"
        size="small"
        class="font-weight-bold"
        variant="elevated"
        elevation="1"
      >
        +12%
      </VChip>
    </VCardText>
  </VCard>
</template>

<style scoped>
.doctor-row:hover .doctor-progress :deep(.v-progress-linear__determinate) {
  filter: brightness(1.1);
}
</style>
