<script setup>
import { inject } from 'vue'

const provider = inject('provider')
</script>

<template>
  <div v-if="provider" class="policies-page">
    <div class="mb-12">
      <!-- Header -->
      <div class="section-title-bar d-flex align-center justify-space-between mb-8 pa-6 rounded-xl bg-gradient-green">
        <div>
          <h2 class="text-h4 font-weight-black text-white mb-1">Our Policies</h2>
          <p class="text-body-2 text-white opacity-90 mb-0">House rules, cancellations, and terms of service</p>
        </div>
        <VIcon icon="tabler-shield-lock" size="48" color="white" class="opacity-20" />
      </div>

      <!-- Content -->
      <VCard flat border class="rounded-xl pa-8">
        <div v-if="provider.policy">
            <!-- Cancellation -->
            <div class="policy-item mb-10" v-if="provider.policy.cancellation_policy">
              <div class="d-flex align-center gap-3 mb-4">
                <div class="icon-box bg-red-50 pa-2 rounded-lg">
                    <VIcon icon="tabler-calendar-cancel" color="error" size="24" />
                </div>
                <h3 class="text-h6 font-weight-black mb-0 text-slate-900">Cancellation Policy</h3>
              </div>
              <div class="pl-14">
                  <p class="text-body-1 text-slate-600 line-height-relaxed">{{ provider.policy.cancellation_policy }}</p>
              </div>
            </div>

            <VDivider class="my-8" />

            <!-- Reschedule -->
            <div class="policy-item mb-10" v-if="provider.policy.reschedule_policy">
              <div class="d-flex align-center gap-3 mb-4">
                <div class="icon-box bg-blue-50 pa-2 rounded-lg">
                    <VIcon icon="tabler-calendar-stats" color="primary" size="24" />
                </div>
                <h3 class="text-h6 font-weight-black mb-0 text-slate-900">Reschedule Policy</h3>
              </div>
              <div class="pl-14">
                  <p class="text-body-1 text-slate-600 line-height-relaxed">{{ provider.policy.reschedule_policy }}</p>
              </div>
            </div>

             <VDivider class="my-8" />

            <!-- House Rules -->
            <div class="policy-item" v-if="provider.policy.house_rules">
              <div class="d-flex align-center gap-3 mb-4">
                <div class="icon-box bg-green-50 pa-2 rounded-lg">
                    <VIcon icon="tabler-home-check" color="success" size="24" />
                </div>
                <h3 class="text-h6 font-weight-black mb-0 text-slate-900">House Rules</h3>
              </div>
              <div class="pl-14">
                  <p class="text-body-1 text-slate-600 line-height-relaxed">{{ provider.policy.house_rules }}</p>
              </div>
            </div>
        </div>
        <div v-else class="text-center py-12">
          <VIcon icon="tabler-shield-off" size="64" color="slate-200" class="mb-4" />
          <p class="text-h6 text-slate-400">No public policies listed.</p>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.text-white { color: white !important; }
.opacity-90 { opacity: 0.9; }
.opacity-20 { opacity: 0.2; }
.bg-gradient-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.25);
}
.text-slate-900 { color: #0f172a; }
.text-slate-600 { color: #475569; }
.text-slate-400 { color: #94a3b8; }
.line-height-relaxed { line-height: 1.75; }

.bg-red-50 { background-color: #fef2f2; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-green-50 { background-color: #f0fdf4; }
</style>
