
<script setup>
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import { useTheme } from 'vuetify'

import { computed, onMounted, ref } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'
import OnboardingWizard from '@/views/provider-home/OnboardingWizard.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/plugins/axios'

definePage({
  name: 'provider-home',
  meta: {
    layout: 'public',
    public: true,
  },
})

const theme = useTheme()

// Placeholder images
const heroImage = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark)

const isLoggedIn = computed(() => {
  return !!useCookie('userData').value || !!localStorage.getItem('userData')
})

const services = ref([])

const fetchServices = async () => {
  try {
    // Use centralized API - no need for manual headers or full URL
    const res = await api.get('/api/superadmin/services/')
    const data = res.data.results || res.data

    services.value = data.map(s => ({
      title: s.display_name,
      icon: s.icon || 'tabler-box', // Default icon if missing
      desc: s.description || 'Service description unavailable.',
    }))
  } catch (err) {
    console.error('Failed to fetch services:', err)
  }
}

const plans = ref([])

const fetchPlans = async () => {
  try {
    const userData = useCookie('userData').value || JSON.parse(localStorage.getItem('userData') || '{}')
    
    // Robust role detection matching routeHelpers.js
    let role = (userData?.role?.name || userData?.role || 'individual').toLowerCase()
    
    // Map 'provider' to 'individual' if needed, or keep as is. 
    // Backend likely expects 'individual' or 'organization'.
    if (role === 'provider') role = 'individual'

    console.log('Fetching plans for role:', role)
    
    const res = await api.get('/api/superadmin/provider/plans/', {
      params: { role },
    })

    plans.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch plans:', err)
  }
}




const benefits = [
  { title: 'Free Marketing', icon: 'tabler-speakerphone', desc: 'Reach thousands of pet owners daily without spending on ads.' },
  { title: 'More Customers', icon: 'tabler-users', desc: 'Get consistent bookings and grow your client base.' },
  { title: 'Online Bookings', icon: 'tabler-calendar', desc: 'Manage appointments effortlessly with our booking system.' },
  { title: 'Payment Tracking', icon: 'tabler-cash', desc: 'Secure payments and automated financial tracking.' },
  { title: 'Ratings & Reviews', icon: 'tabler-star', desc: 'Build trust with verified reviews from happy customers.' },
  { title: 'Business Growth', icon: 'tabler-chart-line', desc: 'Analytics and tools to scale your business.' },
]

const testimonials = [
  { name: 'Sarah Jenkins', role: 'Groomer', text: 'Petleo helped me grow my grooming business 3x in 2 months. The booking system is a lifesaver!', location: 'New York' },
  { name: 'Dr. Ali', role: 'Vet Clinic', text: 'A fantastic platform to connect with pet owners. Highly recommended for any vet clinic.', location: 'London' },
  { name: 'Mike Ross', role: 'Dog Walker', text: 'I filled my schedule within a week of joining. Great support team too!', location: 'Toronto' },
]

const scrollTo = id => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const router = useRouter()
const authStore = useAuthStore()

const logout = async () => {
  await authStore.logout()
}

const showOnboarding = ref(false)
const loadingVerification = ref(false)

const checkVerificationStatus = async () => {
  if (!isLoggedIn.value) return

  loadingVerification.value = true
  try {
    const userData = useCookie('userData').value || JSON.parse(localStorage.getItem('userData') || '{}')
    const userId = userData.id
    const dynamicTarget = userData.provider_type || 'individual'
    const PROVIDER_BASE_URL = 'http://127.0.0.1:8002'

    const res = await api.get('/api/provider/profile/', {
      baseURL: PROVIDER_BASE_URL,
      params: { user: userId, target: dynamicTarget },
    })

    const { fields, requested_documents, uploaded_documents, uploaded_files } = res.data
    const uploads = uploaded_documents || uploaded_files || []

    // 1. Check Profile Fields
    const isProfileComplete = fields.every(f => !f.is_required || (f.value && f.value.length > 0))

    // 2. Check Documents
    // Map uploaded docs by definition ID
    const uploadedMap = {}

    uploads.forEach(d => {
      const defId = d.definition_id || d.definitionId
      if (defId) uploadedMap[defId] = d
    })

    const areDocumentsVerified = requested_documents.every(req => {
      const uploaded = uploadedMap[req.id]

      // Check if uploaded AND status is approved
      // If status is missing, assume pending/not verified if we want strict verification
      // User said: "documents is verefied"
      return uploaded && uploaded.status === 'approved'
    })

    // Show popup if NOT complete OR NOT verified
    if (!isProfileComplete || !areDocumentsVerified) {
      showOnboarding.value = true
    }

  } catch (err) {
    console.error('Failed to check verification status:', err)

    // If error (e.g. 404 profile not found), show onboarding to create it
    showOnboarding.value = true
  } finally {
    loadingVerification.value = false
  }
}

