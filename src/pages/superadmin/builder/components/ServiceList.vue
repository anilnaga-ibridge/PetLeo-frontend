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

const openEditDrawer = service => {
  emit('edit', service)
}

const isDeleteDialogOpen = ref(false)
const serviceToDelete = ref(null)
const deleting = ref(false)

const confirmDelete = service => {
  serviceToDelete.value = service
  isDeleteDialogOpen.value = true
}

const deleteService = async () => {
  if (!serviceToDelete.value) return
  
  deleting.value = true
  try {
    await superAdminApi.delete(`/api/superadmin/services/${serviceToDelete.value.id}/`)
    await fetchServices()
    isDeleteDialogOpen.value = false
    serviceToDelete.value = null
  } catch (err) {
    console.error('Failed to delete service:', err)
  } finally {
    deleting.value = false
  }
}

const selectService = serviceId => {
  emit('select', serviceId)
}

defineExpose({ fetchServices, openAddDrawer })

onMounted(fetchServices)
</script>

<template>
  <div class="service-list-container h-100 d-flex flex-column">
    <div class="pa-5">
      <VBtn
        block
        color="primary"
        prepend-icon="tabler-plus"
        rounded="xl"
        elevation="0"
        class="premium-btn mb-4"
        @click="openAddDrawer"
      >
        Add Service
      </VBtn>
      <div class="text-overline text-medium-emphasis ps-2">
        Platform Services
      </div>
    </div>

    <div class="flex-grow-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
      <div
        v-if="loading"
        class="d-flex justify-center py-12"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <VList
        v-else
        lines="two"
        nav
        class="bg-transparent pa-0"
      >
        <VListItem
          v-for="(service, index) in services"
          :key="service.id"
          :value="service.id"
          :active="props.selectedId === service.id"
          color="primary"
          rounded="xl"
          class="service-item mb-2"
          :style="{ animationDelay: `${index * 0.05}s` }"
          @click="selectService(service.id)"
        >
          <template #prepend>
            <VAvatar 
              :color="props.selectedId === service.id ? 'primary' : 'surface-variant'" 
              :variant="props.selectedId === service.id ? 'elevated' : 'tonal'" 
              size="42" 
              class="me-3 rounded-lg pulse-on-select"
            >
              <VIcon
                :icon="service.icon && service.icon !== 'null' ? service.icon : 'tabler-paw'"
                size="22"
              />
            </VAvatar>
          </template>

          <VListItemTitle class="font-weight-bold text-body-2 mb-1">
            {{ service.display_name }}
          </VListItemTitle>
          <VListItemSubtitle>
            <VChip 
              size="x-small" 
              :color="service.is_active ? 'success' : 'secondary'" 
              variant="tonal"
              class="px-2"
            >
              {{ service.is_active ? 'Active' : 'Inactive' }}
            </VChip>
          </VListItemSubtitle>

          <template #append>
            <div class="item-actions d-flex gap-2">
              <IconBtn
                size="small"
                variant="tonal"
                color="primary"
                rounded="lg"
                @click.stop="openEditDrawer(service)"
              >
                <VIcon
                  icon="tabler-settings"
                  size="16"
                />
              </IconBtn>

              <IconBtn
                size="small"
                variant="tonal"
                color="error"
                rounded="lg"
                @click.stop="confirmDelete(service)"
              >
                <VIcon
                  icon="tabler-trash"
                  size="16"
                />
              </IconBtn>
            </div>
          </template>
        </VListItem>
      </VList>
    </div>

    <!-- Confirm Delete Dialog -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="400"
    >
      <VCard class="pa-4 rounded-xl shadow-lg border-primary">
        <VCardItem class="text-center pb-0">
          <VAvatar
            color="error"
            variant="tonal"
            size="70"
            class="mb-4"
          >
            <VIcon
              icon="tabler-alert-triangle"
              size="40"
            />
          </VAvatar>
          <VCardTitle class="text-h5 font-weight-bold mb-1">
            Delete Service?
          </VCardTitle>
          <VCardSubtitle class="text-wrap px-4">
            Are you sure you want to delete <strong class="text-primary">{{ serviceToDelete?.display_name }}</strong>? This will also remove all associated categories and facilities.
          </VCardSubtitle>
        </VCardItem>

        <VCardText class="d-flex justify-center gap-4 pt-6">
          <VBtn
            variant="tonal"
            color="secondary"
            rounded="lg"
            class="px-8"
            @click="isDeleteDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            rounded="lg"
            class="px-8"
            :loading="deleting"
            @click="deleteService"
          >
            Yes, Delete
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.service-list-container {
  background: transparent;
}

.service-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  opacity: 0;
  animation: slideInLeft 0.5s ease forwards;

  &:hover {
    background: rgba(var(--v-theme-primary), 0.05) !important;
    transform: translateX(4px);
    
    .item-actions {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &.v-list-item--active {
    background: rgba(var(--v-theme-primary), 0.1) !important;
    border-color: rgba(var(--v-theme-primary), 0.2);
    box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.08);

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 4px;
      background: rgb(var(--v-theme-primary));
      border-radius: 0 4px 4px 0;
    }
  }
}

.item-actions {
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
  }
  &:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
  }
}
</style>
