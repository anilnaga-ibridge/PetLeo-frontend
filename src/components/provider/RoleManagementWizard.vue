<script setup>
import { ref, computed, watch } from 'vue'
import { getLabel } from '@/utils/permissionLabels'
import { providerApi } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  role: { type: Object, default: null }, // If editing
  availablePermissions: { type: Array, default: () => [] }, // Full tree from backend
})

const emit = defineEmits(['update:modelValue', 'save'])

// --- STATE ---
const roleTemplates = ref([])
const veterinaryFeatureDefinitions = ref([]) // Fetched from backend
const selectedTemplate = ref(null)

const form = ref({
  name: '',
  description: '',
  selectedServices: [], // IDs of services enabled for this role
  permissions: {}, // Granular data: { 'category:123': { can_view: true... } }
  // Veterinary Special State: Stores enabled feature IDs (e.g., ['registration', 'vitals'])
  veterinaryFeatures: [], 
})

// --- COMPUTED ---
const dialog = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const availableServiceList = computed(() => {
  // Top level services from the tree
  return props.availablePermissions.filter(s => {
      // Exclude granular veterinary keys (handled as features within Veterinary Management)
      const hiddenKeys = [
          'VETERINARY_CORE', 
          'VETERINARY_VISITS', 
          'VETERINARY_VITALS', 
          'VETERINARY_PRESCRIPTIONS', 
          'VETERINARY_LABS', 
          'VETERINARY_MEDICINE_REMINDERS', 
          'VETERINARY_DOCTOR', 
          'VETERINARY_PHARMACY',
          'VETERINARY_SCHEDULE',
          'VETERINARY_SETTINGS' 
      ]
      if (s.service_key && hiddenKeys.includes(s.service_key)) return false
      
      return !!s.service_id
  })
})

const selectedServiceObjects = computed(() => {
  // Return full objects for selected IDs
  return availableServiceList.value.filter(s => form.value.selectedServices.includes(s.service_id))
})

// --- API FETCH ---
const fetchTemplates = async () => {
  try {
    const response = await providerApi.get('/api/provider/role-templates/')
    const data = response.data
    if (data.templates) {
      roleTemplates.value = data.templates
      veterinaryFeatureDefinitions.value = data.features || []
    } else {
      roleTemplates.value = data
    }
  } catch (e) {
    console.error("Failed to fetch role templates", e)
    error.value = e.response?.data?.error || e.message || "Failed to load role templates."
    // Also capture trace if available for debugging
    if (e.response?.data?.trace) {
       console.error("Backend Trace:", e.response.data.trace)
    }
  }
}

const applyTemplate = template => {
  if (!template) return
    
  // 1. Auto-fill Name/Desc if empty
  if (!form.value.name) form.value.name = template.name
  if (!form.value.description) form.value.description = template.description
    
  // 2. Clear current selection
  form.value.selectedServices = []
  form.value.veterinaryFeatures = []
    
  // 3. Enable Services
  template.services.forEach(svcKey => {
    // Find service ID by key
    const found = props.availablePermissions.find(p => p.service_key === svcKey)
    if (found) {
      form.value.selectedServices.push(found.service_id)
    }
  })
    
  // 4. Enable Features (Veterinary)
  form.value.veterinaryFeatures = [...template.features]
}

// --- INIT ---
const initialize = async () => {
  // Load templates if empty
  if (roleTemplates.value.length === 0) await fetchTemplates()

  if (props.role) {
    form.value.name = props.role.name
    form.value.description = props.role.description
        
    // Hydrate Permissions (Complex Logic)
    const existingCaps = props.role.capabilities || []
    const relevantServices = new Set()
    const vetFeatures = new Set()
        
    // Check for Service Keys & Categories
    props.availablePermissions.forEach(svc => {
      let isVet = isVeterinary(svc)
             
      // Check if Base Service Key is present OR if it's Vet (check features)
      if (existingCaps.includes(svc.service_key) || isVet) {
                 
        if (existingCaps.includes(svc.service_key)) {
          relevantServices.add(svc.service_id)
        }

        if (isVet) {
          // Check each feature independently
          let hasFeature = false
          veterinaryFeatureDefinitions.value.forEach(feat => {
            if (feat.capabilities.every(c => existingCaps.includes(c))) {
              vetFeatures.add(feat.id)
              hasFeature = true
            }
          })
                     
          // If any feature is present, ensure service is marked as selected
          if (hasFeature) {
            relevantServices.add(svc.service_id)
          }
        }
      }
             
      svc.categories?.forEach(cat => {
        const action = props.role.capability_actions?.find(a => a.capability_key === cat.linked_capability)
        if (action && (action.can_view || action.can_create)) {
          relevantServices.add(svc.service_id)
          form.value.permissions[`category:${cat.id}`] = {
            can_view: action.can_view,
            can_create: action.can_create,
            can_edit: action.can_edit,
            can_delete: action.can_delete,
          }
        }
        else if (existingCaps.includes(cat.linked_capability)) {
          relevantServices.add(svc.service_id)
          if (!form.value.permissions[`category:${cat.id}`]) {
            form.value.permissions[`category:${cat.id}`] = { can_view: true, can_create: true, can_edit: true, can_delete: true }
          }
        }
      })
    })
        
    form.value.selectedServices = Array.from(relevantServices)
    form.value.veterinaryFeatures = Array.from(vetFeatures)
        
  } else {
    selectedTemplate.value = null
    form.value = {
      name: '',
      description: '',
      selectedServices: [],
      permissions: {},
      veterinaryFeatures: [],
    }
  }
}

