<template>
  <div class="email-builder">

    <!-- TOP CONTROLS -->
    <div class="builder-top">
      <input v-model="meta.name" placeholder="Template Name" />
      <input v-model="meta.subject" placeholder="Subject Line" />

      <select v-model="meta.role">
        <option value="admin">Admin</option>
        <option value="organization">Organization</option>
        <option value="individual">Individual</option>
        <option value="all">All Users</option>
      </select>

      <select v-model="meta.type">
        <option value="manual">Manual</option>
        <option value="automatic">Automatic</option>
      </select>

      <button @click="saveTemplate">Save</button>
      <button v-if="selectedTemplate" @click="publishDefault">Set Default</button>
      <button @click="refreshTemplates">Refresh</button>
    </div>

    <!-- Subject Preview -->
    <div class="subject-preview">
      <strong>Preview:</strong> {{ meta.subject }}
    </div>

    <div class="main-area">

      <!-- GrapesJS Builder -->
      <div class="builder-panel">
        <div id="gjs" class="gjs-container"></div>
      </div>

      <!-- Sidebar -->
      <aside class="side-panel">
        <h4>Insert Variable</h4>

        <div v-for="v in variables" :key="v" class="var-item">
          <button @click="insertVariable(v)">
            <span v-text="`{{${v}}}`"></span>
          </button>
        </div>

        <h4 class="saved-title">Saved Templates</h4>

        <ul class="saved-list">
          <li v-for="t in templates" :key="t.id">
            <a href="#" @click.prevent="openTemplate(t)">
              {{ t.name }} • {{ t.role }} • {{ t.type }}
            </a>
          </li>
        </ul>

      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import newsletter from "grapesjs-preset-newsletter";
import axios from "axios";

// Nuxt cookie
const accessToken = useCookie("accessToken");

const API_BASE = "http://127.0.0.1:8000/auth/";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = accessToken.value;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// STATE
const editor = ref(null);
const templates = ref([]);
const selectedTemplate = ref(null);

const meta = ref({
  id: null,
  name: "",
  subject: "",
  role: "all",
  type: "manual",
});

const variables = ref(["full_name", "email", "role", "user_id", "otp", "link"]);

// INIT
onMounted(async () => {
  editor.value = grapesjs.init({
    container: "#gjs",
    height: "700px",
    storageManager: false,
    plugins: [newsletter],
  });

  editor.value.setComponents(`
    <table width="100%" style="padding:20px;">
      <tr><td>
        <h2>Welcome {{full_name}}</h2>
        <p>Your OTP is <b>{{otp}}</b></p>
      </td></tr>
    </table>
  `);

  await refreshTemplates();
});

// LOAD ALL TEMPLATES
async function refreshTemplates() {
  try {
    const resp = await api.get("email-templates/");
    templates.value = resp.data;
  } catch {
    alert("Failed to load templates");
  }
}

// INSERT VARIABLE
function insertVariable(name) {
  const tag = `{{${name}}}`;
  const selected = editor.value.getSelected();

  if (selected && selected.is("text")) {
    selected.set("content", selected.get("content") + tag);
    return;
  }

  editor.value.addComponents(`<span>${tag}</span>`);
}

// SAVE TEMPLATE
async function saveTemplate() {
  const html = editor.value.getHtml();
  const css = editor.value.getCss();
  const finalHtml = `<style>${css}</style>${html}`;

  const payload = {
    name: meta.value.name,
    subject: meta.value.subject,
    role: meta.value.role,
    type: meta.value.type,
    html_content: finalHtml,
    is_default: false,
    is_active: true,
  };

  try {
    if (meta.value.id) {
      await api.put(`email-templates/${meta.value.id}/`, payload);
      alert("Template updated");
    } else {
      const resp = await api.post("email-templates/", payload);
      meta.value.id = resp.data.id;
      alert("Template saved");
    }
    await refreshTemplates();
  } catch {
    alert("Save failed");
  }
}

// OPEN TEMPLATE
async function openTemplate(t) {
  try {
    const resp = await api.get(`email-templates/${t.id}/`);
    const data = resp.data;

    meta.value = {
      id: data.id,
      name: data.name,
      subject: data.subject,
      role: data.role,
      type: data.type,
    };

    selectedTemplate.value = data;
    editor.value.setComponents(data.html_content);
  } catch {
    alert("Failed to open template");
  }
}

// SET DEFAULT
async function publishDefault() {
  if (!meta.value.id) return alert("Open a template first");

  try {
    await api.post(`email-templates/${meta.value.id}/set_default/`);
    alert("Template marked as default");
  } catch {
    alert("Failed to set default");
  }
}
</script>

<style scoped>
.email-builder {
  padding: 16px;
}

.builder-top {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.builder-top input,
.builder-top select {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.builder-top button {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: #2b6cb0;
  color: white;
  cursor: pointer;
}

.builder-top button:hover {
  opacity: 0.9;
}

.subject-preview {
  background: #f4f4f4;
  padding: 10px;
  border-left: 4px solid #2b6cb0;
  margin-bottom: 16px;
  font-size: 15px;
}

.main-area {
  display: flex;
  gap: 16px;
}

.builder-panel {
  flex: 1;
}

.gjs-container {
  height: 700px;
  border: 1px solid #ddd;
}

.side-panel {
  width: 300px;
}

.var-item button {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #999;
  background: #fafafa;
  cursor: pointer;
}

.var-item button:hover {
  background: #eaeaea;
}

.saved-title {
  margin-top: 20px;
}

.saved-list {
  padding-left: 0;
  list-style: none;
}

.saved-list li {
  margin-bottom: 8px;
}
</style>
