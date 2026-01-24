<script setup>
import { ref, watch, computed } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const props = defineProps({
  modelValue: Boolean,
  visit: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const store = useVeterinaryStore()
const submitting = ref(false)

const visitData = ref({
  pet_id: null,
  visit_type: 'OFFLINE',
  reason: '',
  date: new Date().toISOString().substr(0, 10),
})

const visitTypes = [
  { title: 'Offline', value: 'OFFLINE' },
  { title: 'Online', value: 'ONLINE' },
]

const pets = computed(() => store.pets)

watch(() => props.visit, newVisit => {
  if (newVisit) {
    visitData.value = {
      pet_id: newVisit.pet?.id || newVisit.pet_id,
      visit_type: newVisit.visit_type,
      reason: newVisit.reason || '',
      date: newVisit.created_at ? new Date(newVisit.created_at).toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
    }
  } else {
    visitData.value = {
      pet_id: null,
      visit_type: 'OFFLINE',
      reason: '',
      date: new Date().toISOString().substr(0, 10),
    }
  }
}, { immediate: true })

const handleSave = async () => {
  if (!visitData.value.pet_id) return
    
  submitting.value = true
  try {
    if (props.visit?.id) {
      await store.updateVisit(props.visit.id, visitData.value)
    } else {
      await store.createVisit({
        ...visitData.value,
        clinic: store.activeClinicId,
      })
    }
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    console.error("Failed to save visit:", e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard>
      <VCardTitle class="pa-6 pb-2">
        <h3 class="text-h3 font-weight-bold">
          {{ visit ? 'Edit Visit' : 'New Check-in' }}
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          Update patient visit details
        </p>
      </VCardTitle>
      <VCardText class="pa-6 pt-2">
        <VForm @submit.prevent="handleSave">
          <VRow>
            <VCol cols="12">
              <AppSelect
                v-model="visitData.pet_id"
                :items="pets"
                item-title="name"
                item-value="id"
                label="Select Pet"
                placeholder="Choose a registered pet"
                prepend-inner-icon="tabler-paw"
                clearable
                :disabled="!!visit"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="visitData.visit_type"
                :items="visitTypes"
                item-title="title"
                item-value="value"
                label="Visit Type"
                prepend-inner-icon="tabler-stethoscope"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="visitData.date"
                type="date"
                label="Date"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="visitData.reason"
                label="Reason for Visit"
                placeholder="Short description"
                prepend-inner-icon="tabler-notes"
              />
            </VCol>
          </VRow>

          <div class="d-flex justify-end gap-3 mt-8">
            <VBtn
              variant="tonal"
              color="secondary"
              @click="emit('update:modelValue', false)"
            >
              Cancel
            </VBtn>
            <VBtn
              type="submit"
              color="primary"
              :loading="submitting"
            >
              {{ visit ? 'Save Changes' : 'Create & Check-in' }}
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