watch(() => props.modelValue, val => {
  if (val) initialize()
})

// --- ACTIONS ---
const toggleService = id => {
  if (form.value.selectedServices.includes(id)) {
    form.value.selectedServices = form.value.selectedServices.filter(s => s !== id)
  } else {
    form.value.selectedServices.push(id)
        
    // Auto-Enable All Veterinary Features for UX Convenience
    const svc = availableServiceList.value.find(s => s.service_id === id)
    if (svc && isVeterinary(svc)) {
      const allFeatureIds = veterinaryFeatureDefinitions.value.map(f => f.id)

      form.value.veterinaryFeatures = [...new Set([...form.value.veterinaryFeatures, ...allFeatureIds])]
    }
  }
}

const toggleVetFeature = featureId => {
  if (form.value.veterinaryFeatures.includes(featureId)) {
    form.value.veterinaryFeatures = form.value.veterinaryFeatures.filter(f => f !== featureId)
  } else {
    form.value.veterinaryFeatures.push(featureId)
  }
}

const toggleAllInCategory = (category, value) => {
  const key = `category:${category.id}`
    
  // Ensure object exists
  if (!form.value.permissions[key]) {
    form.value.permissions[key] = { can_view: false, can_create: false, can_edit: false, can_delete: false }
  }
    
  // Set all to the value
  form.value.permissions[key].can_view = value
  form.value.permissions[key].can_create = value
  form.value.permissions[key].can_edit = value
  form.value.permissions[key].can_delete = value
    
  // Handle Facilities
  if (!value && category.facilities) {
    category.facilities.forEach(fac => {
      const fKey = `facility:${fac.id}`
      if (form.value.permissions[fKey]) form.value.permissions[fKey].can_view = false
    })
  }
}

const isAllInCategorySelected = categoryId => {
  const perms = form.value.permissions[`category:${categoryId}`]
  if (!perms) return false
  
  return perms.can_view && perms.can_create && perms.can_edit && perms.can_delete
}


const updatePermission = (key, field, value, category = null) => {
  if (!form.value.permissions[key]) {
    form.value.permissions[key] = { can_view: false, can_create: false, can_edit: false, can_delete: false }
  }
    
  form.value.permissions[key][field] = value
    
  if (field === 'can_view' && !value) {
    form.value.permissions[key].can_create = false
    form.value.permissions[key].can_edit = false
    form.value.permissions[key].can_delete = false
        
    if (category && category.facilities) {
      category.facilities.forEach(fac => {
        const fKey = `facility:${fac.id}`
        if (form.value.permissions[fKey]) form.value.permissions[fKey].can_view = false
      })
    }
  }
    
  if (value && field !== 'can_view') {
    form.value.permissions[key].can_view = true
  }
}

const toggleFacility = facId => {
  const key = `facility:${facId}`
  if (!form.value.permissions[key]) {
    form.value.permissions[key] = { can_view: false }
  }
    
  form.value.permissions[key].can_view = !form.value.permissions[key].can_view
}

