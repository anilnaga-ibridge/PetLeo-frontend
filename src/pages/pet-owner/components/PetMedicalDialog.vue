<script setup>
import { ref, watch, computed } from 'vue'
import { customerApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  pet: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'close'])

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('general')

const form = ref({
  weight_kg: '',
  height_cm: '',
  blood_group: '',
  microchip_id: '',
  medical_profile: {
    allergies: '',
    medical_conditions: '',
    vet_name: '',
    insurance_provider: '',
    insurance_policy_number: '',
    neutered: false,
    special_notes: ''
  }
})

const medications = ref([])
const vaccinations = ref([])
const documents = ref([])

const medicationForm = ref({
  name: '',
  dosage: '',
  frequency: '',
  reason: '',
  start_date: new Date().toISOString().substr(0, 10),
  is_active: true
})

const vaccinationForm = ref({
  vaccine_name: '',
  date_administered: new Date().toISOString().substr(0, 10),
  next_due_date: '',
  notes: ''
})

const showMedicationAdd = ref(false)
const showVaccinationAdd = ref(false)

const fetchData = async () => {
  if (!props.pet?.id) return
  loading.value = true
  try {
    const [petRes, medRes, vacRes, docRes] = await Promise.all([
      customerApi.get(`/api/pet-owner/pets/pets/${props.pet.id}/`),
      customerApi.get(`/api/pet-owner/pets/medications/?pet=${props.pet.id}`),
      customerApi.get(`/api/pet-owner/pets/vaccinations/?pet=${props.pet.id}`),
      customerApi.get(`/api/pet-owner/pets/documents/?pet=${props.pet.id}`)
    ])
    
    const petData = petRes.data
    form.value = {
      weight_kg: petData.weight_kg || '',
      height_cm: petData.height_cm || '',
      blood_group: petData.blood_group || '',
      microchip_id: petData.microchip_id || '',
      medical_profile: {
        ...(petData.medical_profile || {}),
        allergies: petData.medical_profile?.allergies || '',
        medical_conditions: petData.medical_profile?.medical_conditions || '',
        vet_name: petData.medical_profile?.vet_name || '',
        insurance_provider: petData.medical_profile?.insurance_provider || '',
        insurance_policy_number: petData.medical_profile?.insurance_policy_number || '',
        neutered: !!petData.medical_profile?.neutered,
        special_notes: petData.medical_profile?.special_notes || ''
      }
    }
    
    medications.value = medRes.data
    vaccinations.value = vacRes.data
    documents.value = docRes.data
    
  } catch (err) {
    console.error('Failed to fetch health data:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val && props.pet) {
    fetchData()
  } else {
    activeTab.value = 'general'
  }
})

const handleSaveGeneral = async () => {
  submitting.value = true
  try {
    await customerApi.put(`/api/pet-owner/pets/pets/${props.pet.id}/`, form.value)
    emit('saved')
  } catch (err) {
    console.error('Failed to save general health:', err)
  } finally {
    submitting.value = false
  }
}

const handleAddMedication = async () => {
  submitting.value = true
  try {
    await customerApi.post('/api/pet-owner/pets/medications/', {
      ...medicationForm.value,
      pet: props.pet.id
    })
    showMedicationAdd.value = false
    medicationForm.value = {
      name: '', dosage: '', frequency: '', reason: '', 
      start_date: new Date().toISOString().substr(0, 10), is_active: true
    }
    fetchData()
  } catch (err) {
    console.error('Failed to add medication:', err)
  } finally {
    submitting.value = false
  }
}

