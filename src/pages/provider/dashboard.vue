<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
</script>

<template>
  <ProviderLayout>
    <VRow>
      <VCol cols="12">
        <h2 class="text-h4 mb-4">Dashboard</h2>
        <p>Welcome to your provider dashboard.</p>
      </VCol>
    </VRow>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
