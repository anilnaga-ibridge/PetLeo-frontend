<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentCity: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['search'])

const search = ref('')
const city = ref(props.currentCity)

const rawData = localStorage.getItem('userData')
const userData = rawData ? JSON.parse(rawData) : {}
const firstName = (userData.full_name || 'Pet Lover').split(' ')[0]

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  
  return 'Good Evening'
})

const handleSearch = () => {
  emit('search', { search: search.value, city: city.value })
}

// 3D Tilt Logic
const cardTilt = ref({ x: 0, y: 0 })

const handleMouseMove = e => {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  
  cardTilt.value = { x: x * 15, y: y * -15 }
}

const resetTilt = () => {
  cardTilt.value = { x: 0, y: 0 }
}
</script>

<template>
  <section class="hero-section">
    <!-- PREMIUM PET CARE BACKGROUND IMAGE -->
    <div class="hero-bg-image" />

    <!-- OVERLAY LAYERS -->
    <div class="hero-overlay-light" />
    <div class="hero-overlay-gradient" />

    <!-- Floating decorative orbs -->
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />

    <!-- CONTENT -->
    <div class="hero-content">
      <!-- Greeting pill -->
      <div class="greeting-pill animate-in">
        <div class="greeting-dot" />
        <span>{{ greeting }}, {{ firstName }}!</span>
        <span class="greeting-paw">🐾</span>
      </div>

      <!-- Main headline -->
      <h1 class="hero-headline animate-in delay-1">
        Elite Care for Your<br>
        <span class="headline-gradient 3d-text">Beloved Companions</span>
      </h1>

      <!-- Subtitle -->
      <p class="hero-sub animate-in delay-2">
        Connecting you with verified veterinarians, groomers, trainers and pet wellness experts — all in one place.
      </p>

      <!-- Search Glass -->
      <div 
        class="hero-search-wrap animate-in delay-3"
        :style="{
          transform: `perspective(1000px) rotateX(${cardTilt.y}deg) rotateY(${cardTilt.x}deg)`
        }"
        @mousemove="handleMouseMove"
        @mouseleave="resetTilt"
      >
        <div class="hero-search-glass">
          <!-- Service input -->
          <div class="search-field">
            <div class="search-field-icon">
              <VIcon
                icon="tabler-search"
                size="18"
                color="#6366f1"
              />
            </div>
            <input
              v-model="search"
              class="search-field-input"
              placeholder="What service are you looking for?"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- Divider -->
          <div class="search-divider" />

          <!-- Location input -->
          <div class="search-field">
            <div class="search-field-icon">
              <VIcon
                icon="tabler-map-pin"
                size="18"
                color="#6366f1"
              />
            </div>
            <input
              v-model="city"
              class="search-field-input"
              placeholder="City or location"
              @keyup.enter="handleSearch"
            >
          </div>

          <!-- CTA -->
          <button
            class="search-cta"
            @click="handleSearch"
          >
            <VIcon
              icon="tabler-search"
              size="18"
              class="mr-2"
            />
            Search
          </button>
        </div>

        <!-- Quick tags -->
        <div class="quick-tags">
          <span class="quick-label">Popular:</span>
          <button
            v-for="tag in ['Veterinary', 'Grooming', 'Training', 'Boarding', 'Daycare']"
            :key="tag"
            class="quick-tag"
            @click="search = tag; handleSearch()"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Trust indicators -->
      <div class="trust-row animate-in delay-4">
        <div class="trust-item">
          <VIcon
            icon="tabler-shield-check"
            size="18"
            color="#10b981"
          />
          <span>500+ Verified Providers</span>
        </div>
        <div class="trust-sep">
          ·
        </div>
        <div class="trust-item">
          <VIcon
            icon="tabler-star-filled"
            size="16"
            color="#f59e0b"
          />
          <span>4.9 / 5 Rating</span>
        </div>
        <div class="trust-sep">
          ·
        </div>
        <div class="trust-item">
          <VIcon
            icon="tabler-users"
            size="18"
            color="#60a5fa"
          />
          <span>50k+ Pet Parents</span>
        </div>
        <div class="trust-sep">
          ·
        </div>
        <div class="trust-item">
          <VIcon
            icon="tabler-map-pin"
            size="18"
            color="#a78bfa"
          />
          <span>20+ Cities</span>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="scroll-indicator">
      <div class="scroll-mouse">
        <div class="scroll-wheel" />
      </div>
      <span class="scroll-label">Scroll to explore</span>
    </div>
  </section>
</template>

<style scoped>
/* ── Hero Section ── */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ── Premium Background Image ── */
.hero-bg-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('@images/pet-care-hero.png');
  background-size: cover;
  background-position: center 20%;
  animation: bgZoom 20s ease-in-out infinite alternate;
}

@keyframes bgZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

/* ── Overlays ── */
.hero-overlay-light {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1;
}

