<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

const speciesIcon = computed(() => {
  const icons = {
    DOG: 'tabler-dog',
    CAT: 'tabler-cat',
    BIRD: 'tabler-feather',
    OTHER: 'tabler-paw',
  }
  
  return icons[props.pet.species] || 'tabler-paw'
})

const speciesColor = computed(() => {
  const colors = {
    DOG: 'success',
    CAT: 'warning',
    BIRD: 'info',
    OTHER: 'secondary',
  }
  
  return colors[props.pet.species] || 'secondary'
})

const ageDisplay = computed(() => {
  const age = props.pet.age_years
  if (age === null || age === undefined) return 'Unknown'
  if (age === 0) return 'Less than 1 year'
  
  return `${age} year${age > 1 ? 's' : ''} old`
})

const photoUrl = computed(() => {
  if (props.pet.photo) {
    // If photo is a full URL
    if (props.pet.photo.startsWith('http')) return props.pet.photo

    // If it's a relative path, prepend the API base URL
    return `http://localhost:8005${props.pet.photo}`
  }
  
  return null
})
</script>

<template>
  <VCard
    elevation="2"
    class="pet-card"
  >
    <!-- Pet Photo -->
    <div class="pet-photo-container">
      <VImg
        v-if="photoUrl"
        :src="photoUrl"
        cover
        height="200"
        class="pet-photo"
      />
      <div
        v-else
        class="pet-photo-placeholder d-flex align-center justify-center"
      >
        <VIcon
          :icon="speciesIcon"
          size="64"
          color="slate-300"
        />
      </div>
      
      <!-- Species Badge -->
      <VChip
        :color="speciesColor"
        size="small"
        class="species-badge"
      >
        <VIcon
          :icon="speciesIcon"
          start
          size="16"
        />
        {{ pet.species }}
      </VChip>
    </div>

    <!-- Pet Info -->
    <VCardText class="pa-4">
      <h3 class="text-h6 font-weight-bold mb-1">
        {{ pet.name }}
      </h3>
      <p class="text-body-2 text-slate-500 mb-2">
        {{ pet.breed || 'Mixed Breed' }}
      </p>
      
      <div class="d-flex align-center gap-2 text-caption text-slate-400">
        <VIcon
          icon="tabler-calendar"
          size="14"
        />
        <span>{{ ageDisplay }}</span>
      </div>
    </VCardText>

    <!-- Actions -->
    <VCardActions class="pa-4 pt-0">
      <VBtn
        variant="tonal"
        color="primary"
        size="small"
        prepend-icon="tabler-edit"
        @click="emit('edit', pet)"
      >
        Edit
      </VBtn>
      <VSpacer />
      <VBtn
        variant="text"
        color="error"
        size="small"
        icon="tabler-trash"
        @click="emit('delete', pet.id)"
      />
    </VCardActions>
  </VCard>
</template>

<style scoped>
.pet-card {
  border-radius: 12px;
  overflow: hidden;
}

.pet-photo-container {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.pet-photo-placeholder {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
}

.species-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  text-transform: capitalize;
}
</style>
