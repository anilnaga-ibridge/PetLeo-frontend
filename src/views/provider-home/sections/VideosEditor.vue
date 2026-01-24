<template>
  <div>
    <VBtn
      color="primary"
      @click="openAdd"
    >
      + Add Video
    </VBtn>

    <VDialog
      v-model="dialog"
      width="600"
    >
      <VCard class="pa-4">
        <VTextField
          v-model="form.title"
          label="Video Title"
        />
        <VTextField
          v-model="form.url"
          label="Video URL"
        />
        <VTextField
          v-model="form.thumbnail"
          label="Thumbnail URL"
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
  api.addVideo(props.homeId, form.value).then(() => {
    dialog.value = false
    alert("Video added")
  })
}
</script>
