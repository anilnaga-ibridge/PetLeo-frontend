<script setup>
import { ref, watch, onMounted } from 'vue'
import { useVeterinaryStore } from '@/stores/veterinaryStore'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Medicine Name',
  },
})

const emit = defineEmits(['update:modelValue', 'suggestion-selected'])

const store = useVeterinaryStore()
const search = ref('')
const selectedItem = ref(props.modelValue)
const items = ref([])
const loading = ref(false)
const debounceTimeout = ref(null)

const fetchSuggestions = async query => {
  if (!query || query.length < 3) {
    items.value = []
    
    return
  }
  
  loading.value = true
  try {
    const suggestions = await store.aiSuggestMedicine(query)


    // Map to Vuetify expected format + keep raw data
    items.value = suggestions.map(item => ({
      title: item.medicine_name,
      subtitle: `${item.dosage} | ${item.frequency}`,
      value: item.medicine_name,
      raw: item,
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

watch(search, val => {
  if (val && val !== selectedItem.value) {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = setTimeout(() => {
      fetchSuggestions(val)
    }, 500)
  }
})

watch(() => props.modelValue, val => {
  selectedItem.value = val
})

const onChange = val => {
  // If val is an object (due to select), extract the value
  const value = (val && typeof val === 'object') ? val.value : val
  
  emit('update:modelValue', value)

  // Find full object to emit structured data to form for auto-fill
  const selectedObj = items.value.find(i => i.value === value)
  if (selectedObj) {
    emit('suggestion-selected', selectedObj.raw)
  }
}
</script>

<template>
  <VCombobox
    v-model="selectedItem"
    v-model:search="search"
    :items="items"
    :loading="loading"
    :label="label"
    variant="outlined"
    item-title="title"
    item-value="value"
    hide-no-data
    hide-selected
    clearable
    placeholder="Type medicine name..."
    @update:model-value="onChange"
  >
    <template #append-inner>
      <VIcon
        v-if="search && search.length >= 3"
        icon="tabler-sparkles"
        color="secondary"
        class="mr-2"
        size="small"
      />
    </template>

    <template #item="{ props, item }">
      <VListItem
        v-bind="props"
        :title="item.raw.title"
      >
        <template #subtitle>
          <div class="text-caption text-secondary mt-1 fontWeight-bold">
            <VIcon
              icon="tabler-pill"
              size="x-small"
              class="mr-1"
            />
            {{ item.raw.subtitle }}
          </div>
        </template>
      </VListItem>
    </template>
  </VCombobox>
</template>
