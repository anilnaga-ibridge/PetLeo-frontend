<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const trendingItems = ref([])
const loading = ref(false)

const fetchTrending = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')
    const results = res.data.results || res.data || []
        
    const colorMap = ['indigo', 'rose', 'emerald', 'amber', 'sky', 'violet']

    const iconMap = {
      'veterinary': 'tabler-stethoscope',
      'clinic': 'tabler-building-hospital',
      'grooming': 'tabler-cut',
      'training': 'tabler-award',
      'walking': 'tabler-walk',
      'boarding': 'tabler-home',
      'daycare': 'tabler-sun',
    }

    trendingItems.value = results
      .filter(s => s.is_active && !s.slug.includes('_') && s.slug === s.slug.toLowerCase())
      .map((s, index) => ({
        id: s.id,
        title: s.name,
        count: 'Top Rated Professionals',
        icon: iconMap[s.slug] || iconMap[s.name.toLowerCase()] || 'tabler-paw',
        color: colorMap[index % colorMap.length],
        badge: index === 0 ? 'High Demand' : (index === 1 ? 'Expert Choice' : 'Trending'),
      }))
      .slice(0, 5) // Keep it tight for a single row
  } catch (err) {
    console.error('Failed to fetch trending services:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchTrending)
</script>

<template>
  <section class="trending-section py-20 bg-slate-50">
    <VContainer>
      <div class="section-header mb-12 px-4 px-md-0 d-flex align-end justify-space-between">
        <div>
          <h2 class="text-h3 font-weight-black text-slate-900 mb-2 tracking-tight">
            Trending Services
          </h2>
          <p class="text-body-1 text-slate-500 font-medium max-w-md">
            The most sought-after pet care services in your community this month.
          </p>
        </div>
        <VBtn
          variant="text"
          color="primary"
          class="font-weight-bold d-none d-sm-flex"
        >
          Explore All <VIcon
            icon="tabler-arrow-right"
            size="18"
            class="ml-2"
          />
        </VBtn>
      </div>

      <VRow
        v-if="loading"
        class="g-6"
      >
        <VCol
          v-for="i in 5"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="2.4"
        >
          <VSkeletonLoader
            type="image, heading"
            class="rounded-xl"
          />
        </VCol>
      </VRow>

      <VRow
        v-else
        class="g-6"
      >
        <VCol 
          v-for="item in trendingItems" 
          :key="item.id" 
          cols="12" 
          sm="6" 
          md="4" 
          lg="2.4"
        >
          <div class="trending-card-premium pa-8 bg-white border rounded-3xl d-flex flex-column align-center text-center cursor-pointer h-100 position-relative overflow-hidden">
            <div
              class="trending-badge-floating"
              :class="item.color"
            >
              {{ item.badge }}
            </div>
                
            <div
              class="icon-wrapper mb-6"
              :class="item.color"
            >
              <div class="icon-blob" />
              <VIcon
                :icon="item.icon"
                size="36"
                class="position-relative z-1"
              />
            </div>
                
            <h3 class="text-h5 font-weight-black text-slate-900 mb-3 leading-tight">
              {{ item.title }}
            </h3>
            <span class="text-caption text-slate-400 font-weight-bold uppercase tracking-widest">{{ item.count }}</span>
                
            <div class="card-arrow mt-6">
              <VIcon
                icon="tabler-arrow-right"
                size="20"
              />
            </div>
          </div>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

    <style scoped>
    .trending-card-premium {
      transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
      border: 1px solid #f1f5f9 !important;
    }

    .trending-card-premium:hover {
      transform: translateY(-8px);
      border-color: #6366f1 !important;
      box-shadow: 0 30px 60px rgba(99, 102, 241, 0.08) !important;
    }

    .trending-badge-floating {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 8px;
      letter-spacing: 0.8px;
    }

    .trending-badge-floating.indigo { background: #eef2ff; color: #6366f1; }
    .trending-badge-floating.rose { background: #fff1f2; color: #e11d48; }
    .trending-badge-floating.emerald { background: #ecfdf5; color: #10b981; }
    .trending-badge-floating.amber { background: #fffbe6; color: #d97706; }
    .trending-badge-floating.sky { background: #f0f9ff; color: #0ea5e9; }
    .trending-badge-floating.violet { background: #f5f3ff; color: #7c3aed; }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .icon-blob {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 24px;
      opacity: 0.1;
      transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
    }

    .icon-wrapper.indigo .icon-blob { background: #6366f1; }
    .icon-wrapper.rose .icon-blob { background: #e11d48; }
    .icon-wrapper.emerald .icon-blob { background: #10b981; }
    .icon-wrapper.amber .icon-blob { background: #d97706; }
    .icon-wrapper.sky .icon-blob { background: #0ea5e9; }
    .icon-wrapper.violet .icon-blob { background: #7c3aed; }

    .icon-wrapper.indigo { color: #6366f1; }
    .icon-wrapper.rose { color: #e11d48; }
    .icon-wrapper.emerald { color: #10b981; }
    .icon-wrapper.amber { color: #d97706; }
    .icon-wrapper.sky { color: #0ea5e9; }
    .icon-wrapper.violet { color: #7c3aed; }

    .trending-card-premium:hover .icon-blob {
      transform: scale(1.1) rotate(5deg);
      opacity: 0.15;
    }

    .card-arrow {
      opacity: 0;
      transform: translateX(-10px);
      transition: all 0.3s ease;
      color: #6366f1;
    }

    .trending-card-premium:hover .card-arrow {
      opacity: 1;
      transform: translateX(0);
    }

    .tracking-tight { letter-spacing: -2px !important; }
    .tracking-widest { letter-spacing: 1.5px !important; }

    @media (max-width: 960px) {
      .trending-card-premium {
        padding: 32px !important;
      }
    }
    </style>
