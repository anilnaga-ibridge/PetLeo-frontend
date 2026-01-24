<template>
  <div>
    <VBtn
      color="primary"
      @click="openAdd"
    >
      + Add Hero Banner
    </VBtn>

    <VDialog
      v-model="dialog"
      width="600"
    >
      <VCard class="pa-4">
        <VTextField
          v-model="form.title"
          label="Title"
        />
        <VTextField
          v-model="form.subtitle"
          label="Subtitle"
        />
        <VTextarea
          v-model="form.description"
          label="Description"
        />
        <VTextField
          v-model="form.image"
          label="Image URL"
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
  api.addHero(props.homeId, form.value).then(() => {
    dialog.value = false
    alert("Hero banner added")
  })
}
</script>
