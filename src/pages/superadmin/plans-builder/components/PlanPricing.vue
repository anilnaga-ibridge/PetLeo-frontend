<script setup>
import { ref, watch, onMounted } from 'vue'
import { superAdminApi } from '@/plugins/axios'

const props = defineProps(['planId'])
const emit = defineEmits(['saved'])

const loading = ref(false)
const saving = ref(false)

const form = ref({
  price: 0,
  features: [], // Marketing features
})

const fetchPlan = async () => {
  if (!props.planId) return

  loading.value = true
  try {
    const res = await superAdminApi.get(`/api/superadmin/plans/${props.planId}/`)

    form.value.price = res.data.price
    form.value.features = res.data.features || []
  } catch (err) {
    console.error('Failed to fetch plan:', err)
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!props.planId) return
  saving.value = true
  try {
    const res = await superAdminApi.patch(`/api/superadmin/plans/${props.planId}/`, {
      price: form.value.price,
      features: form.value.features,
    })

    emit('saved', res.data)
  } catch (err) {
    console.error('Failed to save pricing:', err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchPlan)
watch(() => props.planId, fetchPlan)
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div
      v-if="!props.planId"
      class="d-flex flex-column align-center justify-center h-100 text-center pa-12"
    >
      <VIcon
        icon="tabler-arrow-left"
        size="48"
        color="medium-emphasis"
        class="mb-4"
      />
      <h3 class="text-h5 font-weight-bold mb-2">
        Select a Plan
      </h3>
      <p class="text-body-1 text-medium-emphasis">
        Please create or select a plan to configure its pricing.
      </p>
    </div>

    <template v-else>
      <div class="pa-6 flex-grow-1 overflow-y-auto">
        <VRow>
          <VCol
            cols="12"
            md="8"
          >
            <VCard
              variant="outlined"
              class="mb-6"
            >
              <VCardItem>
                <template #prepend>
                  <VIcon
                    icon="tabler-currency-dollar"
                    class="text-primary"
                  />
                </template>
                <VCardTitle>Pricing Strategy</VCardTitle>
                <VCardSubtitle>Set the price for this plan.</VCardSubtitle>
              </VCardItem>
              
              <VCardText class="pt-4">
                <VRow>
                  <VCol cols="12">
                    <AppTextField
                      v-model.number="form.price"
                      label="Price (₹)"
                      type="number"
                      placeholder="0.00"
                      prefix="₹"
                      required
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <VCard variant="outlined">
              <VCardItem>
                <template #prepend>
                  <VIcon
                    icon="tabler-list-check"
                    class="text-primary"
                  />
                </template>
                <VCardTitle>Marketing Features</VCardTitle>
                <VCardSubtitle>List features to display on the pricing page.</VCardSubtitle>
              </VCardItem>
              
              <VCardText class="pt-4">
                <div class="d-flex flex-wrap gap-2 mb-4">
                  <VChip
                    v-for="(feature, i) in form.features"
                    :key="i"
                    closable
                    size="small"
                    @click:close="form.features.splice(i, 1)"
                  >
                    {{ feature }}
                  </VChip>
                </div>
                <AppTextField
                  placeholder="Add a feature and press Enter"
                  @keyup.enter="(e) => { if(e.target.value) { form.features.push(e.target.value); e.target.value = '' } }"
                />
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>

      <div class="pa-4 border-t bg-surface d-flex justify-end">
        <VBtn
          color="primary"
          :loading="saving"
          prepend-icon="tabler-device-floppy"
          @click="save"
        >
          Save Changes
        </VBtn>
      </div>
    </template>
  </div>
</template>