onMounted(() => {
  fetchServices()
  fetchPlans()
  if (isLoggedIn.value) {
    checkVerificationStatus()
    fetchCart()
  }
})

const onOnboardingComplete = () => {
  showOnboarding.value = false

  // Optionally reload to update status
  checkVerificationStatus()
}



const loadingCart = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })
const cartItems = ref([])

const fetchCart = async () => {
  if (!isLoggedIn.value) return
  try {
    const res = await api.get('http://127.0.0.1:8002/api/provider/cart/')

    cartItems.value = res.data.items || []
  } catch (err) {
    console.error('Failed to fetch cart:', err)
  }
}

const isPlanInCart = planId => {
  return cartItems.value.some(item => item.plan_id === planId)
}

const addToCart = async plan => {
  if (!plan.billing_cycle) {
    snackbar.value = { show: true, text: 'Plan has no billing cycle selected.', color: 'error' }
    
    return
  }

  loadingCart.value = plan.id
  try {
    const payload = {
      plan_id: plan.id,
      plan_title: plan.title,
      plan_role: plan.target_type || 'individual', // Use target_type
      billing_cycle_id: plan.billing_cycle?.id,
      billing_cycle_name: plan.billing_cycle?.name,
      price_amount: plan.price || 0,
      price_currency: plan.currency || 'INR',
    }

    await api.post('http://127.0.0.1:8002/api/provider/cart/add/', payload)
    
    snackbar.value = { show: true, text: 'Plan added to cart!', color: 'success' }
    fetchCart() // Refresh cart to update UI
  } catch (err) {
    console.error('Add to cart failed:', err)

    const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to add to cart.'

    snackbar.value = { show: true, text: errorMsg, color: 'error' }
  } finally {
    loadingCart.value = null
  }
}
</script>