const saveData = () => {
  console.log('--- Role Wizard: Saving Data ---')

  const capability_actions = []
    
  // 1. Process Dynamic Services Permissions
  Object.entries(form.value.permissions).forEach(([key, perms]) => {
    if (perms.can_view || perms.can_create || perms.can_edit || perms.can_delete) {
      const [type, id] = key.split(':')
      let capKey = null
      if (type === 'category') {
        for (const svc of props.availablePermissions) {
          const cat = svc.categories?.find(c => c.id == id)
          if (cat && cat.linked_capability) {
            capKey = cat.linked_capability
            break
          }
        }
      }
      if (capKey) {
        capability_actions.push({
          capability_key: capKey,
          can_view: perms.can_view,
          can_create: perms.can_create,
          can_edit: perms.can_edit,
          can_delete: perms.can_delete,
        })
      }
    }
  })
    
  console.log('Vet Features Selected:', form.value.veterinaryFeatures)

  // 2. Process Veterinary Features
  form.value.veterinaryFeatures.forEach(featId => {
    const feature = veterinaryFeatureDefinitions.value.find(f => f.id === featId)
    if (feature) {
      feature.capabilities.forEach(cap => {
        if (!capability_actions.find(c => c.capability_key === cap)) {
          capability_actions.push({
            capability_key: cap,
            can_view: true, can_create: true, can_edit: true, can_delete: true,
          })
        }
      })
    }
  })
    
  // 3. Process Service Level Keys
  selectedServiceObjects.value.forEach(svc => {
    if (svc.service_key && !isVeterinary(svc)) {
      if (!capability_actions.find(c => c.capability_key === svc.service_key)) {
        capability_actions.push({
          capability_key: svc.service_key,
          can_view: true, can_create: true, can_edit: true, can_delete: true, 
        })
      }
    }
  })

  console.log('Final Capabilities Payload:', capability_actions)

  const payload = {
    name: form.value.name,
    description: form.value.description,
    capability_actions: capability_actions,
    capabilities: capability_actions.map(c => c.capability_key),
  }
    
  emit('save', payload)
}

const isVeterinary = svc => {
  return svc.service_key?.startsWith('VETERINARY') || (svc.service_name && svc.service_name.toLowerCase().includes('veterinary'))
}

const isVetFeatureActive = id => form.value.veterinaryFeatures.includes(id)

const getUniqueCategories = (categories) => {
  if (!categories) return []
  // Deduplicate by name (if present) to avoid UI clutter from bad data
  const seen = new Set()
  return categories.filter(c => {
    const name = c.name || 'General'
    if (seen.has(name)) return false
    seen.add(name)
    return true
  })
}

const error = ref(null)
</script>

