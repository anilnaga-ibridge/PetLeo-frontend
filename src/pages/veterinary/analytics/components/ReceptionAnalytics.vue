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
          <span class="text-caption">Today's Visits</span>
          <h4 class="text-h4 font-weight-bold my-1 text-primary">
            {{ props.data?.today_visits || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">
            vs {{ props.data?.yesterday_visits || 0 }} yesterday
          </span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Checked In</span>
          <h4 class="text-h4 font-weight-bold my-1 text-success">
            {{ props.data?.checked_in || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">Moved to Vitals</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Pending Check-in</span>
          <h4 class="text-h4 font-weight-bold my-1 text-warning">
            {{ props.data?.pending || 0 }}
          </h4>
          <span class="text-tiny text-medium-emphasis">In Queue</span>
        </VCardText>
      </VCard>
    </VCol>

    <VCol
      cols="12"
      md="3"
    >
      <VCard>
        <VCardText>
          <span class="text-caption">Cancelled / No Show</span>
          <h4 class="text-h4 font-weight-bold my-1 text-error">
            {{ props.data?.cancelled || 0 }}
          </h4>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
