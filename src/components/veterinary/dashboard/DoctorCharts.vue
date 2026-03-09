<script setup>
import { computed } from 'vue'

const props = defineProps({
  barData: {
    type: Object,
    default: () => null,
  },
})

// BAR CHART CONFIG (Monthly Registered Users / Patients)
const barOptions = {
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      columnWidth: '40%',
      borderRadius: 4,
      distributed: true, // Color each bar differently
    },
  },
  colors: [
    '#008FFB',
    '#00E396',
    '#FEB019',
    '#FF4560', 
    '#775DD0',
    '#546E7A',
    '#26a69a',
    '#D10CE8',
    '#008FFB',
    '#00E396',
    '#FEB019',
    '#FF4560',
  ],
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    labels: { style: { colors: '#9e9e9e', fontSize: '12px' } },
  },
  yaxis: {
    labels: { style: { colors: '#9e9e9e' } },
  },
  grid: { strokeDashArray: 4, borderColor: '#e0e0e0' },
}

const barSeries = computed(() => {
  return [{
    name: 'Patients',
    data: props.barData?.monthly || [60, 75, 60, 85, 70, 78, 58, 70, 42, 5, 2, 4],
  }]
})

// RADIAL CHART CONFIG (Mini earning indicators)
const radialOptionsFirstHalf = {
  chart: { type: 'radialBar', sparkline: { enabled: true } },
  plotOptions: {
    radialBar: {
      hollow: { size: '60%' },
      dataLabels: {
        name: { show: false },
        value: { fontSize: '14px', fontWeight: 'bold', offsetY: 5 },
      },
    },
  },
  colors: ['#008FFB'], // Blue
}

const radialOptionsSecondHalf = {
  ...radialOptionsFirstHalf,
  colors: ['#FEB019'], // Yellow
}
</script>

<template>
  <VRow>
    <!-- BAR CHART (8 cols) -->
    <VCol
      cols="12"
      md="8"
    >
      <VCard
        class="h-100"
        elevation="1"
      >
        <VCardText>
          <div class="text-subtitle-1 text-center font-weight-medium mb-4">
            Monthly Registered Users
          </div>
          <VueApexCharts
            type="bar"
            height="300"
            :options="barOptions"
            :series="barSeries"
          />
        </VCardText>
      </VCard>
    </VCol>

    <!-- EARNINGS CARD (4 cols) -->
    <VCol
      cols="12"
      md="4"
    >
      <VCard
        class="h-100"
        elevation="1"
      >
        <VCardText>
          <div class="d-flex justify-space-between align-start mb-6">
            <div class="text-subtitle-1 font-weight-medium">
              Monthly Earning
            </div>
            <div class="d-flex rounded bg-grey-100 px-1 py-1">
              <VBtn
                size="small"
                variant="flat"
                color="primary"
                class="rounded text-capitalize px-4"
              >
                Weekly
              </VBtn>
              <VBtn
                size="small"
                variant="text"
                class="rounded text-capitalize px-4 text-medium-emphasis"
              >
                Monthly
              </VBtn>
            </div>
          </div>

          <div class="text-caption text-medium-emphasis mb-1">
            This Week
          </div>
          <div class="text-h3 font-weight-bold mb-2">
            $29.5
          </div>
          <div class="text-caption text-error mb-6">
            <span class="font-weight-medium">-31.08%</span> From Previous week
          </div>

          <div class="d-flex justify-space-around mt-8">
            <!-- First half analytics -->
            <div class="text-center">
              <VueApexCharts
                type="radialBar"
                height="100"
                :options="radialOptionsFirstHalf"
                :series="[40]"
              />
              <div class="text-caption text-medium-emphasis mt-2">
                1st 15 days Analytics
              </div>
            </div>

            <!-- Second half analytics -->
            <div class="text-center">
              <VueApexCharts
                type="radialBar"
                height="100"
                :options="radialOptionsSecondHalf"
                :series="[30]"
              />
              <div class="text-caption text-medium-emphasis mt-2">
                last 15 days Analytics
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
