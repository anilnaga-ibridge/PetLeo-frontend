<script setup>
import { ref, onMounted, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { providerApi } from '@/plugins/axios'
import Navbar from './sections/Navbar.vue'
import BookingDialog from '../components/BookingDialog.vue'
import ReviewDialog from '../components/ReviewDialog.vue'
import { usePetOwnerProviderStore } from '@/stores/petOwnerProvider'

definePage({
  meta: {
    layout: 'blank',
  },
})

const route = useRoute()
const router = useRouter()
const store = usePetOwnerProviderStore()

const loading = ref(true)
const showRatingDialog = ref(false)

// Computed from store
const provider = computed(() => store.activeProvider)
const reviews = computed(() => store.reviews)
const reviewsLoading = computed(() => store.reviewsLoading)

// Booking state
const showBookingDialog = ref(false)
const selectedService = ref(null)
const selectedFacility = ref(null)
const selectedEmployee = ref(null)

const handleBookNow = (service, facility, employee = null) => {
  selectedService.value = service
  selectedFacility.value = facility
  selectedEmployee.value = employee
  showBookingDialog.value = true
}

const onBookingSuccess = () => {
  router.push('/pet-owner/dashboard')
}

const PROVIDER_BASE = import.meta.env.VITE_PROVIDER_API_URL || 'http://127.0.0.1:8002'

const resolveMediaUrl = url => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  
  return `${PROVIDER_BASE}${url.startsWith('/') ? '' : '/'}${url}`
}

const fetchProvider = async () => {
  loading.value = true
  try {
    const res = await providerApi.get(`/api/provider/public-profile/${route.params.id}/`)
    const data = res.data

    const avatarUrl = resolveMediaUrl(data.avatar || data.profileImageUrl || null)
    const bannerUrl = resolveMediaUrl(data.banner_image || null)

    const mappedData = {
      ...data,
      full_name: data.providerName || data.full_name,
      role: data.providerType || data.role,
      rating: data.averageRating || data.rating,
      reviewCount: data.totalRatings || data.reviewCount,
      avatar: avatarUrl,
      banner_image: bannerUrl,
    }

    store.setActiveProvider(mappedData)
  } catch (err) {
    console.error('Failed to fetch provider details', err)
  } finally {
    loading.value = false
  }
}

const fetchReviews = async () => {
  store.setReviewsLoading(true)
  try {
    const res = await providerApi.get(`/api/provider/public-ratings/${route.params.id}/`)

    store.setReviews(res.data)
  } catch (err) {
    console.error('Failed to fetch reviews', err)
  } finally {
    store.setReviewsLoading(false)
  }
}

const handleViewOnMap = () => {
  if (!provider.value) return
  const address = provider.value.address || provider.value.location
  if (address) {
    const query = encodeURIComponent(address)

    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }
}

const onReviewSaved = () => {
  fetchReviews()
}

provide('provider', provider)
provide('reviews', reviews)
provide('reviewsLoading', reviewsLoading)
provide('showRatingDialog', showRatingDialog)
provide('handleBookNow', handleBookNow)

onMounted(() => {
  fetchProvider()
  fetchReviews()
})
</script>

