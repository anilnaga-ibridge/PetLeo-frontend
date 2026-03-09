<script setup>

// About Us Section — PetLeo brand story with scroll target ID
</script>

<template>
  <section
    id="about-section"
    class="about-us-section"
  >
    <!-- Header -->
    <div class="about-header">
      <div class="about-header-inner">
        <div class="section-eyebrow">
          About PetLeo
        </div>
        <h2 class="about-title">
          Built for Every Pet Parent.<br>
          Powered by Expert Care.
        </h2>
        <p class="about-subtitle">
          PetLeo is India's unified platform connecting pet owners with verified veterinarians, 
          groomers, trainers, and specialized care providers — all in one place.
        </p>
      </div>
    </div>

    <!-- Story + Image grid -->
    <div class="about-story-grid">
      <!-- Left: Image collage -->
      <div class="story-images">
        <div class="img-main">
          <img
            src="https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=600&q=80&fit=crop"
            alt="Vet with dog"
            class="story-img"
          >
          <div class="img-badge">
            <span class="badge-num">50k+</span>
            <span class="badge-lbl">Happy Pets</span>
          </div>
        </div>
        <div class="img-side">
          <img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80&fit=crop"
            alt="Dog grooming"
            class="story-img-sm"
          >
          <img
            src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80&fit=crop"
            alt="Cats playing"
            class="story-img-sm"
          >
        </div>
      </div>

      <!-- Right: Story content -->
      <div class="story-content">
        <div class="story-tag">
          Our Mission
        </div>
        <h3 class="story-heading">
          We believe every pet deserves world-class care.
        </h3>
        <p class="story-para">
          Founded in 2024, PetLeo was born out of a simple frustration: finding trustworthy, 
          affordable pet care was unnecessarily hard. We built a platform where every vet, 
          groomer, and trainer is verified, transparent, and just a tap away.
        </p>
        <p class="story-para">
          From routine checkups to emergency surgeries, grooming to daycare — PetLeo handles 
          it all. Seamlessly. Securely.
        </p>

        <!-- Stats -->
        <div class="story-stats">
          <div class="story-stat">
            <div class="stat-n">
              500+
            </div>
            <div class="stat-l">
              Verified Providers
            </div>
          </div>
          <div class="stat-sep" />
          <div class="story-stat">
            <div class="stat-n">
              50k+
            </div>
            <div class="stat-l">
              Happy Pet Parents
            </div>
          </div>
          <div class="stat-sep" />
          <div class="story-stat">
            <div class="stat-n">
              20+
            </div>
            <div class="stat-l">
              Cities Covered
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Value Props Row -->
    <div class="value-props">
      <div
        v-for="v in values"
        :key="v.title"
        class="value-card"
      >
        <div
          class="value-icon"
          :style="`background: ${v.bg}; color: ${v.color}`"
        >
          <VIcon
            :icon="v.icon"
            size="24"
          />
        </div>
        <h4 class="value-title">
          {{ v.title }}
        </h4>
        <p class="value-desc">
          {{ v.desc }}
        </p>
      </div>
    </div>
  </section>
</template>

<script>
const values = [
  {
    icon: 'tabler-shield-check',
    title: 'Verified Experts',
    desc: 'Every professional is credential-checked, background-verified, and rated by real pet parents.',
    bg: '#eef2ff', color: '#6366f1',
  },
  {
    icon: 'tabler-currency-rupee',
    title: 'Transparent Pricing',
    desc: 'Compare services and costs upfront. No hidden charges, ever.',
    bg: '#f0fdf4', color: '#10b981',
  },
  {
    icon: 'tabler-clock',
    title: 'Instant Booking',
    desc: 'Schedule and confirm appointments in under 60 seconds.',
    bg: '#fffbeb', color: '#f59e0b',
  },
  {
    icon: 'tabler-heart-handshake',
    title: 'Care Continuity',
    desc: 'Pet medical history, prescriptions, and records stored safely and accessible anytime.',
    bg: '#eff6ff', color: '#3b82f6',
  },
]

export default { setup() { return { values } } }
</script>

<style scoped>
.about-us-section {
  background: #ffffff;
  padding: 100px 0 80px;
}

/* Header */
.about-header {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px 72px;
  text-align: center;
}

.about-header-inner {
  max-width: 720px;
  margin: 0 auto;
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
  margin-bottom: 20px;
}

.about-title {
  font-size: 48px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2px;
  line-height: 1.1;
  margin: 0 0 20px;
}

.about-subtitle {
  font-size: 18px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Story Grid */
.about-story-grid {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  margin-bottom: 80px;
}

/* Images */
.story-images {
  display: flex;
  gap: 16px;
  height: 460px;
}

.img-main {
  flex: 1.2;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
}

.img-badge {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.badge-num {
  font-size: 22px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

.badge-lbl {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
}

.img-side {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.story-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-img-sm {
  width: 100%;
  flex: 1;
  object-fit: cover;
  border-radius: 20px;
}

/* Story Content */
.story-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 20px;
}

.story-heading {
  font-size: 34px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1.5px;
  line-height: 1.2;
  margin: 0 0 20px;
}

.story-para {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.65;
  margin: 0 0 16px;
}

.story-stats {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid #f1f5f9;
}

.story-stat { }

.stat-n {
  font-size: 28px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
  line-height: 1;
}

.stat-l {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin-top: 4px;
}

.stat-sep {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
}

/* Value Props */
.value-props {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.value-card {
  background: #fafbff;
  border: 1px solid #f1f5f9;
  border-radius: 20px;
  padding: 28px;
  transition: all 0.3s ease;
}

.value-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 8px 24px rgba(99,102,241,0.06);
  transform: translateY(-4px);
}

.value-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.value-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.value-desc {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.55;
  margin: 0;
}

@media (max-width: 960px) {
  .about-story-grid { grid-template-columns: 1fr; gap: 48px; }
  .story-images { height: 300px; }
  .value-props { grid-template-columns: repeat(2, 1fr); }
  .about-title { font-size: 34px; }
  .about-header, .about-story-grid, .value-props { padding: 0 20px; }
}
</style>
