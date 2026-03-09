<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { providerApi } from '@/plugins/axios'
import ProviderCard from '../components/ProviderCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'

const props = defineProps({
  allProviders: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  filters: {
    type: Object,
    default: () => ({ search: '', city: '', category: 'all' }),
  },
})

const currentPage = ref(1)
const itemsPerPage = 20
const viewMode = ref('list') // Default to list view as requested

const filteredProviders = computed(() => {
  let list = [...props.allProviders]

  if (props.filters.search) {
    const q = props.filters.search.toLowerCase()

    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.organization?.toLowerCase().includes(q) ||
      p.services.some(s => s.toLowerCase().includes(q)),
    )
  }

  if (props.filters.city) {
    const city = props.filters.city.toLowerCase()

    list = list.filter(p => p.location.toLowerCase().includes(city))
  }

  if (props.filters.category && props.filters.category !== 'all') {
    const cat = props.filters.category.toLowerCase()
    const catName = props.filters.categoryName?.toLowerCase()
    
    // Relevance-based sort: Providers matching the category go to the top
    list.sort((a, b) => {
      const aMatches = a.services.some(s => s.toLowerCase().includes(cat)) || (catName && a.services.some(s => s.toLowerCase().includes(catName)))
      const bMatches = b.services.some(s => s.toLowerCase().includes(cat)) || (catName && b.services.some(s => s.toLowerCase().includes(catName)))
      
      if (aMatches && !bMatches) return -1
      if (!aMatches && bMatches) return 1
      
      return b.rating - a.rating
    })
  } else {
    list.sort((a, b) => b.rating - a.rating)
  }

  return list
})

const totalPages = computed(() => {
  return Math.ceil(filteredProviders.value.length / itemsPerPage)
})

const visibleProviders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  
  return filteredProviders.value.slice(start, end)
})

watch(() => props.filters, () => {
  currentPage.value = 1
}, { deep: true })
</script>

<template>
  <section class="providers-section py-20 bg-white">
    <VContainer>
      <!-- Section Header -->
      <div class="providers-header mb-14 animate-fade-down">
        <div class="header-left">
          <div class="section-eyebrow">
            Find a Professional
          </div>
          <h2 class="section-title">
            Top-Rated Pet Care Providers
          </h2>
          <p class="section-sub">
            Browse and book from our curated network of verified, reviewed pet care professionals.
          </p>
        </div>
        <div class="header-right">
          <div class="count-badge">
            <span class="count-num">{{ filteredProviders.length }}</span>
            <span class="count-lbl">Professionals</span>
          </div>
          <VBtnToggle
            v-model="viewMode"
            mandatory
            density="compact"
            class="view-toggle"
            color="primary"
          >
            <button
              class="toggle-btn"
              :class="[{ active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
            >
              <VIcon
                icon="tabler-list"
                size="18"
              />
            </button>
            <button
              class="toggle-btn"
              :class="[{ active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
            >
              <VIcon
                icon="tabler-layout-grid"
                size="18"
              />
            </button>
          </VBtnToggle>
        </div>
      </div>

      <!-- Loading State -->
      <VRow
        v-if="loading"
        class="g-6"
      >
        <VCol
          v-for="i in 8"
          :key="i"
          :cols="viewMode === 'list' ? 12 : 12"
          :sm="viewMode === 'list' ? 12 : 6"
          :md="viewMode === 'list' ? 12 : 4"
          :lg="viewMode === 'list' ? 12 : 3"
        >
          <SkeletonCard />
        </VCol>
      </VRow>

      <!-- Empty State -->
      <div
        v-else-if="filteredProviders.length === 0"
        class="text-center py-20 px-6 bg-slate-50 rounded-3xl border-dashed"
      >
        <VIcon
          icon="tabler-search-off"
          size="64"
          color="slate-200"
          class="mb-4"
        />
        <h3 class="text-h4 font-weight-black text-slate-900 mb-2">
          No professionals found
        </h3>
        <p class="text-h6 text-slate-400 font-medium">
          Try adjusting your filters or search terms.
        </p>
      </div>

      <!-- Provider Grid -->
      <div v-else>
        <TransitionGroup 
          name="staggered-list" 
          tag="div" 
          class="row g-6"
        >
          <VCol
            v-for="(provider, index) in visibleProviders"
            :key="provider.id"
            :cols="viewMode === 'list' ? 12 : 12"
            :sm="viewMode === 'list' ? 12 : 6"
            :md="viewMode === 'list' ? 12 : 4"
            :lg="viewMode === 'list' ? 12 : 3"
            class="provider-col staggered-item"
            :style="{ '--stagger-index': index }"
          >
            <ProviderCard
              :provider="provider"
              :view-mode="viewMode"
            />
          </VCol>
        </TransitionGroup>

        <!-- Pagination Section -->
        <div
          v-if="totalPages > 1"
          class="pagination-container mt-16 d-flex justify-center"
        >
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            rounded="lg"
            color="primary"
            variant="flat"
            class="luxury-pagination"
          />
        </div>
      </div>
    </VContainer>
  </section>
</template>

<style scoped>
.providers-section {
  border-top: 1px solid #f1f5f9;
}

/* Section Header */
.providers-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}

.header-left { flex: 1; }
.header-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }

.section-eyebrow {
  display: inline-block;
  background: #eef2ff;
  color: #6366f1;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 14px;
}

.section-title {
  font-size: 40px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1.8px;
  line-height: 1.1;
  margin: 0 0 8px;
}

.section-sub {
  font-size: 16px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0;
}

.count-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 20px;
}

.count-num {
  font-size: 26px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

.count-lbl {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

/* View toggle (custom buttons) */
.view-toggle {
  display: flex;
  gap: 0;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 4px;
  overflow: hidden;
}

.toggle-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s ease;
  font-family: inherit;
}

.toggle-btn:hover { background: #eef2ff; color: #6366f1; }
.toggle-btn.active { background: #6366f1; color: white; }

/* Grid gap */
.g-6 {
  --v-grid-gutter-x: 24px;
  --v-grid-gutter-y: 32px;
}

/* Staggered entry */
.staggered-item {
  opacity: 0;
  transform: translateY(30px);
  animation: slideUpFade 0.6s cubic-bezier(0.2, 0, 0, 1) forwards;
  animation-delay: calc(var(--stagger-index) * 0.08s);
}

@keyframes slideUpFade {
  to { opacity: 1; transform: translateY(0); }
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -12px;
  margin-left: -12px;
}

.animate-fade-down {
  animation: fadeDown 0.8s cubic-bezier(0.2, 0, 0, 1) forwards;
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.provider-col { margin-bottom: 24px; }

@media (min-width: 960px) {
  .providers-section { padding-top: 5rem; padding-bottom: 5rem; }
}
</style>