<template>
  <div class="provider-detail-page bg-white min-h-screen">
    <!-- Unified Navbar (same as discovery page) -->
    <Navbar mode="provider" />


    <!-- Loading State -->
    <div
      v-if="loading"
      class="d-flex flex-column align-center justify-center"
      style="min-height: 60vh"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="52"
        width="3"
      />
      <p class="mt-6 text-body-1 text-slate-400 font-weight-medium">
        Loading provider profile...
      </p>
    </div>

    <!-- Error State -->
    <VContainer
      v-else-if="!provider"
      class="text-center py-32"
    >
      <VIcon
        icon="tabler-circle-x"
        size="80"
        color="error"
        class="mb-6 opacity-20"
      />
      <h3 class="text-h3 font-weight-black text-slate-900 mb-3">
        Profile Unavailable
      </h3>
      <p class="text-h6 text-slate-400 font-medium mb-10">
        This provider profile is private or does not exist.
      </p>
      <VBtn
        to="/pet-owner/book"
        color="primary"
        height="56"
        class="px-10 font-weight-black rounded-2xl"
      >
        Back to Discovery
      </VBtn>
    </VContainer>

    <!-- Main Content -->
    <div v-else>
      <!-- Hero Banner -->
      <div
        class="provider-hero-banner"
        :style="provider.banner_image
          ? `background-image: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(15,23,42,0.85)), url(${provider.banner_image}); background-size: cover; background-position: center;`
          : `background-image: linear-gradient(to bottom, rgba(2,6,23,0.35), rgba(15,23,42,0.88)), url(https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1600&q=80&fit=crop); background-size: cover; background-position: center;`"
      >
        <VContainer class="hero-inner pb-12">
          <!-- Back Button -->
          <VBtn
            variant="text"
            color="white"
            class="mb-8 opacity-80 hover-opacity-100 px-0 font-weight-bold"
            prepend-icon="tabler-arrow-left"
            @click="router.push('/pet-owner/book')"
          >
            All Professionals
          </VBtn>

          <div class="d-flex flex-column flex-md-row align-md-end gap-8">
            <!-- Avatar -->
            <VAvatar
              size="140"
              class="hero-profile-avatar flex-shrink-0"
              color="white"
            >
              <VImg
                v-if="provider.avatar"
                :src="provider.avatar"
                cover
              />
              <VIcon
                v-else
                icon="tabler-user-check"
                size="64"
                color="primary"
              />
            </VAvatar>

            <!-- Text Info -->
            <div class="flex-grow-1">
              <div class="d-flex align-center flex-wrap gap-3 mb-4">
                <VChip
                  variant="flat"
                  color="primary"
                  size="small"
                  class="font-weight-black text-uppercase tracking-wider px-4"
                >
                  {{ provider.role === 'organization' ? 'Organization' : 'Specialist' }}
                </VChip>
                <div
                  class="rating-pill d-flex align-center gap-2 cursor-pointer"
                  @click="router.push(`/pet-owner/book/${route.params.id}/reviews`)"
                >
                  <VIcon
                    icon="tabler-star-filled"
                    size="14"
                    color="amber"
                  />
                  <span class="text-white font-weight-black">{{ provider.rating }}</span>
                  <span class="text-white opacity-60 text-caption">({{ provider.reviewCount }} reviews)</span>
                </div>
                <div
                  v-if="provider.isVerified || provider.verified"
                  class="verified-badge d-flex align-center gap-2"
                >
                  <VIcon
                    icon="tabler-discount-check-filled"
                    size="16"
                    color="primary"
                  />
                  <span class="text-white font-weight-bold text-caption">PetLeo Verified</span>
                </div>
              </div>

              <h1 class="text-h1 font-weight-black text-white mb-3 tracking-tight hero-name">
                {{ provider.full_name }}
              </h1>

              <p
                v-if="provider.detailed_profile?.tagline"
                class="text-h6 text-white font-weight-medium mb-4 opacity-85"
              >
                {{ provider.detailed_profile.tagline }}
              </p>

              <div
                v-if="provider.location"
                class="d-flex align-center gap-2 text-white opacity-70"
              >
                <VIcon
                  icon="tabler-map-pin"
                  size="18"
                />
                <span class="text-subtitle-1 font-medium">{{ provider.location }}</span>
              </div>
            </div>

            <!-- CTA -->
            <div class="flex-shrink-0">
              <VBtn
                color="primary"
                height="56"
                class="px-8 font-weight-black rounded-2xl shadow-xl mb-3 w-100"
                @click="showRatingDialog = true"
              >
                <VIcon
                  icon="tabler-pencil-star"
                  size="20"
                  class="mr-2"
                />
                Write a Review
              </VBtn>
            </div>
          </div>
        </VContainer>
      </div>

      <!-- Body Content -->
      <VContainer class="py-12">
        <VRow>
          <!-- Dynamic Content -->
          <VCol
            cols="12"
            md="8"
          >
            <RouterView />
          </VCol>

          <!-- Sidebar -->
          <VCol
            cols="12"
            md="4"
          >
            <!-- Contact Card -->
            <VCard
              flat
              rounded="3xl"
              class="pa-8 mb-6 sidebar-card"
            >
              <h3 class="text-h5 font-weight-black text-slate-900 mb-8">
                Contact Details
              </h3>
              <div class="d-flex flex-column gap-6">
                <div
                  v-if="provider.email"
                  class="contact-row"
                >
                  <div class="contact-icon-box email">
                    <VIcon
                      icon="tabler-mail"
                      size="20"
                    />
                  </div>
                  <div>
                    <div class="text-tiny text-slate-400 font-weight-black uppercase tracking-widest mb-1">
                      Email
                    </div>
                    <div class="text-body-1 font-weight-bold">
                      {{ provider.email }}
                    </div>
                  </div>
                </div>

                <div
                  v-if="provider.phone_number"
                  class="contact-row"
                >
                  <div class="contact-icon-box phone">
                    <VIcon
                      icon="tabler-phone"
                      size="20"
                    />
                  </div>
                  <div>
                    <div class="text-tiny text-slate-400 font-weight-black uppercase tracking-widest mb-1">
                      Phone
                    </div>
                    <div class="text-body-1 font-weight-bold">
                      {{ provider.phone_number }}
                    </div>
                  </div>
                </div>

                <div
                  v-if="provider.address || provider.location"
                  class="contact-row"
                >
                  <div class="contact-icon-box location">
                    <VIcon
                      icon="tabler-map-pin"
                      size="20"
                    />
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-tiny text-slate-400 font-weight-black uppercase tracking-widest mb-1">
                      Address
                    </div>
                    <div class="text-body-1 font-weight-bold mb-3">
                      {{ provider.address || provider.location }}
                    </div>
                    <VBtn
                      variant="tonal"
                      color="primary"
                      size="small"
                      class="rounded-xl font-weight-bold"
                      prepend-icon="tabler-map-2"
                      @click="handleViewOnMap"
                    >
                      View on Map
                    </VBtn>
                  </div>
                </div>
              </div>

              <VBtn
                block
                color="primary"
                height="52"
                class="mt-10 font-weight-black rounded-2xl"
                prepend-icon="tabler-message-2"
              >
                Send Message
              </VBtn>
            </VCard>

            <!-- Write a Review Card -->
            <VCard
              flat
              rounded="3xl"
              class="pa-8 mb-6 review-prompt-card"
            >
              <div class="d-flex align-center gap-4 mb-4">
                <div class="review-icon-box">
                  <VIcon
                    icon="tabler-star"
                    size="22"
                    color="#d97706"
                  />
                </div>
                <h4 class="text-h6 font-weight-black text-slate-900">
                  Your Experience?
                </h4>
              </div>
              <p class="text-body-2 text-slate-500 font-weight-medium mb-6 line-height-relaxed">
                Help others make informed decisions by sharing your honest review.
              </p>
              <VBtn
                block
                variant="flat"
                color="amber-darken-2"
                height="48"
                class="font-weight-black rounded-xl"
                prepend-icon="tabler-edit"
                @click="showRatingDialog = true"
              >
                Write a Review
              </VBtn>
            </VCard>

            <!-- Verified Badge Card -->
            <VCard
              flat
              rounded="3xl"
              class="pa-8 verified-card"
            >
              <div class="d-flex align-center gap-4">
                <div class="verified-icon-box">
                  <VIcon
                    icon="tabler-shield-check"
                    size="26"
                    color="#10b981"
                  />
                </div>
                <div>
                  <div class="text-subtitle-1 font-weight-black text-slate-900 mb-1">
                    PetLeo Verified
                  </div>
                  <div class="text-caption text-slate-500 font-weight-medium">
                    Credentials & identity confirmed
                  </div>
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </div>

    <!-- Booking Dialog -->
    <BookingDialog
      v-if="provider && selectedService && selectedFacility"
      v-model="showBookingDialog"
      :provider="provider"
      :service="selectedService"
      :facility="selectedFacility"
      :employee_id="selectedEmployee?.auth_user_id"
      @success="onBookingSuccess"
    />

    <!-- Rating Dialog -->
    <ReviewDialog
      v-if="provider"
      v-model="showRatingDialog"
      :provider="provider"
      @saved="onReviewSaved"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

