<script setup>
defineProps({
  icon: String,
  label: String,
  color: {
    type: String,
    default: 'primary'
  }
})
</script>

<template>
  <VCard
    class="quick-action-card text-center pa-4 cursor-pointer"
    elevation="0"
    border
    @click="$emit('click')"
  >
    <div
      class="icon-box mx-auto mb-3 d-flex align-center justify-center rounded-xl"
      :class="`bg-${color}-lighten-5`"
    >
      <VIcon :icon="icon" :color="color" size="28" />
    </div>
    <div class="text-caption font-weight-bold text-slate-700 text-uppercase tracking-wider">
      {{ label }}
    </div>
  </VCard>
</template>

<style scoped>
.quick-action-card {
  border-radius: 20px !important;
  transition: all 0.2s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.icon-box {
  width: 56px;
  height: 56px;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  border-color: var(--v-primary-base) !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
}

.tracking-wider {
  letter-spacing: 0.5px;
}
</style>
