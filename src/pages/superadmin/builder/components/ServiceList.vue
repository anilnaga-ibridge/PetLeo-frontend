<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['selectedId'])
const emit = defineEmits(['select', 'create', 'edit'])

const services = ref([])
const loading = ref(false)

const fetchServices = async () => {
  loading.value = true
  try {
    const res = await superAdminApi.get('/api/superadmin/services/')
    services.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch services:', err)
  } finally {
    loading.value = false
  }
}

const openAddDrawer = () => {
  emit('create')
}

const openEditDrawer = (service) => {
  emit('edit', service)
}

const selectService = (serviceId) => {
  emit('select', serviceId)
}

defineExpose({ fetchServices, openAddDrawer })

onMounted(fetchServices)
</script>

<template>
  <div class="service-list-container h-100 d-flex flex-column">
    <div class="pa-4 border-b">
      <VBtn
        block
        color="primary"
        prepend-icon="tabler-plus"
        @click="openAddDrawer"
      >
        Add Service
      </VBtn>
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-2">
      <div v-if="loading" class="d-flex justify-center py-4">
        <VProgressCircular indeterminate color="primary" />
      </div>

      <VList v-else lines="two" nav class="bg-transparent">
        <VListItem
          v-for="service in services"
          :key="service.id"
          :value="service.id"
          :active="props.selectedId === service.id"
          color="primary"
          rounded="lg"
          class="mb-1"
          @click="selectService(service.id)"
        >
          <template #prepend>
            <VAvatar color="surface-variant" variant="tonal" size="40" class="me-3">
              <VIcon :icon="service.icon && service.icon !== 'null' ? service.icon : 'tabler-paw'" size="24" />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-bold">
            {{ service.display_name }}
          </VListItemTitle>
          <VListItemSubtitle class="text-caption">
            {{ service.is_active ? 'Active' : 'Inactive' }}
          </VListItemSubtitle>

          <template #append>
            <div class="d-flex align-center">
              <IconBtn size="small" variant="text" color="medium-emphasis" @click.stop="openEditDrawer(service)">
                <VIcon icon="tabler-edit" size="18" />
              </IconBtn>
            </div>
          </template>
        </VListItem>
      </VList>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.service-list-container {
  background: rgb(var(--v-theme-surface));
}

.service-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
  }
}
</style>
