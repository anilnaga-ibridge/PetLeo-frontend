<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const services = ref([])
const loading = ref(true)

// Map common service names to icons and gradient colors
const serviceStyles = {
  VETERINARY: { icon: 'tabler-stethoscope', bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', emoji: '🏥' },
  GROOMING: { icon: 'tabler-scissors', bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', emoji: '✂️' },
  TRAINING: { icon: 'tabler-award', bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', emoji: '🎓' },
  BOARDING: { icon: 'tabler-home-heart', bg: 'linear-gradient(135deg, #4f46e5, #6366f1)', emoji: '🏠' },
  DAYCARE: { icon: 'tabler-sun', bg: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', emoji: '☀️' },
  PHARMACY: { icon: 'tabler-pill', bg: 'linear-gradient(135deg, #6366f1, #3b82f6)', emoji: '💊' },
  PET_SPA: { icon: 'tabler-bubble', bg: 'linear-gradient(135deg, #2563eb, #4f46e5)', emoji: '🛁' },
  WALKING: { icon: 'tabler-walk', bg: 'linear-gradient(135deg, #06b6d4, #0284c7)', emoji: '🦮' },
}

const getStyle = service => {
  const key = (service.linked_capability || service.name || '').toUpperCase()

  // Try exact match, then partial match
  for (const [k, v] of Object.entries(serviceStyles)) {
    if (key.includes(k)) return v
  }
  
  return { icon: 'tabler-paw', bg: 'linear-gradient(135deg, #6366f1, #3b82f6)', emoji: '🐾' }
}

const fetchServices = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')
    const all = Array.isArray(res.data) ? res.data : (res.data.results || [])

    services.value = all.filter(s => s.is_active && !s.blocked)
  } catch (err) {
    console.error('Failed to fetch services', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchServices)
</script>

<template>
  <section
    id="services-section"
    class="services-section"
  >
    <!-- Header -->
    <div class="services-header">
      <div class="section-eyebrow">
        Our Services
      </div>
      <h2 class="services-title">
        Everything Your Pet Needs
      </h2>
      <p class="services-sub">
        From routine checkups to emergency care — PetLeo connects you with verified professionals 
        for every aspect of your pet's wellbeing.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="services-loading"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="44"
        width="4"
      />
      <p class="loading-text">
        Loading services…
      </p>
    </div>

    <!-- Services Grid -->
    <div
      v-else-if="services.length > 0"
      class="services-grid"
    >
      <div
        v-for="(service, i) in services"
        :key="service.id"
        class="service-card"
        :style="`animation-delay: ${i * 0.07}s`"
      >
        <!-- Icon Block -->
        <div
          class="service-icon-wrap"
          :style="`background: ${getStyle(service).bg}`"
        >
          <span class="service-emoji">{{ getStyle(service).emoji }}</span>
        </div>

        <!-- Content -->
        <div class="service-content">
          <h3 class="service-name">
            {{ service.display_name || service.name }}
          </h3>
          <p class="service-desc">
            {{ service.description || `Professional ${service.display_name || service.name} services for your beloved pet.` }}
          </p>
        </div>

        <!-- Footer row -->
        <div class="service-footer">
          <div class="billing-tag">
            <VIcon
              icon="tabler-clock"
              size="12"
            />
            {{ service.default_billing_unit?.replace(/_/g, ' ') || 'Per Session' }}
          </div>
          <div class="audience-tag">
            <VIcon
              icon="tabler-users"
              size="12"
            />
            {{ service.target_audience || 'All' }}
          </div>
        </div>

        <!-- Hover glow line -->
        <div
          class="service-card-glow"
          :style="`background: ${getStyle(service).bg}`"
        />
      </div>
    </div>

    <!-- Empty fallback -->
    <div
      v-else
      class="services-empty"
    >
      <p>No services available at the moment. Please check back soon.</p>
    </div>

    <!-- CTA -->
    <div class="services-cta">
      <p class="cta-label">
        Ready to book for your pet?
      </p>
      <VBtn
        color="primary"
        height="54"
        class="font-weight-black rounded-2xl px-10"
        prepend-icon="tabler-search"
        onclick="document.getElementById('providers-section')?.scrollIntoView({ behavior: 'smooth' })"
        @click="$router.push('/pet-owner/book')"
      >
        Find a Provider
      </VBtn>
    </div>
  </section>
</template>

<style scoped>
.services-section {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  padding: 100px 0 80px;
}

/* Header */
.services-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 60px;
  padding: 0 24px;
}

.section-eyebrow {
  display: inline-block;
  background: #eef2ff;
  color: #6366f1;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 16px;
}

.services-title {
  font-size: 46px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2px;
  line-height: 1.1;
  margin: 0 0 16px;
}

.services-sub {
  font-size: 17px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Loading */
.services-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px;
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #94a3b8;
}

/* Grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px 60px;
}

/* Card */
.service-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
  animation: fadeUp 0.5s cubic-bezier(0.2, 0, 0, 1) both;
  cursor: default;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.service-card:hover {
  transform: translateY(-8px);
  border-color: #c7d2fe;
  box-shadow: 0 20px 48px rgba(99,102,241,0.08);
}

.service-card:hover .service-card-glow {
  opacity: 1;
}

/* Glow line at bottom on hover */
.service-card-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Icon */
.service-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.service-emoji {
  font-size: 28px;
}

/* Content */
.service-content { flex: 1; }

.service-name {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin: 0 0 8px;
}

.service-desc {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer row */
.service-footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.billing-tag, .audience-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}

/* Empty state */
.services-empty {
  text-align: center;
  padding: 60px 24px;
  color: #94a3b8;
  font-size: 16px;
}

/* CTA */
.services-cta {
  text-align: center;
  padding: 0 24px;
}

.cta-label {
  font-size: 16px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .services-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 900px) {
  .services-grid { grid-template-columns: repeat(2, 1fr); padding: 0 20px 48px; }
  .services-title { font-size: 34px; }
}

@media (max-width: 600px) {
  .services-grid { grid-template-columns: 1fr; }
}
</style>
