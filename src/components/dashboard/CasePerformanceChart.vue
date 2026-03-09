<script setup>
import { computed } from 'vue'

const props = defineProps({
  scope: {
    type: String,
    default: 'CLINIC',
  },
  data: {
    type: Array,
    default: null,
  },
})

const chartOptions = computed(() => {
  return {
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      animations: {
        enabled: false,
      },
    },
    labels: ['Completed', 'In Progress', 'Pending'],
    colors: ['#2E8B57', '#FFB300', '#F87171'],
    stroke: {
      width: 1,
      colors: ['transparent'],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom',
      fontSize: '14px',
      markers: {
        radius: 12,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 8,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              fontSize: '14px',
            },
            value: {
              fontSize: '24px',
              fontFamily: 'inherit',
              fontWeight: 700,
              color: '#374151',
            },
            total: {
              show: true,
              showAlways: true,
              label: props.scope === 'PERSONAL' ? 'Your Total' : 'Total Cases',
              fontSize: '14px',
              color: '#6b7280',
            },
          },
        },
      },
    },
  }
})

const series = computed(() => {
  if (props.data) return props.data
  return props.scope === 'PERSONAL' ? [8, 2, 4] : [45, 15, 20]
})
</script>

<template>
  <VCard
    elevation="0"
    border
    class="rounded-xl h-100"
  >
    <VCardItem class="pb-0">
      <VCardTitle class="text-h6 font-weight-bold">
        Case Performance
      </VCardTitle>
      <VCardSubtitle class="text-caption">
        Proportions of today's workload
      </VCardSubtitle>
    </VCardItem>

    <VCardText class="d-flex align-center justify-center pt-4">
      <VueApexCharts
        type="donut"
        height="320"
        :options="chartOptions"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>
