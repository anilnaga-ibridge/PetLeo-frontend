<script setup>
import emptyIllustration from '@images/illustrations/pet-empty-state.png'

defineEmits(['add'])
</script>

<template>
  <VCard
    class="pet-empty-state-premium pa-10 text-center"
    elevation="0"
  >
    <VImg
      :src="emptyIllustration"
      max-width="320"
      class="mx-auto mb-8 animate-bounce-subtle"
    />
    
    <div
      class="content-wrapper mx-auto"
      style="max-width: 480px;"
    >
      <h3 class="text-h4 font-weight-black text-slate-900 mb-3">
        Where's the family? 🐾
      </h3>
      <p class="text-h6 text-slate-500 mb-8 opacity-90 leading-relaxed">
        It looks like you haven't added any pets yet. Add your first furry friend to start tracking their health and booking services.
      </p>
      
      <VBtn
        color="primary"
        size="x-large"
        class="rounded-xl px-12 text-h6 elevation-lg"
        prepend-icon="tabler-plus"
        @click="$emit('add')"
      >
        Add Your First Pet
      </VBtn>
    </div>
  </VCard>
</template>

<style scoped>
.pet-empty-state-premium {
  background: transparent !important;
  border-radius: 40px !important;
}

.elevation-lg {
  box-shadow: 0 15px 30px rgba(var(--v-theme-primary), 0.25) !important;
}

.animate-bounce-subtle {
  animation: bounceSubtle 3s ease-in-out infinite;
}

@keyframes bounceSubtle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

.leading-relaxed {
  line-height: 1.6;
}
</style>
