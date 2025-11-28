<script setup>
/**
 * SuperadminFieldBuilder.vue
 * Copy-paste ready:
 * - Fetch roles from ROLES_API
 * - Map role -> target (individual/organization/employee)
 * - Fetch definitions for selected target
 * - Create field (modal)
 * - Edit field (modal)
 * - Delete
 * - Search / filter
 * - Drag & drop reorder + Save Order (PATCH each changed item)
 *
 * Requirements:
 * - axios plugin available at "@/plugins/axios" (your existing plugin)
 */

import { ref, reactive, computed, onMounted } from "vue";
import axios from "@/plugins/axios";
import { useCookie } from "@/@core/composable/useCookie";
// ---------- Config (change if needed) ----------
const ROLES_API = "http://127.0.0.1:8000/auth/roles/public";
const API = "http://127.0.0.1:8003/api/superadmin/definitions/";

// ---------- state ----------
const roles = ref([]);
const selectedTarget = ref(null);
const definitions = ref([]);
const loading = ref(false);
const savingOrder = ref(false);

const search = ref("");
const pageSize = ref(20); // client-side paging
const page = ref(1);

// ---------- form/modal state ----------
const modalOpen = ref(false);
const isEdit = ref(false);
const form = reactive({
  id: null,
  name: "",
  label: "",
  field_type: "",
  is_required: false,
  options: [],
  order: 0,
  help_text: "",
});
const optionInput = ref("");

// ---------- helper lists ----------
const fieldTypes = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Textarea", value: "textarea" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Multiselect", value: "multiselect" },
  { label: "File Upload", value: "file" },
  { label: "Date", value: "date" },
];

// ---------- map backend role name -> target ----------
const roleToTarget = (name) => {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes("individual")) return "individual";
  if (n.includes("organization employee")) return "employee";
  if (n.includes("organization")) return "organization";
  return null;
};

// ---------- fetch roles ----------
const fetchRoles = async () => {
  try {
    const res = await axios.get(ROLES_API);
    roles.value = res.data
      .map((r) => ({ id: r.id, name: r.name, target: roleToTarget(r.name) }))
      .filter((r) => r.target);
    if (!selectedTarget.value && roles.value.length) {
      selectedTarget.value = roles.value[0].target;
    }
  } catch (err) {
    console.error("fetchRoles error", err);
    roles.value = [
      // fallback (if roles api blocked) keep two main targets so UI still usable
      { id: "fallback-ind", name: "Individual", target: "individual" },
      { id: "fallback-org", name: "Organization", target: "organization" },
    ];
    if (!selectedTarget.value) selectedTarget.value = roles.value[0].target;
  }
};

// ---------- fetch definitions ----------
const fetchDefinitions = async () => {
  if (!selectedTarget.value) return;
  loading.value = true;
  try {
    const res = await axios.get(`${API}?target=${selectedTarget.value}`);
    // Ensure order is numeric
    definitions.value = (res.data || []).map((d) => ({ ...d, order: Number(d.order || 0) }));
    // sort by order then label
    definitions.value.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  } catch (err) {
    console.error("fetchDefinitions error", err);
    definitions.value = [];
  } finally {
    loading.value = false;
  }
};

// ---------- search + pagination computed ----------
const filtered = computed(() => {
  if (!search.value) return definitions.value;
  const q = search.value.toLowerCase();
  return definitions.value.filter(
    (d) =>
      (d.label || "").toLowerCase().includes(q) ||
      (d.name || "").toLowerCase().includes(q) ||
      (d.field_type || "").toLowerCase().includes(q)
  );
});

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));

const goPrev = () => { if (page.value > 1) page.value--; };
const goNext = () => { if (page.value < totalPages.value) page.value++; };
const goFirst = () => { page.value = 1; };
const goLast = () => { page.value = totalPages.value; };

// ---------- modal helpers ----------
const openCreateModal = () => {
  isEdit.value = false;
  resetForm();
  modalOpen.value = true;
};

