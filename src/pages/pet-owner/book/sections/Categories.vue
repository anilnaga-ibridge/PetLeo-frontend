<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const emit = defineEmits(['select'])

const categories = ref([
  { id: 'all', name: 'All Services', icon: 'tabler-layout-grid' },
])

const activeCategory = ref('all')
const loading = ref(false)

const fetchServices = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')
    const results = res.data.results || res.data || []
    
    // Icon mapping for known services
    const iconMap = {
      'veterinary': 'tabler-stethoscope',
      'clinic': 'tabler-building-hospital',
      'grooming': 'tabler-cut',
      'training': 'tabler-award',
      'walking': 'tabler-walk',
      'boarding': 'tabler-home',
      'daycare': 'tabler-sun',
    }

    const dynamicCategories = results
      .filter(s => s.is_active)
      .map(s => ({
        id: s.id,
        name: s.name,
        icon: iconMap[s.slug] || iconMap[s.name.toLowerCase()] || 'tabler-paw',
      }))

    categories.value = [
      { id: 'all', name: 'All Services', icon: 'tabler-layout-grid' },
      ...dynamicCategories,
    ]
  } catch (err) {
    console.error('Failed to fetch services for categories:', err)
  } finally {
    loading.value = false
  }
}

const selectCategory = cat => {
  activeCategory.value = cat.id
  emit('select', cat)
}

onMounted(fetchServices)
</script>

<template>
  <div class="categories-nav bg-white border-bottom sticky-categories">
    <VContainer>
      <div class="categories-scroll-wrapper">
        <div class="d-flex align-center gap-4 py-4 overflow-x-auto scroll-container hide-scrollbar">
          <VBtn
            v-for="cat in categories"
            :key="cat.id"
            :variant="activeCategory === cat.id ? 'flat' : 'tonal'"
            :color="activeCategory === cat.id ? 'primary' : 'secondary'"
            class="rounded-pill px-6 font-weight-bold flex-shrink-0"
            size="small"
            @click="selectCategory(cat)"
          >
            <VIcon
              :icon="cat.icon"
              size="18"
              class="mr-2"
            />
            {{ cat.name }}
          </VBtn>
          
          <div
            v-if="loading"
            class="d-flex gap-4"
          >
            <VSkeletonLoader
              v-for="i in 3"
              :key="i"
              type="button"
              class="rounded-pill"
              width="100"
            />
          </div>
        </div>
      </div>
    </VContainer>
  </div>
</template>

<style scoped lang="scss">
.sticky-categories {
  position: sticky;
  top: 64px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.categories-scroll-wrapper {
  position: relative;
  width: 100%;
}

.scroll-container {
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar {
  &::-webkit-scrollbar {
    display: none;
  }
}

/* Ensure buttons don't shrink and are easy to click */
.v-btn {
  text-transform: none;
  letter-spacing: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &:hover {
    transform: translateY(-3px) scale(1.05);
  }
  
  &:active {
    transform: translateY(1px) scale(0.95);
  }

  &.v-btn--flat {
    animation: float 3s ease-in-out infinite;
    box-shadow: 0 8px 20px rgba(var(--v-theme-primary), 0.3);
  }
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
}
</style>
