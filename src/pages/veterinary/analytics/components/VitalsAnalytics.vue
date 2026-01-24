<script setup>
const props = defineProps(['data'])
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Patients Received</span>
          <h4 class="text-h4 font-weight-bold my-1">
            {{ props.data?.patients_received || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">From Reception</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Vitals Completed</span>
          <h4 class="text-h4 font-weight-bold my-1 text-success">
            {{ props.data?.vitals_completed || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">Ready for Doctor</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Pending Vitals</span>
          <h4 class="text-h4 font-weight-bold my-1 text-warning">
            {{ props.data?.pending_vitals || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">Queue</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Avg Time per Patient</span>
          <h4 class="text-h4 font-weight-bold my-1 text-info">
            {{ props.data?.avg_time_minutes || 0 }} min
          </h4>
          <span class="text-tiny text-medium-emphasis">Efficiency Metric</span>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
