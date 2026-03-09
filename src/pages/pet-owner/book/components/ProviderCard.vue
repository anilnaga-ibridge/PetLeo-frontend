<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  provider: { type: Object, required: true },
  viewMode: { type: String, default: 'grid' },
})

const router = useRouter()

const addToRecentlyViewed = () => {
  const history = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
  const filtered = history.filter(p => p.id !== props.provider.id)

  filtered.unshift(props.provider)
  localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)))
}

const navigateToProvider = () => {
  addToRecentlyViewed()
  router.push(`/pet-owner/book/${props.provider.id}`)
}

// Avatar initials from provider name
const initials = computed(() => {
  const name = props.provider.name || ''
  
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'P'
})

// Pick a gradient based on index (rotates through palette)
const bannerGradients = [
  'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
  'linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)',
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
]

const bannerGradient = computed(() => {
  const idx = (props.provider.name?.charCodeAt(0) || 0) % bannerGradients.length
  
  return bannerGradients[idx]
})

// Service tag colors (cycle)
const tagColors = ['indigo', 'purple', 'cyan', 'teal', 'orange']
const tagColor = i => tagColors[i % tagColors.length]

const photoUrl = computed(() => {
  const p = props.provider
  if (p.photo && p.photo.startsWith('http')) return p.photo
  if (p.banner && p.banner.startsWith('http')) return p.banner
  
  return null
})

const rating = computed(() => {
  const r = parseFloat(props.provider.rating)
  
  return isNaN(r) ? null : r.toFixed(1)
})

const reviewCount = computed(() => props.provider.reviews || 0)
</script>

<template>
  <!-- ── GRID card ── -->
  <div
    v-if="viewMode === 'grid'"
    class="provider-card"
    @click="navigateToProvider"
  >
    <!-- Banner / Cover -->
    <div
      class="card-banner"
      :style="`background: ${bannerGradient}`"
    >
      <!-- Photo or pattern -->
      <img
        v-if="photoUrl"
        :src="photoUrl"
        class="banner-img"
        :alt="provider.name"
      >
      <div
        v-else
        class="banner-pattern"
      />

      <!-- Rating pill -->
      <div class="rating-pill">
        <VIcon
          icon="tabler-star-filled"
          size="11"
          color="#f59e0b"
        />
        <span>{{ rating || 'New' }}</span>
      </div>

      <!-- Verified badge -->
      <div
        v-if="provider.verified"
        class="verified-pill"
      >
        <VIcon
          icon="tabler-rosette-discount-check"
          size="13"
          color="#10b981"
        />
        Verified
      </div>
    </div>

    <!-- Avatar overlapping banner -->
    <div class="avatar-wrap">
      <div
        class="provider-avatar"
        :style="`background: ${bannerGradient}`"
      >
        <span class="avatar-initials">{{ initials }}</span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <!-- Name + verify icon -->
      <div class="provider-name-row">
        <h3 class="provider-name">
          {{ provider.name }}
        </h3>
        <VIcon
          v-if="provider.verified"
          icon="tabler-discount-check-filled"
          color="#6366f1"
          size="18"
        />
      </div>

      <!-- Org / Type label -->
      <p class="provider-type">
        {{ provider.organization || 'Verified PetLeo Professional' }}
      </p>

      <!-- Location & reviews -->
      <div class="provider-meta">
        <div
          v-if="provider.location"
          class="meta-item"
        >
          <VIcon
            icon="tabler-map-pin"
            size="13"
            color="#94a3b8"
          />
          <span class="meta-text">{{ provider.location }}</span>
        </div>
        <div class="meta-item">
          <VIcon
            icon="tabler-message-circle"
            size="13"
            color="#94a3b8"
          />
          <span class="meta-text">{{ reviewCount }} Reviews</span>
        </div>
      </div>

      <!-- Service tags -->
      <div class="service-tags">
        <span
          v-for="(svc, i) in (provider.services || []).slice(0, 3)"
          :key="svc"
          class="service-tag"
          :class="`tag-${tagColor(i)}`"
        >
          {{ svc }}
        </span>
        <span
          v-if="(provider.services || []).length > 3"
          class="service-tag tag-more"
        >
          +{{ provider.services.length - 3 }}
        </span>
      </div>

      <!-- Footer -->
      <div class="card-footer">
        <div
          v-if="provider.price"
          class="price-block"
        >
          <span class="price-label">From</span>
          <span class="price-value">₹{{ provider.price }}</span>
        </div>
        <div
          v-else
          class="price-block"
        >
          <span class="price-label">Book Now</span>
        </div>
        <button class="explore-btn">
          Explore
          <VIcon
            icon="tabler-arrow-right"
            size="14"
          />
        </button>
      </div>
    </div>
  </div>

  <!-- ── LIST card ── -->
  <div
    v-else
    class="provider-list-card"
    @click="navigateToProvider"
  >
    <!-- Left accent bar -->
    <div
      class="list-accent"
      :style="`background: ${bannerGradient}`"
    />

    <!-- Avatar -->
    <div
      class="list-avatar"
      :style="`background: ${bannerGradient}`"
    >
      <img
        v-if="photoUrl"
        :src="photoUrl"
        class="list-avatar-img"
        :alt="provider.name"
      >
      <span
        v-else
        class="list-avatar-initials"
      >{{ initials }}</span>
    </div>

    <!-- Info -->
    <div class="list-info">
      <div class="list-name-row">
        <h3 class="list-name">
          {{ provider.name }}
        </h3>
        <VIcon
          v-if="provider.verified"
          icon="tabler-discount-check-filled"
          color="#6366f1"
          size="20"
        />
        <div
          v-if="rating"
          class="list-rating"
        >
          <VIcon
            icon="tabler-star-filled"
            size="13"
            color="#f59e0b"
          />
          {{ rating }}
        </div>
      </div>

      <p class="list-type">
        {{ provider.organization || 'Verified PetLeo Professional' }}
      </p>

      <div class="list-meta-row">
        <div
          v-if="provider.location"
          class="list-meta-item"
        >
          <VIcon
            icon="tabler-map-pin"
            size="14"
            color="#94a3b8"
          />
          {{ provider.location }}
        </div>
        <div class="list-meta-item">
          <VIcon
            icon="tabler-message-circle"
            size="14"
            color="#94a3b8"
          />
          {{ reviewCount }} Verified Reviews
        </div>
      </div>

      <!-- Tags -->
      <div class="list-tags">
        <span
          v-for="(svc, i) in (provider.services || [])"
          :key="svc"
          class="service-tag"
          :class="`tag-${tagColor(i)}`"
        >
          {{ svc }}
        </span>
      </div>
    </div>

    <!-- Right CTA -->
    <div class="list-cta">
      <div
        v-if="provider.price"
        class="list-price"
      >
        <span class="price-label">From</span>
        <span class="list-price-val">₹{{ provider.price }}</span>
      </div>
      <button
        class="list-explore-btn"
        :style="`background: ${bannerGradient}`"
      >
        View Profile
        <VIcon
          icon="tabler-arrow-up-right"
          size="16"
          class="ml-1"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ═════════════════════════════════
   GRID CARD
