<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  trend: {
    type: String,
    default: '',
  },
  trendUp: {
    type: Boolean,
    default: true,
  },
  color: {
    type: String,
    default: 'primary', // Will use Vuetify theme colors (e.g., 'primary', 'info', 'success', 'warning', 'error')
  },
})

const trendColor = computed(() => {
  return props.trendUp ? 'success' : 'error'
})

const trendIcon = computed(() => {
  return props.trendUp ? 'tabler-trending-up' : 'tabler-trending-down'
})
</script>

<template>
  <VCard
    elevation="0"
    class="metric-card rounded-xl hover-elevation-2 transition-all"
    border
  >
    <VCardText class="d-flex justify-space-between pb-2">
      <VAvatar
        rounded="lg"
        variant="tonal"
        :color="props.color"
        size="48"
      >
        <VIcon
          :icon="props.icon"
          size="28"
        />
      </VAvatar>

      <div
        v-if="props.trend"
        class="d-flex align-center gap-1"
      >
        <VChip
          :color="trendColor"
          size="small"
          class="font-weight-bold px-2"
          variant="tonal"
        >
          <VIcon
            :icon="trendIcon"
            size="14"
            class="me-1"
          />
          {{ props.trend }}
        </VChip>
      </div>
    </VCardText>

    <VCardText>
      <h3 class="text-h3 font-weight-bold text-high-emphasis mb-1">
        {{ props.value }}
      </h3>
      <p class="text-body-2 font-weight-medium text-medium-emphasis mb-0">
        {{ props.title }}
      </p>
    </VCardText>
  </VCard>
</template>

<style scoped>
.metric-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: white;
}

.hover-elevation-2:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}
</style>
