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
          <span class="text-caption">Patients Seen Today</span>
          <h4 class="text-h4 font-weight-bold my-1 text-primary">
            {{ props.data?.patients_seen || 0 }}
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
          <span class="text-caption">Prescriptions Written</span>
          <h4 class="text-h4 font-weight-bold my-1 text-info">
            {{ props.data?.prescriptions_written || 0 }}
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
          <span class="text-caption">Lab Tests Ordered</span>
          <h4 class="text-h4 font-weight-bold my-1 text-warning">
            {{ props.data?.lab_tests_ordered || 0 }}
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
          <span class="text-caption">Lab Reports Reviewed</span>
          <h4 class="text-h4 font-weight-bold my-1 text-success">
            {{ props.data?.lab_reports_reviewed || 0 }}
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
          <span class="text-caption">Pending Patients</span>
          <h4 class="text-h4 font-weight-bold my-1">
            {{ props.data?.pending_patients || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">Waiting for Doctor</span>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
