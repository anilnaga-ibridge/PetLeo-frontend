<script setup>
import { ref, computed } from 'vue'

import BuilderLayout from './components/BuilderLayout.vue'
import ServiceList from './components/ServiceList.vue'
import StepServiceTypes from './components/StepServiceTypes.vue'
import StepFacilities from './components/StepFacilities.vue'
import StepSummary from './components/StepSummary.vue'
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
  { value: 'types', title: 'Categories', icon: 'tabler-hierarchy-2' },
  { value: 'facilities', title: 'Facilities & Pricing', icon: 'tabler-building-hospital' },
  { value: 'summary', title: 'Summary', icon: 'tabler-list-check' },
]

// =====================
// METHODS
// =====================
const handleServiceSelect = id => {
  selectedServiceId.value = id
  selectedCategoryId.value = null
  selectedFacilityId.value = null
  activeTab.value = 'types'
}

const handleStateUpdate = newState => {
  if (newState.selectedCategoryId !== undefined) selectedCategoryId.value = newState.selectedCategoryId
  if (newState.selectedFacilityId !== undefined) selectedFacilityId.value = newState.selectedFacilityId
}

const openCreateDrawer = () => {
  isEdit.value = false
  editService.value = null
  drawerOpen.value = true
}

const openEditDrawer = service => {
  isEdit.value = true
  editService.value = service
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}
</script>

<template>
  <div class="premium-page-container pa-6">
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-bold mb-2 gradient-text">
          Services & Logistics
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-0">
          Configure global service protocols, facilities, and pricing structures
        </p>
      </div>
      <VBtn 
        color="primary" 
        prepend-icon="tabler-plus" 
        elevation="0"
        rounded="xl"
        class="premium-btn px-6"
        @click="openCreateDrawer"
      >
        New Global Service
      </VBtn>
    </div>

    <!-- MAIN BUILDER CANVAS -->
    <VCard class="builder-canvas glass-morphism overflow-hidden">
      <BuilderLayout>
        <!-- LEFT: SERVICES LIST -->
        <template #left>
          <ServiceList
            :selected-id="selectedServiceId"
            @select="handleServiceSelect"
            @create="openCreateDrawer"
            @edit="openEditDrawer"
          />
        </template>

        <!-- MAIN CONTENT AREA -->
        <template #main>
          <div
            v-if="!selectedServiceId"
            class="d-flex flex-column align-center justify-center h-100 text-center pa-12 empty-state-container"
          >
            <div class="empty-icon-wrapper mb-8 floating-animation">
              <div class="icon-blob blob-1" />
              <div class="icon-blob blob-2" />
              <VIcon
                icon="tabler-topology-ring-3"
                size="84"
                color="primary"
                class="relative-icon"
              />
            </div>

            <h2 class="text-h3 font-weight-bold mb-4 gradient-text">
              Select a Service
            </h2>
            <p class="text-h6 text-medium-emphasis mb-10 max-w-500">
              Choose a core service from the directory to begin configuring its categories, facility requirements, and pricing logic.
            </p>

            <VBtn
              color="primary"
              variant="tonal"
              size="large"
              rounded="xl"
              prepend-icon="tabler-list-details"
              @click="$el?.querySelector('.service-list-container')?.scrollIntoView({ behavior: 'smooth' })"
            >
              Browse Registry
            </VBtn>
          </div>

          <div
            v-else
            class="d-flex flex-column h-100"
          >
            <!-- TABS CONSOLE -->
            <div class="builder-tabs-header border-b">
              <VTabs
                v-model="activeTab"
                color="primary"
                grow
                class="premium-builder-tabs"
              >
                <VTab
                  v-for="tab in tabs"
                  :key="tab.value"
                  :value="tab.value"
                  class="text-body-2 font-weight-bold"
                >
                  <VIcon
                    :icon="tab.icon"
                    size="18"
                    class="me-2"
                  />
                  {{ tab.title }}
                </VTab>
              </VTabs>
            </div>

            <!-- WORKSPACE -->
            <div class="flex-grow-1 pa-6 workplace-bg">
              <VWindow
                v-model="activeTab"
                class="h-100"
              >
                <VWindowItem
                  value="types"
                  class="h-100"
                >
                  <VFadeTransition hide-on-leave>
                    <StepServiceTypes 
                      v-if="activeTab === 'types'"
                      :state="builderState" 
                      @update:state="handleStateUpdate"
                      @next="activeTab = 'facilities'"
                    />
                  </VFadeTransition>
                </VWindowItem>

                <VWindowItem
                  value="facilities"
                  class="h-100"
                >
                  <VFadeTransition hide-on-leave>
                    <StepFacilities 
                      v-if="activeTab === 'facilities'"
                      :state="builderState" 
                      @update:state="handleStateUpdate"
                      @next="activeTab = 'summary'"
                      @prev="activeTab = 'types'"
                    />
                  </VFadeTransition>
                </VWindowItem>

                <VWindowItem
                  value="summary"
                  class="h-100"
                >
                  <VFadeTransition hide-on-leave>
                    <StepSummary 
                      v-if="activeTab === 'summary'"
                      :state="builderState" 
                      @prev="activeTab = 'facilities'"
                    />
                  </VFadeTransition>
                </VWindowItem>
              </VWindow>
            </div>
          </div>
        </template>
      </BuilderLayout>
    </VCard>

    <!-- SERVICE DRAWER -->
    <Teleport to="body">
      <VNavigationDrawer
        v-model="drawerOpen"
        location="end"
        temporary
        :scrim="true"
        width="500"
        class="premium-drawer-v2"
      >
        <div class="d-flex flex-column h-100">
          <!-- HEADER -->
          <div class="drawer-header-v2 pa-6 border-b d-flex justify-space-between align-center">
            <div>
              <h3 class="text-h5 font-weight-bold gradient-text">
                {{ isEdit ? 'Modify Service' : 'Initialize Service' }}
              </h3>
              <p class="text-caption text-medium-emphasis mb-0">
                Platform Registry Entry
              </p>
            </div>
            <VBtn
              icon="tabler-x"
              variant="tonal"
              size="small"
              rounded="lg"
              @click="closeDrawer"
            />
          </div>

          <!-- CONTENT -->
          <div class="drawer-content-v2 flex-grow-1 overflow-y-auto pa-6">
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
.premium-page-container {
  max-width: 1600px;
  margin: 0 auto;
}