const handleAddVaccination = async () => {
  submitting.value = true
  try {
    await customerApi.post('/api/pet-owner/pets/vaccinations/', {
      ...vaccinationForm.value,
      pet: props.pet.id
    })
    showVaccinationAdd.value = false
    vaccinationForm.value = {
      vaccine_name: '', date_administered: new Date().toISOString().substr(0, 10), 
      next_due_date: '', notes: ''
    }
    fetchData()
  } catch (err) {
    console.error('Failed to add vaccination:', err)
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="850"
    max-height="90vh"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
    class="premium-medical-dialog"
  >
    <VCard class="rounded-[40px] overflow-hidden elevation-24 border-0">
      <!-- HEADER -->
      <div class="pa-10 pb-0 luxury-medical-header">
        <div class="d-flex align-center justify-space-between mb-8">
          <div class="d-flex align-center">
            <div class="luxury-icon-box shadow-primary me-6">
              <VIcon icon="tabler-heart-rate-monitor" color="primary" size="32" />
            </div>
            <div>
              <h2 class="text-h3 font-weight-black text-slate-900 tracking-tighter">{{ pet?.name }}'s Wellness</h2>
              <p class="text-h6 text-slate-500 mb-0 opacity-70">Curating health, happiness, and longevity.</p>
            </div>
          </div>
          <VBtn icon="tabler-x" variant="tonal" color="slate-400" @click="handleClose" class="rounded-xl" />
        </div>

        <VTabs
          v-model="activeTab"
          color="primary"
          align-tabs="start"
          class="luxury-tabs mb-2"
        >
          <VTab value="general" class="text-none">Physical Stats</VTab>
          <VTab value="medications" class="text-none">Medications</VTab>
          <VTab value="vaccinations" class="text-none">Vaccinations</VTab>
          <VTab value="diagnostics" class="text-none">Diagnostics</VTab>
          <VTab value="insurance" class="text-none">Care & Protection</VTab>
        </VTabs>
      </div>

      <VCardText class="pa-10 pt-8 luxury-scrollable-content">
        <VWindow v-model="activeTab">
          <!-- GENERAL HEALTH TAB -->
          <VWindowItem value="general">
            <VRow>
              <VCol cols="12" md="4">
                <div class="stat-card luxury-glass pa-6">
                  <div class="label-tiny">WEIGHT (KG)</div>
                  <VTextField v-model="form.weight_kg" variant="plain" type="number" class="huge-input" hide-details />
                </div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="stat-card luxury-glass pa-6">
                  <div class="label-tiny">HEIGHT (CM)</div>
                  <VTextField v-model="form.height_cm" variant="plain" type="number" class="huge-input" hide-details />
                </div>
              </VCol>
              <VCol cols="12" md="4">
                <div class="stat-card luxury-glass pa-6">
                  <div class="label-tiny">BLOOD GROUP</div>
                  <VTextField v-model="form.blood_group" variant="plain" class="huge-input" hide-details placeholder="DEA 1.1" />
                </div>
              </VCol>
              
              <VCol cols="12">
                <VCard variant="flat" class="pa-8 rounded-[32px] bg-slate-50 border-0">
                  <div class="d-flex align-center mb-6">
                    <div class="dot-indicator me-3"></div>
                    <span class="text-h6 font-weight-black text-slate-800 tracking-tight">Health Directives & Notes</span>
                  </div>
                  <VRow>
                    <VCol cols="12" md="8">
                      <VTextarea
                        v-model="form.medical_profile.special_notes"
                        placeholder="Any specialized care instructions, dietary requirements, or behavioral notes..."
                        variant="outlined"
                        class="luxury-textarea bg-white"
                        rows="4"
                        hide-details
                      />
                    </VCol>
                    <VCol cols="12" md="4">
                      <div class="d-flex flex-column gap-6 h-100 justify-center pa-4 bg-white rounded-2xl border">
                        <div class="d-flex align-center justify-space-between">
                          <div>
                            <div class="text-subtitle-1 font-weight-bold text-slate-800">Neutered</div>
                            <div class="text-caption text-slate-400">Reproductive status</div>
                          </div>
                          <VSwitch v-model="form.medical_profile.neutered" color="primary" inset hide-details />
                        </div>
                        <VDivider class="opacity-10" />
                        <div>
                          <div class="label-tiny mb-2">MICROCHIP ID</div>
                          <VTextField v-model="form.microchip_id" variant="plain" class="text-h6 font-weight-black" hide-details placeholder="Not microchipped" />
                        </div>
                      </div>
                    </VCol>
                  </VRow>
                </VCard>
              </VCol>
            </VRow>
            <div class="mt-10 d-flex justify-end">
              <VBtn 
                color="primary" 
                size="x-large" 
                class="rounded-2xl px-12 shadow-primary-lg" 
                :loading="submitting"
                @click="handleSaveGeneral"
              >
                Save Changes
              </VBtn>
            </div>
          </VWindowItem>

          <!-- MEDICATIONS TAB -->
          <VWindowItem value="medications">
            <div class="d-flex justify-space-between align-center mb-10">
              <h3 class="text-h4 font-weight-black text-slate-900 tracking-tighter">Current Prescriptions</h3>
              <VBtn 
                prepend-icon="tabler-plus" 
                color="primary" 
                variant="tonal" 
                class="rounded-xl font-weight-bold"
                @click="showMedicationAdd = true"
              >
                Add Medication
              </VBtn>
            </div>

            <VRow v-if="medications.length">
              <VCol v-for="med in medications" :key="med.id" cols="12">
                <VCard variant="flat" class="pa-6 rounded-[28px] border bg-white hover-shadow transition-all">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <div class="medicine-icon me-5">
                        <VIcon icon="tabler-pill" color="primary" />
                      </div>
                      <div>
                        <h4 class="text-h5 font-weight-black text-slate-900">{{ med.name }}</h4>
                        <p class="text-subtitle-2 text-slate-500 mb-0 font-weight-bold opacity-70">
                          {{ med.dosage }} • {{ med.frequency }}
                        </p>
                      </div>
                    </div>
                    <div class="text-right">
                      <VChip v-if="med.is_active" color="success" size="small" variant="flat" class="font-weight-black">ACTIVE</VChip>
                      <VChip v-else color="slate-200" size="small" variant="flat" class="font-weight-black">COMPLETED</VChip>
                    </div>
                  </div>
                </VCard>
              </VCol>
            </VRow>
            <div v-else class="text-center py-16 px-10 rounded-[32px] bg-slate-50 border-2 border-dashed">
              <VIcon icon="tabler-pill-off" size="64" color="slate-200" class="mb-4" />
              <p class="text-h6 text-slate-400 font-weight-bold">No active medications recorded.</p>
            </div>

            <!-- ADD MEDICATION FORM -->
            <VExpandTransition>
              <VCard v-if="showMedicationAdd" class="mt-8 pa-8 rounded-[32px] border-2 border-primary elevation-12">
                <h4 class="text-h5 font-weight-black mb-6">Register New Medication</h4>
                <VRow>
                  <VCol cols="12" md="6">
                    <VTextField v-model="medicationForm.name" label="Medication Name" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12" md="3">
                    <VTextField v-model="medicationForm.dosage" label="Dosage (e.g. 5mg)" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12" md="3">
                    <VTextField v-model="medicationForm.frequency" label="Frequency" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12">
                    <VTextField v-model="medicationForm.reason" label="Reason / Condition" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12">
                     <div class="d-flex align-center justify-space-between pa-4 bg-slate-50 rounded-2xl border">
                        <div>
                          <div class="text-subtitle-2 font-weight-black text-slate-800">Enable Reminders</div>
                          <div class="text-caption text-slate-400 font-weight-bold">Receive notifications for this medication</div>
                        </div>
                        <VSwitch v-model="medicationForm.reminder_enabled" color="primary" inset hide-details />
                      </div>
                  </VCol>
                </VRow>
                <div class="d-flex justify-end gap-4 mt-6">
                  <VBtn variant="text" color="slate-400" @click="showMedicationAdd = false" class="rounded-xl">Cancel</VBtn>
                  <VBtn color="primary" class="rounded-xl px-8 shadow-primary" @click="handleAddMedication" :loading="submitting">Add to Records</VBtn>
                </div>
              </VCard>
            </VExpandTransition>
          </VWindowItem>

          <!-- VACCINATIONS TAB -->
          <VWindowItem value="vaccinations">
            <div class="d-flex justify-space-between align-center mb-10">
              <h3 class="text-h4 font-weight-black text-slate-900 tracking-tighter">Vaccination History</h3>
              <VBtn 
                prepend-icon="tabler-vaccine" 
                color="secondary" 
                variant="tonal" 
                class="rounded-xl font-weight-bold"
                @click="showVaccinationAdd = true"
              >
                Log Booster
              </VBtn>
            </div>

            <VRow v-if="vaccinations.length">
              <VCol v-for="vac in vaccinations" :key="vac.id" cols="12">
                <VCard variant="flat" class="pa-8 rounded-[28px] border-l-[6px] border-secondary bg-white shadow-sm overflow-hidden">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <h4 class="text-h5 font-weight-black text-slate-900 mb-1">{{ vac.vaccine_name }}</h4>
                      <p class="text-subtitle-1 text-slate-500 font-weight-bold opacity-70 mb-4">
                        Administered: {{ vac.date_administered }}
                      </p>
                      <div class="d-flex align-center bg-secondary-lighten-5 pa-2 px-4 rounded-xl border border-secondary-lighten-4">
                        <VIcon icon="tabler-clock" color="secondary" size="18" class="me-2" />
                        <span class="text-subtitle-2 font-weight-black text-secondary uppercase tracking-wider">Next Due: {{ vac.next_due_date }}</span>
                      </div>
                    </div>
                    <div class="text-right d-none d-md-block">
                      <div class="text-caption text-slate-400 font-weight-bold uppercase mb-1">Clinic / Dr.</div>
                      <div class="text-subtitle-1 font-weight-black text-slate-700">{{ vac.administered_by || 'Verified Hub' }}</div>
                    </div>
                  </div>
                </VCard>
              </VCol>
            </VRow>
            <div v-else class="text-center py-16 px-10 rounded-[32px] bg-slate-50 border-2 border-dashed">
              <VIcon icon="tabler-vaccine-off" size="64" color="slate-200" class="mb-4" />
              <p class="text-h6 text-slate-400 font-weight-bold">No vaccination history recorded yet.</p>
            </div>

            <!-- ADD VACCINATION FORM -->
            <VExpandTransition>
              <VCard v-if="showVaccinationAdd" class="mt-8 pa-8 rounded-[32px] border-2 border-secondary elevation-12">
                <h4 class="text-h5 font-weight-black mb-6">Log New Vaccination</h4>
                <VRow>
                  <VCol cols="12" md="6">
                    <VTextField v-model="vaccinationForm.vaccine_name" label="Vaccine Name" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12" md="3">
                    <VTextField v-model="vaccinationForm.date_administered" type="date" label="Administered Date" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12" md="3">
                    <VTextField v-model="vaccinationForm.next_due_date" type="date" label="Next Due Date" variant="outlined" class="luxury-input-field" />
                  </VCol>
                  <VCol cols="12">
                    <VTextField v-model="vaccinationForm.notes" label="Notes / Batch Number" variant="outlined" class="luxury-input-field" />
                  </VCol>
                </VRow>
                <div class="d-flex justify-end gap-4 mt-6">
                  <VBtn variant="text" color="slate-400" @click="showVaccinationAdd = false" class="rounded-xl">Cancel</VBtn>
                  <VBtn color="secondary" class="rounded-xl px-8 shadow-primary" @click="handleAddVaccination" :loading="submitting">Log Vaccination</VBtn>
                </div>
              </VCard>
            </VExpandTransition>
          </VWindowItem>

          <!-- DIAGNOSTICS TAB -->
          <VWindowItem value="diagnostics">
            <div class="d-flex justify-space-between align-center mb-10">
              <h3 class="text-h4 font-weight-black text-slate-900 tracking-tighter">Diagnostic Reports</h3>
              <VBtn 
                prepend-icon="tabler-file-upload" 
                color="info" 
                variant="tonal" 
                class="rounded-xl font-weight-bold"
              >
                Upload Lab Result
              </VBtn>
            </div>

            <VRow v-if="documents.length">
              <VCol v-for="doc in documents" :key="doc.id" cols="12" md="6">
                <VCard variant="flat" class="pa-6 rounded-[28px] border bg-white d-flex align-center justify-space-between h-100">
                  <div class="d-flex align-center">
                    <div class="doc-icon me-4 bg-info-lighten-5 rounded-2xl pa-3">
                      <VIcon icon="tabler-report-medical" color="info" />
                    </div>
                    <div>
                      <h4 class="text-subtitle-1 font-weight-black text-slate-900 text-truncate max-width-150">{{ doc.document_name }}</h4>
                      <p class="text-caption text-slate-400 mb-0 font-weight-bold">{{ doc.uploaded_at.split('T')[0] }}</p>
                    </div>
                  </div>
                  <VBtn icon="tabler-download" variant="text" color="slate-400" size="small" />
                </VCard>
              </VCol>
            </VRow>
            <div v-else class="text-center py-16 px-10 rounded-[32px] bg-slate-50 border-2 border-dashed">
              <VIcon icon="tabler-file-off" size="64" color="slate-200" class="mb-4" />
              <p class="text-h6 text-slate-400 font-weight-bold">No diagnostic reports uploaded.</p>
            </div>
          </VWindowItem>

          <!-- INSURANCE TAB -->
          <VWindowItem value="insurance">
            <VCard variant="flat" class="pa-10 rounded-[40px] border bg-white mb-8">
              <h4 class="text-h4 font-weight-black text-slate-900 mb-8 tracking-tighter d-flex align-center">
                <VIcon icon="tabler-shield-check" color="primary" class="me-4" />
                Coverage & Care
              </h4>
              <VRow>
                <VCol cols="12">
                  <VTextField
                    v-model="form.medical_profile.vet_name"
                    label="Primary Veterinarian / Clinic"
                    variant="outlined"
                    class="luxury-input-field mb-4"
                    prepend-inner-icon="tabler-stethoscope"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.medical_profile.insurance_provider"
                    label="Insurance Provider"
                    variant="outlined"
                    class="luxury-input-field"
                    prepend-inner-icon="tabler-shield"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="form.medical_profile.insurance_policy_number"
                    label="Policy Number"
                    variant="outlined"
                    class="luxury-input-field"
                  />
                </VCol>
              </VRow>
            </VCard>
          </VWindowItem>
        </VWindow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.premium-medical-dialog {
  backdrop-filter: blur(24px) saturate(180%);
}

.luxury-medical-header {
  background: linear-gradient(to bottom, rgba(var(--v-theme-primary), 0.05), transparent);
}

.luxury-icon-box {
  width: 72px;
  height: 72px;
  background: white;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.luxury-tabs {
  margin-left: -20px;
}

.luxury-tabs :deep(.v-tab) {
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.5px;
  padding: 0 24px;
  opacity: 0.5;
}

.luxury-tabs :deep(.v-tab--selected) {
  opacity: 1;
}

.luxury-scrollable-content {
  max-height: 65vh;
  overflow-y: auto !important;
}

.stat-card {
  border-radius: 28px;
  border: 1px solid rgba(0,0,0,0.05);
  background: white;
}

.luxury-glass {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(10px);
}

.label-tiny {
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin-bottom: 8px;
}

.huge-input :deep(input) {
  font-size: 2rem !important;
  font-weight: 900 !important;
  color: #1e293b !important;
  padding: 0 !important;
  letter-spacing: -1px;
}

.dot-indicator {
  width: 10px;
  height: 10px;
  background: var(--v-theme-primary);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--v-theme-primary);
}

.luxury-textarea :deep(.v-field__outline) {
  border-color: #e2e8f0 !important;
  border-radius: 20px !important;
}

.medicine-icon, .doc-icon {
  width: 54px;
  height: 54px;
  background: #f1f7ff;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-shadow:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important;
}

.luxury-input-field :deep(.v-field__outline) {
  border-radius: 16px !important;
  border-color: #e2e8f0 !important;
}

.shadow-primary-lg {
  box-shadow: 0 20px 40px rgba(var(--v-theme-primary), 0.3) !important;
}

.max-width-150 {
  max-width: 150px;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.v-window-item {
  animation: slideIn 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
}

/* Custom Scrollbar */
.luxury-scrollable-content::-webkit-scrollbar {
  width: 6px;
}
.luxury-scrollable-content::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
