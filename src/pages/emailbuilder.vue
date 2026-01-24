<template>
  <VContainer
    fluid
    class="pa-0 fill-height bg-grey-lighten-5 font-inter"
  >
    <!-- ================================================================================= -->
    <!-- VIEW 1: DASHBOARD (Template Management) -->
    <!-- ================================================================================= -->
    <div
      v-if="viewMode === 'dashboard'"
      class="d-flex flex-column fill-height w-100"
    >
      <!-- Dashboard Header -->
      <div class="bg-white border-b px-8 py-6">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-1">
              Email Templates
            </h1>
            <p class="text-body-1 text-grey">
              Manage and design your email communications
            </p>
          </div>
          <VBtn
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            class="text-none font-weight-bold px-6 shadow-primary"
            rounded="lg"
            @click="createNew"
          >
            Create Blank Template
          </VBtn>
        </div>

        <!-- Search & Filter -->
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="searchQuery"
              placeholder="Search your templates..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              bg-color="grey-lighten-5"
              class="search-input"
            />
          </VCol>
        </VRow>
      </div>

      <!-- Content Area -->
      <div class="flex-grow-1 overflow-y-auto px-8 py-8">
        <!-- SECTION 1: STARTER TEMPLATES -->
        <div class="mb-8">
          <div class="d-flex align-center mb-4">
            <VIcon
              color="primary"
              class="mr-2"
            >
              mdi-star-four-points-outline
            </VIcon>
            <h2 class="text-h6 font-weight-bold text-grey-darken-3">
              Starter Templates
            </h2>
          </div>
          
          <VRow>
            <VCol
              v-for="starter in starterTemplates"
              :key="starter.name"
              cols="12"
              sm="6"
              md="3"
              lg="2"
            >
              <VCard
                class="fill-height card-hover border-thin d-flex flex-column"
                elevation="0"
                rounded="lg"
                @click="createFromStarter(starter)"
              >
                <div
                  class="h-100 bg-grey-lighten-4 d-flex align-center justify-center"
                  style="height: 120px !important;"
                >
                  <VIcon
                    size="48"
                    color="grey-lighten-1"
                  >
                    {{ starter.icon }}
                  </VIcon>
                </div>
                <div class="pa-3 bg-white flex-grow-1">
                  <div class="font-weight-bold text-body-2 text-grey-darken-3">
                    {{ starter.name }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ starter.desc }}
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>
        </div>

        <VDivider class="mb-8" />

        <!-- SECTION 2: MY TEMPLATES -->
        <div>
          <div class="d-flex align-center mb-4">
            <VIcon
              color="grey-darken-2"
              class="mr-2"
            >
              mdi-folder-outline
            </VIcon>
            <h2 class="text-h6 font-weight-bold text-grey-darken-3">
              My Templates
            </h2>
          </div>

          <div
            v-if="filteredTemplates.length === 0"
            class="text-center py-12 bg-white rounded-lg border-dashed"
          >
            <VIcon
              size="64"
              color="grey-lighten-2"
              class="mb-4"
            >
              mdi-email-open-outline
            </VIcon>
            <h3 class="text-h6 text-grey">
              No saved templates found
            </h3>
            <p class="text-grey-lighten-1">
              Create a new one or pick a starter above
            </p>
          </div>

          <VRow v-else>
            <VCol
              v-for="t in filteredTemplates"
              :key="t.id"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <VCard
                class="fill-height card-hover border-thin"
                elevation="0"
                rounded="lg"
                @click="openTemplate(t)"
              >
                <div class="pa-5 h-100 d-flex flex-column">
                  <div class="d-flex justify-space-between align-start mb-4">
                    <div class="d-flex align-center gap-2">
                      <VAvatar
                        size="32"
                        color="primary"
                        variant="tonal"
                      >
                        <VIcon size="18">
                          mdi-email-outline
                        </VIcon>
                      </VAvatar>
                      <VChip
                        size="x-small"
                        :color="t.is_active ? 'success' : 'grey'"
                        variant="flat"
                        class="font-weight-bold"
                      >
                        {{ t.is_active ? 'ACTIVE' : 'DRAFT' }}
                      </VChip>
                    </div>
                    <VMenu>
                      <template #activator="{ props }">
                        <VBtn
                          icon="mdi-dots-horizontal"
                          variant="text"
                          density="compact"
                          color="grey"
                          v-bind="props"
                          @click.stop
                        />
                      </template>
                      <VList density="compact">
                        <VListItem
                          class="text-red"
                          @click="deleteTemplate(t)"
                        >
                          <template #prepend>
                            <VIcon size="small">
                              mdi-delete
                            </VIcon>
                          </template>
                          <VListItemTitle>Delete</VListItemTitle>
                        </VListItem>
                      </VList>
                    </VMenu>
                  </div>

                  <h3 class="text-h6 font-weight-bold text-grey-darken-3 mb-1 text-truncate">
                    {{ t.name }}
                  </h3>
                  <p class="text-body-2 text-grey mb-4 text-truncate">
                    {{ t.subject || 'No subject' }}
                  </p>

                  <div class="mt-auto pt-4 border-t d-flex justify-space-between text-caption text-grey-darken-1">
                    <span><VIcon
                      size="14"
                      class="mr-1"
                    >mdi-account-group</VIcon> {{ t.role }}</span>
                    <span><VIcon
                      size="14"
                      class="mr-1"
                    >mdi-flash</VIcon> {{ t.type }}</span>
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>
        </div>
      </div>
    </div>


    <!-- ================================================================================= -->
    <!-- VIEW 2: EDITOR (BeeFree Style) -->
    <!-- ================================================================================= -->
    <div
      v-else
      class="d-flex flex-column fill-height w-100 bg-white"
    >
      <!-- Top Bar -->
      <VToolbar
        color="white"
        class="border-b px-4"
        height="64"
        flat
      >
        <VBtn
          icon="mdi-arrow-left"
          variant="text"
          color="grey-darken-2"
          class="mr-2"
          @click="goBack"
        />
        
        <div class="d-flex flex-column mr-6">
          <input 
            v-model="meta.name" 
            class="title-input text-subtitle-1 font-weight-bold text-grey-darken-3"
            placeholder="Untitled Template"
          >
        </div>

        <VDivider
          vertical
          class="mx-4 py-3"
        />

        <!-- Device Toggles -->
        <div class="d-flex gap-2 border rounded px-1 py-1">
          <VBtn
            size="small"
            variant="text"
            :color="device === 'Desktop' ? 'primary' : 'grey'"
            icon="mdi-monitor"
            @click="setDevice('Desktop')"
          />
          <VBtn
            size="small"
            variant="text"
            :color="device === 'Tablet' ? 'primary' : 'grey'"
            icon="mdi-tablet"
            @click="setDevice('Tablet')"
          />
          <VBtn
            size="small"
            variant="text"
            :color="device === 'Mobile Portrait' ? 'primary' : 'grey'"
            icon="mdi-cellphone"
            @click="setDevice('Mobile Portrait')"
          />
        </div>

        <VSpacer />

        <!-- Actions -->
        <VBtn
          variant="text"
          color="grey-darken-1"
          class="mr-2 text-none"
          @click="undo"
        >
          Undo
        </VBtn>
        <VBtn
          variant="text"
          color="grey-darken-1"
          class="mr-2 text-none"
          @click="redo"
        >
          Redo
        </VBtn>
        <VBtn
          variant="text"
          color="primary"
          class="mr-2 text-none"
          @click="preview"
        >
          Preview
        </VBtn>

        <VBtn
          color="primary"
          variant="flat"
          class="text-none font-weight-bold px-6 shadow-primary"
          :loading="saving"
          rounded="lg"
          @click="saveTemplate"
        >
          Save
        </VBtn>
      </VToolbar>

      <div class="d-flex flex-grow-1 overflow-hidden">
        <!-- Main Canvas -->
        <div class="flex-grow-1 position-relative bg-grey-lighten-4">
          <div
            id="gjs"
            class="gjs-container fill-height"
          />
        </div>

        <!-- Right Sidebar (BeeFree Style) -->
        <div
          class="right-sidebar border-s bg-white d-flex flex-column"
          style="width: 350px;"
        >
          <!-- Tabs -->
          <VTabs
            v-model="activeTab"
            grow
            density="compact"
            color="primary"
            class="border-b"
          >
            <VTab
              value="content"
              class="text-none font-weight-medium"
            >
              Content
            </VTab>
            <VTab
              value="blocks"
              class="text-none font-weight-medium"
            >
              Blocks
            </VTab>
            <VTab
              value="settings"
              class="text-none font-weight-medium"
            >
              Settings
            </VTab>
          </VTabs>

          <div class="flex-grow-1 overflow-y-auto">
            <!-- TAB 1: CONTENT (Styles & Traits) -->
            <div
              v-show="activeTab === 'content'"
              class="fill-height"
            >
              <div class="pa-4">
                <div
                  id="selectors-container"
                  class="mb-4"
                />
                <div
                  id="traits-container"
                  class="mb-4"
                />
                <div id="styles-container" />
                <div
                  v-if="!hasSelection"
                  class="text-center py-12 text-grey"
                >
                  <VIcon
                    size="48"
                    class="mb-2"
                  >
                    mdi-cursor-default-click-outline
                  </VIcon>
                  <p>Select an element on the canvas to edit its properties.</p>
                </div>
              </div>
            </div>

            <!-- TAB 2: BLOCKS (Drag & Drop) -->
            <div
              v-show="activeTab === 'blocks'"
              class="fill-height"
            >
              <div
                id="blocks-container"
                class="pa-4"
              />
            </div>

            <!-- TAB 3: SETTINGS (Global & Meta) -->
            <div
              v-show="activeTab === 'settings'"
              class="fill-height"
            >
              <div class="pa-5">
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-4 text-uppercase">
                  Template Details
                </h3>
                
                <div class="mb-6">
                  <label class="text-caption font-weight-bold text-grey mb-1 d-block">SUBJECT LINE</label>
                  <VTextField
                    v-model="meta.subject"
                    placeholder="e.g. Welcome to PetLeo"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="grey-lighten-5"
                  />
                </div>

                <div class="mb-6">
                  <label class="text-caption font-weight-bold text-grey mb-1 d-block">TARGET AUDIENCE</label>
                  <VSelect
                    v-model="meta.role"
                    :items="['all', 'admin', 'organization', 'individual']"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="grey-lighten-5"
                  />
                </div>

                <div class="mb-6">
                  <label class="text-caption font-weight-bold text-grey mb-1 d-block">EMAIL TYPE</label>
                  <VSelect
                    v-model="meta.type"
                    :items="['manual', 'automatic']"
                    variant="outlined"
                    density="compact"
                    hide-details
                    bg-color="grey-lighten-5"
                  />
                </div>

                <div class="mb-6">
                  <label class="text-caption font-weight-bold text-grey mb-1 d-block">STATUS</label>
                  <VSwitch
                    v-model="meta.is_active"
                    color="success"
                    label="Active Template"
                    hide-details
                    inset
                  />
                </div>

                <VDivider class="mb-6" />

                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-3 text-uppercase">
                  Merge Tags
                </h3>
                <p class="text-caption text-grey mb-3">
                  Click to copy variable.
                </p>
                
                <div class="d-flex flex-wrap gap-2">
                  <VChip
                    v-for="v in variables"
                    :key="v"
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="variable-chip cursor-pointer"
                    label
                    @click="copyVariable(v)"
                  >
                    {{ formatVariable(v) }}
                  </VChip>
                </div>
                
                <div class="mt-8">
                  <VBtn
                    block
                    variant="tonal"
                    color="primary"
                    :disabled="!meta.id"
                    @click="publishDefault"
                  >
                    Set as Default Template
                  </VBtn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SNACKBAR -->
    <VSnackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      location="top center"
      variant="elevated"
      elevation="4"
      timeout="3000"
      rounded="pill"
      class="mt-4"
    >
      <div class="d-flex align-center gap-2">
        <VIcon
          size="small"
          color="white"
        >
          {{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </VIcon>
        <span class="font-weight-medium text-white">{{ snackbar.text }}</span>
      </div>
    </VSnackbar>
  </VContainer>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from "vue"
import grapesjs from "grapesjs"
import "grapesjs/dist/css/grapes.min.css"
import newsletter from "grapesjs-preset-newsletter"
import axios from "axios"
import { useCookie } from "@/@core/composable/useCookie"

// --- STATE ---
const viewMode = ref('dashboard') // 'dashboard' | 'editor'
const editor = ref(null)
const templates = ref([])
const saving = ref(false)
const snackbar = reactive({ show: false, text: "", color: "success" })
const activeTab = ref('blocks')
const device = ref('Desktop')
const hasSelection = ref(false)
const searchQuery = ref("")

const meta = reactive({
  id: null,
  name: "",
  subject: "",
  role: "all",
  type: "automatic",
  is_active: true,
})

const variables = ["full_name", "phone_number", "role", "email", "user_id", "otp", "link", "company_name"]

// --- STARTER TEMPLATES ---
const starterTemplates = [
  {
    name: "Welcome Email",
    desc: "Welcome with user details",
    icon: "mdi-hand-wave-outline",
    subject: "Welcome to PetLeo, {{full_name}}!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @media screen and (max-width: 600px) {
            .container { width: 100% !important; border-radius: 0 !important; }
            .content { padding: 20px !important; }
            .header { padding: 30px 20px !important; }
            .step-item { flex-direction: column !important; align-items: center !important; text-align: center !important; }
            .step-number { margin-right: 0 !important; margin-bottom: 10px !important; }
            .otp-code { font-size: 32px !important; letter-spacing: 4px !important; }
            .btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
            h1 { font-size: 24px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <div class="container" style="max-width: 600px; text-align: left; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); margin: 0 auto;">
                
                <!-- Header -->
                <div class="header" style="background: linear-gradient(135deg, #6C27FF 0%, #9D50FF 100%); padding: 40px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to PetLeo!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Your journey starts here.</p>
                </div>
                
                <div class="content" style="padding: 40px;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hello <strong>{{full_name}}</strong>,</p>
                  <p style="color: #4B5563; font-size: 15px; line-height: 1.6;">Thank you for registering. To complete your account setup, please follow these steps:</p>

                  <!-- Steps -->
                  <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    
                    <div class="step-item" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                      <div class="step-number" style="background: #0EA5E9; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
                      <div>
                        <strong style="color: #0C4A6E; display: block; margin-bottom: 4px;">Verify your Number</strong>
                        <span style="color: #334155; font-size: 14px;">Use the OTP below to verify your phone number.</span>
                      </div>
                    </div>

                    <div class="step-item" style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                      <div class="step-number" style="background: #0EA5E9; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
                      <div>
                        <strong style="color: #0C4A6E; display: block; margin-bottom: 4px;">Set your PIN</strong>
                        <span style="color: #334155; font-size: 14px;">Create a secure 4 or 6 digit PIN for easy login.</span>
                      </div>
                    </div>

                    <div class="step-item" style="display: flex; align-items: flex-start;">
                      <div class="step-number" style="background: #0EA5E9; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
                      <div>
                        <strong style="color: #0C4A6E; display: block; margin-bottom: 4px;">Login</strong>
                        <span style="color: #334155; font-size: 14px;">Access your dashboard using your phone and PIN.</span>
                      </div>
                    </div>

                  </div>

                  <!-- OTP Box -->
                  <div style="background: #F9FAFB; border: 2px dashed #6C27FF; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                    <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Your Verification Code</p>
                    <div class="otp-code" style="color: #6C27FF; font-size: 42px; font-weight: 800; letter-spacing: 8px; font-family: monospace;">{{otp}}</div>
                  </div>

                  <!-- User Details -->
                  <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
                    <div style="background: #F9FAFB; padding: 10px 15px; border-bottom: 1px solid #E5E7EB; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Account Details</div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 12px 15px; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Full Name</td>
                        <td style="padding: 12px 15px; color: #111827; font-weight: 500; text-align: right; border-bottom: 1px solid #F3F4F6;">{{full_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 15px; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Phone</td>
                        <td style="padding: 12px 15px; color: #111827; font-weight: 500; text-align: right; border-bottom: 1px solid #F3F4F6;">{{phone_number}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 15px; color: #6B7280;">Role</td>
                        <td style="padding: 12px 15px; color: #6C27FF; font-weight: 600; text-align: right; text-transform: capitalize;">{{role}}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="text-align: center; margin-top: 40px;">
                    <a href="{{link}}" class="btn" style="display: inline-block; padding: 16px 40px; background: #6C27FF; color: white; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(108, 39, 255, 0.4);">Verify Account &rarr;</a>
                  </div>
                </div>
                
                <div style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
                  <p style="color: #9CA3AF; font-size: 12px; margin: 0;">&copy; 2024 PetLeo Inc. All rights reserved.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  },

  // ... other starters (omitted for brevity, can be re-added if needed)
]

// --- COMPUTED ---
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value
  const q = searchQuery.value.toLowerCase()
  
  return templates.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.role.toLowerCase().includes(q),
  )
})

// --- API ---
const accessToken = useCookie("accessToken")
const API_BASE = "http://127.0.0.1:8000/auth/"
const api = axios.create({ baseURL: API_BASE, withCredentials: true })

api.interceptors.request.use(config => {
  if (accessToken.value) config.headers.Authorization = `Bearer ${accessToken.value}`
  
  return config
})

// --- LIFECYCLE ---
onMounted(async () => {
  await refreshTemplates()
})

onBeforeUnmount(() => {
  if (editor.value) editor.value.destroy()
})

// --- ACTIONS ---
async function refreshTemplates() {
  try {
    const resp = await api.get("email-templates/")

    templates.value = resp.data
  } catch (e) {
    showMsg("Failed to load templates", "error")
  }
}

async function createNew() {
  meta.id = null
  meta.name = "New Campaign"
  meta.subject = ""
  meta.role = "all"
  meta.type = "automatic"
  meta.is_active = true
  
  viewMode.value = 'editor'
  activeTab.value = 'blocks'
  await nextTick()
  initGrapes()
  editor.value.setComponents("") 
}

async function createFromStarter(starter) {
  meta.id = null
  meta.name = starter.name + " Copy"
  meta.subject = starter.subject
  meta.role = "all"
  meta.type = "automatic"
  meta.is_active = true

  viewMode.value = 'editor'
  activeTab.value = 'blocks'
  await nextTick()
  initGrapes()
  editor.value.setComponents(starter.html)
  showMsg(`Started with ${starter.name}`)
}

async function openTemplate(t) {
  try {
    const resp = await api.get(`email-templates/${t.id}/`)
    const data = resp.data

    meta.id = data.id
    meta.name = data.name
    meta.subject = data.subject
    meta.role = data.role
    meta.type = data.type
    meta.is_active = data.is_active ?? true

    viewMode.value = 'editor'
    activeTab.value = 'content'
    await nextTick()
    initGrapes()
    editor.value.setComponents(data.html_content)
  } catch (e) {
    showMsg("Failed to open template", "error")
  }
}

function goBack() {
  viewMode.value = 'dashboard'
  if (editor.value) {
    editor.value.destroy()
    editor.value = null
  }
  refreshTemplates()
}

async function saveTemplate() {
  if (!meta.name || !meta.subject) return showMsg("Name and Subject are required", "warning")

  saving.value = true

  const html = editor.value.getHtml()
  const css = editor.value.getCss()
  const finalHtml = `<style>${css}</style>${html}`

  const payload = {
    name: meta.name,
    subject: meta.subject,
    role: meta.role,
    type: meta.type,
    html_content: finalHtml,
    is_active: meta.is_active,
  }

  try {
    if (meta.id) {
      await api.put(`email-templates/${meta.id}/`, payload)
      showMsg("Template updated successfully")
    } else {
      const resp = await api.post("email-templates/", payload)

      meta.id = resp.data.id
      showMsg("Template created successfully")
    }
  } catch (e) {
    showMsg("Save failed", "error")
  } finally {
    saving.value = false
  }
}

async function deleteTemplate(t) {
  if(!confirm(`Delete template "${t.name}"?`)) return
  try {
    await api.delete(`email-templates/${t.id}/`)
    showMsg("Template deleted")
    await refreshTemplates()
  } catch(e) {
    showMsg("Delete failed", "error")
  }
}

async function publishDefault() {
  if (!meta.id) return
  try {
    await api.post(`email-templates/${meta.id}/set_default/`)
    showMsg("Set as default template")
  } catch (e) {
    showMsg("Failed to set default", "error")
  }
}

function copyVariable(v) {
  const tag = `{{${v}}}`

  navigator.clipboard.writeText(tag)
  showMsg(`Copied ${tag} to clipboard`)
}

function formatVariable(v) {
  return `{{${v}}}`
}

function showMsg(text, color = "success") {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function setDevice(d) {
  device.value = d
  editor.value.setDevice(d)
}

function undo() { editor.value.runCommand('core:undo') }
function redo() { editor.value.runCommand('core:redo') }
function preview() { editor.value.runCommand('core:preview') }

// --- GRAPESJS INIT ---
function initGrapes() {
  if (editor.value) return 
  
  editor.value = grapesjs.init({
    container: "#gjs",
    height: "100%",
    width: "auto",
    storageManager: false,
    plugins: [newsletter],
    pluginsOpts: {
      [newsletter]: {
        // Disable default modal/code view if we want custom UI
      },
    },

    // Custom Panel Rendering
    blockManager: {
      appendTo: '#blocks-container',
    },
    styleManager: {
      appendTo: '#styles-container',
      sectors: [
        { name: 'Typography', open: false, buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration'] },
        { name: 'Decorations', open: false, buildProps: ['background-color', 'border-radius', 'border', 'box-shadow', 'background'] },
        { name: 'Dimension', open: false, buildProps: ['width', 'height', 'padding', 'margin'] },
      ],
    },
    selectorManager: {
      appendTo: '#selectors-container',
    },
    traitManager: {
      appendTo: '#traits-container',
    },
    panels: { defaults: [] }, // Hide default panels
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '' },
        { name: 'Tablet', width: '768px', widthMedia: '992px' },
        { name: 'Mobile Portrait', width: '320px', widthMedia: '575px' },
      ],
    },
  })

  // Event Listeners
  editor.value.on('component:selected', () => {
    hasSelection.value = true
    activeTab.value = 'content' // Auto-switch to content tab
  })
  editor.value.on('component:deselected', () => {
    hasSelection.value = false
  })
}
</script>

<style scoped>
.font-inter { font-family: 'Inter', sans-serif !important; }

/* Dashboard Cards */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06) !important;
}
.dashed-border {
  border: 2px dashed #E0E0E0;
  border-radius: 12px;
}
.dashed-border:hover {
  border-color: #6C27FF;
  background-color: #F3E8FF !important;
}
.border-thin {
  border: 1px solid #E5E7EB;
}

