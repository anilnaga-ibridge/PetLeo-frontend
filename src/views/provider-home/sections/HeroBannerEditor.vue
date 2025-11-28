<template>
  <div>
    <v-btn color="primary" @click="openAdd">+ Add Hero Banner</v-btn>

    <v-dialog v-model="dialog" width="600">
      <v-card class="pa-4">
        <v-text-field v-model="form.title" label="Title" />
        <v-text-field v-model="form.subtitle" label="Subtitle" />
        <v-textarea v-model="form.description" label="Description" />
        <v-text-field v-model="form.image" label="Image URL" />
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
  api.addHero(props.homeId, form.value).then(() => {
    dialog.value = false;
    alert("Hero banner added");
  });
}
</script>
