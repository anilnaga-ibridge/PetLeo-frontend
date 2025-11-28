<template>
  <div>
    <v-btn color="primary" @click="openAdd">+ Add Image</v-btn>

    <v-dialog v-model="dialog" width="600">
      <v-card class="pa-4">
        <v-text-field v-model="form.image" label="Image URL" />
        <v-text-field v-model="form.caption" label="Caption" />

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
  api.addImage(props.homeId, form.value).then(() => {
    dialog.value = false;
    alert("Gallery image added");
  });
}
</script>
