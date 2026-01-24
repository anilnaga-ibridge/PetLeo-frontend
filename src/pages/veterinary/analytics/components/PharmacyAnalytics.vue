<script setup>
const props = defineProps(['data'])

const formatCurrency = value => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value || 0)
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Patients Served</span>
          <h4 class="text-h4 font-weight-bold my-1 text-primary">
            {{ props.data?.patients_served || 0 }}
          </h4>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Prescriptions Filled</span>
          <h4 class="text-h4 font-weight-bold my-1 text-success">
            {{ props.data?.prescriptions_filled || 0 }}
          </h4>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Medicines Dispensed</span>
          <h4 class="text-h4 font-weight-bold my-1 text-info">
            {{ props.data?.medicines_dispensed || 0 }}
          </h4>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Pharmacy Revenue</span>
          <h4 class="text-h4 font-weight-bold my-1 text-warning">
            {{ formatCurrency(props.data?.revenue) }}
          </h4>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
