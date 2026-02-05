<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { useCookie } from '@/@core/composable/useCookie'

const props = defineProps({
  metrics: {
    type: Object, // { today: {...}, yesterday: {...} }
    default: () => null,
  },
})

const getTrend = (current, previous) => {
  if (!previous) return { value: 0, color: 'secondary', icon: 'tabler-minus' }
  const diff = current - previous
  const percentage = Math.round((diff / previous) * 100) || 0
  
  if (diff > 0) return { value: `+${diff}`, color: 'success', icon: 'tabler-arrow-up' }
  if (diff < 0) return { value: diff, color: 'error', icon: 'tabler-arrow-down' }
  return { value: '-', color: 'secondary', icon: 'tabler-minus' }
}

const stats = computed(() => {
  if (!props.metrics || !props.metrics.today) return []
  
  const today = props.metrics.today
  const yesterday = props.metrics.yesterday || {}

  const visitTrend = getTrend(today.visits, yesterday.visits)
  const completedTrend = getTrend(today.completed, yesterday.completed)
  
  return [
    { 
      title: 'Visits Today', 
      value: today.visits || 0, 
      icon: 'tabler-users', 
      color: 'primary',
      trend: visitTrend
    },
    { 
      title: 'Waiting', 
      value: today.waiting || 0, 
      icon: 'tabler-clock', 
      color: 'warning', 
      trend: null
    },
    { 
      title: 'Vitals', 
      value: today.vitals || 0, 
      icon: 'tabler-heart-rate-monitor', 
      color: 'info', 
      trend: null
    },
    { 
      title: 'Doctor', 
      value: today.doctor || 0, 
      icon: 'tabler-stethoscope', 
      color: 'primary', 
      trend: null
    },
    { 
      title: 'Labs', 
      value: today.labs || 0, 
      icon: 'tabler-flask', 
      color: 'secondary', 
      trend: null
    },
    { 
      title: 'Pharmacy', 
      value: today.pharmacy || 0, 
      icon: 'tabler-pill', 
      color: 'success', 
      trend: null
    },
    { 
      title: 'Avg Wait Time', 
      value: `${today.avg_wait_time || 0} min`, 
      icon: 'tabler-hourglass', 
      color: (today.avg_wait_time || 0) > 30 ? 'error' : 'success', 
      trend: getTrend(today.avg_wait_time, yesterday.avg_wait_time) 
    }
  ]
})

// [NEW] Detail Popup Logic
const isDialogVisible = ref(false)
const selectedMetric = ref(null)
const selectedList = ref([])

const openDetail = (stat) => {
  if (!props.metrics || !props.metrics.details) return
  
  // Map stat key to detail key
  const detailKeyMap = {
    'Visits Today': 'visits',
    'Waiting': 'waiting',
    'Vitals': 'vitals',
    'Doctor': 'doctor',
    'Labs': 'labs',
    'Pharmacy': 'pharmacy',
    'Completed': 'completed'
  }
  
  const key = detailKeyMap[stat.title]
  if (key && props.metrics.details[key] && props.metrics.details[key].length > 0) {
    selectedMetric.value = stat.title
    selectedList.value = props.metrics.details[key]
    isDialogVisible.value = true
  }
}
</script>

<template>
  <VRow class="mb-6">
    <VCol
      v-for="stat in stats"
      :key="stat.title"
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        elevation="0"
        class="border"
        :class="{ 'cursor-pointer hover-card': stat.title !== 'Avg Wait Time' }"
        @click="openDetail(stat)"
        v-ripple="stat.title !== 'Avg Wait Time'"
      >
        <VCardText class="d-flex align-center">
          <VAvatar
            :color="stat.color"
            variant="tonal"
            size="48"
            class="me-4 rounded-lg"
          >
            <VIcon
              :icon="stat.icon"
              size="24"
            />
          </VAvatar>
          <div>
            <div class="text-h4 font-weight-bold">
              {{ stat.value }}
            </div>
            <div class="d-flex align-center gap-2 mt-1"> 
                <div class="text-caption text-medium-emphasis">
                {{ stat.title }}
                </div>
                <VChip
                    v-if="stat.trend"
                    :color="stat.trend.color"
                    size="x-small"
                    class="px-1"
                >
                    <VIcon :icon="stat.trend.icon" size="12" start />
                    {{ stat.trend.value }}
                </VChip>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Detail Dialog -->
    <VDialog v-model="isDialogVisible" max-width="600">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center pa-4">
          <span>{{ selectedMetric }} - Details</span>
          <VBtn icon variant="text" @click="isDialogVisible = false">
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText class="pa-0">
          <VList lines="two" class="pa-2">
            <template v-for="(item, index) in selectedList" :key="item.id">
              <VListItem>
                <template #prepend>
                   <VAvatar color="primary" variant="tonal" size="40" class="me-2">
                      <span class="text-h6">{{ item.pet_name.charAt(0) }}</span>
                   </VAvatar>
                </template>
                
                <VListItemTitle class="font-weight-bold">
                  {{ item.pet_name }}
                </VListItemTitle>
                <VListItemSubtitle>
                  Owner: {{ item.owner }}
                </VListItemSubtitle>

                <template #append>
                   <div class="text-end">
                      <VChip size="small" color="primary" class="mb-1">{{ item.status }}</VChip>
                      <div class="text-caption">{{ item.time }}</div>
                   </div>
                </template>
              </VListItem>
              <VDivider v-if="index < selectedList.length - 1" inset />
            </template>
          </VList>
        </VCardText>
      </VCard>
    </VDialog>
  </VRow>
</template>

<style scoped>
.hover-card:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.05);
  transition: all 0.2s ease;
}
</style>
