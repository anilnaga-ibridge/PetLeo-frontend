<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import ProviderCard from '../components/ProviderCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  allProviders: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  city: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'all'
  },
  categoryName: {
    type: String,
    default: null
  }
})

const filteredProviders = computed(() => {
  let list = [...props.allProviders]
  
  if (props.city) {
    const city = props.city.toLowerCase()
    list = list.filter(p => p.location.toLowerCase().includes(city))
  }

  if (props.category && props.category !== 'all') {
    const cat = props.category.toLowerCase()
    list = list.filter(p => 
      p.services.some(s => s.toLowerCase().includes(cat)) ||
      (props.categoryName && p.services.some(s => s.toLowerCase().includes(props.categoryName.toLowerCase())))
    )
  }

  // Sort by rating and return only top 8 for recommended section
  return list.sort((a, b) => b.rating - a.rating).slice(0, 8)
})
</script>

<template>
  <section class="recommended-section py-12 bg-white">
    <VContainer>
      <div class="section-header mb-8 px-4 px-md-0">
        <h2 class="text-h4 font-weight-black text-slate-900 mb-2 tracking-tight">Recommended For You</h2>
        <p class="text-body-1 text-slate-500 font-medium">
          {{ props.city ? `Top-rated professionals in ${props.city}` : 'Top-rated professionals near you' }}
        </p>
      </div>

      <VCard v-if="loading" flat class="bg-transparent">
        <VRow class="g-6">
          <VCol v-for="i in 4" :key="i" cols="12" sm="6" md="4" lg="3">
            <SkeletonCard />
          </VCol>
        </VRow>
      </VCard>

      <VRow v-else class="g-6">
        <VCol 
          v-for="provider in filteredProviders" 
          :key="provider.id" 
          cols="12" 
          sm="6" 
          md="4" 
          lg="3"
        >
          <ProviderCard :provider="provider" />
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style scoped>
.g-6 {
  --v-grid-gutter-x: 24px;
  --v-grid-gutter-y: 32px;
}
.tracking-tight { letter-spacing: -1.5px !important; }
</style>
