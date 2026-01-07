<script setup>
// Layout component for the Services & Plans Builder
</script>

<template>
  <div class="builder-layout d-flex flex-grow-1 rounded-lg overflow-visible border" style="max-width: 100%;">
    <!-- Left Panel: Service List -->
    <div class="layout-left border-e bg-surface">
      <slot name="left"></slot>
    </div>

    <!-- Main Panel: Configuration -->
    <div class="layout-main flex-grow-1 bg-surface d-flex flex-column">
      <slot name="main"></slot>
    </div>

    <!-- Right Panel: Summary (Optional) -->
    <div v-if="$slots.right" class="layout-right border-s bg-surface-variant">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.builder-layout {
  flex: 1;
  min-height: 0;
}

.layout-left {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.layout-main {
  flex: 1;
  min-width: 0; // Prevent flex overflow
  overflow-y: auto;
  overflow-x: hidden;
}

.layout-right {
  width: 280px;
  min-width: 280px;
  display: none; // Hidden by default on small screens, can be toggled
  
  @media (min-width: 1400px) {
    display: block;
  }
}
</style>
