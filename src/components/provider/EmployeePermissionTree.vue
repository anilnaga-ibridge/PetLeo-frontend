<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  available: {
    type: Array,
    default: () => []
  },
  assigned: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:permissions'])

// Internal selection state
const permissions = ref({}) // key -> { can_view, can_create, can_edit, can_delete }

// Initialize selection from assigned prop
watch(() => props.assigned, (newAssigned) => {
  const newPerms = {}
  
  const processItem = (item, type, id) => {
    const key = `${type}:${id}`
    newPerms[key] = {
      can_view: item.can_view || false,
      can_create: item.can_create || false,
      can_edit: item.can_edit || false,
      can_delete: item.can_delete || false
    }
  }

  newAssigned.forEach(svc => {
    processItem(svc, 'service', svc.service_id)
    
    svc.categories.forEach(cat => {
      processItem(cat, 'category', cat.id)
      
      cat.pricing?.forEach(p => processItem(p, 'pricing', p.id))
      
      cat.facilities.forEach(fac => {
        processItem(fac, 'facility', fac.id)
        fac.pricing?.forEach(p => processItem(p, 'pricing', p.id))
      })
    })
  })
  
  permissions.value = newPerms
}, { immediate: true })

// Helper to toggle selection
const toggle = (key, type, item, parentKeys = [], field = 'can_view') => {
  if (!permissions.value[key]) {
    permissions.value[key] = { can_view: false, can_create: false, can_edit: false, can_delete: false }
  }

  const isSelected = permissions.value[key][field]
  const newValue = !isSelected
  
  permissions.value[key][field] = newValue
  
  // Logic for can_view dependency
  if (field === 'can_view' && !newValue) {
    // If we deselect view, deselect everything else for this item
    permissions.value[key].can_create = false
    permissions.value[key].can_edit = false
    permissions.value[key].can_delete = false
    
    // Auto-deselect children
    if (type === 'service') {
      item.categories.forEach(c => {
        const cKey = `category:${c.id}`
        if (permissions.value[cKey]) permissions.value[cKey].can_view = false
        c.pricing?.forEach(p => { if (permissions.value[`pricing:${p.id}`]) permissions.value[`pricing:${p.id}`].can_view = false })
        c.facilities.forEach(f => {
          const fKey = `facility:${f.id}`
          if (permissions.value[fKey]) permissions.value[fKey].can_view = false
          f.pricing?.forEach(p => { if (permissions.value[`pricing:${p.id}`]) permissions.value[`pricing:${p.id}`].can_view = false })
        })
      })
    } else if (type === 'category') {
      item.pricing?.forEach(p => { if (permissions.value[`pricing:${p.id}`]) permissions.value[`pricing:${p.id}`].can_view = false })
      item.facilities.forEach(f => {
        const fKey = `facility:${f.id}`
        if (permissions.value[fKey]) permissions.value[fKey].can_view = false
        f.pricing?.forEach(p => { if (permissions.value[`pricing:${p.id}`]) permissions.value[`pricing:${p.id}`].can_view = false })
      })
    } else if (type === 'facility') {
      item.pricing?.forEach(p => { if (permissions.value[`pricing:${p.id}`]) permissions.value[`pricing:${p.id}`].can_view = false })
    }
  } else if (newValue) {
    // If we select ANY permission, we MUST select view
    permissions.value[key].can_view = true
    
    // Auto-select parents' view
    parentKeys.forEach(pk => {
      if (!permissions.value[pk]) {
        permissions.value[pk] = { can_view: true, can_create: false, can_edit: false, can_delete: false }
      } else {
        permissions.value[pk].can_view = true
      }
    })
  }
  
  emitUpdate()
}

// Convert state to API Payload
const emitUpdate = () => {
  const payload = []
  
  Object.entries(permissions.value).forEach(([key, perms]) => {
    if (perms.can_view || perms.can_create || perms.can_edit || perms.can_delete) {
      const [type, id] = key.split(':')
      const entry = { ...perms }
      
      if (type === 'service') {
        entry.service_id = id
      } else if (type === 'category') {
        // We need to find the service_id for this category
        const svc = props.available.find(s => s.categories.some(c => c.id === id))
        if (svc) {
          entry.service_id = svc.service_id
          entry.category_id = id
        }
      } else if (type === 'facility') {
        const svc = props.available.find(s => s.categories.some(c => c.facilities.some(f => f.id === id)))
        if (svc) {
          const cat = svc.categories.find(c => c.facilities.some(f => f.id === id))
          entry.service_id = svc.service_id
          entry.category_id = cat.id
          entry.facility_id = id
        }
      } else if (type === 'pricing') {
        // Pricing is tricky because it can be under category or facility
        let found = false
        props.available.forEach(svc => {
          svc.categories.forEach(cat => {
            if (cat.pricing?.some(p => p.id === id)) {
              entry.service_id = svc.service_id
              entry.category_id = cat.id
              entry.pricing_id = id
              found = true
            }
            cat.facilities.forEach(fac => {
              if (fac.pricing?.some(p => p.id === id)) {
                entry.service_id = svc.service_id
                entry.category_id = cat.id
                entry.facility_id = fac.id
                entry.pricing_id = id
                found = true
              }
            })
          })
        })
        if (!found) return
      }
      
      payload.push(entry)
    }
  })
  
  emit('update:permissions', payload)
}
</script>