═════════════════════════════════ */
.provider-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: relative;
}

.provider-card:hover {
  transform: perspective(1000px) translateZ(30px) rotateX(4deg);
  box-shadow: 
    0 32px 64px rgba(99,102,241,0.18), 
    0 0 0 1px rgba(99,102,241,0.15),
    0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #a5b4fc;
}

/* Banner */
.card-banner {
  height: 120px;
  position: relative;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

.banner-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.15;
  background-image:
    radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
    radial-gradient(circle at 80% 50%, white 1px, transparent 1px);
  background-size: 28px 28px;
}

/* Rating & Verified pills */
.rating-pill {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(2,6,23,0.75);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.3);
}

.verified-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(16,185,129,0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(16,185,129,0.35);
  color: #10b981;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: inset 0 1px 1px rgba(16,185,129,0.2), 0 4px 8px rgba(0,0,0,0.1);
}

/* Avatar */
.avatar-wrap {
  display: flex;
  justify-content: flex-start;
  padding: 0 20px;
  margin-top: -28px;
  position: relative;
  z-index: 2;
}

.provider-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.avatar-initials {
  font-size: 18px;
  font-weight: 900;
  color: white;
  letter-spacing: -0.5px;
}

/* Body */
.card-body {
  padding: 12px 20px 20px;
}

.provider-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.provider-name {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.4px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-type {
  font-size: 11px;
  font-weight: 700;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 12px;
}

/* Meta row */
.provider-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.meta-text {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Service Tags */
.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.service-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 8px;
}

.tag-indigo { background: #eef2ff; color: #6366f1; }
.tag-purple { background: #faf5ff; color: #a855f7; }
.tag-cyan   { background: #ecfeff; color: #06b6d4; }
.tag-teal   { background: #f0fdfa; color: #0d9488; }
.tag-orange { background: #fff7ed; color: #f97316; }
.tag-more   { background: #f8fafc; color: #94a3b8; }

/* Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}

.price-block { display: flex; flex-direction: column; gap: 0; }

.price-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
}

.price-value {
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.8px;
}

.explore-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(99,102,241,0.28);
}

.explore-btn:hover {
  filter: brightness(1.08);
  transform: translateX(2px);
}

/* ═════════════════════════════════
   LIST CARD
═════════════════════════════════ */
.provider-list-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.provider-list-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 8px 32px rgba(99,102,241,0.08);
  transform: translateX(4px);
}

/* Accent bar on left */
.list-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}

/* List avatar */
.list-avatar {
  width: 68px;
  height: 68px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.list-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-avatar-initials {
  font-size: 22px;
  font-weight: 900;
  color: white;
  letter-spacing: -0.5px;
}

/* List info */
.list-info { flex: 1; min-width: 0; }

.list-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
  flex-wrap: wrap;
}

.list-name {
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.5px;
  margin: 0;
}

.list-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
}

.list-type {
  font-size: 11px;
  font-weight: 700;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 8px;
}

.list-meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.list-meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.list-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* List CTA */
.list-cta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.list-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.list-price-val {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
}

.list-explore-btn {
  display: flex;
  align-items: center;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s ease;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(99,102,241,0.3);
}

.list-explore-btn:hover {
  filter: brightness(1.08);
  transform: translateX(2px);
  box-shadow: 0 8px 24px rgba(99,102,241,0.35);
}

@media (max-width: 600px) {
  .provider-list-card { flex-direction: column; align-items: flex-start; }
  .list-cta { align-items: flex-start; width: 100%; }
  .list-explore-btn { width: 100%; justify-content: center; }
}
</style>
