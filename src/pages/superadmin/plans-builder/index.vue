<script setup>
import { ref } from 'vue'
import BuilderLayout from '../../builder/components/BuilderLayout.vue'
import PlanList from './components/PlanList.vue'
import PlanOverview from './components/PlanOverview.vue'
import PlanServices from './components/PlanServices.vue'
import PlanPricing from './components/PlanPricing.vue'

const selectedPlanId = ref(null)
const activeTab = ref('overview')
const planListRef = ref(null)

const tabs = [
  { value: 'overview', title: 'Overview', icon: 'tabler-info-circle' },
  { value: 'services', title: 'Included Services', icon: 'tabler-list-check' },
  { value: 'pricing', title: 'Pricing', icon: 'tabler-currency-dollar' },
]

const handlePlanSelect = id => {
  selectedPlanId.value = id
}

const handleCreate = () => {
  selectedPlanId.value = null
  activeTab.value = 'overview'
}

const handleSaved = plan => {
  selectedPlanId.value = plan.id
  planListRef.value?.fetchPlans()
}
</script>

<template>
  <div class="h-100">
    <VRow class="mb-2">
      <VCol cols="12">
        <div class="d-flex align-center">
          <VAvatar
            color="primary"
            variant="tonal"
            rounded
            size="42"
            class="me-3"
          >
            <VIcon
              icon="tabler-package"
              size="26"
            />
          </VAvatar>
          <div>
            <h1 class="text-h4 font-weight-bold">
              Plans Builder
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-0">
              Create and manage subscription plans.
            </p>
          </div>
        </div>
      </VCol>
    </VRow>

    <BuilderLayout>
      <template #left>
        <PlanList
          ref="planListRef"
          :selected-id="selectedPlanId"
          @select="handlePlanSelect"
          @create="handleCreate"
        />
      </template>

      <template #main>
        <div class="d-flex flex-column h-100">
          <VTabs
            v-model="activeTab"
            bg-color="surface"
            color="primary"
            class="border-b px-4"
          >
            <VTab
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="text-body-1"
              :disabled="!selectedPlanId && tab.value !== 'overview'"
            >
              <VIcon
                :icon="tab.icon"
                size="20"
                class="me-2"
              />
              {{ tab.title }}
            </VTab>
          </VTabs>

          <div class="flex-grow-1 overflow-y-auto bg-background">
            <VWindow
              v-model="activeTab"
              class="h-100"
            >
              <VWindowItem
                value="overview"
                class="h-100"
              >
                <PlanOverview
                  :plan-id="selectedPlanId"
                  @saved="handleSaved"
                />
              </VWindowItem>

              <VWindowItem
                value="services"
                class="h-100"
              >
                <PlanServices :plan-id="selectedPlanId" />
              </VWindowItem>

              <VWindowItem
                value="pricing"
                class="h-100"
              >
                <PlanPricing
                  :plan-id="selectedPlanId"
                  @saved="handleSaved"
                />
              </VWindowItem>
            </VWindow>
          </div>
        </div>
      </template>

      <template #right>
        <div class="pa-4">
          <h3 class="text-h6 font-weight-bold mb-4">
            Plan Summary
          </h3>
          <VCard
            variant="outlined"
            class="mb-4 bg-surface"
          >
            <VCardText>
              <div class="d-flex align-center gap-2 mb-2">
                <VIcon
                  icon="tabler-bulb"
                  size="20"
                  color="warning"
                />
                <span class="font-weight-bold">Tip</span>
              </div>
              <p class="text-caption mb-0">
                Start by defining the basic plan details in the Overview tab. Once saved, you can add services and set pricing.
              </p>
            </VCardText>
          </VCard>
        </div>
      </template>
    </BuilderLayout>
  </div>
</template>

<style lang="scss" scoped>
.bg-background {
  background-color: rgb(var(--v-theme-background));
}
</style>

<route lang="yaml">
meta:
  layout: default
  action: read
  subject: Auth
</route>
