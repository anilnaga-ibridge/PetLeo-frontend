<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { veterinaryApi } from '@/api/veterinary'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  clinicId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'success'])

const vetStore = useVeterinaryStore()
const loading = ref(false)
const pets = ref([])
const doctors = ref([])
const consultationTypes = ref([])

const selectedType = computed(() => {
  return consultationTypes.value.find(t => t.id === form.value.consultation_type_id)
})

const form = ref({
  pet_id: '',
  consultation_type_id: '',
  doctor_auth_id: '',
  appointment_date: new Date().toISOString().split('T')[0],
  start_time: '',
  notes: '',
})

const availableSlots = ref([])
const slotsLoading = ref(false)

const fetchInitialData = async () => {
  try {
    const [petsRes, docsRes, typesRes] = await Promise.all([
      vetStore.fetchPets(),
      veterinaryApi.get('/api/veterinary/assignments/', {
        params: { clinic: props.clinicId, role: 'DOCTOR' },
      }),
      providerApi.get('/api/provider/consultation-types/'),
    ])

    pets.value = petsRes
    doctors.value = docsRes.data.results || docsRes.data
    consultationTypes.value = typesRes.data.results || typesRes.data
    
    if (doctors.value.length > 0) {
      form.value.doctor_auth_id = doctors.value[0].staff_auth_id
    }
    
    if (consultationTypes.value.length > 0) {
      form.value.consultation_type_id = consultationTypes.value[0].id
    }
  } catch (err) {
    console.error('Failed to fetch initial data:', err)
  }
}

const fetchSlots = async () => {
  if (!form.value.appointment_date || !form.value.doctor_auth_id) return
  slotsLoading.value = true
  try {
    const slots = await vetStore.fetchDoctorAvailability(props.clinicId, {
      service_id: 'consultation', // Base service type
      consultation_type_id: form.value.consultation_type_id,
      date: form.value.appointment_date,
      doctor_auth_id: form.value.doctor_auth_id,
    })

    availableSlots.value = slots
    if (availableSlots.value.length > 0) {
      form.value.start_time = availableSlots.value[0]
    } else {
      form.value.start_time = ''
    }
  } catch (err) {
    console.error('Failed to fetch slots:', err)
  } finally {
    slotsLoading.value = false
  }
}

const submit = async () => {
  if (!form.value.pet_id || !form.value.start_time) {
    alert('Please select a pet and a time slot.')
    
    return
  }
  
  loading.value = true
  try {
    await vetStore.createMedicalAppointment({
      ...form.value,
      service_id: 'consultation',
      consultation_type: selectedType.value?.name || '',
      consultation_fee: selectedType.value?.consultation_fee || 0.00,
      clinic_id: props.clinicId,
      created_by: 'RECEPTIONIST',
    })
    emit('success', 'Appointment scheduled successfully!')
    emit('update:modelValue', false)
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to schedule appointment.')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, val => {
  if (val) {
    fetchInitialData()
    fetchSlots()
  }
})

watch(() => [form.value.appointment_date, form.value.doctor_auth_id, form.value.consultation_type_id], fetchSlots)
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard title="Schedule Medical Appointment">
      <VCardText>
        <VRow>
          <VCol cols="12">
            <AppSelect
              v-model="form.pet_id"
              :items="pets"
              item-title="name"
              item-value="id"
              label="Select Patient"
              prepend-inner-icon="tabler-paw"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="form.doctor_auth_id"
              :items="doctors"
              item-title="staff_name"
              item-value="staff_auth_id"
              label="Select Doctor"
              prepend-inner-icon="tabler-stethoscope"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="form.consultation_type_id"
              :items="consultationTypes"
              item-title="name"
              item-value="id"
              label="Consultation Type"
              prepend-inner-icon="tabler-category"
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props">
                  <template #append>
                    <span class="text-primary font-weight-bold">₹{{ item.raw.consultation_fee }}</span>
                  </template>
                </VListItem>
              </template>
            </AppSelect>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="form.appointment_date"
              type="date"
              label="Appointment Date"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <AppSelect
              v-model="form.start_time"
              :items="availableSlots"
              label="Available Slot"
              :loading="slotsLoading"
              placeholder="Select a time"
            />
          </VCol>

          <VCol cols="12">
            <VTextarea
              v-model="form.notes"
              label="Internal Notes"
              placeholder="Reason for visit or instructions..."
              rows="2"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          @click="emit('update:modelValue', false)"
        >
          Cancel
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="submit"
        >
          Schedule Appointment
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
