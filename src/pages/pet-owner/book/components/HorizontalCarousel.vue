<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="carousel-wrapper">
    <div class="d-flex align-center justify-space-between mb-6 px-4 px-md-0">
      <div>
        <h2 class="text-h4 font-weight-black text-slate-900 mb-1 tracking-tight">
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="text-body-2 text-slate-500 font-weight-medium"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          icon="tabler-chevron-left"
          variant="tonal"
          color="slate-400"
          size="small"
          rounded="lg"
        />
        <VBtn
          icon="tabler-chevron-right"
          variant="tonal"
          color="slate-400"
          size="small"
          rounded="lg"
        />
      </div>
    </div>

    <div class="carousel-scroll-container">
      <div class="carousel-track">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.carousel-wrapper {
  overflow: hidden;
}

.carousel-scroll-container {
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 24px;
  margin-bottom: -24px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.carousel-scroll-container::-webkit-scrollbar {
  display: none;
}

.carousel-track {
  display: flex;
  gap: 20px;
  padding-inline: 4px;
}

/* Add some padding on desktop if container is restricted */
@media (min-width: 1280px) {
  .carousel-track {
    padding-inline: 0;
  }
}

.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.tracking-tight { letter-spacing: -1px !important; }
</style>