* {
  font-family: 'Outfit', sans-serif !important;
}

.provider-detail-page {
  background: #f8fafc;
}

/* Sub Navigation */
.detail-sub-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid #f1f5f9;
}

.sub-nav-btn {
  color: #64748b !important;
  border-radius: 0 !important;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  letter-spacing: 0.2px;
}

.sub-nav-btn:hover {
  color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.04) !important;
}

.sub-nav-active {
  color: #6366f1 !important;
  border-bottom-color: #6366f1 !important;
  background: transparent !important;
}

/* Hero Banner */
.provider-hero-banner {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding-top: 40px;
  position: relative;
}

.hero-inner {
  position: relative;
  z-index: 2;
}

.hero-name {
  line-height: 1.1;
  letter-spacing: -2px;
}

.hero-profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* Pills & Badges */
.rating-pill {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.rating-pill:hover {
  background: rgba(255, 255, 255, 0.2);
}

.verified-badge {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 5px 12px;
  border-radius: 20px;
}

/* Sidebar Cards */
.sidebar-card {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
}

.contact-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.contact-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-icon-box.email { background: #eef2ff; color: #6366f1; }
.contact-icon-box.phone { background: #f0fdf4; color: #10b981; }
.contact-icon-box.location { background: #fff7ed; color: #f97316; }

/* Review Prompt Card */
.review-prompt-card {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
}

.review-icon-box {
  width: 48px;
  height: 48px;
  background: rgba(217, 119, 6, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Verified Card */
.verified-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #a7f3d0;
}

.verified-icon-box {
  width: 56px;
  height: 56px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Typography */
.text-tiny { font-size: 10px; }
.tracking-tight { letter-spacing: -1.5px !important; }
.tracking-wider { letter-spacing: 1px !important; }
.tracking-widest { letter-spacing: 1.5px !important; }
.line-height-relaxed { line-height: 1.6; }

.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }

.shadow-xl { box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important; }
</style>
