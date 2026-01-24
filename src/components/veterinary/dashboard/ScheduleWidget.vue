

<template>
  <VCard
    title="Today's Schedule"
    class="h-100 border"
    elevation="0"
  >
    <VCardText
      class="d-flex align-center justify-center"
      style="min-height: 300px;"
    >
      <div class="text-center text-medium-emphasis">
        <VIcon
          icon="tabler-calendar"
          size="48"
          class="mb-2 opacity-50"
        />
        <p>No appointments scheduled for today.</p>
        <VBtn
          variant="text"
          color="primary"
          class="mt-2"
        >
          View Full Schedule
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
