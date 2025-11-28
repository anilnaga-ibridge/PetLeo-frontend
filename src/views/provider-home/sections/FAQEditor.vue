<template>
  <div>
    <v-btn color="primary" @click="openAdd">+ Add FAQ</v-btn>

    <v-dialog v-model="dialog" width="600">
      <v-card class="pa-4">
        <v-text-field v-model="form.question" label="Question" />
        <v-textarea v-model="form.answer" label="Answer" />

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
  api.addFAQ(props.homeId, form.value).then(() => {
    dialog.value = false;
    alert("FAQ added");
  });
}
</script>
