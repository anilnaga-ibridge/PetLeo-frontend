<script setup>
import { ref, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['state'])
const emit = defineEmits(['next', 'update:state'])

const services = ref([])
const loading = ref(false)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = ref({
  name: '',
  display_name: '',
  description: '',
  icon: 'tabler-paw',
  is_active: true,
})

const iconList = [
  { title: 'Veterinary', value: 'tabler-first-aid-kit' },
  { title: 'Grooming', value: 'tabler-scissors' },
  { title: 'Training', value: 'tabler-school' },
  { title: 'Boarding', value: 'tabler-home' },
  { title: 'Pharmacy', value: 'tabler-pill' },
  { title: 'Lab', value: 'tabler-microscope' },
  { title: 'General', value: 'tabler-paw' },
]

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
  isEdit.value = false
  form.value = {
    name: '',
    display_name: '',
    description: '',
    icon: 'tabler-paw',
    is_active: true,
  }
  drawerOpen.value = true
}

const openEditDrawer = service => {
  isEdit.value = true
  editId.value = service.id
  form.value = { ...service }
  drawerOpen.value = true
}

const submit = async () => {
  try {
    if (isEdit.value) {
      await superAdminApi.put(`/api/superadmin/services/${editId.value}/`, form.value)
    } else {
      await superAdminApi.post('/api/superadmin/services/', form.value)
    }
    drawerOpen.value = false
    fetchServices()
  } catch (err) {
    console.error('Failed to save service:', err)
  }
}

const toggleStatus = async service => {
  try {
    await superAdminApi.patch(`/api/superadmin/services/${service.id}/`, {
      is_active: service.is_active,
    })
  } catch (err) {
    console.error('Failed to toggle status:', err)
    service.is_active = !service.is_active
  }
}

const selectService = serviceId => {
  emit('update:state', { ...props.state, selectedServiceId: serviceId })
  emit('next')
}

onMounted(fetchServices)
</script>

<template>
  <div>
    <VRow v-if="loading">
      <VCol
        v-for="i in 3"
        :key="i"
        cols="12"
        sm="6"
        md="4"
      >
        <VSkeletonLoader type="card" />
      </VCol>
    </VRow>

    <VRow v-else-if="services.length > 0">
      <VCol
        v-for="service in services"
        :key="service.id"
        cols="12"
        sm="6"
        md="4"
      >
        <VCard
          class="service-card"
          :class="[{ 'selected': props.state.selectedServiceId === service.id }]"
          @click="selectService(service.id)"
        >
          <VCardText class="d-flex flex-column align-center text-center pa-6">
            <VAvatar
              size="56"
              color="primary"
              variant="tonal"
              class="mb-4"
            >
              <VIcon
                :icon="service.icon || 'tabler-paw'"
                size="32"
              />
            </VAvatar>
            
            <h3 class="text-h6 font-weight-bold mb-1">
              {{ service.display_name }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4 line-clamp-2">
              {{ service.description || 'No description provided.' }}
            </p>

            <div
              class="d-flex align-center gap-2 mt-auto"
              @click.stop
            >
              <VSwitch
                v-model="service.is_active"
                density="compact"
                hide-details
                color="success"
                @update:model-value="toggleStatus(service)"
              />
              <VBtn
                icon="tabler-edit"
                variant="text"
                size="small"
                color="medium-emphasis"
                @click="openEditDrawer(service)"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard
      v-else
      class="builder-empty-state"
      variant="outlined"
    >
      <VCardText>
        <VIcon
          icon="tabler-paw"
          size="48"
          color="medium-emphasis"
          class="mb-4"
        />
        <h3 class="text-h6 font-weight-bold mb-2">
          No Services Found
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Create your first service to get started.
        </p>
        <VBtn
          variant="tonal"
          color="primary"
          @click="openAddDrawer"
        >
          Add First Service
        </VBtn>
      </VCardText>
    </VCard>

    <div class="d-flex justify-end mt-8">
      <VBtn
        color="primary"
        append-icon="tabler-arrow-right"
        :disabled="!props.state.selectedServiceId"
        @click="emit('next')"
      >
        Next Step
      </VBtn>
    </div>
    <VNavigationDrawer
      v-model="drawerOpen"
      location="end"
      temporary
      width="600"
      attach="body"
    >
      <div class="d-flex flex-column h-100">
        <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header">
          <h3 class="text-h6 font-weight-bold">
            {{ isEdit ? 'Edit Service' : 'Add Service' }}
          </h3>
          <VBtn
            icon="tabler-x"
            variant="text"
            @click="drawerOpen = false"
          />
        </div>

        <div class="flex-grow-1 overflow-y-auto pa-6">
          <VForm @submit.prevent="submit">
            <AppTextField
              v-model="form.display_name"
              label="Display Name"
              placeholder="e.g. Veterinary"
              class="mb-4"
              required
            />
            <AppTextField
              v-model="form.name"
              label="Slug (Internal Name)"
              placeholder="e.g. veterinary"
              class="mb-4"
              required
              :disabled="isEdit"
            />
            <VSelect
              v-model="form.icon"
              :items="iconList"
              label="Icon"
              item-title="title"
              item-value="value"
              class="mb-4"
            >
              <template #selection="{ item }">
                <div class="d-flex align-center">
                  <VIcon
                    :icon="item.raw.value"
                    class="me-2"
                  />
                  {{ item.raw.title }}
                </div>
              </template>
              <template #item="{ props, item }">
                <VListItem
                  v-bind="props"
                  :prepend-icon="item.raw.value"
                />
              </template>
            </VSelect>
            <AppTextarea
              v-model="form.description"
              label="Description"
              placeholder="Briefly describe the service..."
              class="mb-6"
            />

            <div class="d-flex gap-4">
              <VBtn
                color="primary"
                block
                type="submit"
              >
                {{ isEdit ? 'Update Service' : 'Create Service' }}
              </VBtn>
            </div>
          </VForm>
        </div>
      </div>
    </VNavigationDrawer>
  </div>
</template>

<style lang="scss" scoped>
.service-card {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }

  &.selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.builder-empty-state {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
