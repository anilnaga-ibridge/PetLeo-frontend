<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: { type: Object, required: true }
})

const emit = defineEmits(['view', 'medical', 'edit', 'delete'])

const petAge = computed(() => props.pet.age_display || 'Unknown age')

const nextVaccination = computed(() => {
  const d = props.pet.medical_profile?.next_due_date
  if (!d) return null
  const days = Math.ceil((new Date(d) - new Date()) / 86400000)
  return { date: new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), days }
})

const vaccDays = computed(() => nextVaccination.value?.days ?? null)
const vaccColor = computed(() => {
  if (vaccDays.value === null) return '#94a3b8'
  if (vaccDays.value <= 3) return '#ef4444'
  if (vaccDays.value <= 7) return '#f59e0b'
  return '#10b981'
})

const photoUrl = computed(() => {
  if (!props.pet.photo) return null
  if (props.pet.photo.startsWith('http')) return props.pet.photo
  return `http://localhost:8005${props.pet.photo}`
})

const initials = computed(() => (props.pet.name || 'P').charAt(0).toUpperCase())

const speciesIcon = computed(() => {
  const s = (props.pet.species_name || props.pet.species || '').toUpperCase()
  if (s.includes('DOG')) return 'tabler-dog'
  if (s.includes('CAT')) return 'tabler-cat'
  if (s.includes('BIRD')) return 'tabler-feather'
  if (s.includes('RABBIT')) return 'tabler-rabbit'
  if (s.includes('FISH')) return 'tabler-fish'
  if (s.includes('REPTILE') || s.includes('SNAKE') || s.includes('LIZARD')) return 'tabler-stretching'
  return 'tabler-paw'
})

const speciesEmoji = computed(() => {
  const s = (props.pet.species_name || props.pet.species || '').toUpperCase()
  if (s.includes('DOG')) return '🐕'
  if (s.includes('CAT')) return '🐱'
  if (s.includes('BIRD')) return '🦜'
  if (s.includes('RABBIT')) return '🐇'
  if (s.includes('FISH')) return '🐠'
  if (s.includes('REPTILE') || s.includes('SNAKE') || s.includes('LIZARD')) return '🦎'
  return '🐾'
})

const ringColor = computed(() => {
  if (vaccDays.value === null) return '#e2e8f0'
  if (vaccDays.value <= 3) return '#ef4444'
  if (vaccDays.value <= 7) return '#f59e0b'
  return '#10b981'
})

// Health score: 0–100 represented as stroke-dashoffset
const healthArc = computed(() => {
  // Simplistic: if vaccinated recently => high, if overdue => low
  if (vaccDays.value === null) return 80
  if (vaccDays.value <= 3) return 30
  if (vaccDays.value <= 7) return 60
  return 90
})
// SVG arc: circumference = 2π × 42 ≈ 264
const arcOffset = computed(() => 264 - (healthArc.value / 100) * 264)
</script>

