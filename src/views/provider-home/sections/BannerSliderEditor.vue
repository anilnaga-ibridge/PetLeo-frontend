<template>
  <div>
    <v-btn color="primary" @click="openAdd">+ Add Slide</v-btn>

    <v-dialog v-model="dialog" width="600">
      <v-card class="pa-4">
        <v-text-field v-model="form.image" label="Image URL" />
        <v-text-field v-model="form.title" label="Title" />
        <v-text-field v-model="form.subtitle" label="Subtitle" />
        <v-text-field v-model="form.cta_text" label="CTA Text" />
        <v-text-field v-model="form.cta_url" label="CTA URL" />

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
  api.addSlide(props.homeId, form.value).then(() => {
    dialog.value = false;
    alert("Slide added");
  });
}
</script>
