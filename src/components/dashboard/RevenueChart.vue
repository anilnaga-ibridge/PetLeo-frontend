<script setup>
import { computed } from 'vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
  },
  data: {
    type: Array,
    default: () => [42000, 48000, 55000, 51000, 60000, 72000],
  },
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: { enabled: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: ['#2E8B57'],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: props.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '13px',
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          if (typeof value !== 'number') return value
          return `$${value / 1000}k`
        },
        style: {
          colors: '#6b7280',
          fontSize: '13px',
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: '#f3f4f6',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: value => `$${value.toLocaleString()}`,
        title: {
          formatter: () => 'Revenue: ',
        },
      },
    },
  }
})

const series = computed(() => [{
  name: 'Revenue',
  data: props.data,
}])
</script>

<template>
  <VCard
    elevation="0"
    border
    class="rounded-xl h-100"
  >
    <VCardItem>
      <div class="d-flex justify-space-between align-center">
        <div>
          <VCardTitle class="text-h6 font-weight-bold">
            Revenue Analytics
          </VCardTitle>
          <VCardSubtitle class="text-caption">
            Monthly clinic revenue overview
          </VCardSubtitle>
        </div>
        <VSelect
          :items="['Last 6 Months', 'This Year']"
          model-value="Last 6 Months"
          variant="plain"
          density="compact"
          class="font-weight-medium bg-surface-variant rounded-lg px-2 max-w-200"
          hide-details
        />
      </div>
    </VCardItem>

    <VCardText class="pt-2">
      <VueApexCharts
        type="bar"
        height="320"
        :options="chartOptions"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>

<style scoped>
.max-w-200 {
  max-width: 160px;
}
</style>
