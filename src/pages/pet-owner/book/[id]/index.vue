<script setup>
import { inject } from 'vue'

const provider = inject('provider')

// Pet care images to display in the gallery
const petImages = [
  {
    src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80&fit=crop',
    alt: 'Happy dogs playing',
    caption: 'Happy & Healthy Pets',
  },
  {
    src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop',
    alt: 'Dog grooming session',
    caption: 'Professional Grooming',
  },
  {
    src: 'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=600&q=80&fit=crop',
    alt: 'Vet with dog',
    caption: 'Expert Veterinary Care',
  },
]
</script>

<template>
  <div
    v-if="provider"
    class="about-page"
  >
    <!-- ── About Section ── -->
    <div class="about-block">
      <div class="section-eyebrow">
        About Us
      </div>
      <h2 class="about-title">
        <VIcon
          icon="tabler-heart"
          color="#6366f1"
          size="26"
          class="mr-2"
        />
        Meet {{ provider.full_name }}
      </h2>

      <div
        v-if="provider.detailed_profile?.clinic_name"
        class="clinic-chip"
      >
        🏥 {{ provider.detailed_profile.clinic_name }}
      </div>

      <p class="about-bio">
        {{ provider.bio || `Dedicated to providing the highest standards of pet care, ${provider.full_name} offers professional expertise and compassionate service to our community. We treat every pet like family — with love, skill and undivided attention.` }}
      </p>

      <!-- Stats row -->
      <div
        v-if="provider.detailed_profile?.years_of_experience > 0"
        class="stats-row"
      >
        <div class="stat-card">
          <span class="stat-num">{{ provider.detailed_profile.years_of_experience }}+</span>
          <span class="stat-lbl">Years<br>Experience</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ provider.reviewCount || 0 }}+</span>
          <span class="stat-lbl">Happy<br>Clients</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ provider.reviewCount > 0 ? (provider.rating || 0).toFixed(1) : '0.0' }}</span>
          <span class="stat-lbl">Average<br>Rating</span>
        </div>
      </div>

      <!-- Specialisations -->
      <div
        v-if="provider.detailed_profile?.specializations"
        class="spec-wrap"
      >
        <div class="spec-label">
          Specialisations
        </div>
        <div class="spec-chips">
          <span
            v-for="spec in provider.detailed_profile.specializations.split(',')"
            :key="spec"
            class="spec-chip"
          >
            {{ spec.trim() }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Pet Images Gallery ── -->
    <div class="gallery-block">
      <div class="gallery-label">
        Our Clinic in Action
      </div>
      <div class="pet-gallery">
        <div
          v-for="(img, i) in petImages"
          :key="i"
          class="gallery-item"
          :style="`animation-delay: ${i * 0.1}s`"
        >
          <img
            :src="img.src"
            :alt="img.alt"
            class="gallery-img"
          >
          <div class="gallery-caption">
            <VIcon
              icon="tabler-camera"
              size="12"
              class="mr-1"
            />
            {{ img.caption }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── Why Choose Us ── -->
    <div class="why-block">
      <div class="section-eyebrow">
        Why Choose Us
      </div>
      <div class="why-grid">
        <div
          v-for="w in whys"
          :key="w.title"
          class="why-card"
        >
          <div class="why-icon">
            <VIcon
              :icon="w.icon"
              size="22"
              color="#6366f1"
            />
          </div>
          <h4 class="why-title">
            {{ w.title }}
          </h4>
          <p class="why-desc">
            {{ w.desc }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const whys = [
  {
    icon: 'tabler-shield-check',
    title: 'Certified & Verified',
    desc: 'All credentials are checked and verified by the PetLeo platform.',
  },
  {
    icon: 'tabler-heart-handshake',
    title: 'Compassionate Care',
    desc: 'We treat every pet with the same love and attention as our own.',
  },
  {
    icon: 'tabler-clock',
    title: 'Flexible Schedules',
    desc: 'Appointments available 7 days a week to fit your busy life.',
  },
  {
    icon: 'tabler-currency-rupee',
    title: 'Transparent Pricing',
    desc: 'No hidden fees. All costs are clearly shown before you book.',
  },
]

export default { setup() { return { whys } } }
</script>

<style scoped>
.about-page {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* Section eyebrow */
.section-eyebrow {
  display: inline-block;
  background: #eef2ff;
  color: #6366f1;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 14px;
}

/* ── About Block ── */
.about-block {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  padding: 32px;
}

.about-title {
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.8px;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
}

.clinic-chip {
  display: inline-block;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.about-bio {
  font-size: 15px;
  font-weight: 500;
  color: #475569;
  line-height: 1.75;
  margin: 0 0 24px;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 14px 20px;
}

.stat-num {
  font-size: 28px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

.stat-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
}

/* Specializations */
.spec-wrap { }

.spec-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.spec-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-chip {
  display: inline-block;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 10px;
}

/* ── Gallery Block ── */
.gallery-block {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  padding: 28px;
}

.gallery-label {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.3px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.gallery-label::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background: linear-gradient(180deg, #6366f1, #3b82f6);
  border-radius: 2px;
}

.pet-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.gallery-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  animation: galleryFadeIn 0.5s ease both;
  cursor: default;
}

.gallery-item:hover .gallery-img {
  transform: scale(1.06);
}

.gallery-item:hover .gallery-caption {
  opacity: 1;
  transform: translateY(0);
}

@keyframes galleryFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.gallery-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.gallery-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(15,23,42,0.85), transparent);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 20px 12px 10px;
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

/* ── Why Block ── */
.why-block {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 24px;
  padding: 28px;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.why-card {
  background: #fafbff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;
}

.why-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 16px rgba(99,102,241,0.06);
  transform: translateY(-2px);
}

.why-icon {
  width: 44px;
  height: 44px;
  background: #eef2ff;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.why-title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  letter-spacing: -0.2px;
}

.why-desc {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 600px) {
  .pet-gallery { grid-template-columns: 1fr; }
  .why-grid { grid-template-columns: 1fr; }
  .gallery-img { height: 220px; }
}
</style>
