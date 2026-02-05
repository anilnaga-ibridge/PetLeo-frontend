<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'

const props = defineProps({
  data: {
    type: Array, // [{ date: '2024-02-01', visits: 10 }]
    default: () => [],
  },
})

const theme = useTheme()

const series = computed(() => [{
  name: 'Visits',
  data: props.data.map(d => d.visits)
}])

const chartOptions = computed(() => {
  const primaryColor = theme.current.value.colors.primary
  
  return {
    chart: {
      type: 'area',
      height: 300,
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2, colors: [primaryColor] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    colors: [primaryColor],
    xaxis: {
      categories: props.data.map(d => d.date),
      labels: { style: { colors: theme.current.value.colors.secondary } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { show: false }, // Cleaner look
    },
    grid: {
      show: false, // Minimalist
    },
    tooltip: {
      theme: 'dark'
    }
  }
})
</script>

<template>
  <VCard class="border" elevation="0">
    <VCardItem>
      <VCardTitle>Weekly Traffic</VCardTitle>
      <VCardSubtitle>Visits over the last 7 days</VCardSubtitle>
    </VCardItem>
    <div class="px-4 pb-4">
      <VueApexCharts
        type="area"
        height="300"
        :options="chartOptions"
        :series="series"
      />
    </div>
  </VCard>
</template>
