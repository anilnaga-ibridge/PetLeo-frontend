import re

file_path = "/Users/PraveenWorks/Anil Works/PetLeo-frontend/src/pages/veterinary/prescriptions.vue"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Import
import_str = "import AIMedicineAutocomplete from '@/components/veterinary/AIMedicineAutocomplete.vue'\n"
if "import AIMedicineAutocomplete" not in content:
    content = content.replace("import { ref, onMounted, computed } from 'vue'", "import { ref, onMounted, computed } from 'vue'\n" + import_str)

# 2. Add handleAiSuggestion logic
ai_logic = """
const handleAiSuggestion = (suggestion) => {
  if (!suggestion) return
  
  const freqStr = (suggestion.frequency || '').toLowerCase()
  const morning = freqStr.includes('morning') || freqStr.includes('od') || freqStr.includes('bid') || freqStr.includes('tid')
  const afternoon = freqStr.includes('afternoon') || freqStr.includes('bid') || freqStr.includes('tid')
  const night = freqStr.includes('night') || freqStr.includes('tid')
  
  const dosageStr = suggestion.dosage || ''
  
  newMedicines.value.push({
    id: Date.now(),
    name: suggestion.medicine_name || medicineInput.value,
    dosage: dosageStr,
    morning: morning,
    afternoon: afternoon,
    night: night,
    duration: suggestion.duration || '',
    notes: suggestion.notes || '',
  })
  
  // Clear input after a tick
  setTimeout(() => {
    medicineInput.value = ''
  }, 100)
}
"""
if "const handleAiSuggestion =" not in content:
    content = content.replace("const handleEnter = e => {", ai_logic + "\nconst handleEnter = e => {")

# 3. Replace Template Add Row
orig_template = """            <!-- Add Row -->
            <div class="add-medicine-row">
              <div class="add-input-wrap">
                <VIcon icon="tabler-search" size="15" class="add-icon" />
                <input
                  v-model="medicineInput"
                  placeholder="Type medicine name and press Enter or Add…"
                  class="add-input"
                  @keydown.enter="handleEnter"
                />
              </div>
              <button class="add-btn" @click="addMedicine" :disabled="!medicineInput.trim()">
                <VIcon icon="tabler-plus" size="15" />
                Add
              </button>
            </div>"""

new_template = """            <!-- Add Row -->
            <div class="add-medicine-row">
              <div class="flex-grow-1">
                <AIMedicineAutocomplete
                  v-model="medicineInput"
                  label="Search Medicine (AI powered)"
                  @suggestion-selected="handleAiSuggestion"
                  @keydown.enter="handleEnter"
                />
              </div>
              <button class="add-btn mt-1" @click="addMedicine" :disabled="!medicineInput?.trim()">
                <VIcon icon="tabler-plus" size="15" />
                Add
              </button>
            </div>"""
content = content.replace(orig_template, new_template)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Prescriptions patched with AI Complete")
