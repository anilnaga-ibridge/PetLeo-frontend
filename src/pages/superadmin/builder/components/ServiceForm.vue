<script setup>
import { ref, watch } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps({
  service: Object,
  isEdit: Boolean,
})

const emit = defineEmits(['close', 'success'])

/* =======================
   FORM STATE
======================= */
const form = ref({
  name: '',
  display_name: '',
  description: '',
  icon: 'tabler-paw',
  is_active: true,
})

/* =======================
   ICON OPTIONS
======================= */
// Static Icon List
const iconList = [
  { title: 'Pet Care', value: 'tabler-heart-handshake' },
  { title: 'Pet Grooming', value: 'tabler-scissors' },
  { title: 'Pet Health', value: 'tabler-stethoscope' },
  { title: 'Veterinary', value: 'tabler-first-aid-kit' },
  { title: 'Pet Training', value: 'tabler-school' },
  { title: 'Pet Behavior', value: 'tabler-brain' },
  { title: 'Pet Adoption', value: 'tabler-home-heart' },
  { title: 'Pet Store', value: 'tabler-shopping-cart' },
  { title: 'Pet Transport', value: 'tabler-car' },
  { title: 'Pet Relocation', value: 'tabler-truck-delivery' },
  { title: 'Special Services', value: 'tabler-sparkles' },
  { title: 'Fish & Aquarium', value: 'tabler-fish' },
  { title: 'Exotic Pets', value: 'tabler-bug' },
  { title: 'General Pet', value: 'tabler-paw' },
  { title: 'Dog', value: 'tabler-dog' },
  { title: 'Cat', value: 'tabler-cat' },
  { title: 'Bone', value: 'tabler-bone' },
  { title: 'Vaccine', value: 'tabler-vaccine' },
  { title: 'Bath', value: 'tabler-bath' },
  { title: 'Walking', value: 'tabler-walk' },
  { title: 'Home', value: 'tabler-home' },
  { title: 'Location', value: 'tabler-map-pin' },
  { title: 'Schedule', value: 'tabler-calendar-time' },
]


/* =======================
   INIT FORM (EDIT / CREATE)
======================= */
watch(
  () => props.service,
  val => {
    if (val && props.isEdit) {
      form.value = {
        name: val.name,
        display_name: val.display_name,
        description: val.description,
        icon: val.icon || 'tabler-paw',
        is_active: val.is_active,
      }
    } else {
      form.value = {
        name: '',
        display_name: '',
        description: '',
        icon: 'tabler-paw',
        is_active: true,
      }
    }
  },
  { immediate: true },
)

/* =======================
   SUBMIT
======================= */
const submit = async () => {
  try {
    if (props.isEdit && props.service?.id) {
      await superAdminApi.put(
        `/api/superadmin/services/${props.service.id}/`,
        form.value,
      )
    } else {
      await superAdminApi.post('/api/superadmin/services/', form.value)
    }

    emit('success')
    emit('close')
  } catch (err) {
    console.error('Failed to save service:', err)
  }
}
</script>

<template>
  <div class="service-form-wrapper">
    <!--
      =======================
      FORM CONTENT
      ======================= 
    -->
    <VForm
      class="form-content"
      @submit.prevent="submit"
    >
      <div class="d-flex flex-column gap-6">
        <!-- Display Name -->
        <AppTextField
          v-model="form.display_name"
          label="Display Name"
          placeholder="e.g. Veterinary"
          required
          density="comfortable"
        />

        <!-- Slug -->
        <AppTextField
          v-model="form.name"
          label="Slug (Internal Name)"
          placeholder="e.g. veterinary"
          required
          :disabled="isEdit"
          density="comfortable"
        />

        <!-- ICON SELECT -->
        <VSelect
          v-model="form.icon"
          :items="iconList"
          item-title="title"
          item-value="value"
          label="Service Icon"
          placeholder="Select an icon"
          prepend-inner-icon="tabler-icons"
          density="comfortable"
          variant="outlined"
          :menu-props="{ zIndex: 10000 }"
        >
          <template #selection="{ item }">
            <div class="d-flex align-center">
              <VIcon
                :icon="item.raw.value"
                class="me-2"
                color="primary"
              />
              <span class="text-body-2">{{ item.raw.title }}</span>
            </div>
          </template>
          <template #item="{ props, item }">
            <VListItem
              v-bind="props"
              title=""
              class="px-4 py-2"
            >
              <template #prepend>
                <VIcon
                  :icon="item.raw.value"
                  color="primary"
                />
              </template>
              <VListItemTitle class="ms-2">
                {{ item.raw.title }}
              </VListItemTitle>
            </VListItem>
          </template>
        </VSelect>

        <!-- Description -->
        <AppTextarea
          v-model="form.description"
          label="Description"
          placeholder="Briefly describe the service..."
          rows="3"
        />
      </div>
    </VForm>

    <!-- FIXED FOOTER ACTIONS -->
    <div class="form-footer mt-auto pt-6">
      <VBtn
        variant="tonal"
        color="secondary"
        rounded="lg"
        @click="emit('close')"
      >
        Cancel
      </VBtn>

      <VBtn
        color="primary"
        rounded="lg"
        class="premium-btn"
        @click="submit"
      >
        {{ props.isEdit ? 'Update Service' : 'Create Service' }}
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.service-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form-content {
  flex: 1;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: white;
}
</style>
