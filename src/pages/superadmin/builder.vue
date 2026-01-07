<script setup>
// No script needed for simple layout
</script>

<template>
  <div class="builder-page">
    <div class="builder-frame">
      <!-- Builder content -->
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.builder-page {
  height: calc(100vh - var(--v-layout-top));
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  overflow: hidden;
}

.builder-frame {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}



.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<route lang="yaml">
meta:
  layout: default
  action: read
  subject: Auth
  pageTitle: ''
  pageHeader: false
  contentClass: 'layout-full'
</route>
