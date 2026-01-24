<template>
  <div>
    <VBtn
      color="primary"
      @click="openAdd"
    >
      + Add Slide
    </VBtn>

    <VDialog
      v-model="dialog"
      width="600"
    >
      <VCard class="pa-4">
        <VTextField
          v-model="form.image"
          label="Image URL"
        />
        <VTextField
          v-model="form.title"
          label="Title"
        />
        <VTextField
          v-model="form.subtitle"
          label="Subtitle"
        />
        <VTextField
          v-model="form.cta_text"
          label="CTA Text"
        />
        <VTextField
          v-model="form.cta_url"
          label="CTA URL"
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
  api.addSlide(props.homeId, form.value).then(() => {
    dialog.value = false
    alert("Slide added")
  })
}
</script>