<template>
  <VDialog
    v-model="dialog"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <VCard class="h-100 d-flex flex-column bg-grey-lighten-5">
      <!-- HEADER -->
      <div class="px-8 py-4 bg-white border-b d-flex align-center justify-space-between elevation-1">
        <div class="d-flex align-center gap-4">
          <VBtn
            icon="tabler-x"
            variant="text"
            @click="dialog = false"
          />
          <div>
            <div class="text-h6 font-weight-bold">
              {{ role ? 'Edit Role' : 'Create New Role' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Configure role details and permissions
            </div>
          </div>
        </div>
        <div>
          <VBtn
            color="success"
            size="large"
            :disabled="!form.name"
            @click="saveData"
          >
            Save Role
          </VBtn>
        </div>
      </div>

      <!-- BODY -->
      <div class="flex-grow-1 overflow-y-auto pa-8 justify-center d-flex">
        <div
          class="w-100"
          style="max-width: 900px;"
        >
          <VAlert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-6"
            closable
            @click:close="error = null"
          >
            {{ error }}
          </VAlert>

          <!-- SECTION 1: ROLE BASICS -->
          <div class="mb-8 animate-fade-in">
            <div class="text-h5 font-weight-bold mb-1 text-high-emphasis">
              Role Basics
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Give this role a name and description.
            </p>
                 
            <VCard
              class="pa-6 rounded-xl border-opacity-50"
              flat
              border
            >
              <!-- ROLE TEMPLATE SELECTOR -->
              <VAutocomplete 
                v-if="!role"
                v-model="selectedTemplate"
                :items="roleTemplates"
                item-title="name"
                return-object
                label="Choose a Role Template (Optional)"
                placeholder="Select a standard role to auto-fill permissions"
                variant="outlined"
                class="mb-4"
                bg-color="white"
                prepend-inner-icon="tabler-template"
                clearable
                @update:model-value="applyTemplate"
              >
                <template #item="{ props, item }">
                  <VListItem
                    v-bind="props"
                    :subtitle="item.raw.description"
                  />
                </template>
              </VAutocomplete>

              <VTextField 
                v-model="form.name" 
                label="Role Name" 
                placeholder="e.g. Grooming Manager" 
                variant="outlined" 
                class="mb-4"
                bg-color="white"
              />
              <VTextarea 
                v-model="form.description" 
                label="Description" 
                placeholder="What is this person responsible for?" 
                variant="outlined" 
                rows="2"
                bg-color="white"
              />
            </VCard>
          </div>

          <!-- SECTION 2: SERVICE SELECTION -->
          <div
            class="mb-8 animate-fade-in"
            style="animation-delay: 0.1s"
          >
            <div class="text-h5 font-weight-bold mb-1 text-high-emphasis">
              Assign Services
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Click to select the services this role manages.
            </p>

            <div class="d-grid grid-cols-2 gap-4">
              <VCard 
                v-for="service in availableServiceList" 
                :key="service.service_id"
                class="service-select-card cursor-pointer pa-6 rounded-xl border-opacity-50 transition-all"
                :class="{'selected-service elevation-4': form.selectedServices.includes(service.service_id)}"
                variant="outlined"
                border
                @click="toggleService(service.service_id)"
              >
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="service-icon-lg rounded-circle bg-primary-lighten-5 pa-4">
                    <VIcon
                      :icon="service.icon || 'tabler-box'"
                      size="32"
                      color="primary"
                    />
                  </div>
                  <VIcon 
                    :icon="form.selectedServices.includes(service.service_id) ? 'tabler-circle-check-filled' : 'tabler-circle'" 
                    size="28" 
                    :color="form.selectedServices.includes(service.service_id) ? 'primary' : 'medium-emphasis'"
                  />
                </div>
                <div class="text-h6 font-weight-bold mb-1">
                  {{ service.display_name || service.service_name }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ form.selectedServices.includes(service.service_id) ? 'Access Enabled' : 'Click to Enable' }}
                </div>
              </VCard>
            </div>
          </div>

          <!-- SECTION 3: PERMISSIONS CONFIGURATION -->
          <div
            v-if="selectedServiceObjects.length > 0"
            class="animate-fade-in"
            style="animation-delay: 0.2s"
          >
            <div class="text-h5 font-weight-bold mb-1 text-high-emphasis">
              Detailed Permissions
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Fine-tune exactly what they can do within the selected services.
            </p>

            <div class="d-flex flex-column gap-6">
              <VCard 
                v-for="service in selectedServiceObjects" 
                :key="service.service_id"
                class="rounded-xl border overflow-hidden"
                flat
              >
                <!-- Service Header -->
                <div class="px-6 py-4 bg-grey-lighten-5 border-b d-flex align-center">
                  <div class="service-icon-box me-3">
                    <VIcon
                      :icon="service.icon || 'tabler-box'"
                      size="24"
                      color="primary"
                    />
                  </div>
                  <div>
                    <div class="text-h6 font-weight-bold">
                      {{ service.display_name || service.service_name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Configure Access Rights
                    </div>
                  </div>
                </div>

                <div class="pa-6">
                  <!-- VETERINARY SPECIAL UI (CHECKBOXES + SELECT ALL) -->
                  <div v-if="isVeterinary(service)">
                    <div class="d-flex align-center justify-space-between mb-4 px-4">
                      <div class="text-subtitle-1 font-weight-bold">
                        Select Permissions ({{ veterinaryFeatureDefinitions.length }})
                      </div>
                      <VCheckbox 
                        label="Select All" 
                        hide-details 
                        density="compact"
                        color="primary"
                        :model-value="form.veterinaryFeatures.length === veterinaryFeatureDefinitions.length && veterinaryFeatureDefinitions.length > 0"
                        @update:model-value="(val) => {
                          if (val) form.veterinaryFeatures = veterinaryFeatureDefinitions.map(f => f.id)
                          else form.veterinaryFeatures = []
                        }"
                      />
                    </div>

                    <div class="d-flex flex-column gap-4">
                      <div 
                        v-for="feature in veterinaryFeatureDefinitions" 
                        :key="feature.id"
                        class="d-flex align-center justify-space-between pa-4 rounded-lg border cursor-pointer"
                        :class="{'bg-primary-lighten-5 border-primary': isVetFeatureActive(feature.id)}"
                        @click="toggleVetFeature(feature.id)"
                      >
                        <div class="d-flex align-center gap-4">
                          <div class="pa-3 rounded-circle bg-white elevation-1">
                            <VIcon
                              :icon="feature.icon"
                              color="primary"
                            />
                          </div>
                          <div>
                            <div class="text-subtitle-1 font-weight-bold">
                              {{ feature.title }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                              {{ feature.description }}
                            </div>
                          </div>
                        </div>
                        <VCheckbox 
                          :model-value="isVetFeatureActive(feature.id)"
                          color="primary"
                          hide-details
                          density="compact"
                          class="pointer-events-none" 
                        />
                      </div>
                    </div>
                  </div>

                  <!-- DYNAMIC SERVICES (GROOMING/ETC) -->
                  <div v-else>
                    <div
                      v-if="!service.categories || service.categories.length === 0"
                      class="text-caption text-disabled"
                    >
                      No granular permissions available.
                    </div>

                    <div
                      v-for="category in getUniqueCategories(service.categories)"
                      :key="category.id"
                      class="mb-6"
                    >
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div class="text-overline font-weight-bold text-medium-emphasis">
                          {{ category.name || 'General' }}
                        </div>
                        <VCheckbox 
                          label="Select All" 
                          hide-details 
                          density="compact"
                          color="primary"
                          class="mt-0 pt-0"
                          :model-value="isAllInCategorySelected(category.id)"
                          @update:model-value="(val) => toggleAllInCategory(category, val)"
                        />
                      </div>
                                     
                      <!-- Category Actions (View/Create/Edit/Delete) -->
                      <div class="border rounded-lg pa-4">
                        <!-- Main Toggle: View (Access) -->
                        <div class="d-flex align-center justify-space-between mb-2">
                          <div>
                            <div class="text-subtitle-2 font-weight-bold">
                              Access {{ category.name }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                              Allow staff to view bookings and records.
                            </div>
                          </div>
                          <VCheckbox 
                            color="primary" 
                            hide-details 
                            density="compact"
                            :model-value="form.permissions[`category:${category.id}`]?.can_view"
                            @update:model-value="(val) => updatePermission(`category:${category.id}`, 'can_view', val, category)"
                          />
                        </div>

                        <VDivider
                          v-if="form.permissions[`category:${category.id}`]?.can_view"
                          class="my-3"
                        />

                        <!-- Detailed Actions (Hidden if no access) -->
                        <div
                          v-if="form.permissions[`category:${category.id}`]?.can_view"
                          class="d-flex flex-column gap-3 pl-4 border-l-2 ml-2"
                        >
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-body-2">{{ getLabel('can_create') }}</span>
                            <VCheckbox 
                              color="success" 
                              hide-details 
                              density="compact" 
                              :model-value="form.permissions[`category:${category.id}`]?.can_create"
                              @update:model-value="(val) => updatePermission(`category:${category.id}`, 'can_create', val)"
                            />
                          </div>
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-body-2">{{ getLabel('can_edit') }}</span>
                            <VCheckbox 
                              color="info" 
                              hide-details 
                              density="compact" 
                              :model-value="form.permissions[`category:${category.id}`]?.can_edit"
                              @update:model-value="(val) => updatePermission(`category:${category.id}`, 'can_edit', val)"
                            />
                          </div>
                          <div class="d-flex align-center justify-space-between">
                            <span class="text-body-2">{{ getLabel('can_delete') }}</span>
                            <VCheckbox 
                              color="error" 
                              hide-details 
                              density="compact" 
                              :model-value="form.permissions[`category:${category.id}`]?.can_delete"
                              @update:model-value="(val) => updatePermission(`category:${category.id}`, 'can_delete', val)"
                            />
                          </div>
                        </div>
                      </div>

                      <!-- Facilities (Simpler) -->
                      <div
                        v-if="category.facilities && category.facilities.length > 0"
                        class="mt-4"
                      >
                        <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
                          FACILITY ACCESS
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                          <VChip
                            v-for="fac in category.facilities"
                            :key="fac.id"
                            filter
                            :color="form.permissions[`facility:${fac.id}`]?.can_view ? 'primary' : 'default'"
                            :variant="form.permissions[`facility:${fac.id}`]?.can_view ? 'tonal' : 'outlined'"
                            :input-value="form.permissions[`facility:${fac.id}`]?.can_view"
                            @click="toggleFacility(fac.id)"
                          >
                            {{ fac.name }}
                          </VChip>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </VCard>
            </div>
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.4s ease-out backwards;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.service-select-card:hover {
    border-color: rgb(var(--v-theme-primary));
    transform: translateY(-2px);
}
.selected-service {
    border-color: rgb(var(--v-theme-primary)) !important;
    background-color: rgba(var(--v-theme-primary), 0.04);
}
.d-grid {
    display: grid;
}
.grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
}
.gap-4 {
    gap: 24px;
}
.border-primary {
    border-color: rgb(var(--v-theme-primary)) !important;
}
</style>
