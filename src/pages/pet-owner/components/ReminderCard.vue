<script setup>
const props = defineProps({
  title: String,
  message: String,
  type: {
    type: String,
    default: 'warning'
  },
  icon: {
    type: String,
    default: null
  }
})

const defaultIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.type === 'warning') return 'tabler-alert-circle'
  return 'tabler-info-circle'
})

const colorClass = computed(() => {
  if (props.type === 'warning') return 'amber'
  if (props.type === 'info') return 'blue'
  return 'primary'
})
</script>

<template>
  <VCard
    class="reminder-card pa-5 mb-4 border-l-4"
    elevation="0"
    :class="[`bg-${colorClass}-lighten-5`, `border-${colorClass}`]"
  >
    <div class="d-flex align-center">
      <div class="reminder-icon-container me-4" :class="`bg-${colorClass}-lighten-4`">
        <VIcon
          :icon="defaultIcon"
          :color="colorClass"
          size="26"
        />
      </div>
      <div class="flex-grow-1">
        <h5 class="text-h6 font-weight-black text-slate-800 mb-1">{{ title }}</h5>
        <p class="text-body-1 text-slate-600 mb-0 opacity-90">{{ message }}</p>
      </div>
      <VBtn
        icon="tabler-x"
        variant="text"
        :color="colorClass"
        size="small"
        class="ms-2 opacity-40 hover-opacity-100 transition-all"
        @click="$emit('dismiss')"
      />
    </div>
  </VCard>
</template>

<style scoped>
.reminder-card {
  border-radius: 24px !important;
  transition: transform 0.2s ease;
}

.reminder-card:hover {
  transform: translateX(4px);
}

.reminder-icon-container {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
}

.border-l-4 {
  border-left-width: 6px !important;
}

.transition-all {
  transition: all 0.2s ease;
}

.hover-opacity-100:hover {
  opacity: 1 !important;
}
</style>
