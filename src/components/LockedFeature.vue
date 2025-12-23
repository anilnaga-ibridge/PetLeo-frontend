<script setup>
defineProps({
  message: {
    type: String,
    default: 'Upgrade your plan to access this service.',
  },
  title: {
    type: String,
    default: 'Feature Locked',
  },
})
</script>

<template>
  <div class="d-flex flex-column align-center justify-center text-center pa-5 fill-height">
    <VIcon
      icon="tabler-lock"
      size="64"
      color="warning"
      class="mb-4"
    />
    
    <h3 class="text-h3 font-weight-bold mb-2">
      {{ title }}
    </h3>
    
    <p class="text-body-1 text-medium-emphasis mb-6">
      {{ message }}
    </p>
    
    <VBtn
      color="primary"
      :to="{ name: 'provider-pricing' }"
      prepend-icon="tabler-arrow-up-circle"
    >
      Upgrade Plan
    </VBtn>
  </div>
</template>

<style scoped>
.fill-height {
  min-height: 400px;
}
</style>