<template>
  <div class="pet-profile-card">
    <!-- Top strip: species emoji -->
    <div class="card-top-strip">
      <span class="species-emoji">{{ speciesEmoji }}</span>
      <div class="card-menu">
        <VMenu location="bottom end" transition="slide-y-transition" offset="4">
          <template #activator="{ props: mp }">
            <button v-bind="mp" class="menu-trigger">
              <VIcon icon="tabler-dots-vertical" size="14" />
            </button>
          </template>
          <VList class="menu-list py-1" width="170" elevation="16" rounded="xl">
            <VListItem density="compact" class="menu-item" @click="emit('edit', pet)">
              <template #prepend><VIcon icon="tabler-pencil" size="15" class="mr-2 text-slate-500" /></template>
              <span class="text-sm font-weight-bold">Edit</span>
            </VListItem>
            <VListItem density="compact" class="menu-item" @click="emit('medical', pet)">
              <template #prepend><VIcon icon="tabler-stethoscope" size="15" class="mr-2 text-slate-500" /></template>
              <span class="text-sm font-weight-bold">Medical</span>
            </VListItem>
            <VDivider class="my-1 opacity-50" />
            <VListItem density="compact" class="menu-item danger" @click="emit('delete', pet)">
              <template #prepend><VIcon icon="tabler-trash" size="15" class="mr-2 text-error" /></template>
              <span class="text-sm font-weight-bold text-error">Delete</span>
            </VListItem>
          </VList>
        </VMenu>
      </div>
    </div>

    <!-- Avatar with SVG ring -->
    <div class="avatar-zone">
      <svg class="health-ring" viewBox="0 0 100 100" fill="none">
        <!-- Track -->
        <circle cx="50" cy="50" r="42" stroke="#f1f5f9" stroke-width="5" />
        <!-- Arc -->
        <circle
          cx="50" cy="50" r="42"
          :stroke="vaccColor"
          stroke-width="5"
          stroke-linecap="round"
          stroke-dasharray="264"
          :stroke-dashoffset="arcOffset"
          transform="rotate(-90 50 50)"
          class="health-arc"
        />
      </svg>

      <!-- Photo or Static Icon -->
      <div class="avatar-inner">
        <img v-if="photoUrl" :src="photoUrl" class="avatar-img" :alt="pet.name" />
        <div v-else class="avatar-static-icon">
          <VIcon :icon="speciesIcon" size="48" color="primary" />
        </div>
      </div>

      <!-- Health % badge -->
      <div class="health-badge" :style="`background: ${vaccColor}`">
        {{ healthArc }}%
      </div>
    </div>

    <!-- Name & Breed -->
    <div class="pet-name-row">
      <h3 class="pet-name-text">{{ pet.name }}</h3>
      <p class="pet-breed-text">{{ pet.breed || pet.species }}</p>
    </div>

    <!-- Stats chips row -->
    <div class="stats-row">
      <div class="stat-chip">
        <VIcon icon="tabler-clock" size="11" />
        {{ petAge }}
      </div>
      <div class="stat-chip">
        <VIcon icon="tabler-gender-bigender" size="11" />
        {{ pet.gender || '—' }}
      </div>
      <div v-if="pet.weight" class="stat-chip">
        <VIcon icon="tabler-weight" size="11" />
        {{ pet.weight }}kg
      </div>
    </div>

    <!-- Vaccination pill -->
    <div class="vacc-row" :style="`border-color: ${vaccColor}30; background: ${vaccColor}08`">
      <VIcon icon="tabler-vaccine" size="14" :color="vaccColor" />
      <div class="vacc-text">
        <span class="vacc-title">Next Vaccine</span>
        <span class="vacc-date" :style="`color: ${vaccColor}`">
          {{ nextVaccination ? nextVaccination.date : 'Not scheduled' }}
        </span>
      </div>
      <div v-if="nextVaccination" class="vacc-days" :style="`background: ${vaccColor}; color: white`">
        {{ vaccDays }}d
      </div>
    </div>

    <!-- Action Row -->
    <div class="action-row">
      <button class="action-main" @click="emit('view', pet)">
        <VIcon icon="tabler-file-text" size="16" class="mr-2" />
        Records
      </button>
      <button class="action-icon" @click="emit('medical', pet)" title="Medical">
        <VIcon icon="tabler-first-aid-kit" size="18" color="#6366f1" />
      </button>
      <button class="action-icon" @click="emit('view', pet)" title="Profile">
        <VIcon icon="tabler-arrow-right" size="18" color="#6366f1" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pet-profile-card {
  width: 260px;
  min-width: 260px;
  background: white;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
  flex-shrink: 0;
  position: relative;
}

.pet-profile-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 24px 48px rgba(99,102,241,0.10), 0 0 0 1px rgba(99,102,241,0.1);
  border-color: #c7d2fe;
}

/* Top strip */
.card-top-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.species-emoji {
  font-size: 20px;
  line-height: 1;
}

.menu-trigger {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s ease;
}

.menu-trigger:hover { background: #eef2ff; color: #6366f1; border-color: #c7d2fe; }

.menu-list { background: white !important; }
.menu-item { border-radius: 10px; margin: 2px 6px; cursor: pointer; }
.menu-item:hover { background: #f8fafc; }
.menu-item.danger:hover { background: #fef2f2; }

/* Avatar Zone */
.avatar-zone {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;
}

.health-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.health-arc {
  transition: stroke-dashoffset 1s ease;
}

.avatar-inner {
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-size: 32px;
  font-weight: 900;
  color: #6366f1;
  letter-spacing: -1px;
}

.health-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 9px;
  font-weight: 900;
  padding: 3px 7px;
  border-radius: 10px;
  border: 2px solid white;
  line-height: 1;
}

/* Name Row */
.pet-name-row { text-align: center; }

.pet-name-text {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.8px;
  margin: 0 0 2px;
  line-height: 1.1;
}

.pet-breed-text {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Stats Row */
.stats-row {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

/* Vaccination pill */
.vacc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.vacc-row:hover { transform: scale(1.01); }

.vacc-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.vacc-title {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #94a3b8;
}

.vacc-date {
  font-size: 12px;
  font-weight: 800;
}

.vacc-days {
  font-size: 10px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* Action Row */
.action-row {
  display: flex;
  gap: 8px;
}

.action-main {
  flex: 1;
  height: 42px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(99,102,241,0.3);
}

.action-main:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99,102,241,0.35);
  filter: brightness(1.08);
}

.action-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #f5f3ff;
  border: 1px solid #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.action-icon:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  transform: scale(1.06);
}
</style>
