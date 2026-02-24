<script setup>
import { inject } from 'vue'

const provider = inject('provider')
</script>

<template>
  <div v-if="provider" class="blogs-page">
    <div id="blogs-section" class="mb-12">
      <div class="section-title-bar d-flex align-center justify-space-between mb-8 pa-6 rounded-xl bg-gradient-orange">
        <div>
          <h2 class="text-h4 font-weight-black text-white mb-1">Latest from Blog</h2>
          <p class="text-body-2 text-white opacity-90 mb-0">Insights, tips and pet care stories from {{ provider.full_name }}</p>
        </div>
        <VIcon icon="tabler-news" size="48" color="white" class="opacity-20" />
      </div>

      <VRow>
        <VCol v-for="i in 2" :key="i" cols="12" sm="6">
          <VCard flat border class="rounded-xl overflow-hidden blog-card h-100">
            <VImg
              src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80"
              height="200"
              cover
            />
            <div class="pa-5">
              <div class="d-flex align-center gap-2 mb-3">
                <VChip size="x-small" color="primary" variant="tonal">{{ i === 1 ? 'Health' : 'Lifestyle' }}</VChip>
                <span class="text-caption text-slate-400">Feb 12, 2026</span>
              </div>
              <h4 class="text-h6 font-weight-bold text-slate-900 mb-2">Essential care tips for your furry friends in 2026</h4>
              <p class="text-body-2 text-slate-500 mb-4 line-clamp-2">
                Discover the latest trends in pet health and wellness to keep your companions happy and healthy all year round.
              </p>
              <VBtn variant="text" color="primary" class="px-0 font-weight-bold" append-icon="tabler-arrow-right">Read More</VBtn>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </div>
</template>

<style scoped>
.text-white { color: white !important; }
.opacity-90 { opacity: 0.9; }
.opacity-20 { opacity: 0.2; }
.bg-gradient-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.25);
}
.blog-card {
  transition: transform 0.3s ease;
}
.blog-card:hover {
  transform: translateY(-4px);
}
</style>
