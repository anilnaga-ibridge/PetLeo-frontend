<template>
  <div>
    <v-btn color="primary" @click="openAdd">+ Add Testimonial</v-btn>

    <v-dialog v-model="dialog" width="600">
      <v-card class="pa-4">
        <v-text-field v-model="form.name" label="Name" />
        <v-text-field v-model="form.role" label="Role / Business" />
        <v-textarea v-model="form.review" label="Review" />
        <v-text-field v-model="form.image" label="Image URL" />
        <v-text-field
          v-model="form.rating"
          type="number"
          label="Rating (1–5)"
        />

        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "../api";

const props = defineProps({
  homeId: String
});

const dialog = ref(false);
const form = ref({});

function openAdd() {
  dialog.value = true;
  form.value = {};
}

function save() {
  api.addTestimonial(props.homeId, form.value).then(() => {
    dialog.value = false;
    alert("Testimonial added");
  });
}
</script>
