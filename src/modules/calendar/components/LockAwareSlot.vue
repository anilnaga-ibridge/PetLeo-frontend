<script setup>
import { computed } from 'vue'

const props = defineProps({
  lockInfo: {
    type: Object,
    required: true,

    // Expected: { type: 'emp|pet', id: '...', lockedBy: 'User X', expiresAt: '...' }
  },
  isConflict: {
    type: Boolean,
    default: false,
  },
})

const label = computed(() => {
  if (props.isConflict) return 'Lock Conflict'
  
  return props.lockInfo.type === 'pet' ? 'Pet Reserved' : 'Staff Locked'
})

const icon = computed(() => {
  if (props.isConflict) return 'tabler-alert-triangle'
  
  return props.lockInfo.type === 'pet' ? 'tabler-dog-bowl' : 'tabler-lock-check'
})
</script>

<template>
  <div 
    class="lock-aware-slot pa-1 rounded d-flex align-center"
    :class="{ 
      'bg-var-theme-background': !isConflict, 
      'bg-error-lighten-5 text-error': isConflict,
      'border-dashed': !isConflict
    }"
  >
    <VIcon
      :icon="icon"
      size="14"
      class="me-1"
      :color="isConflict ? 'error' : 'secondary'"
    />
    <span class="text-xs font-weight-medium text-truncate">{{ label }}</span>
    
    <VTooltip
      activator="parent"
      location="top"
    >
      <template v-if="isConflict">
        <div class="font-weight-bold">
          CONCURRENCY CONFLICT
        </div>
        <div>This slot was just taken by another user.</div>
      </template>
      <template v-else>
        <div class="font-weight-bold">
          TEMPORARILY RESERVED
        </div>
        <div>Currently in checkout flow (expires in 5m).</div>
      </template>
    </VTooltip>
  </div>
</template>

<style scoped>
.lock-aware-slot {
    height: 100%;
    width: 100%;
    opacity: 0.8;
    border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
    user-select: none;
    cursor: not-allowed;
    background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(var(--v-theme-on-surface), 0.02) 5px, rgba(var(--v-theme-on-surface), 0.02) 10px);
}

.text-xs {
    font-size: 0.7rem;
}

.bg-error-lighten-5 {
    background-color: rgba(var(--v-theme-error), 0.08) !important;
}
</style>