.hero-overlay-gradient {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, transparent 40%, rgba(255,255,255,0.9) 100%),
    linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 50%, rgba(59,130,246,0.05) 100%);
  z-index: 2;
}

/* ── Floating Orbs ── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  pointer-events: none;
  z-index: 3;
}

.orb-1 {
  width: 500px; height: 500px;
  background: rgba(99,102,241,0.12);
  top: -150px; right: -100px;
  animation: orbFloat 8s ease-in-out infinite alternate;
}

.orb-2 {
  width: 350px; height: 350px;
  background: rgba(59,130,246,0.08);
  bottom: -80px; left: -80px;
  animation: orbFloat 10s ease-in-out infinite alternate-reverse;
}

.orb-3 {
  width: 250px; height: 250px;
  background: rgba(6,182,212,0.07);
  top: 40%; left: 10%;
  animation: orbFloat 12s ease-in-out infinite alternate;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(30px, -30px) scale(1.1); }
}

/* ── Content ── */
.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
  padding: 120px 24px 100px;
}

/* Greeting pill */
.greeting-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(99, 102, 241, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(99, 102, 241, 0.15);
  color: #4338ca;
  font-size: 13px;
  font-weight: 800;
  padding: 8px 20px;
  border-radius: 100px;
  margin-bottom: 28px;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.05);
}

.greeting-dot {
  width: 8px; height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
  70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}

.greeting-paw { font-size: 16px; }

/* Headline */
.hero-headline {
  font-size: 76px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -3.5px;
  line-height: 1.0;
  margin: 0 0 24px;
  text-shadow: 0 4px 24px rgba(0,0,0,0.05);
}

.headline-gradient {
  background: linear-gradient(135deg, #93c5fd 0%, #818cf8 60%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  &.3d-text {
    filter: drop-shadow(0 4px 8px rgba(99, 102, 241, 0.4)) drop-shadow(0 12px 24px rgba(0, 0, 0, 0.3));
    letter-spacing: -2px;
  }
}

/* Subtitle */
.hero-sub {
  font-size: 19px;
  font-weight: 500;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 44px;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

/* ── Search Glass ── */
.hero-search-wrap {
  max-width: 780px;
  margin: 0 auto 36px;
  transition: transform 0.15s ease-out;
  transform-style: preserve-3d;
  will-change: transform;
}

.hero-search-glass {
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(28px);
  border: 1.5px solid rgba(255,255,255,0.8);
  border-radius: 22px;
  padding: 8px;
  box-shadow: 
    0 20px 60px rgba(0,0,0,0.3), 
    0 0 0 1px rgba(99,102,241,0.1),
    inset 0 0 20px rgba(255,255,255,0.5);
  overflow: hidden;
  transform: translateZ(50px); /* Lift element in 3D space */
}

.search-field {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 4px 12px;
  gap: 10px;
  min-width: 0;
}

.search-field-icon {
  flex-shrink: 0;
}

.search-field-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  font-family: inherit;
  min-width: 0;
}

.search-field-input::placeholder { color: #94a3b8; }

.search-divider {
  width: 1px;
  height: 32px;
  background: #e2e8f0;
  flex-shrink: 0;
  margin: 0 4px;
}

.search-cta {
  height: 50px;
  padding: 0 28px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-family: inherit;
  transition: all 0.25s ease;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(99,102,241,0.4);
  flex-shrink: 0;
}

.search-cta:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(99,102,241,0.45);
}

/* Quick tags */
.quick-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.quick-tag {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 100px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.quick-tag:hover {
  background: rgba(99,102,241,0.4);
  border-color: rgba(99,102,241,0.5);
  color: white;
}

/* Trust Row */
.trust-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}

.trust-sep {
  color: #e2e8f0;
  font-size: 20px;
}

/* ── Scroll Indicator ── */
.scroll-indicator {
  position: absolute;
  bottom: 36px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: scrollBounce 2s ease-in-out infinite;
}

@keyframes scrollBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(6px); }
}

.scroll-mouse {
  width: 24px;
  height: 38px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 5px;
}

.scroll-wheel {
  width: 3px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 2px;
  animation: wheelMove 1.5s ease-in-out infinite;
}

@keyframes wheelMove {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(12px); opacity: 0; }
}

.scroll-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

/* ── Animations ── */
.animate-in {
  animation: heroFadeUp 0.9s cubic-bezier(0.2,0,0,1) both;
}

.delay-1 { animation-delay: 0.12s; }
.delay-2 { animation-delay: 0.22s; }
.delay-3 { animation-delay: 0.32s; }
.delay-4 { animation-delay: 0.44s; }

@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero-headline { font-size: 44px; letter-spacing: -2px; }
  .hero-sub { font-size: 16px; }
  .hero-search-glass { flex-direction: column; border-radius: 16px; gap: 8px; }
  .search-divider { display: none; }
  .search-field { width: 100%; }
  .search-cta { width: 100%; justify-content: center; }
  .trust-sep { display: none; }
}
</style>
