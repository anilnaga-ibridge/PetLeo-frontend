<script setup>
import { ref, computed } from 'vue'

import BuilderLayout from './components/BuilderLayout.vue'
import ServiceList from './components/ServiceList.vue'
import StepServiceTypes from './components/StepServiceTypes.vue'
import StepFacilities from './components/StepFacilities.vue'
import StepPricing from './components/StepPricing.vue'
import ServiceForm from './components/ServiceForm.vue' // CREATE / EDIT SERVICE FORM

// =====================
// STATE
// =====================
const selectedServiceId = ref(null)
const selectedCategoryId = ref(null)
const selectedFacilityId = ref(null)
const activeTab = ref('types')

// Drawer state (IMPORTANT)
const drawerOpen = ref(false)
const isEdit = ref(false)
const editService = ref(null)

// Shared state for steps
const builderState = computed(() => ({
  selectedServiceId: selectedServiceId.value,
  selectedCategoryId: selectedCategoryId.value,
  selectedFacilityId: selectedFacilityId.value,
}))

const tabs = [
  { value: 'types', title: 'Types & Features', icon: 'tabler-hierarchy-2' },
  { value: 'facilities', title: 'Facilities', icon: 'tabler-building-hospital' },
  { value: 'pricing', title: 'Pricing Rules', icon: 'tabler-currency-dollar' },
]

// =====================
// METHODS
// =====================
const handleServiceSelect = (id) => {
  selectedServiceId.value = id
  selectedCategoryId.value = null
  selectedFacilityId.value = null
  activeTab.value = 'types'
}

const handleStateUpdate = (newState) => {
  if (newState.selectedCategoryId !== undefined) selectedCategoryId.value = newState.selectedCategoryId
  if (newState.selectedFacilityId !== undefined) selectedFacilityId.value = newState.selectedFacilityId
}

const openCreateDrawer = () => {
  isEdit.value = false
  editService.value = null
  drawerOpen.value = true
}

const openEditDrawer = (service) => {
  isEdit.value = true
  editService.value = service
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}
</script>

<template>
  <div class="builder-container">
    <!-- ===================== -->
    <!-- MAIN BUILDER CANVAS -->
    <!-- ===================== -->
    <VCard class="builder-canvas" variant="flat">
      <BuilderLayout>
        <!-- LEFT -->
        <template #left>
          <ServiceList
            :selected-id="selectedServiceId"
            @select="handleServiceSelect"
            @create="openCreateDrawer"
            @edit="openEditDrawer"
          />
        </template>

        <!-- MAIN -->
        <template #main>
          <div
            v-if="!selectedServiceId"
            class="d-flex flex-column align-center justify-center h-100 text-center pa-12 bg-surface"
          >
            <div class="mb-6 pa-6 rounded-circle bg-primary-lighten-5">
              <VIcon icon="tabler-click" size="64" color="primary" />
            </div>

            <h2 class="text-h4 font-weight-bold mb-3">Select a Service</h2>
            <p class="text-body-1 text-medium-emphasis mb-8" style="max-width: 420px;">
              Choose a service from the left or create a new one to begin configuration.
            </p>

            <VBtn
              color="primary"
              size="large"
              prepend-icon="tabler-plus"
              @click="openCreateDrawer"
            >
              Create New Service
            </VBtn>
          </div>

          <div v-else class="d-flex flex-column h-100">
            <!-- TABS -->
            <div class="sticky-top bg-surface z-index-1">
              <div class="px-6 py-3">
                <VTabs
                  v-model="activeTab"
                  bg-color="surface"
                  color="primary"
                  density="comfortable"
                  class="premium-tabs"
                  slider-color="primary"
                >
                  <VTab
                    v-for="tab in tabs"
                    :key="tab.value"
                    :value="tab.value"
                    class="text-body-2 font-weight-medium rounded-pill me-2"
                    :ripple="false"
                  >
                    <VIcon :icon="tab.icon" size="18" class="me-2" />
                    {{ tab.title }}
                  </VTab>
                </VTabs>
              </div>
            </div>

            <!-- CONTENT -->
            <div class="flex-grow-1 overflow-y-auto pa-4 bg-background">
              <VWindow v-model="activeTab" class="h-100">
                <VWindowItem value="types">
                  <StepServiceTypes 
                    :state="builderState" 
                    @update:state="handleStateUpdate"
                    @next="activeTab = 'facilities'"
                  />
                </VWindowItem>

                <VWindowItem value="facilities">
                  <StepFacilities 
                    :state="builderState" 
                    @update:state="handleStateUpdate"
                    @next="activeTab = 'pricing'"
                    @prev="activeTab = 'types'"
                  />
                </VWindowItem>

                <VWindowItem value="pricing">
                  <StepPricing 
                    :state="builderState" 
                    @update:state="handleStateUpdate"
                    @prev="activeTab = 'facilities'"
                  />
                </VWindowItem>
              </VWindow>
            </div>
          </div>
        </template>
      </BuilderLayout>
    </VCard>

    <!-- ===================== -->
    <!-- SERVICE DRAWER (SAME AS PLANS BUILDER) -->
    <!-- ===================== -->
    <Teleport to="body">
      <VNavigationDrawer
        v-model="drawerOpen"
        location="end"
        temporary
        :scrim="false"
        width="500"
        class="builder-drawer"
        style="z-index: 8888 !important; top: 0 !important; height: 100vh !important; position: fixed !important;"
      >
      <div class="d-flex flex-column h-100">
        <!-- HEADER -->
        <div class="pa-6 border-b d-flex justify-space-between align-center bg-surface sticky-header">
          <h3 class="text-h6 font-weight-bold">
            {{ isEdit ? 'Edit Service' : 'Create Service' }}
          </h3>
          <VBtn icon="tabler-x" variant="text" @click="closeDrawer" />
        </div>

        <!-- BODY -->
        <div class="flex-grow-1 overflow-y-auto pa-6">
          <ServiceForm
            :service="editService"
            :is-edit="isEdit"
            @close="closeDrawer"
            @success="() => { serviceListRef?.fetchServices(); closeDrawer() }"
          />
        </div>


      </div>
      </VNavigationDrawer>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.builder-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.builder-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.bg-background {
  background-color: rgb(var(--v-theme-background));
}

.sticky-top {
  position: sticky;
  top: 0;
}

.z-index-1 {
  z-index: 1;
}

.bg-primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

/* 🔥 SAME FIX AS PLANS BUILDER */
.premium-tabs {
  --v-tabs-height: 40px;

  :deep(.v-tab) {
    text-transform: none;
    letter-spacing: normal;
    min-width: auto;
    padding: 0 16px;
    opacity: 0.7;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      background-color: rgba(var(--v-theme-primary), 0.04);
    }

    &.v-tab--selected {
      opacity: 1;
      background-color: rgba(var(--v-theme-primary), 0.08);
      color: rgb(var(--v-theme-primary));
    }
  }

  :deep(.v-slide-group__content) {
    padding: 2px 0;
  }
}
</style>

<style lang="scss">
.builder-drawer {
  position: fixed !important;
  top: 0 !important;
  height: 100vh !important;
  z-index: 8888 !important;
  
  .v-navigation-drawer__content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}
</style>

<route lang="yaml">
meta:
  pageTitle: null
  pageHeader: false
</route>
