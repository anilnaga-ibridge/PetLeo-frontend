<script setup>
import { inject, computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const provider = inject('provider')
const handleBookNow = inject('handleBookNow')
const route = useRoute()
const router = useRouter()

const facilityId = computed(() => route.params.facilityId)

const facility = computed(() => {
  if (!provider.value?.menu) return null
  
  for (const svc of provider.value.menu) {
    for (const cat of (svc.categories || [])) {
      const fac = (cat.facilities || []).find(f => String(f.id) === String(facilityId.value))
      if (fac) return { ...fac, parentService: svc, parentCategory: cat }
    }
  }
  return null
})

const formatPrice = (price) => {
  if (price === '0.00' || !price) return 'Contact for Price'
  const num = parseFloat(price)
  if (isNaN(num)) return price
  return `₹${num.toLocaleString('en-IN')}`
}

const allImages = computed(() => {
  if (!facility.value) return []
  const images = []
  if (facility.value.image_url) images.push(facility.value.image_url)
  if (facility.value.gallery?.length) {
    facility.value.gallery.forEach(g => {
      if (g.image_url && g.image_url !== facility.value.image_url) {
        images.push(g.image_url)
      }
    })
  }
  return images
})

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div v-if="facility" class="facility-detail">
    <!-- Navigation / Breadcrumbs -->
    <div class="d-flex align-center gap-2 mb-8 text-slate-400">
      <VBtn variant="text" density="compact" class="px-0 text-slate-500 font-weight-bold" @click="router.back()">
        <VIcon icon="tabler-chevron-left" size="18" class="mr-1" />
        Back to Services
      </VBtn>
      <span class="opacity-30">/</span>
      <span class="text-caption font-weight-bold uppercase tracking-wider">{{ facility.parentService.service_name }}</span>
    </div>

    <!-- Main Content Card -->
    <VCard flat rounded="3xl" class="overflow-hidden border border-slate-100 shadow-sm mb-12">
      <!-- Media Header -->
      <div v-if="allImages.length > 1" class="detail-media">
        <VCarousel 
          hide-delimiter-background 
          show-arrows="hover" 
          height="320"
          color="white"
          class="rounded-0"
        >
          <VCarouselItem v-for="(img, i) in allImages" :key="i" :src="img" cover />
        </VCarousel>
      </div>
      <div v-else-if="allImages.length === 1" class="detail-media">
        <img :src="allImages[0]" class="detail-img" />
        <div class="media-overlay" />
      </div>
      <div v-else class="detail-media-placeholder d-flex flex-column align-center justify-center bg-slate-50 text-slate-300">
        <VIcon icon="tabler-photo-off" size="64" class="opacity-20" />
        <span class="mt-4 font-weight-bold uppercase tracking-widest text-tiny opacity-50">No Image Available</span>
      </div>

      <div class="pa-10">
        <!-- Header Info -->
        <div class="d-flex flex-wrap align-start justify-space-between gap-6 mb-10">
          <div class="flex-grow-1">
            <div class="d-flex align-center gap-3 mb-3">
              <VChip size="small" color="primary" variant="tonal" class="font-weight-black uppercase tracking-wider">
                {{ facility.parentCategory.category_name }}
              </VChip>
              <div v-if="facility.duration" class="slot-info">
                <VIcon icon="tabler-clock-hour-4" size="16" color="#6366f1" />
                <span>{{ (facility.duration >= 60 && facility.duration % 60 === 0) ? `${facility.duration / 60} hour(s)` : `${facility.duration} minutes` }}</span>
              </div>
            </div>
            <h1 class="text-h3 font-weight-black text-slate-900 mb-4">{{ facility.name }}</h1>
          </div>

          <div class="price-box-large">
            <span class="price-lbl">Starting from</span>
            <span class="price-val">{{ formatPrice(facility.price) }}</span>
            <span v-if="facility.price !== '0.00'" class="price-unit">per session</span>
          </div>
        </div>

        <VDivider class="mb-10 opacity-50" />

        <!-- Description -->
        <div class="mb-12">
          <h3 class="text-h5 font-weight-black text-slate-900 mb-6 d-flex align-center gap-3">
            <div class="title-accent" />
            Service Description
          </h3>
          <p class="description-text">
            {{ (facility.description && facility.description !== 'null') ? facility.description : 'Explore our professional ' + facility.name + ' service, designed to provide the highest level of care and satisfaction for your pet. Our team of experts ensures a safe, comfortable, and tailored experience for every furry friend.' }}
          </p>
        </div>

        <!-- Inclusions -->
        <div v-if="facility.inclusions?.length" class="mb-12">
          <h3 class="text-h5 font-weight-black text-slate-900 mb-6 d-flex align-center gap-3">
             <div class="title-accent" />
             What's Included
          </h3>
          <VRow>
            <VCol v-for="inc in facility.inclusions" :key="inc" cols="12" sm="6">
              <div class="inclusion-item">
                <div class="inc-icon">
                  <VIcon icon="tabler-circle-check-filled" size="20" color="#10b981" />
                </div>
                <span>{{ inc }}</span>
              </div>
            </VCol>
          </VRow>
        </div>

        <!-- Call to Action -->
        <div class="cta-banner rounded-3xl pa-8 d-flex flex-wrap align-center justify-space-between gap-8">
          <div>
            <h4 class="text-h5 font-weight-black text-white mb-1">Ready to book?</h4>
            <p class="text-white opacity-70 font-weight-medium mb-0">Secure your slot in just a few clicks.</p>
          </div>
          <VBtn 
            color="white" 
            height="56" 
            class="px-10 font-weight-black rounded-2xl text-primary cta-glow"
            @click="handleBookNow(facility.parentService, facility)"
          >
            <VIcon icon="tabler-calendar-heart" size="20" class="mr-2" />
            Book Now
          </VBtn>
        </div>
      </div>
    </VCard>
  </div>

  <div v-else-if="!provider" class="text-center py-20">
    <VProgressCircular indeterminate color="primary" />
  </div>

  <div v-else class="text-center py-20">
    <VIcon icon="tabler-alert-triangle" size="48" color="warning" class="mb-4 opacity-50" />
    <h3 class="text-h5 font-weight-bold">Service Not Found</h3>
    <p class="text-slate-400">The service you are looking for might have been moved or renamed.</p>
    <VBtn variant="tonal" color="primary" class="mt-6 rounded-xl" @click="router.back()">Go Back</VBtn>
  </div>
</template>

<style scoped>
.facility-detail {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-media {
  height: 320px;
  position: relative;
  overflow: hidden;
}

.detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(15, 23, 42, 0.4));
}

.detail-media-placeholder {
  height: 240px;
}

.slot-info {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.price-box-large {
  text-align: right;
  background: #f8fafc;
  padding: 16px 24px;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
}

.price-lbl {
  display: block;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #64748b;
  margin-bottom: 4px;
}

.price-val {
  display: block;
  font-size: 28px;
  font-weight: 950;
  color: #0f172a;
  letter-spacing: -1px;
  line-height: 1;
}

.price-unit {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.title-accent {
  width: 6px;
  height: 24px;
  background: #6366f1;
  border-radius: 4px;
}

.description-text {
  font-size: 17px;
  line-height: 1.7;
  color: #475569;
  font-weight: 500;
}

.inclusion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-weight: 600;
  color: #0f172a;
}

.cta-banner {
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
}

.cta-glow {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.cta-glow:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}

@media (max-width: 600px) {
  .price-box-large { text-align: left; width: 100%; }
  .detail-media { height: 200px; }
  .text-h3 { font-size: 1.75rem !important; }
}
</style>
