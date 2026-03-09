<script setup>
import { ref, onMounted } from 'vue'
import HorizontalCarousel from '../components/HorizontalCarousel.vue'
import ProviderCard from '../components/ProviderCard.vue'

const viewedProviders = ref([])

const loadRecentlyViewed = () => {
  const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')

  viewedProviders.value = history
}

onMounted(loadRecentlyViewed)
</script>

<template>
  <section
    v-if="viewedProviders.length > 0"
    class="recently-viewed-section py-12 bg-white"
  >
    <VContainer>
      <HorizontalCarousel 
        title="Continue where you left off" 
        subtitle="Based on your recent activity"
      >
        <div 
          v-for="provider in viewedProviders" 
          :key="provider.id" 
          style="width: 280px"
        >
          <ProviderCard :provider="provider" />
        </div>
      </HorizontalCarousel>
    </VContainer>
  </section>
</template>

<style scoped>
.recently-viewed-section {
  border-bottom: 1px solid #f1f5f9;
}
</style>