.builder-canvas {
  min-height: 700px;
}

.workplace-bg {
  background: rgba(var(--v-theme-background), 0.4);
}

.premium-builder-tabs {
  :deep(.v-btn) {
    text-transform: none;
    letter-spacing: 0;
    transition: all 0.3s ease;
    height: 60px;
  }
}

.empty-state-container {
  height: 100%;
}

.max-w-500 {
  max-width: 500px;
}

/* Animations */
.floating-animation {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.empty-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .relative-icon {
    position: relative;
    z-index: 2;
  }

  .icon-blob {
    position: absolute;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.15;
    z-index: 1;
  }

  .blob-1 { background: rgb(var(--v-theme-primary)); top: -10px; left: -10px; }
  .blob-2 { background: #ce9ffc; bottom: -10px; right: -10px; }
}

/* Common Styles (Should be shared if possible) */
.gradient-text {
  background: linear-gradient(135deg, #7367f0 0%, #ce9ffc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-morphism {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(14px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
</style>

<style lang="scss">
/* Premium Drawer Pattern */
.premium-drawer-v2 {
  border-left: 1px solid rgba(0, 0, 0, 0.05) !important;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.05) !important;
  
  .v-navigation-drawer__content {
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
  }
}

.drawer-header-v2 {
  background: linear-gradient(to bottom, #fcfcfd, #ffffff);
}
</style>

<route lang="yaml">
meta:
  pageTitle: null
  pageHeader: false
</route>
