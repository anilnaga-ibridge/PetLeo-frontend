<script setup>

// Layout component for the Services & Plans Builder
</script>

<template>
  <div
    class="builder-layout d-flex flex-grow-1 overflow-visible"
    style="max-width: 100%;"
  >
    <!-- Left Panel: Service List -->
    <div class="layout-left border-e bg-surface-glass shadow-v2">
      <slot name="left" />
    </div>

    <!-- Main Panel: Configuration -->
    <div class="layout-main flex-grow-1 d-flex flex-column bg-workspace overflow-hidden">
      <!--
        Added overflow-hidden to container, scroll will be handled by children or here if needed. 
        But wait, services.vue adds scroll to VWindow items. 
        Let's just ensure this container doesn't block it or allows it. 
        Actually, if services.vue handles scroll in VWindowItem, this just needs to be flex parent.
        BUT, to be safe, let's allow this to be the scroll parent if children don't have it.
        However, services.vue has overflow-y-auto on VWindowItems now.
        So layout-main just needs to restricts height.
      -->
      <slot name="main" />
    </div>

    <!-- Right Panel: Summary (Optional) -->
    <div
      v-if="$slots.right"
      class="layout-right border-s glass-morphism shadow-v2 overflow-y-auto"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.builder-layout {
  flex: 1;
  min-height: 0;
  border-radius: 0 !important;
}

.layout-left {
  width: 300px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  /* overflow handled by child ServiceList */
}

.layout-main {
  flex: 1;
  min-width: 0;
  /* overflow handled by child VWindowItems in services.vue */
}

.bg-surface-glass {
  background: rgba(var(--v-theme-surface), 0.9);
  backdrop-filter: blur(10px);
}

.bg-workspace {
  background: rgba(var(--v-theme-background), 0.2);
}

.shadow-v2 {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
}

.glass-morphism {
  background: rgba(var(--v-theme-surface), 0.8) !important;
  backdrop-filter: blur(10px);
}

.layout-right {
  width: 320px;
  min-width: 320px;
  display: none;
  
  @media (min-width: 1600px) {
    display: block;
  }
}
</style>