<template>
  <div class="permission-tree">
    <VExpansionPanels variant="accordion" multiple>
      <VExpansionPanel
        v-for="service in available"
        :key="service.service_id"
        elevation="0"
        class="border mb-3 rounded-lg"
      >
        <VExpansionPanelTitle class="py-3 bg-grey-lighten-5">
          <div class="d-flex align-center w-100">
            <VCheckbox
              :model-value="permissions[`service:${service.service_id}`]?.can_view"
              @update:model-value="toggle(`service:${service.service_id}`, 'service', service, [], 'can_view')"
              @click.stop
              hide-details
              density="compact"
              color="primary"
              class="me-3 flex-grow-0"
            />
            <VIcon :icon="service.icon || 'tabler-box'" size="24" class="me-3 text-primary" />
            <span class="text-h6 font-weight-bold">{{ service.display_name || service.name }}</span>
            
            <VSpacer />
            
            <!-- Service Level Operations -->
            <div class="d-flex gap-2 me-4">
              <VCheckbox
                label="Create"
                :model-value="permissions[`service:${service.service_id}`]?.can_create"
                @update:model-value="toggle(`service:${service.service_id}`, 'service', service, [], 'can_create')"
                @click.stop
                hide-details
                density="compact"
                color="success"
              />
              <VCheckbox
                label="Edit"
                :model-value="permissions[`service:${service.service_id}`]?.can_edit"
                @update:model-value="toggle(`service:${service.service_id}`, 'service', service, [], 'can_edit')"
                @click.stop
                hide-details
                density="compact"
                color="info"
              />
              <VCheckbox
                label="Delete"
                :model-value="permissions[`service:${service.service_id}`]?.can_delete"
                @update:model-value="toggle(`service:${service.service_id}`, 'service', service, [], 'can_delete')"
                @click.stop
                hide-details
                density="compact"
                color="error"
              />
            </div>
          </div>
        </VExpansionPanelTitle>

        <VExpansionPanelText class="pt-4 px-4 pb-4">
          <div v-if="service.categories.length === 0" class="text-body-2 text-disabled text-center py-4">
            No categories available for this service.
          </div>

          <div v-else class="d-flex flex-column gap-4">
            <div class="text-overline text-medium-emphasis">Categories & Facilities</div>
            
            <VCard
              v-for="category in service.categories"
              :key="category.id"
              variant="outlined"
              class="category-card rounded-lg"
              :class="{ 'border-primary': permissions[`category:${category.id}`]?.can_view }"
            >
              <VCardText class="pa-4">
                <!-- Category Header -->
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="d-flex align-center flex-grow-1">
                    <VCheckbox
                      :model-value="permissions[`category:${category.id}`]?.can_view"
                      @update:model-value="toggle(`category:${category.id}`, 'category', category, [`service:${service.service_id}`], 'can_view')"
                      hide-details
                      density="compact"
                      color="primary"
                      class="me-2"
                    />
                    <span class="text-subtitle-1 font-weight-bold">{{ category.name }}</span>
                  </div>
                  
                  <!-- Category Level Operations -->
                  <div class="d-flex gap-2 me-4">
                    <VCheckbox
                      label="C"
                      :model-value="permissions[`category:${category.id}`]?.can_create"
                      @update:model-value="toggle(`category:${category.id}`, 'category', category, [`service:${service.service_id}`], 'can_create')"
                      hide-details
                      density="compact"
                      color="success"
                      title="Create"
                    />
                    <VCheckbox
                      label="E"
                      :model-value="permissions[`category:${category.id}`]?.can_edit"
                      @update:model-value="toggle(`category:${category.id}`, 'category', category, [`service:${service.service_id}`], 'can_edit')"
                      hide-details
                      density="compact"
                      color="info"
                      title="Edit"
                    />
                    <VCheckbox
                      label="D"
                      :model-value="permissions[`category:${category.id}`]?.can_delete"
                      @update:model-value="toggle(`category:${category.id}`, 'category', category, [`service:${service.service_id}`], 'can_delete')"
                      hide-details
                      density="compact"
                      color="error"
                      title="Delete"
                    />
                  </div>

                  <!-- Service Context -->
                  <div class="d-flex align-center text-caption text-disabled bg-grey-lighten-4 px-2 py-1 rounded">
                    <VIcon :icon="service.icon || 'tabler-box'" size="14" class="me-1" />
                    <span class="font-weight-medium">{{ service.display_name || service.name }}</span>
                  </div>
                </div>

                <!-- Category Pricing Chips -->
                <div v-if="category.pricing && category.pricing.length > 0" class="mb-4 ps-8">
                  <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">PRICING OPTIONS</div>
                  <div class="d-flex flex-wrap gap-2">
                    <VChip
                      v-for="price in category.pricing"
                      :key="price.id"
                      :color="permissions[`pricing:${price.id}`]?.can_view ? 'primary' : 'default'"
                      :variant="permissions[`pricing:${price.id}`]?.can_view ? 'tonal' : 'outlined'"
                      filter
                      :input-value="permissions[`pricing:${price.id}`]?.can_view"
                      @click="toggle(`pricing:${price.id}`, 'pricing', price, [`service:${service.service_id}`, `category:${category.id}`])"
                      class="pricing-chip"
                    >
                      {{ price.description || price.duration }} - ${{ price.price }}
                    </VChip>
                  </div>
                </div>

                <!-- Facilities List -->
                <div v-if="category.facilities && category.facilities.length > 0" class="ps-6">
                  <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">FACILITIES</div>
                  
                  <div v-for="facility in category.facilities" :key="facility.id" class="facility-item mb-3 pa-3 bg-grey-lighten-5 rounded">
                    <div class="d-flex align-center justify-space-between mb-2">
                      <div class="d-flex align-center flex-grow-1">
                        <VCheckbox
                          :model-value="permissions[`facility:${facility.id}`]?.can_view"
                          @update:model-value="toggle(`facility:${facility.id}`, 'facility', facility, [`service:${service.service_id}`, `category:${category.id}`], 'can_view')"
                          hide-details
                          density="compact"
                          color="primary"
                          class="me-2"
                        />
                        <span class="text-body-2 font-weight-bold">{{ facility.name }}</span>
                      </div>

                      <!-- Facility Level Operations -->
                      <div class="d-flex gap-2">
                        <VCheckbox
                          label="C"
                          :model-value="permissions[`facility:${facility.id}`]?.can_create"
                          @update:model-value="toggle(`facility:${facility.id}`, 'facility', facility, [`service:${service.service_id}`, `category:${category.id}`], 'can_create')"
                          hide-details
                          density="compact"
                          color="success"
                          title="Create"
                        />
                        <VCheckbox
                          label="E"
                          :model-value="permissions[`facility:${facility.id}`]?.can_edit"
                          @update:model-value="toggle(`facility:${facility.id}`, 'facility', facility, [`service:${service.service_id}`, `category:${category.id}`], 'can_edit')"
                          hide-details
                          density="compact"
                          color="info"
                          title="Edit"
                        />
                        <VCheckbox
                          label="D"
                          :model-value="permissions[`facility:${facility.id}`]?.can_delete"
                          @update:model-value="toggle(`facility:${facility.id}`, 'facility', facility, [`service:${service.service_id}`, `category:${category.id}`], 'can_delete')"
                          hide-details
                          density="compact"
                          color="error"
                          title="Delete"
                        />
                      </div>
                    </div>

                    <!-- Facility Pricing Chips -->
                    <div v-if="facility.pricing && facility.pricing.length > 0" class="ps-8">
                      <div class="d-flex flex-wrap gap-2">
                        <VChip
                          v-for="price in facility.pricing"
                          :key="price.id"
                          :color="permissions[`pricing:${price.id}`]?.can_view ? 'primary' : 'default'"
                          :variant="permissions[`pricing:${price.id}`]?.can_view ? 'tonal' : 'outlined'"
                          filter
                          size="small"
                          :input-value="permissions[`pricing:${price.id}`]?.can_view"
                          @click="toggle(`pricing:${price.id}`, 'pricing', price, [`service:${service.service_id}`, `category:${category.id}`, `facility:${facility.id}`])"
                          class="pricing-chip"
                        >
                          {{ price.description || price.duration }} - ${{ price.price }}
                        </VChip>
                      </div>
                    </div>
                  </div>
                </div>

              </VCardText>
            </VCard>
          </div>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>
  </div>
</template>

<style scoped>
.category-card {
  transition: border-color 0.2s ease;
}
.category-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}
.pricing-chip {
  font-weight: 500;
}
.gap-2 {
  gap: 8px;
}
.gap-4 {
  gap: 16px;
}
</style>
