<template>
  <div>
    <VBtn
      color="primary"
      @click="openAdd"
    >
      + Add Feature
    </VBtn>

    <VDialog
      v-model="dialog"
      width="600"
    >
      <VCard class="pa-4">
        <VTextField
          v-model="form.icon"
          label="Icon (mdi-…)"
        />
        <VTextField
          v-model="form.title"
          label="Title"
        />
        <VTextarea
          v-model="form.description"
          label="Description"
        />

        <VBtn
          color="primary"
          @click="save"
        >
          Save
        </VBtn>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup>
import { ref } from "vue"
import api from "../api"

const props = defineProps({
  homeId: String,
})

const dialog = ref(false)
const form = ref({})

function openAdd() {
  dialog.value = true
  form.value = {}
}

function save() {
  api.addFeature(props.homeId, form.value).then(() => {
    dialog.value = false
    alert("Feature added")
  })
}
</script>
