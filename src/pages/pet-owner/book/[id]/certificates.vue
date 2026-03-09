<script setup>
import { inject } from 'vue'

const provider = inject('provider')
const loading = inject('loading')
</script>

<template>
  <div
    v-if="provider"
    class="certificates-page"
  >
    <div class="mb-12">
      <!-- Header -->
      <div class="section-title-bar d-flex align-center justify-space-between mb-8 pa-6 rounded-xl bg-gradient-blue">
        <div>
          <h2 class="text-h4 font-weight-black text-white mb-1">
            Certifications
          </h2>
          <p class="text-body-2 text-white opacity-90 mb-0">
            Verified professional credentials and licenses
          </p>
        </div>
        <VIcon
          icon="tabler-certificate"
          size="48"
          color="white"
          class="opacity-20"
        />
      </div>

      <!-- Content -->
      <VCard
        flat
        border
        class="rounded-xl pa-8"
      >
        <div v-if="provider.certifications?.length > 0">
          <div class="d-flex flex-column gap-4">
            <VCard 
              v-for="cert in provider.certifications" 
              :key="cert.id"
              variant="tonal" 
              class="pa-6 rounded-xl border-dashed d-flex align-center gap-6"
            >
              <div class="cert-icon-box bg-white pa-4 rounded-lg elevation-2">
                <VIcon
                  icon="tabler-file-certificate"
                  size="40"
                  color="primary"
                />
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-center gap-2 mb-1">
                  <h3 class="text-h6 font-weight-bold mb-0 text-slate-900">
                    {{ cert.title }}
                  </h3>
                  <VIcon
                    v-if="cert.verified_by_admin"
                    icon="tabler-discount-check-filled"
                    color="primary"
                    size="20"
                  />
                </div>
                <p class="text-body-1 text-slate-500 mb-0">
                  {{ cert.issued_by }}
                </p>
                <div
                  v-if="cert.verified_by_admin"
                  class="mt-2"
                >
                  <VChip
                    color="success"
                    size="small"
                    label
                    class="font-weight-bold"
                  >
                    Verified by PetLeo
                  </VChip>
                </div>
              </div>
            </VCard>
          </div>
        </div>
        <div
          v-else
          class="text-center py-12"
        >
          <VIcon
            icon="tabler-certificate-off"
            size="64"
            color="slate-200"
            class="mb-4"
          />
          <p class="text-h6 text-slate-400">
            No public certifications listed.
          </p>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.text-white { color: white !important; }
.opacity-90 { opacity: 0.9; }
.opacity-20 { opacity: 0.2; }
.bg-gradient-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.25);
}
.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
</style>
