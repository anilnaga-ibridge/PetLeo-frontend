<script setup>
const props = defineProps({
  stats: {
    type: Object, // { registered: 5, vitals: 4, consulted: 3, completed: 2 }
    default: () => ({ registered: 0, vitals: 0, consulted: 0, completed: 0 }),
  },
})

const items = [
  { key: 'registered', title: 'Pets Registered', icon: 'tabler-paw', color: 'primary' },
  { key: 'vitals', title: 'Vitals Done', icon: 'tabler-activity-heartbeat', color: 'info' },
  { key: 'consulted', title: 'Consultations', icon: 'tabler-stethoscope', color: 'warning' },
  { key: 'completed', title: 'Checkouts', icon: 'tabler-check', color: 'success' },
]
</script>

<template>
  <VCard class="border h-100" elevation="0">
    <VCardItem class="pb-2">
      <VCardTitle>My Work Today</VCardTitle>
      <VCardSubtitle>Your daily contribution</VCardSubtitle>
    </VCardItem>
    
    <VCardText>
      <div v-for="item in items" :key="item.key" class="d-flex align-center mb-4">
        <VAvatar :color="item.color" variant="tonal" class="me-3" rounded>
          <VIcon :icon="item.icon" size="22" />
        </VAvatar>
        <div class="flex-grow-1">
          <div class="text-subtitle-2 font-weight-medium">{{ item.title }}</div>
          <div class="text-caption text-medium-emphasis">Today</div>
        </div>
         <h4 class="text-h5 font-weight-bold mb-0">
          {{ props.stats[item.key] || 0 }}
        </h4>
      </div>
    </VCardText>
  </VCard>
</template>
