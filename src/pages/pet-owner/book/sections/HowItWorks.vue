<script setup>
// Premium How It Works section with dummy step content and id for scroll navigation
</script>

<template>
  <section id="how-it-works-section" class="hiw-section">
    <!-- Header -->
    <div class="hiw-header">
      <div class="section-eyebrow">How It Works</div>
      <h2 class="hiw-title">Pet Care Made Simple</h2>
      <p class="hiw-sub">
        From first search to first appointment — PetLeo makes the entire journey effortless for you and your pet.
      </p>
    </div>

    <!-- Steps -->
    <div class="hiw-steps">
      <!-- Connector line (desktop) -->
      <div class="steps-connector" />

      <div
        v-for="(step, i) in steps"
        :key="step.id"
        class="step-item"
        :style="`animation-delay: ${i * 0.12}s`"
      >
        <!-- Number bubble -->
        <div class="step-number-wrap">
          <div class="step-ring" />
          <div class="step-bubble" :style="`background: ${step.gradient}`">
            <span class="step-num">{{ step.id }}</span>
          </div>
        </div>

        <!-- Icon card -->
        <div class="step-icon-card" :style="`background: ${step.gradient}`">
          <VIcon :icon="step.icon" size="40" color="white" />
        </div>

        <!-- Content -->
        <h3 class="step-title">{{ step.title }}</h3>
        <p class="step-desc">{{ step.desc }}</p>

        <!-- Mini check list -->
        <ul class="step-points">
          <li v-for="p in step.points" :key="p">
            <VIcon icon="tabler-check" size="13" :color="step.color" />
            {{ p }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom CTA strip -->
    <div class="hiw-cta-strip">
      <div class="cta-strip-inner">
        <div class="cta-paw">🐾</div>
        <div>
          <h3 class="cta-title">Ready to give your pet the best care?</h3>
          <p class="cta-sub">Join 50,000+ pet parents already using PetLeo.</p>
        </div>
        <div class="cta-actions">
          <VBtn
            color="white"
            height="50"
            class="px-8 font-weight-black rounded-2xl cta-primary-btn"
            prepend-icon="tabler-search"
            @click="$router.push('/pet-owner/book')"
          >
            Find a Provider
          </VBtn>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
const steps = [
  {
    id: 1,
    icon: 'tabler-search',
    title: 'Search & Discover',
    desc: 'Browse hundreds of verified vets, groomers, trainers, and care providers near you using smart filters.',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#6366f1',
    points: ['Search by location', 'Filter by service type', 'View availability in real-time']
  },
  {
    id: 2,
    icon: 'tabler-user-check',
    title: 'Choose Your Expert',
    desc: 'Read verified reviews, check credentials, and compare prices — all before you decide.',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#3b82f6',
    points: ['Verified credentials', 'Real parent reviews', 'Transparent pricing']
  },
  {
    id: 3,
    icon: 'tabler-calendar-check',
    title: 'Book Instantly',
    desc: 'Select a slot, confirm your booking in seconds, and receive a calendar invite — no phone calls.',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    color: '#06b6d4',
    points: ['Real-time slot selection', 'Instant confirmation', 'Calendar reminders']
  },
  {
    id: 4,
    icon: 'tabler-heart-handshake',
    title: 'Track & Manage',
    desc: 'Access your pet\'s medical history, upcoming appointments, prescriptions, and vaccination records anytime.',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#10b981',
    points: ['Digital health records', 'Vaccination reminders', 'Prescription history']
  }
]
export default { setup() { return { steps } } }
</script>

<style scoped>
.hiw-section {
  background: #0f172a;
  padding: 100px 0 0;
  position: relative;
  overflow: hidden;
}

/* Ambient glow */
.hiw-section::before {
  content: '';
  position: absolute;
  top: -100px; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 400px;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%);
  pointer-events: none;
}

/* Header */
.hiw-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 80px;
  padding: 0 24px;
}

.section-eyebrow {
  display: inline-block;
  background: rgba(99,102,241,0.15);
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 16px;
  border: 1px solid rgba(99,102,241,0.2);
}

.hiw-title {
  font-size: 48px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -2.5px;
  line-height: 1.1;
  margin: 0 0 16px;
}

.hiw-sub {
  font-size: 17px;
  font-weight: 500;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

/* Steps Container */
.hiw-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  position: relative;
  margin-bottom: 80px;
}

/* Horizontal connector line */
.steps-connector {
  position: absolute;
  top: 68px;
  left: calc(40px + 12.5%);
  right: calc(40px + 12.5%);
  height: 1px;
  background: linear-gradient(90deg, rgba(99,102,241,0.5), rgba(59,130,246,0.5), rgba(6,182,212,0.5), rgba(16,185,129,0.5));
  z-index: 0;
}

/* Step Item */
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 20px;
  position: relative;
  animation: fadeStepUp 0.6s cubic-bezier(0.2,0,0,1) both;
}

@keyframes fadeStepUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Number bubble */
.step-number-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 28px;
  z-index: 2;
}

.step-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 1; }
}

.step-bubble {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  border: 3px solid rgba(255,255,255,0.15);
}

.step-num {
  font-size: 20px;
  font-weight: 900;
  color: white;
  line-height: 1;
}

/* Icon Card */
.step-icon-card {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  transition: transform 0.3s ease;
}

.step-item:hover .step-icon-card {
  transform: translateY(-6px) scale(1.04);
}

/* Title & Desc */
.step-title {
  font-size: 20px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.5px;
  margin: 0 0 10px;
}

.step-desc {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px;
}

/* Check list */
.step-points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.step-points li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 6px 12px;
  width: 100%;
}

/* CTA Strip */
.hiw-cta-strip {
  background: linear-gradient(135deg, #6366f1, #4f46e5, #3b82f6);
  padding: 48px 40px;
}

.cta-strip-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.cta-paw { font-size: 48px; flex-shrink: 0; }

.cta-title {
  font-size: 26px;
  font-weight: 900;
  color: white;
  letter-spacing: -0.8px;
  margin: 0 0 4px;
}

.cta-sub {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255,255,255,0.75);
  margin: 0;
}

.cta-actions { margin-left: auto; }

.cta-primary-btn {
  color: #6366f1 !important;
  font-weight: 900;
}

@media (max-width: 960px) {
  .hiw-steps { grid-template-columns: repeat(2, 1fr); gap: 48px; }
  .steps-connector { display: none; }
  .hiw-title { font-size: 34px; }
  .hiw-steps { padding: 0 20px; }
}

@media (max-width: 600px) {
  .hiw-steps { grid-template-columns: 1fr; }
  .cta-strip-inner { flex-direction: column; text-align: center; }
  .cta-actions { margin: 0 auto; }
}
</style>
