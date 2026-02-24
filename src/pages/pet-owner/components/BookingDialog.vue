<script setup>
import { ref, watch, computed } from 'vue'
import { customerApi, providerApi } from '@/plugins/axios'
import { useCartStore } from '@/stores/cartStore'
import { useVeterinaryStore } from '@/stores/veterinaryStore'
import { veterinaryApi } from '@/api/veterinary'

const props = defineProps({
  modelValue: Boolean,
  provider: {
    type: Object,
    required: true
  },
  service: {
    type: Object,
    required: true
  },
  facility: {
    type: Object,
    required: true
  },
  employee_id: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const cartStore = useCartStore()
const vetStore = useVeterinaryStore()
const loading = ref(false)
const pets = ref([])
const petsLoading = ref(false)

const getServiceType = (svc) => {
  const key = (svc?.service_key || svc?.service_name || '').toLowerCase()
  if (key.includes('vet') || key.includes('doctor') || key.includes('clinic')) return 'VETERINARY'
  if (key.includes('day') || key.includes('board')) return 'PACKAGE'
  return 'SLOT_BASED'
}

const serviceType = computed(() => getServiceType(props.service))
const isVeterinary = computed(() => serviceType.value === 'VETERINARY')
const isPackage = computed(() => serviceType.value === 'PACKAGE')

const steps = computed(() => {
  const s = ['Select Pet', 'Choose Date']
  if (!isPackage.value) s.push('Pick Time')
  s.push('Confirm')
  return s
})

const currentStep = computed(() => {
  if (!form.value.pet_id) return 1
  if (!form.value.selected_date) return 2
  if (!isPackage.value && !form.value.selected_time) return 3
  return isPackage.value ? 3 : 4
})

const doctors = ref([])
const doctorsLoading = ref(false)
const selectedDoctor = ref(props.employee_id)

// ── Consultation Types (Vet only) ──────────────────────────────────────────
const consultationTypes = ref([])
const consultationTypesLoading = ref(false)
const selectedConsultationType = ref(null)

const form = ref({
  pet_id: '',
  selected_date: '',
  selected_time: '',
  notes: '',
  selected_addons: []
})

const availableSlots = ref([])
const slotsLoading = ref(false)

const fetchDoctors = async () => {
  if (!isVeterinary.value) return
  doctorsLoading.value = true
  try {
    const res = await veterinaryApi.get('/api/veterinary/assignments/', {
      params: { clinic: props.provider.id, role: 'DOCTOR' }
    })
    doctors.value = res.data.results || res.data
  } catch (err) {
    console.error('Failed to fetch doctors:', err)
  } finally {
    doctorsLoading.value = false
  }
}

const fetchConsultationTypes = async () => {
  if (!isVeterinary.value) return
  consultationTypesLoading.value = true
  try {
    const res = await providerApi.get('/api/provider/consultation-types/', {
      params: { provider_id: props.provider.id }
    })
    consultationTypes.value = res.data.results || res.data || []
  } catch (err) {
    console.error('Failed to fetch consultation types:', err)
    consultationTypes.value = []
  } finally {
    consultationTypesLoading.value = false
  }
}

const fetchSlots = async () => {
  if (!form.value.selected_date) return
  
  // For packages, we don't need hourly slots
  if (isPackage.value) {
    availableSlots.value = []
    return
  }

  // Enforce consultation type for vet before fetching slots
  if (isVeterinary.value && consultationTypes.value.length > 0 && !selectedConsultationType.value) {
    availableSlots.value = []
    return
  }

  slotsLoading.value = true
  try {
    if (isVeterinary.value) {
      const slots = await vetStore.fetchDoctorAvailability(props.provider.id, {
        service_id: props.service.service_id,
        date: form.value.selected_date,
        doctor_auth_id: selectedDoctor.value,
        consultation_type_id: selectedConsultationType.value
      })
      availableSlots.value = slots
    } else {
      const facilityParam = props.facility?.facility_id && props.facility.facility_id !== 'doctor-consultation' ? `&facility_id=${props.facility.facility_id}` : ''
      const employeeParam = props.employee_id || selectedDoctor.value ? `&employee_id=${props.employee_id || selectedDoctor.value}` : ''
      const res = await providerApi.get(`/api/provider/availability/${props.provider.id}/available-slots/?date=${form.value.selected_date}${facilityParam}${employeeParam}`)
      availableSlots.value = res.data.slots
    }
    
    if (availableSlots.value.length > 0 && !availableSlots.value.includes(form.value.selected_time)) {
      form.value.selected_time = availableSlots.value[0]
    }
  } catch (err) {
    console.error('Failed to fetch slots:', err)
  } finally {
    slotsLoading.value = false
  }
}

const groupedSlots = computed(() => {
  const groups = { Morning: [], Afternoon: [], Evening: [] }
  availableSlots.value.forEach(slot => {
    const hour = parseInt(slot.split(':')[0])
    if (hour < 12) groups.Morning.push(slot)
    else if (hour < 17) groups.Afternoon.push(slot)
    else groups.Evening.push(slot)
  })
  return groups
})

const fetchPets = async () => {
  petsLoading.value = true
  try {
    const res = await customerApi.get('/api/pet-owner/pets/pets/')
    if (Array.isArray(res.data)) {
        pets.value = res.data
    } else if (res.data.results && Array.isArray(res.data.results)) {
        pets.value = res.data.results
    } else {
        pets.value = []
    }
    
    if (pets.value.length > 0) {
      form.value.pet_id = pets.value[0].id
    }
  } catch (err) {
    console.error('Failed to fetch pets:', err)
  } finally {
    petsLoading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    fetchPets()
    selectedDoctor.value = props.employee_id
    if (isVeterinary.value) {
      fetchDoctors()
      fetchConsultationTypes()
    }
    const today = new Date().toISOString().split('T')[0]
    form.value.selected_date = today
    form.value.selected_addons = []
    selectedConsultationType.value = null
    fetchSlots()
  }
}, { immediate: true })

watch(() => form.value.selected_date, fetchSlots)
watch(() => selectedDoctor.value, fetchSlots)
watch(() => selectedConsultationType.value, fetchSlots)

const handleAddToCart = async () => {
  if (!form.value.pet_id || !form.value.selected_date || (!isPackage.value && !form.value.selected_time)) {
      return
  }

  // Validate consultation type for vet bookings
  if (isVeterinary.value && consultationTypes.value.length > 0 && !selectedConsultationType.value) {
    alert('Please select a consultation type for this veterinary appointment.')
    return
  }

  loading.value = true
  try {
    const selectedAddonObjects = props.facility.addons
        ? props.facility.addons
            .filter(addon => form.value.selected_addons.includes(addon.id))
            .map(addon => ({
                id: addon.id,
                name: addon.name,
                price: addon.price
            }))
        : []

    // For veterinary bookings, the consultation fee replaces the base facility price
    const consultType = consultationTypes.value.find(t => t.id === selectedConsultationType.value)
    const doctorObj = doctors.value.find(d => d.staff_auth_id === selectedDoctor.value)
    
    let basePrice = parseFloat(props.facility.price || 0)

    if (isVeterinary.value) {
      if (doctorObj && doctorObj.consultation_fee > 0) {
        basePrice = parseFloat(doctorObj.consultation_fee)
      } else if (consultType) {
        basePrice = parseFloat(consultType.consultation_fee || 0)
      }
    }
      
    const addonsPrice = selectedAddonObjects.reduce((sum, addon) => sum + parseFloat(addon.price || 0), 0)
    const totalPrice = basePrice + addonsPrice

    // consultType is already declared on line 231

    const payload = {
      provider_id: props.provider.id,
      pet: form.value.pet_id,
      service_id: props.service.service_id,
      facility_id: props.facility.facility_id,
      selected_time: isPackage.value ? `${form.value.selected_date}T00:00:00Z` : `${form.value.selected_date}T${form.value.selected_time}:00Z`,
      selected_addons: selectedAddonObjects,
      extra_notes: form.value.notes,
      price_snapshot: totalPrice.toFixed(2),
      employee_id: selectedDoctor.value || props.employee_id,
      is_medical: isVeterinary.value,
      // Store consultation type in service snapshot for vet sync
      consultation_type: consultType?.name || '',
      consultation_type_id: selectedConsultationType.value || null,
    }
    
    await cartStore.addItem(payload)

    // ✅ Re-fetch slots immediately to reflect booked slot + 30-min buffer removal
    form.value.selected_time = ''
    await fetchSlots()

    emit('success')
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Adding to cart failed:', err)
    alert(err.response?.data?.error || 'Failed to add to cart. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard class="rounded-xl overflow-hidden glass-card">
      <div class="pa-8 pb-4">
        <!-- Progress Wizard -->
        <div class="booking-wizard mb-6">
          <div v-for="(step, idx) in steps" :key="step" class="wizard-step" :class="{ 'active': currentStep >= idx + 1 }">
            <div class="step-num">{{ idx + 1 }}</div>
            <span class="step-label text-tiny font-weight-black text-uppercase tracking-widest">{{ step }}</span>
            <div v-if="idx < steps.length - 1" class="step-line" />
          </div>
        </div>

        <div class="d-flex align-center justify-space-between mb-2">
          <h2 class="text-h4 font-weight-black text-slate-900">
            {{ isVeterinary ? 'Schedule Appointment' : (isPackage ? 'Book Package' : 'Reserve Time Slot') }}
          </h2>
          <VBtn icon="tabler-x" variant="text" @click="emit('update:modelValue', false)" />
        </div>
        <p class="text-subtitle-1 text-slate-500 font-weight-medium">
          {{ facility.name || facility.facility_name }} with 
          <span v-if="selectedDoctor" class="text-indigo-600 font-weight-black">
            {{ doctors.find(d => d.staff_auth_id === selectedDoctor)?.staff_name || provider.full_name }}
            <span v-if="doctors.find(d => d.staff_auth_id === selectedDoctor)?.specialization" class="text-caption text-slate-400 font-weight-medium">
              ({{ doctors.find(d => d.staff_auth_id === selectedDoctor).specialization }})
            </span>
          </span>
          <span v-else>{{ provider.full_name }}</span>
        </p>
      </div>

      <VCardText class="pa-8 pt-0">
        <VRow>
          <VCol cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Select Family Member</label>
            <VSelect
              v-model="form.pet_id"
              :items="pets"
              item-title="name"
              item-value="id"
              placeholder="Who is this for?"
              variant="outlined"
              class="luxury-input"
              :loading="petsLoading"
            />
          </VCol>

          <VCol v-if="isVeterinary && !employee_id" cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Select Specialist (Optional)</label>
            <VSelect
              v-model="selectedDoctor"
              :items="doctors"
              item-title="staff_name"
              item-value="staff_auth_id"
              placeholder="Auto-assign best doctor"
              variant="outlined"
              class="luxury-input"
              clearable
              :loading="doctorsLoading"
            >
              <template #item="{ item, props: itemProps }">
                <VListItem v-bind="itemProps">
                  <template #subtitle>
                    <span v-if="item.raw.specialization" class="text-caption text-indigo-600 font-weight-bold">
                      {{ item.raw.specialization }}
                    </span>
                    <span v-else class="text-caption text-slate-400">General Practitioner</span>
                    <span v-if="item.raw.consultation_fee > 0" class="text-caption text-slate-400"> · ₹{{ item.raw.consultation_fee }} fee</span>
                  </template>
                </VListItem>
              </template>
            </VSelect>
          </VCol>

          <!-- Consultation Type — shown for vet bookings that have types configured -->
          <VCol v-if="isVeterinary && consultationTypes.length > 0" cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">
              Consultation Type <span class="text-error">*</span>
            </label>
            <VSelect
              v-model="selectedConsultationType"
              :items="consultationTypes"
              item-title="name"
              item-value="id"
              placeholder="Select reason for visit"
              variant="outlined"
              class="luxury-input"
              :loading="consultationTypesLoading"
            >
              <template #item="{ item, props: itemProps }">
                <VListItem v-bind="itemProps">
                  <template #subtitle>
                    <span class="text-caption text-slate-400">
                      {{ item.raw.description }}
                      <span v-if="item.raw.duration_minutes && item.raw.duration_minutes !== 'null'"> · {{ item.raw.duration_minutes }} min</span>
                    </span>
                  </template>
                  <template #append>
                    <span class="text-primary font-weight-black">₹{{ item.raw.consultation_fee }}</span>
                  </template>
                </VListItem>
              </template>
            </VSelect>
          </VCol>

          <VCol cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Select Date</label>
            <VTextField
              v-model="form.selected_date"
              type="date"
              variant="outlined"
              class="luxury-input"
              @change="fetchSlots"
            />
          </VCol>

          <VCol v-if="!isPackage" cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-4 d-block">Available Time Slots</label>
            
            <div v-if="isVeterinary && consultationTypes.length > 0 && !selectedConsultationType" class="text-center py-8 px-4 bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-200">
              <VIcon icon="tabler-info-circle" color="indigo-300" size="32" class="mb-2" />
              <p class="text-caption text-indigo-700 font-weight-black mb-0">Select a Consultation Type first to see available slots.</p>
            </div>

            <div v-else-if="slotsLoading" class="d-flex justify-center py-4">
              <VProgressCircular indeterminate size="24" color="primary" />
            </div>
            <div v-else-if="availableSlots.length === 0" class="text-center py-8 px-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <VIcon icon="tabler-calendar-off" color="slate-300" size="40" class="mb-4" />
              <p class="text-body-2 text-slate-600 mb-1 font-weight-black">No slots available for this date</p>
              <p class="text-caption text-slate-400 mb-0 font-weight-medium">
                {{ new Date(form.selected_date).getDay() === 0 || new Date(form.selected_date).getDay() === 6 
                  ? 'Limited availability on weekends. ' 
                  : '' 
                }}Please select another date or contact the clinic.
              </p>
            </div>
            <div v-else class="slot-container">
              <VItemGroup v-model="form.selected_time" mandatory>
                <div v-for="(slots, period) in groupedSlots" :key="period" v-show="slots.length > 0" class="mb-4">
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center gap-2">
                    <VIcon 
                      :icon="period === 'Morning' ? 'tabler-sun' : period === 'Afternoon' ? 'tabler-sun-high' : 'tabler-moon'" 
                      size="14" 
                    />
                    {{ period }}
                  </div>
                  <div class="d-flex flex-wrap gap-2">
                    <VItem
                      v-for="slot in slots"
                      :key="slot"
                      :value="slot"
                      v-slot="{ isSelected, toggle }"
                    >
                      <div 
                        class="slot-chip px-4 py-2 rounded-lg font-weight-bold cursor-pointer transition-all text-center"
                        :class="isSelected ? 'bg-primary text-white elevation-4' : 'bg-surface border text-slate-700 hover:bg-slate-50'"
                        style="min-width: 80px; user-select: none;"
                        @click="toggle"
                      >
                         {{ slot }}
                      </div>
                    </VItem>
                  </div>
                </div>
              </VItemGroup>
            </div>
          </VCol>

          <!-- Add-ons Section -->
          <VCol v-if="facility.addons && facility.addons.length > 0" cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Optional Add-ons</label>
            <VList class="bg-slate-50 rounded-xl pa-2">
                <VListItem v-for="addon in facility.addons" :key="addon.id" class="px-2">
                    <template #prepend>
                        <VCheckbox v-model="form.selected_addons" :value="addon.id" hide-details />
                    </template>
                    <VListItemTitle class="font-weight-bold">{{ addon.name }}</VListItemTitle>
                    <template #append v-if="addon.price">
                        <span class="text-primary font-weight-black">+₹{{ addon.price }}</span>
                    </template>
                </VListItem>
            </VList>
          </VCol>

          <VCol cols="12">
            <label class="text-caption font-weight-black text-slate-400 uppercase mb-2 d-block">Special Notes</label>
            <VTextarea
              v-model="form.notes"
              placeholder="Any special instructions for the provider?"
              variant="outlined"
              rows="3"
              class="luxury-input"
            />
          </VCol>
        </VRow>
      </VCardText>

      <div class="pa-8 pt-0">
        <VBtn
          block
          color="primary"
          size="x-large"
          height="64"
          class="rounded-xl font-weight-black shadow-primary"
          :loading="loading"
          @click="handleAddToCart"
        >
          {{ isVeterinary ? 'Confirm & Schedule Appointment' : (isPackage ? 'Confirm & Book Package' : 'Confirm & Reserve Slot') }} • ₹{{ 
            (isVeterinary && consultationTypes.find(t => t.id === selectedConsultationType))
            ? parseFloat(consultationTypes.find(t => t.id === selectedConsultationType).consultation_fee || 0) + (facility.addons 
              ? facility.addons.filter(addon => form.selected_addons.includes(addon.id)).reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
              : 0)
            : parseFloat(facility.price || 0) + (facility.addons 
              ? facility.addons.filter(addon => form.selected_addons.includes(addon.id)).reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
              : 0)
          }}
        </VBtn>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
}

.luxury-input :deep(.v-field) {
  border-radius: 16px !important;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}

.luxury-input :deep(.v-field--focused) {
  border-color: var(--v-theme-primary) !important;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1) !important;
}

.shadow-primary {
  box-shadow: 0 20px 40px rgba(var(--v-theme-primary), 0.3) !important;
}

.slot-container {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 8px;
  scrollbar-width: thin;
}

.slot-container::-webkit-scrollbar {
  width: 4px;
}

.slot-container::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

/* Wizard */
.booking-wizard {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.3;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.wizard-step.active {
  opacity: 1;
}

.step-num {
  width: 20px;
  height: 20px;
  background: #6366f1;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
}

.step-label {
  font-size: 8px;
  white-space: nowrap;
}

.step-line {
  width: 20px;
  height: 1px;
  background: #e2e8f0;
}
</style>
