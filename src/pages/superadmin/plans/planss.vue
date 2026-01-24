<script>
import { superAdminApi } from "@/plugins/axios"
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"

export default {
  name: "PlansPage",

  setup() {
    const router = useRouter()

    const baseURL = "/api/superadmin/plans/"
    const billingCycleURL = "/api/superadmin/billing-cycles/"
    const rolesURL = "http://127.0.0.1:8000/auth/roles/public/"

    const plans = ref([])

    const headers = [
      { title: "Title", key: "title" },
      { title: "Subtitle", key: "subtitle" },
      { title: "Target Type", key: "target_type" },
      { title: "Billing Cycle", key: "billing_cycle" },
      { title: "Features", key: "features" },
      { title: "Description", key: "description" },
      { title: "Active", key: "is_active" },
      { title: "Actions", key: "actions", sortable: false },
    ]

    const page = ref(1)
    const itemsPerPage = ref(10)
    const totalItems = ref(0)
    const searchQuery = ref("")

    const deleteDialog = ref(false)
    const deleteItem = ref(null)

    const fetchPlans = async () => {
      try {
        const params = {
          page: page.value,
          page_size: itemsPerPage.value,
          search: searchQuery.value,
        }

        const res = await superAdminApi.get(baseURL, { params })

        plans.value = res.data.results || res.data
        totalItems.value = res.data.count ?? res.data.length
      } catch (err) {
        console.error("fetchPlans error:", err)
      }
    }

    onMounted(fetchPlans)
    watch([page, itemsPerPage, searchQuery], fetchPlans)

    const updateOptions = () => fetchPlans()

    const goToAddPlan = () => router.push("/superadmin/plans/addplan")
    const goToEditPlan = id => router.push(`/superadmin/plans/addplan?id=${id}`)

    const openDeleteDialog = item => {
      deleteItem.value = item
      deleteDialog.value = true
    }

    const deletePlan = async () => {
      try {
        await superAdminApi.delete(`${baseURL}${deleteItem.value.id}/`)
        deleteDialog.value = false
        fetchPlans()
      } catch (err) {
        console.error("deletePlan error:", err)
        alert("Failed to delete plan")
      }
    }

    const togglePlanStatus = async item => {
      try {
        await superAdminApi.patch(`${baseURL}${item.id}/`, {
          is_active: item.is_active,
        })
      } catch (err) {
        console.error("togglePlanStatus error:", err)

        // Revert on error
        item.is_active = !item.is_active
        alert("Failed to update plan status")
      }
    }

    return {
      plans,
      headers,
      page,
      itemsPerPage,
      totalItems,
      searchQuery,

      goToAddPlan,
      goToEditPlan,

      deleteDialog,
      deleteItem,
      openDeleteDialog,
      deletePlan,
      updateOptions,
      togglePlanStatus,
    }
  },
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem class="pb-2">
        <VCardTitle class="text-h5 font-weight-bold">
          Plans
        </VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            sm="4"
          >
            <AppTextField
              v-model="searchQuery"
              placeholder="Search plans..."
              prepend-inner-icon="tabler-search"
            />
          </VCol>

          <VCol
            cols="12"
            sm="8"
            class="d-flex justify-end"
          >
            <VBtn
              color="primary"
              prepend-icon="tabler-plus"
              class="px-6"
              @click="goToAddPlan"
            >
              Add Plan
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <!-- TABLE -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items="plans"
        :items-length="totalItems"
        :headers="headers"
        class="text-no-wrap"
        hover
        density="comfortable"
        @update:options="updateOptions"
      >
        <!-- Title -->
        <template #item.title="{ item }">
          <div class="d-flex align-center">
            <VAvatar
              size="32"
              color="primary"
              variant="tonal"
              class="me-2"
            >
              <VIcon
                icon="tabler-file-certificate"
                size="18"
              />
            </VAvatar>
            <div>
              <div class="font-weight-medium">
                {{ item.title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.subtitle }}
              </div>
            </div>
          </div>
        </template>

        <!-- Target Type -->
        <template #item.target_type="{ item }">
          <VChip
            size="small"
            label
            color="info"
            variant="tonal"
            class="text-capitalize"
          >
            {{ item.target_type }}
          </VChip>
        </template>

        <!-- Billing Cycle -->
        <template #item.billing_cycle="{ item }">
          <div class="d-flex align-center gap-1">
            <VIcon
              icon="tabler-calendar-repeat"
              size="14"
              class="text-medium-emphasis"
            />
            <span>{{ item.billing_cycle }}</span>
          </div>
        </template>

        <!-- Features -->
        <template #item.features="{ item }">
          <div
            class="d-flex flex-wrap gap-1"
            style="max-width: 250px;"
          >
            <VChip
              v-for="(f, i) in item.features.slice(0, 3)"
              :key="i"
              size="x-small"
              color="primary"
              variant="tonal"
            >
              {{ f }}
            </VChip>
            <VChip
              v-if="item.features.length > 3"
              size="x-small"
              color="grey"
              variant="tonal"
            >
              +{{ item.features.length - 3 }} more
            </VChip>
          </div>
        </template>

        <!-- Description -->
        <template #item.description="{ item }">
          <div
            class="text-truncate"
            style="max-width: 200px;"
            :title="item.description"
          >
            {{ item.description }}
          </div>
        </template>

        <!-- Active / Inactive -->
        <template #item.is_active="{ item }">
          <VSwitch
            v-model="item.is_active"
            density="compact"
            color="success"
            hide-details
            @update:model-value="togglePlanStatus(item)"
          />
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="goToEditPlan(item.id)">
              <VIcon icon="tabler-edit" />
            </IconBtn>

            <IconBtn
              color="error"
              @click="openDeleteDialog(item)"
            >
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </div>
        </template>

        <!-- Pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
          />
        </template>
      </VDataTableServer>
    </VCard>

    <!-- DELETE CONFIRMATION -->
    <VDialog
      v-model="deleteDialog"
      width="420"
      transition="dialog-bottom-transition"
    >
      <VCard
        class="pa-4 rounded-xl"
        elevation="10"
      >
        <div class="text-center mb-3">
          <VAvatar
            size="60"
            color="error"
            variant="tonal"
            class="mb-3"
          >
            <VIcon
              icon="tabler-alert-triangle"
              size="32"
            />
          </VAvatar>

          <h3 class="text-h6 font-weight-bold">
            Delete Plan?
          </h3>
          <p class="text-body-2 mt-1 text-medium-emphasis">
            Are you sure you want to delete <br>
            <strong class="text-primary">{{ deleteItem?.title }}</strong>?
          </p>
        </div>

        <VDivider class="my-3" />

        <div class="d-flex justify-end gap-2">
          <VBtn
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            prepend-icon="tabler-trash"
            @click="deletePlan"
          >
            Delete
          </VBtn>
        </div>
      </VCard>
    </VDialog>
  </section>
</template>