/* Inputs */
.search-input :deep(.v-field__outline__start),
.search-input :deep(.v-field__outline__end),
.search-input :deep(.v-field__outline__notch) {
  border-color: #E5E7EB !important;
}
.title-input {
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  width: 100%;
}
.title-input:focus {
  border-bottom: 2px solid #6C27FF;
}

.shadow-primary { box-shadow: 0 4px 14px rgba(108, 39, 255, 0.3) !important; }

/* Variables */
.variable-chip {
  font-family: monospace;
  font-size: 11px !important;
}

/* GrapesJS Custom Styling for BeeFree Look */
:deep(.gjs-cv-canvas) {
  background-color: #F3F4F6;
  height: 100%;
  width: 100%;
}

/* Blocks */
:deep(.gjs-blocks-c) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
:deep(.gjs-block) {
  min-height: 80px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: white;
  box-shadow: none;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
}
:deep(.gjs-block:hover) {
  border-color: #6C27FF;
  background-color: #F3E8FF;
  color: #6C27FF;
}
:deep(.gjs-block-label) {
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
}

/* Style Manager */
:deep(.gjs-sm-sector) {
  border-bottom: 1px solid #E5E7EB;
}
:deep(.gjs-sm-sector-title) {
  background: #F9FAFB;
  color: #374151;
  font-weight: 600;
  font-size: 12px;
  padding: 10px 15px;
  border: none;
}
:deep(.gjs-sm-properties) {
  padding: 10px;
}
:deep(.gjs-sm-property) {
  margin-bottom: 10px;
}
:deep(.gjs-sm-label) {
  font-size: 11px;
  color: #6B7280;
  margin-bottom: 4px;
  display: block;
}
:deep(.gjs-field) {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  color: #374151;
}
:deep(.gjs-field input) {
  color: #374151;
}
:deep(.gjs-field-color-picker) {
  border-radius: 4px;
  overflow: hidden;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 3px;
}
</style>
