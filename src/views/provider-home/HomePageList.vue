<template>
  <div>
    <div class="d-flex justify-end mb-3">
      <VBtn
        color="primary"
        @click="$router.push('/superadmin/provider-home/create')"
      >
        + Create Home Page
      </VBtn>
    </div>

    <VCard>
      <VCardTitle>Provider Home Pages</VCardTitle>

      <VDataTable
        :headers="headers"
        :items="pages"
        :loading="loading"
      >
        <template #item.actions="{ item }">
          <VBtn
            icon
            @click="editPage(item)"
          >
            <VIcon>mdi-pencil</VIcon>
          </VBtn>

          <VBtn
            icon
            color="red"
            @click="deletePage(item)"
          >
            <VIcon>mdi-delete</VIcon>
          </VBtn>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "./api"

const pages = ref([])
const loading = ref(false)

const headers = [
  { title: "Slug", key: "slug" },
  { title: "Provider Type", key: "provider_type" },
  { title: "Published", key: "is_published" },
  { title: "Updated", key: "updated_at" },
  { title: "Actions", key: "actions", sortable: false },
]

onMounted(loadPages)

function loadPages() {
  loading.value = true
  api.getPages().then(res => {
    pages.value = res.data
  }).finally(() => loading.value = false)
}

function editPage(item) {
  router.push(`/superadmin/provider-home/${item.id}`)
}

function deletePage(item) {
  if (!confirm("Delete this homepage?")) return

  api.deletePage(item.id).then(() => {
    loadPages()
  })
}
</script>
