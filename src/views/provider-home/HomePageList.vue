<template>
  <div>
    <div class="d-flex justify-end mb-3">
      <v-btn color="primary" @click="$router.push('/superadmin/provider-home/create')">
        + Create Home Page
      </v-btn>
    </div>

    <v-card>
      <v-card-title>Provider Home Pages</v-card-title>

      <v-data-table
        :headers="headers"
        :items="pages"
        :loading="loading"
      >
        <template #item.actions="{ item }">
          <v-btn icon @click="editPage(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>

          <v-btn icon color="red" @click="deletePage(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "./api";

const pages = ref([]);
const loading = ref(false);

const headers = [
  { title: "Slug", key: "slug" },
  { title: "Provider Type", key: "provider_type" },
  { title: "Published", key: "is_published" },
  { title: "Updated", key: "updated_at" },
  { title: "Actions", key: "actions", sortable: false }
];

onMounted(loadPages);

function loadPages() {
  loading.value = true;
  api.getPages().then(res => {
    pages.value = res.data;
  }).finally(() => loading.value = false);
}

function editPage(item) {
  router.push(`/superadmin/provider-home/${item.id}`);
}

function deletePage(item) {
  if (!confirm("Delete this homepage?")) return;

  api.deletePage(item.id).then(() => {
    loadPages();
  });
}
</script>
