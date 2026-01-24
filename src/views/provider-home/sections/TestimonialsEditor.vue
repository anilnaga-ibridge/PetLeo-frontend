<template>
  <div>
    <VBtn
      color="primary"
      @click="openAdd"
    >
      + Add Testimonial
    </VBtn>

    <VDialog
      v-model="dialog"
      width="600"
    >
      <VCard class="pa-4">
        <VTextField
          v-model="form.name"
          label="Name"
        />
        <VTextField
          v-model="form.role"
          label="Role / Business"
        />
        <VTextarea
          v-model="form.review"
          label="Review"
        />
        <VTextField
          v-model="form.image"
          label="Image URL"
        />
        <VTextField
          v-model="form.rating"
          type="number"
          label="Rating (1–5)"
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
  api.addTestimonial(props.homeId, form.value).then(() => {
    dialog.value = false
    alert("Testimonial added")
  })
}
</script>
