<script setup>
import { ref, onMounted } from 'vue'
import Navbar from './sections/Navbar.vue'
import Hero from './sections/Hero.vue'
import Categories from './sections/Categories.vue'
import Providers from './sections/Providers.vue'
import ServicesSection from './sections/ServicesSection.vue'
import ContactSection from './sections/ContactSection.vue'
import Testimonials from './sections/Testimonials.vue'
import HowItWorks from './sections/HowItWorks.vue'
import Gallery from './sections/Gallery.vue'
import About from './sections/About.vue'
import Footer from './sections/Footer.vue'
import { providerApi } from '@/plugins/axios'

definePage({
  meta: {
    layout: 'blank',
  },
})

const selectedCity = ref('')

const filters = ref({
  search: '',
  city: '',
  category: 'all',
})

const allProviders = ref([])
const providersLoading = ref(true)

const fetchProviders = async () => {
  providersLoading.value = true
  try {
    const res = await providerApi.get('/api/provider/providers/active/')
    const rawList = Array.isArray(res.data) ? res.data : (res.data.results || [])
    
    allProviders.value = rawList.map(p => ({
      id: p.providerId,
      name: p.providerName,
      organization: p.organizationName,
      type: p.providerType,
      location: p.city && p.city.length > 20 ? p.city : (p.city && p.state ? `${p.city}, ${p.state}` : (p.city || p.state || 'PetLeo Partner')),
      avatar: p.profileImageUrl,
      banner: p.bannerImageUrl || 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?auto=format&fit=crop&w=600&q=80',
      rating: p.averageRating || 0,
      price: p.startingPrice || p.basePrice || 0,
      services: p.servicesOffered || ['General Care'],
      reviews: p.totalRatings || 0,
      verified: p.isVerified || false,
      city: p.city,
    }))
  } catch (err) {
    console.error('Failed to fetch providers', err)
  } finally {
    providersLoading.value = false
  }
}

const handleSearch = ({ search, city }) => {
  filters.value = { ...filters.value, search, city }
}

const handleCityUpdate = newCity => {
  selectedCity.value = newCity
  filters.value = { ...filters.value, city: newCity }
}

const handleCategorySelect = category => {
  filters.value = { 
    ...filters.value, 
    category: category.id,
    categoryName: category.name === 'All Services' ? null : category.name,
  }
}

onMounted(fetchProviders)
</script>

<template>
  <div class="discovery-page bg-white">
    <Navbar 
      mode="landing"
      :current-city="selectedCity" 
      @update:city="handleCityUpdate" 
    />
    
    <Hero 
      :current-city="selectedCity" 
      @search="handleSearch" 
    />

    <Categories @select="handleCategorySelect" />

    <Providers 
      id="providers-section"
      :all-providers="allProviders"
      :loading="providersLoading"
      :filters="filters"
    />

    <!-- About Us Section -->
    <About />

    <!-- Services from Super Admin -->
    <ServicesSection />
    
    <Testimonials class="bg-white" />
    
    <HowItWorks class="bg-slate-50" />
    
    <!-- Contact Us Section -->
    <ContactSection />

    <Gallery />

    <Footer />
  </div>
</template>

<style scoped>
.discovery-page {
  min-height: 100vh;
}
</style>
