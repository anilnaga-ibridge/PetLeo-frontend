<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const store = useVeterinaryStore()
const userData = useCookie('userData')
const activeClinicId = computed(() => userData.value?.clinic_id || store.activeClinicId)

const metrics = ref(null)
const loading = ref(false)

const fetchMetrics = async () => {
    if (!activeClinicId.value) return
    loading.value = true
    try {
        const data = await store.fetchAnalytics(activeClinicId.value)
        metrics.value = data
    } catch (e) {
        console.error("Failed to fetch analytics:", e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchMetrics()
})

const stats = computed(() => {
    if (!metrics.value) return []
    return [
        { 
            title: 'Visits Today', 
            value: metrics.value.visits_today, 
            icon: 'tabler-users', 
            color: 'primary' 
        },
        { 
            title: 'Avg Wait Time', 
            value: `${metrics.value.avg_wait_time_minutes} min`, 
            icon: 'tabler-clock', 
            color: metrics.value.avg_wait_time_minutes > 30 ? 'error' : 'success' 
        },
        { 
            title: 'In Progress', 
            value: (metrics.value.status_breakdown?.VITALS_RECORDED || 0) + (metrics.value.status_breakdown?.DOCTOR_ASSIGNED || 0), 
            icon: 'tabler-activity', 
            color: 'info' 
        },
        { 
            title: 'Completed', 
            value: metrics.value.status_breakdown?.CLOSED || 0, 
            icon: 'tabler-check', 
            color: 'success' 
        },
    ]
})
</script>

<template>
  <VRow class="mb-6">
    <VCol v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
      <VCard elevation="0" class="border">
        <VCardText class="d-flex align-center">
          <VAvatar :color="stat.color" variant="tonal" size="48" class="me-4 rounded-lg">
            <VIcon :icon="stat.icon" size="24" />
          </VAvatar>
          <div>
            <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
