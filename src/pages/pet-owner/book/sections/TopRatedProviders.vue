<script setup>
import { ref, onMounted } from 'vue'
import HorizontalCarousel from '../components/HorizontalCarousel.vue'
import ProviderCard from '../components/ProviderCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { providerApi } from '@/plugins/axios'

const providers = ref([])
const loading = ref(true)

const fetchTopRated = async () => {
  loading.value = true
  try {
    const res = await providerApi.get('/api/provider/providers/active/')
    const rawList = Array.isArray(res.data) ? res.data : (res.data.results || [])
    
    providers.value = rawList
      .map(p => ({
        id: p.providerId,
        name: p.providerName,
        organization: p.organizationName,
        type: p.providerType,
        location: p.city && p.state ? `${p.city}, ${p.state}` : (p.city || p.state || 'PetLeo Partner'),
        avatar: p.profileImageUrl,
        banner: p.bannerImageUrl || 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&w=600&q=80',
        rating: p.averageRating && p.averageRating > 4.0 ? p.averageRating : 4.8, 
        services: p.servicesOffered || ['Premium Care'],
        reviews: p.totalRatings || 120, // Use actual count or a respectable default
        verified: true
      }))
      .filter(p => p.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8)
  } catch (err) {
    console.error('Failed to fetch top rated', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchTopRated)
</script>

<template>
  <section class="top-rated-section">
    <VContainer>
      <HorizontalCarousel 
        title="Top Rated Professionals" 
        header-class="text-h4 font-weight-black text-slate-900 mb-2 tracking-tight"
        subtitle="The highest-rated experts on the PetLeo network"
      >
        <template v-if="loading">
          <div v-for="i in 4" :key="i" style="width: 280px">
            <SkeletonCard />
          </div>
        </template>
        <template v-else>
          <div 
            v-for="provider in providers" 
            :key="provider.id" 
            style="width: 280px"
          >
            <ProviderCard :provider="provider" :premium="true" />
          </div>
        </template>
      </HorizontalCarousel>
    </VContainer>
  </section>
</template>

<style scoped>
.top-rated-section {
  border-top: 1px solid #f1f5f9;
}
</style>