const openEditModal = (def) => {
  isEdit.value = true;
  form.id = def.id;
  form.name = def.name;
  form.label = def.label;
  form.field_type = def.field_type;
  form.is_required = Boolean(def.is_required);
  form.options = Array.isArray(def.options) ? [...def.options] : [];
  form.order = Number(def.order || 0);
  form.help_text = def.help_text || "";
  optionInput.value = "";
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  form.id = null;
  form.name = "";
  form.label = "";
  form.field_type = "";
  form.is_required = false;
  form.options = [];
  form.order = definitions.value.length ? Math.max(...definitions.value.map(d => d.order)) + 1 : 0;
  form.help_text = "";
  optionInput.value = "";
};

// ---------- options helpers ----------
const addOptionToForm = () => {
  const v = (optionInput.value || "").trim();
  if (!v) return;
  if (!form.options.includes(v)) form.options.push(v);
  optionInput.value = "";
};
const removeOptionFromForm = (opt) => {
  form.options = form.options.filter(o => o !== opt);
};

// ---------- create / update ----------
const saveField = async () => {
  // simple validation
  if (!form.name || !form.label || !form.field_type) {
    alert("Please provide machine name, label and type.");
    return;
  }
  const payload = {
    target: selectedTarget.value,
    name: form.name,
    label: form.label,
    field_type: form.field_type,
    is_required: form.is_required,
    options: form.options,
    order: form.order,
    help_text: form.help_text,
  };
  try {
    if (isEdit.value && form.id) {
      await axios.put(`${API}${form.id}/`, payload);
      // update local copy
      const idx = definitions.value.findIndex(d => d.id === form.id);
      if (idx >= 0) definitions.value[idx] = { ...(definitions.value[idx] || {}), ...payload, id: form.id };
      alert("Updated successfully.");
    } else {
      const res = await axios.post(API, payload);
      // push into list
      definitions.value.push(res.data);
      definitions.value.sort((a,b) => a.order - b.order || a.label.localeCompare(b.label));
      alert("Created successfully.");
    }
    closeModal();
  } catch (err) {
    console.error("saveField error", err);
    alert("Failed to save. Check console for details.");
  }
};

// ---------- delete ----------
const deleteDefinition = async (id) => {
  if (!confirm("Delete this field permanently?")) return;
  try {
    await axios.delete(`${API}${id}/`);
    definitions.value = definitions.value.filter(d => d.id !== id);
    alert("Deleted.");
  } catch (err) {
    console.error("deleteDefinition error", err);
    alert("Delete failed.");
  }
};

// ---------- drag & drop (HTML5) ----------
let dragIndex = null;

const onDragStart = (e, idx) => {
  dragIndex = idx;
  e.dataTransfer.effectAllowed = "move";
  // needed for Firefox
  e.dataTransfer.setData("text/plain", String(idx));
  e.currentTarget.classList.add("dragging");
};

const onDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
};

const onDragEnter = (e) => {
  e.currentTarget.classList.add("drag-over");
};

const onDragLeave = (e) => {
  e.currentTarget.classList.remove("drag-over");
};

const onDrop = (e, idx) => {
  e.preventDefault();
  const from = dragIndex !== null ? dragIndex : Number(e.dataTransfer.getData("text/plain"));
  const to = idx;
  if (from === to) {
    cleanupDragClasses();
    return;
  }
  // reorder array
  const arr = [...definitions.value];
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  // reassign order numbers (0-based or 1-based, keep consistent; backend expects order int)
  arr.forEach((it, i) => { it.order = i; });
  definitions.value = arr;
  dragIndex = null;
  cleanupDragClasses();
};

const cleanupDragClasses = () => {
  const els = document.querySelectorAll(".def-item");
  els.forEach(el => {
    el.classList.remove("drag-over");
    el.classList.remove("dragging");
  });
};

// ---------- save order to backend ----------
const saveOrder = async () => {
  // send PATCH for each changed def (we will optimistically send all)
  savingOrder.value = true;
  try {
    // prepare promises
    const promises = definitions.value.map(d => {
      return axios.patch(`${API}${d.id}/`, { order: d.order }).catch(err => {
        console.error("Order patch failed for", d.id, err);
        // don't throw to allow others to complete
      });
    });
    await Promise.all(promises);
    alert("Order saved ✔");
  } catch (err) {
    console.error("saveOrder error", err);
    alert("Failed to save order.");
  } finally {
    savingOrder.value = false;
  }
};

