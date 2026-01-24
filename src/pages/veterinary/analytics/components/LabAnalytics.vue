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
          <span class="text-caption">Lab Requests Received</span>
          <h4 class="text-h4 font-weight-bold my-1 text-primary">
            {{ props.data?.lab_requests_received || 0 }}
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
          <span class="text-caption">Samples Collected</span>
          <h4 class="text-h4 font-weight-bold my-1 text-info">
            {{ props.data?.samples_collected || 0 }}
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
          <span class="text-caption">Reports Completed</span>
          <h4 class="text-h4 font-weight-bold my-1 text-success">
            {{ props.data?.reports_completed || 0 }}
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
          <span class="text-caption">Avg Turnaround Time</span>
          <h4 class="text-h4 font-weight-bold my-1 text-warning">
            {{ props.data?.avg_turnaround_minutes || 0 }} min
          </h4>
          <span class="text-tiny text-medium-emphasis">Order to Report</span>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