<template>
  <div class="provider-home-page">
    <!-- NAVBAR -->
    <VAppBar
      color="surface"
      elevation="0"
      class="px-4 border-b"
      position="sticky"
    >
      <div class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-paw"
          size="32"
          color="primary"
        />
        <h2 class="text-h5 font-weight-bold text-primary mb-0">
          Petleo
        </h2>
      </div>
      
      <VSpacer />
      
      <div class="d-none d-md-flex gap-2">
        <VBtn
          variant="text"
          @click="scrollTo('services')"
        >
          Services
        </VBtn>
        <VBtn
          variant="text"
          @click="scrollTo('plans')"
        >
          Plans
        </VBtn>
        <VBtn
          variant="text"
          @click="scrollTo('benefits')"
        >
          Benefits
        </VBtn>
        <VBtn
          variant="text"
          @click="scrollTo('benefits')"
        >
          Benefits
        </VBtn>
        <VBtn
          variant="text"
          @click="scrollTo('testimonials')"
        >
          Testimonials
        </VBtn>
        <VBtn
          variant="text"
          @click="scrollTo('about')"
        >
          About
        </VBtn>
      </div>
      
      <VSpacer />
      
      <!-- Profile Menu (Logged In) -->
      <div v-if="isLoggedIn">
        <VMenu
          location="bottom end"
          offset="10"
        >
          <template #activator="{ props }">
            <VAvatar
              v-bind="props"
              color="primary"
              variant="tonal"
              class="cursor-pointer"
            >
              <VIcon icon="tabler-user" />
            </VAvatar>
          </template>
          
          <VCard min-width="200">
            <VList>
              <VListItem
                prepend-icon="tabler-layout-dashboard"
                title="Provider Dashboard"
                :to="{ name: 'provider-dashboard' }"
              />
              <VDivider class="my-2" />
              <VListItem 
                prepend-icon="tabler-logout" 
                title="Logout" 
                color="error" 
                class="cursor-pointer"
                @click="logout"
              />
            </VList>
          </VCard>
        </VMenu>
      </div>

      <!-- Join Button (Logged Out) -->
      <VBtn
        v-else
        color="primary"
        variant="flat"
        :to="{ name: 'register' }"
      >
        Join as Provider
      </VBtn>
    </VAppBar>

    <!-- 1. HERO SECTION -->
    <section class="hero-section position-relative bg-surface pb-12 pt-16 mt-12">
      <VContainer>
        <VRow align="center">
          <VCol
            cols="12"
            md="6"
          >
            <h1 class="text-h2 font-weight-bold text-primary mb-4">
              Grow Your Pet Business with Petleo
            </h1>
            <p class="text-h5 text-medium-emphasis mb-8">
              Join 500+ trusted pet service providers and get daily clients directly.
            </p>
            <div class="d-flex gap-4">
              <VBtn
                v-if="!isLoggedIn"
                size="large"
                color="primary"
                :to="{ name: 'register' }"
              >
                Join as a Provider
              </VBtn>
              <VBtn
                size="large"
                variant="outlined"
                color="primary"
              >
                View Demo
              </VBtn>
              <VBtn
                v-if="isLoggedIn"
                size="large"
                color="secondary"
                @click="showOnboarding = true"
              >
                Complete Profile
              </VBtn>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="6"
            class="text-center"
          >
            <VImg
              :src="heroImage"
              max-height="400"
              class="mx-auto"
            />
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 🚀 ONBOARDING WIZARD POPUP (Visible if logged in) -->
    <VDialog 
      v-model="showOnboarding" 
      persistent 
      width="100%" 
      max-width="1200px" 
      class="onboarding-dialog"
      style="z-index: 2000;"
    >
      <OnboardingWizard
        @complete="onOnboardingComplete"
        @close="showOnboarding = false"
      />
    </VDialog>

    <!-- 2. SERVICES SECTION -->
    <section
      id="services"
      class="services-section py-16 bg-background"
    >
      <VContainer>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-2">
            What Services You Can Offer
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            Expand your reach by offering these high-demand services
          </p>
        </div>
        <VRow>
          <VCol
            v-for="service in services"
            :key="service.title"
            cols="12"
            sm="6"
            md="4"
          >
            <VCard
              class="h-100 text-center pa-6"
              elevation="2"
            >
              <VAvatar
                color="primary"
                variant="tonal"
                size="64"
                class="mb-4"
              >
                <VIcon
                  :icon="service.icon"
                  size="32"
                />
              </VAvatar>
              <h3 class="text-h5 font-weight-bold mb-2">
                {{ service.title }}
              </h3>
              <p class="text-body-2 text-medium-emphasis">
                {{ service.desc }}
              </p>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 2.5 PLANS SECTION -->
    <section
      id="plans"
      class="plans-section py-16 bg-surface position-relative"
    >
      <!-- Background decoration -->
      <div
        class="position-absolute top-0 left-0 w-100 h-100"
        style="background: radial-gradient(circle at 50% 50%, rgba(var(--v-theme-primary), 0.05) 0%, transparent 70%); pointer-events: none;"
      />

      <VContainer>
        <div class="text-center mb-16">
          <VChip
            color="primary"
            variant="tonal"
            class="mb-4 font-weight-bold"
            size="small"
          >
            PRICING PLANS
          </VChip>
          <h2 class="text-h3 font-weight-bold mb-4">
            Choose the Perfect Plan
          </h2>
          <p
            class="text-h6 text-medium-emphasis font-weight-regular"
            style="max-width: 600px; margin: 0 auto;"
          >
            Transparent pricing. No hidden fees. Cancel anytime.
          </p>
        </div>

        <VRow
          justify="center"
          align="stretch"
        >
          <VCol
            v-for="plan in plans"
            :key="plan.id"
            cols="12"
            md="4"
            lg="4"
          >
            <VCard 
              class="h-100 d-flex flex-column plan-card rounded-xl overflow-visible" 
              elevation="0"
              border
              :class="{ 'border-primary ring-primary': isPlanInCart(plan.id) }"
              style="transition: all 0.3s ease;"
            >
              <!-- Header -->
              <div class="pa-8 text-center bg-surface rounded-t-xl">
                <h3 class="text-h4 font-weight-bold mb-2 text-high-emphasis">
                  {{ plan.title }}
                </h3>
                <p class="text-body-1 text-medium-emphasis mb-6">
                  {{ plan.subtitle }}
                </p>
                
                <!-- Price -->
                <div
                  v-if="plan.price"
                  class="d-flex align-center justify-center gap-1 mb-2"
                >
                  <span class="text-h5 font-weight-bold text-medium-emphasis mt-2">{{ plan.price.currency }}</span>
                  <span class="text-h2 font-weight-bolder text-primary">{{ plan.price.amount }}</span>
                  <span
                    v-if="plan.billing_cycle"
                    class="text-body-1 text-medium-emphasis align-self-end mb-2"
                  >
                    /{{ plan.billing_cycle?.name?.toLowerCase() || '' }}
                  </span>
                </div>
                <div
                  v-else
                  class="text-h2 font-weight-bolder text-primary mb-2"
                >
                  Free
                </div>
              </div>

              <VDivider class="mx-8 border-dashed" />
              
              <!-- Body -->
              <div class="pa-8 flex-grow-1 bg-surface">
                <!-- Features List -->
                <div
                  v-if="plan.features && plan.features.length"
                  class="mb-8"
                >
                  <div class="text-overline font-weight-bold text-medium-emphasis mb-4">
                    WHAT'S INCLUDED
                  </div>
                  <ul class="list-none pa-0 ma-0 d-flex flex-column gap-3">
                    <li
                      v-for="(feature, index) in plan.features"
                      :key="index"
                      class="d-flex align-start"
                    >
                      <VIcon
                        icon="tabler-circle-check-filled"
                        color="primary"
                        size="20"
                        class="me-3 mt-1"
                      />
                      <span class="text-body-1 text-high-emphasis">{{ feature }}</span>
                    </li>
                  </ul>
                </div>

                <!-- Access / Capabilities -->
                <div v-if="plan.access && plan.access.length">
                  <div class="text-overline font-weight-bold text-medium-emphasis mb-4">
                    CAPABILITIES
                  </div>
                  
                  <div class="d-flex flex-column gap-3">
                    <div
                      v-for="(serviceItem, idx) in plan.access"
                      :key="idx"
                      class="capability-item"
                    >
                      <!-- Service Header -->
                      <div class="d-flex align-center mb-2">
                        <VAvatar
                          color="primary"
                          variant="tonal"
                          size="32"
                          class="me-3"
                        >
                          <VIcon
                            :icon="serviceItem.service.icon || 'tabler-box'"
                            size="18"
                          />
                        </VAvatar>
                        <span class="text-subtitle-1 font-weight-bold">{{ serviceItem.service.name }}</span>
                      </div>

                      <!-- Categories (Clean List) -->
                      <div class="ps-11">
                        <div
                          v-for="(cat, cIdx) in serviceItem.categories"
                          :key="cIdx"
                          class="mb-3"
                        >
                          <div class="d-flex align-center justify-space-between mb-1">
                            <span class="text-body-2 font-weight-medium text-high-emphasis">{{ cat.name }}</span>
                            <!-- Mini Permissions Indicators -->
                            <div class="d-flex gap-1">
                              <VTooltip
                                location="top"
                                text="View"
                              >
                                <template #activator="{ props }">
                                  <div
                                    v-bind="props"
                                    class="perm-dot"
                                    :class="{ 'active': cat.permissions.can_view }"
                                  >
                                    V
                                  </div>
                                </template>
                              </VTooltip>
                              <VTooltip
                                location="top"
                                text="Create"
                              >
                                <template #activator="{ props }">
                                  <div
                                    v-bind="props"
                                    class="perm-dot"
                                    :class="{ 'active': cat.permissions.can_create }"
                                  >
                                    C
                                  </div>
                                </template>
                              </VTooltip>
                              <VTooltip
                                location="top"
                                text="Edit"
                              >
                                <template #activator="{ props }">
                                  <div
                                    v-bind="props"
                                    class="perm-dot"
                                    :class="{ 'active': cat.permissions.can_edit }"
                                  >
                                    E
                                  </div>
                                </template>
                              </VTooltip>
                              <VTooltip
                                location="top"
                                text="Delete"
                              >
                                <template #activator="{ props }">
                                  <div
                                    v-bind="props"
                                    class="perm-dot"
                                    :class="{ 'active': cat.permissions.can_delete }"
                                  >
                                    D
                                  </div>
                                </template>
                              </VTooltip>
                            </div>
                          </div>
                          
                          <!-- Facilities (Subtle) -->
                          <div
                            v-if="cat.facilities && cat.facilities.length"
                            class="text-caption text-medium-emphasis"
                          >
                            <VIcon
                              icon="tabler-building-store"
                              size="12"
                              class="me-1"
                            />
                            {{ cat.facilities.map(f => f.name).join(', ') }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer / Action -->
              <div class="pa-8 pt-0 bg-surface rounded-b-xl">
                <VBtn 
                  v-if="isLoggedIn"
                  block 
                  size="x-large"
                  :color="isPlanInCart(plan.id) ? 'success' : 'primary'"
                  variant="flat" 
                  class="rounded-lg font-weight-bold"
                  :loading="loadingCart === plan.id"
                  :disabled="isPlanInCart(plan.id)"
                  elevation="0"
                  @click="addToCart(plan)"
                >
                  {{ isPlanInCart(plan.id) ? 'Added to Cart' : 'Select Plan' }}
                </VBtn>
                
                <VBtn 
                  v-else
                  block 
                  size="x-large" 
                  color="primary" 
                  variant="flat" 
                  class="rounded-lg font-weight-bold"
                  :to="{ name: 'register', query: { plan: plan.id } }"
                  elevation="0"
                >
                  Get Started
                </VBtn>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
      
      <VSnackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        location="top end"
      >
        {{ snackbar.text }}
        <template #actions>
          <VBtn
            variant="text"
            @click="snackbar.show = false"
          >
            Close
          </VBtn>
        </template>
      </VSnackbar>
    </section>

    <!-- 3. BENEFITS SECTION -->

    <section
      id="benefits"
      class="benefits-section py-16 bg-surface"
    >
      <VContainer>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-2">
            Why Join Petleo?
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            Everything you need to manage and grow your business
          </p>
        </div>
        <VRow>
          <VCol
            v-for="benefit in benefits"
            :key="benefit.title"
            cols="12"
            sm="6"
            md="4"
          >
            <div class="d-flex align-start mb-6">
              <VAvatar
                color="success"
                variant="tonal"
                size="48"
                class="me-4"
              >
                <VIcon
                  :icon="benefit.icon"
                  size="24"
                />
              </VAvatar>
              <div>
                <h3 class="text-h6 font-weight-bold mb-1">
                  {{ benefit.title }}
                </h3>
                <p class="text-body-2 text-medium-emphasis">
                  {{ benefit.desc }}
                </p>
              </div>
            </div>
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 4. OUR WORK / CLIENTS -->
    <section class="clients-section py-16 bg-background">
      <VContainer>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-2">
            Our Trusted Partners
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            Join the network of top-rated pet care professionals
          </p>
        </div>
        <!-- Placeholder for logos/cards -->
        <VRow justify="center">
          <VCol
            cols="12"
            md="10"
          >
            <VCard
              class="pa-8 text-center"
              variant="outlined"
              style="border-style: dashed;"
            >
              <p class="text-h6 text-disabled">
                [Logos of Partner Clinics and Businesses will appear here]
              </p>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 5. TESTIMONIALS -->
    <section
      id="testimonials"
      class="testimonials-section py-16 bg-surface"
    >
      <VContainer>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-2">
            Success Stories
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            Hear from providers who are growing with Petleo
          </p>
        </div>
        <VRow>
          <VCol
            v-for="testimonial in testimonials"
            :key="testimonial.name"
            cols="12"
            md="4"
          >
            <VCard
              class="h-100 pa-6"
              elevation="3"
            >
              <div class="mb-4">
                <VIcon
                  icon="tabler-quote"
                  size="40"
                  color="primary"
                  class="opacity-20"
                />
              </div>
              <p class="text-body-1 mb-6 font-italic">
                "{{ testimonial.text }}"
              </p>
              <div class="d-flex align-center">
                <VAvatar
                  color="secondary"
                  class="me-3"
                >
                  <span class="text-h6 text-white">{{ testimonial.name.charAt(0) }}</span>
                </VAvatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ testimonial.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ testimonial.role }} • {{ testimonial.location }}
                  </div>
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 6. HOW IT WORKS -->
    <section class="how-it-works-section py-16 bg-background">
      <VContainer>
        <div class="text-center mb-12">
          <h2 class="text-h3 font-weight-bold mb-2">
            How It Works
          </h2>
          <p class="text-body-1 text-medium-emphasis">
            Get started in 4 simple steps
          </p>
        </div>
        <VRow class="text-center">
          <VCol
            cols="12"
            md="3"
          >
            <div class="mb-4">
              <VAvatar
                color="primary"
                size="64"
                class="text-h4 font-weight-bold"
              >
                1
              </VAvatar>
            </div>
            <h3 class="text-h6 font-weight-bold mb-2">
              Register
            </h3>
            <p class="text-body-2">
              Create your free account in seconds.
            </p>
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <div class="mb-4">
              <VAvatar
                color="primary"
                size="64"
                class="text-h4 font-weight-bold"
              >
                2
              </VAvatar>
            </div>
            <h3 class="text-h6 font-weight-bold mb-2">
              Get Verified
            </h3>
            <p class="text-body-2">
              Upload your documents and complete your profile.
            </p>
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <div class="mb-4">
              <VAvatar
                color="primary"
                size="64"
                class="text-h4 font-weight-bold"
              >
                3
              </VAvatar>
            </div>
            <h3 class="text-h6 font-weight-bold mb-2">
              Set Up Services
            </h3>
            <p class="text-body-2">
              List your services, prices, and availability.
            </p>
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <div class="mb-4">
              <VAvatar
                color="primary"
                size="64"
                class="text-h4 font-weight-bold"
              >
                4
              </VAvatar>
            </div>
            <h3 class="text-h6 font-weight-bold mb-2">
              Start Earning
            </h3>
            <p class="text-body-2">
              Receive bookings and grow your business.
            </p>
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 7. ABOUT PETLEO -->
    <section
      id="about"
      class="about-section py-16 bg-surface"
    >
      <VContainer>
        <VRow align="center">
          <VCol
            cols="12"
            md="6"
          >
            <h2 class="text-h3 font-weight-bold mb-4">
              About Petleo
            </h2>
            <p class="text-body-1 mb-4">
              Petleo was built with a simple mission: to connect pet owners with the best care providers in their area. We believe that every pet deserves the best, and every pet business deserves the tools to thrive.
            </p>
            <p class="text-body-1 mb-6">
              Our platform empowers veterinarians, groomers, walkers, and trainers to manage their bookings, payments, and client relationships in one place, so they can focus on what they do best—caring for pets.
            </p>
            <VBtn
              variant="text"
              color="primary"
              append-icon="tabler-arrow-right"
            >
              Learn More About Us
            </VBtn>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VImg
              :src="heroImage"
              max-height="300"
              class="mx-auto rounded-lg elevation-2"
            />
          </VCol>
        </VRow>
      </VContainer>
    </section>

    <!-- 8. CTA -->
    <section class="cta-section py-16 bg-primary text-white text-center">
      <VContainer>
        <h2 class="text-h2 font-weight-bold text-white mb-6">
          Ready to Grow Your Business?
        </h2>
        <p class="text-h5 text-white opacity-90 mb-8">
          Join thousands of providers on Petleo today.
        </p>
        <VBtn
          size="x-large"
          color="white"
          variant="flat"
          class="text-primary font-weight-bold"
          :to="{ name: 'provider-dashboard' }"
        >
          Start Your Free Provider Account Now
        </VBtn>
      </VContainer>
    </section>
  </div>
</template>

<style scoped>
.ls-1 {
  letter-spacing: 1px !important;
}
.plan-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.plan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -4px rgba(var(--v-shadow-key-umbra-opacity, 0, 0, 0), 0.12) !important;
}

.ring-primary {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary)) !important;
}

.perm-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.38);
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  transition: all 0.2s ease;
}

.perm-dot.active {
  background-color: rgb(var(--v-theme-primary));
  color: white;
}
</style>