// ---------- lifecycle ----------
onMounted(async () => {
  await fetchRoles();
  await fetchDefinitions();
});
</script>

<template>
  <VContainer class="py-6">

    <!-- ============================= -->
    <!-- PAGE TITLE -->
    <!-- ============================= -->
    <VCard class="pa-4 mb-6" elevation="2">
      <VCardTitle class="text-h5 font-weight-bold" style="color:#6C27FF">
        Dynamic Field Builder — SuperAdmin
      </VCardTitle>
    </VCard>

    <!-- ============================= -->
    <!-- TOP ROW -->
    <!-- ============================= -->
    <VCard elevation="2" class="mb-6">
      <VCardText>

        <VRow class="align-end" no-gutters>

          <!-- ROLE SELECT -->
          <VCol cols="12" sm="3" class="pe-sm-3">
            <span class="text-caption font-weight-medium">Provider Role</span>
            <VSelect
              v-model="selectedTarget"
              :items="roles"
              item-title="name"
              item-value="target"
              variant="outlined"
              density="comfortable"
              @change="fetchDefinitions"
            />
          </VCol>

          <!-- SEARCH -->
          <VCol cols="12" sm="4" class="pe-sm-3 mt-4 mt-sm-0">
            <span class="text-caption font-weight-medium">Search fields</span>
            <VTextField
              v-model="search"
              placeholder="Search by name/label/type…"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
            />
          </VCol>

          <!-- BUTTONS -->
          <VCol cols="12" sm="5" class="d-flex justify-sm-end mt-4 mt-sm-0 gap-3">

            <!-- CREATE -->
            <VBtn :style="{ background:'#6C27FF' }" @click="openCreateModal" size="small">
              + Create
            </VBtn>

            <!-- REFRESH -->
            <VBtn
              variant="tonal"
              size="small"
              :style="{ '--v-theme-overlay-multiplier':'0', background:'#F3E8FF', color:'#6C27FF' }"
              @click="fetchDefinitions"
            >
              Refresh
            </VBtn>

            <!-- SAVE ORDER -->
            <VBtn
              :style="{ background:'#6C27FF' }"
              size="small"
              :disabled="savingOrder || definitions.length === 0"
              @click="saveOrder"
            >
              {{ savingOrder ? "Saving…" : "Save Order" }}
            </VBtn>

          </VCol>
        </VRow>

      </VCardText>
    </VCard>

    <!-- ============================= -->
    <!-- MAIN CONTENT -->
    <!-- ============================= -->
    <VRow>

      <!-- LEFT SIDE LIST -->
      <VCol cols="12" md="8">
        <VCard elevation="2">

          <VCardText>

            <!-- Loading -->
            <div v-if="loading" class="text-center py-10 text-grey">
              <VProgressCircular indeterminate :color="'#6C27FF'" />
              <div class="mt-3">Loading fields…</div>
            </div>

            <!-- Empty -->
            <div v-else-if="filtered.length === 0" class="text-center py-10 text-grey">
              No fields found.
            </div>

            <!-- Field List -->
            <div v-else>

              <div
                v-for="(d, idx) in paginated"
                :key="d.id"
                class="pa-4 mb-3 rounded-lg border d-flex justify-space-between align-start def-item"
                style="border-color: #e5e7eb; background:#fafafa"
                draggable="true"
                @dragstart="(e) => onDragStart(e, (page-1)*pageSize + idx)"
                @dragover="onDragOver"
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @drop="(e) => onDrop(e, (page-1)*pageSize + idx)"
              >

                <!-- Main data -->
                <div>
                  <div class="d-flex align-center flex-wrap gap-2">
                    <span class="font-weight-bold text-body-1">{{ d.label }}</span>
                    <span class="text-grey">({{ d.name }})</span>

                    <VChip
                      size="small"
                      label
                      :style="{ background:'#EFE4FF', color:'#6C27FF' }"
                    >
                      {{ d.field_type }}
                    </VChip>
                  </div>

                  <div class="mt-2 text-caption text-grey-darken-1 d-flex flex-wrap gap-4">
                    <div>Required: <b>{{ d.is_required ? "Yes" : "No" }}</b></div>
                    <div>Order: <b>{{ d.order }}</b></div>
                    <div v-if="d.options?.length">Options: {{ d.options.join(", ") }}</div>
                  </div>
                </div>

                <!-- ACTION BUTTONS -->
                <div class="d-flex flex-column gap-2">
                  <VBtn
                    size="x-small"
                    :style="{ background:'#6C27FF' }"
                    @click="openEditModal(d)"
                  >
                    Edit
                  </VBtn>

                  <VBtn
                    size="x-small"
                    color="red-darken-2"
                    @click="deleteDefinition(d.id)"
                  >
                    Delete
                  </VBtn>
                </div>

              </div>

            </div>

            <!-- Pagination -->
            <div class="d-flex justify-center mt-6" v-if="totalPages > 1">
              <VBtn size="small" :style="{ background:'#6C27FF' }" @click="goFirst" :disabled="page === 1">«</VBtn>
              <VBtn size="small" :style="{ background:'#6C27FF' }" @click="goPrev" :disabled="page === 1">‹</VBtn>

              <div class="px-4 py-1 text-body-2">
                Page {{ page }} / {{ totalPages }}
              </div>

              <VBtn size="small" :style="{ background:'#6C27FF' }" @click="goNext" :disabled="page === totalPages">›</VBtn>
              <VBtn size="small" :style="{ background:'#6C27FF' }" @click="goLast" :disabled="page === totalPages">»</VBtn>
            </div>

          </VCardText>

        </VCard>
      </VCol>

      <!-- ============================= -->
      <!-- RIGHT PANEL -->
      <!-- ============================= -->
      <VCol cols="12" md="4">
  <VCard elevation="3" class="pa-5 preview-card">

    <!-- Title -->
    <div class="d-flex align-center mb-4">
      <VAvatar size="36" color="purple-lighten-4">
        <VIcon icon="mdi-lightbulb-on-outline" color="purple-darken-2" />
      </VAvatar>
      <h3 class="text-h6 font-weight-bold ms-3 text-purple-darken-3">
        Preview & Tips
      </h3>
    </div>

    <!-- Tips -->
    <div class="tip-box mb-4">
      <VIcon icon="mdi-dots-grid" size="20" color="purple-darken-2" class="me-2" />
      <span>Drag fields to reorder. Don’t forget to save the order.</span>
    </div>

    <div class="tip-box mb-4">
      <VIcon icon="mdi-format-list-bulleted" size="20" color="purple-darken-2" class="me-2" />
      <span>Dropdown & multiselect require options.</span>
    </div>

    <VDivider class="my-4" />

    <!-- Validation -->
    <h4 class="text-subtitle-1 font-weight-bold mb-3 text-purple-darken-3">
      Quick Validation
    </h4>

    <VList density="comfortable" nav class="rounded-lg">
      <VListItem>
        <template #prepend>
          <VIcon icon="mdi-check-circle-outline" color="purple-darken-2" />
        </template>
        <VListItemTitle>Machine name: lowercase, use underscores</VListItemTitle>
      </VListItem>

      <VListItem>
        <template #prepend>
          <VIcon icon="mdi-check-circle-outline" color="purple-darken-2" />
        </template>
        <VListItemTitle>Label must be user friendly</VListItemTitle>
      </VListItem>

      <VListItem>
        <template #prepend>
          <VIcon icon="mdi-check-circle-outline" color="purple-darken-2" />
        </template>
        <VListItemTitle>Order: smaller number appears earlier</VListItemTitle>
      </VListItem>
    </VList>

  </VCard>
