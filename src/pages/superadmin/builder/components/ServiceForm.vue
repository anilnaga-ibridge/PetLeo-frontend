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
    ];
/* =======================
   INIT FORM (EDIT / CREATE)
======================= */
watch(
  () => props.service,
  (val) => {
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
  { immediate: true }
)

/* =======================
   SUBMIT
======================= */
const submit = async () => {
  try {
    if (props.isEdit && props.service?.id) {
      await superAdminApi.put(
        `/api/superadmin/services/${props.service.id}/`,
        form.value
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
    <!-- =======================
         FORM CONTENT
    ======================= -->
    <VForm @submit.prevent="submit" class="form-content">
      <!-- Display Name -->
      <AppTextField
        v-model="form.display_name"
        label="Display Name"
        placeholder="e.g. Veterinary"
        class="mb-4"
        required
      />

      <!-- Slug -->
      <AppTextField
        v-model="form.name"
        label="Slug (Internal Name)"
        placeholder="e.g. veterinary"
        class="mb-4"
        required
        :disabled="isEdit"
      />

      <!-- ICON SELECT (FIXED – NO CUSTOM SLOTS) -->
      <VSelect
        v-model="form.icon"
        :items="iconList"
        item-title="title"
        item-value="value"
        label="Service Icon"
        placeholder="Select an icon"
        prepend-inner-icon="tabler-icons"
        :menu-props="{ zIndex: 10000 }"
      >
        <template #selection="{ item }">
          <div class="d-flex align-center">
            <VIcon :icon="item.raw.value" class="me-2" />
            {{ item.raw.title }}
          </div>
        </template>
        <template #item="{ props, item }">
          <VListItem v-bind="props" title="">
            <template #prepend>
              <VIcon :icon="item.raw.value" />
            </template>
            <VListItemTitle>{{ item.raw.title }}</VListItemTitle>
          </VListItem>
        </template>
      </VSelect>

      <!-- Description -->
      <AppTextarea
        v-model="form.description"
        label="Description"
        placeholder="Briefly describe the service..."
        class="mb-6"
      />
    </VForm>

    <!-- =======================
         FIXED FOOTER ACTIONS
    ======================= -->
    <div class="form-footer">
      <VBtn
        variant="outlined"
        color="secondary"
        @click="emit('close')"
      >
        Cancel
      </VBtn>

      <VBtn
        color="primary"
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
  overflow-y: auto;
  padding-bottom: 16px;
}

.form-footer {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
