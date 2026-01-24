<script setup>
import VeterinaryLayout from '@/components/VeterinaryLayout.vue'
</script>

<template>
  <VeterinaryLayout>
    <div
      class="d-flex flex-column align-center justify-center"
      style="height: 70vh;"
    >
      <VIcon
        icon="tabler-video"
        size="64"
        class="text-disabled mb-4"
      />
      <h1 class="text-h4 font-weight-bold text-medium-emphasis">
        Online Consultation
      </h1>
      <p class="text-body-1 text-disabled">
        This feature is under development.
      </p>
    </div>
  </VeterinaryLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