</VCol>


    </VRow>

    <!-- ============================= -->
    <!-- CREATE / EDIT MODAL -->
    <!-- ============================= -->
   <VDialog v-model="modalOpen" max-width="650">
  <VCard elevation="8" class="rounded-lg">

    <!-- HEADER -->
    <VCardTitle
      class="d-flex justify-space-between align-center px-5 py-4"
      style="background:#F5EDFF; border-bottom:1px solid #E8D8FF;"
    >
      <span class="text-h6 font-weight-bold" style="color:#6C27FF">
        {{ isEdit ? "Edit Field" : "Create Field" }}
      </span>

      <VBtn icon variant="text" @click="closeModal">
        <VIcon icon="mdi-close" size="26" color="purple-darken-2" />
      </VBtn>
    </VCardTitle>

    <!-- BODY -->
    <VCardText class="px-5 py-4">

      <VRow>
        <!-- Machine Name -->
        <VCol cols="12" sm="6">
          <VTextField
            v-model="form.name"
            label="Machine Name *"
            placeholder="business_license_no"
            variant="outlined"
            density="comfortable"
          />
        </VCol>

        <!-- Label -->
        <VCol cols="12" sm="6">
          <VTextField
            v-model="form.label"
            label="Label *"
            placeholder="UI label"
            variant="outlined"
            density="comfortable"
          />
        </VCol>

        <!-- Field Type -->
        <VCol cols="12" sm="6">
          <VSelect
            v-model="form.field_type"
            :items="fieldTypes"
            item-title="label"
            item-value="value"
            label="Field Type *"
            variant="outlined"
            density="comfortable"
          />
        </VCol>

        <!-- Order -->
        <VCol cols="12" sm="6">
          <VTextField
            v-model.number="form.order"
            label="Order"
            placeholder="0"
            type="number"
            variant="outlined"
            density="comfortable"
          />
        </VCol>
      </VRow>

      <!-- OPTIONS for dropdown / multiselect -->
      <div v-if="['dropdown','multiselect'].includes(form.field_type)" class="mt-4">
        <h4 class="text-subtitle-2 font-weight-bold mb-2">Options</h4>

        <div class="d-flex gap-3">
          <VTextField
            v-model="optionInput"
            label="Add Option"
            placeholder="Type option and Enter"
            variant="outlined"
            density="comfortable"
            class="flex-grow-1"
            @keyup.enter="addOptionToForm"
          />

          <VBtn
            size="small"
            style="background:#6C27FF"
            @click="addOptionToForm"
          >
            Add
          </VBtn>
        </div>

        <!-- OPTION CHIPS -->
        <div class="d-flex flex-wrap gap-2 mt-3">
          <VChip
            v-for="o in form.options"
            :key="o"
            closable
            class="bg-purple-lighten-5 text-purple-darken-3"
            @click:close="removeOptionFromForm(o)"
            size="small"
          >
            {{ o }}
          </VChip>
        </div>
      </div>

      <!-- Help Text -->
      <VTextField
        v-model="form.help_text"
        label="Help Text"
        placeholder="Optional guidance"
        variant="outlined"
        density="comfortable"
        class="mt-4"
      />

      <!-- Required -->
      <VCheckbox
        v-model="form.is_required"
        label="Required Field"
        color="purple-darken-2"
        class="mt-1"
      />

    </VCardText>

    <!-- FOOTER BUTTONS -->
    <VCardActions
      class="px-5 py-4 justify-end"
      style="border-top:1px solid #EFE8FF"
    >
      <VBtn variant="text" size="small" @click="closeModal">
        Cancel
      </VBtn>

          <VBtn
        size="small"
        class="purple-btn"
        @click="saveField"
      >

        {{ isEdit ? "Update Field" : "Create Field" }}
      </VBtn>
    </VCardActions>

  </VCard>
</VDialog>


  </VContainer>
</template>
<style scoped>
.preview-card {
  border-radius: 14px;
  background: white;
  border: 1px solid #eee;
}

.tip-box {
  display: flex;
  align-items: center;
  background: #f7f2ff;
  padding: 10px 14px;
  border-radius: 10px;
  border-left: 4px solid #6C27FF;
  font-size: 14px;
  color: #4a4a4a;
}

.purple-btn {
  background: #6C27FF !important;
  color: white !important;
  transition: 0.25s ease-in-out;
}

.purple-btn:hover {
  background: #8F4CFF !important; /* lighter purple hover */
  color: white !important;
}
</style>