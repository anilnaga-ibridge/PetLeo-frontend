<script setup>
import AppPricing from '@/components/AppPricing.vue'
import ProviderLayout from '@/components/ProviderLayout.vue'

const pricingData = ref([])

// fetch pricing data logic here if needed, or rely on AppPricing to handle it
</script>

<template>
  <ProviderLayout>
    <VCard class="pa-6">
      <AppPricing
        title="Pricing Plans"
        md="4"
        cols="12"
      />
    </VCard>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
