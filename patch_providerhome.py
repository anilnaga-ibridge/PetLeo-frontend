import re

file_path = "/Users/PraveenWorks/Anil Works/PetLeo-frontend/src/pages/provider/providerhome.vue"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add onIntersect to script setup
onintersect_func = """
const onIntersect = (isIntersecting, entries, observer) => {
  if (isIntersecting && entries && entries[0]) {
    entries[0].target.classList.add('reveal-visible')
    entries[0].target.classList.remove('reveal-hidden')
  }
}
"""
content = content.replace("const onOnboardingComplete = () => {", f"{onintersect_func}\nconst onOnboardingComplete = () => {{")

# 2. Add styles to style scoped
new_styles = """
/* Premium UI/UX Animations & Styles */
@keyframes gradient-xy {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.hero-gradient {
  background: linear-gradient(-45deg, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-secondary), 0.05), rgba(var(--v-theme-primary), 0.02), transparent);
  background-size: 400% 400%;
  animation: gradient-xy 15s ease infinite;
}

.text-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.frosted-app-bar {
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  background-color: rgba(var(--v-theme-surface), 0.75) !important;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.reveal-hidden {
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}

.premium-card {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.05) !important;
}
.premium-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -8px rgba(var(--v-theme-primary), 0.15) !important;
  border-color: rgba(var(--v-theme-primary), 0.3) !important;
}

.fade-up-1 { animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s forwards; opacity: 0; }
.fade-up-2 { animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards; opacity: 0; }
.fade-up-3 { animation: fadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards; opacity: 0; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-badge {
  background: rgba(var(--v-theme-primary), 0.1);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}
"""
content = content.replace("<style scoped>", f"<style scoped>\n{new_styles}")

# 3. Modify App Bar
content = content.replace('class="px-4 border-b"', 'class="px-4 border-b frosted-app-bar"')

# 4. Modify Hero Section
hero_old = '<section class="hero-section position-relative bg-surface pb-12 pt-16 mt-12">'
hero_new = '''<section class="hero-section position-relative hero-gradient pb-12 pt-16 mt-12 overflow-hidden">
      <!-- Decorative Cinematic Blobs -->
      <div class="position-absolute rounded-circle bg-primary opacity-20" style="width: 400px; height: 400px; filter: blur(80px); top: -100px; left: -100px; pointer-events: none;"></div>
      <div class="position-absolute rounded-circle bg-secondary opacity-20" style="width: 500px; height: 500px; filter: blur(100px); bottom: -150px; right: -150px; pointer-events: none;"></div>'''
content = content.replace(hero_old, hero_new)

content = content.replace('<h1 class="text-h2 font-weight-bold text-primary mb-4">', '<h1 class="text-h2 font-weight-bold mb-4 fade-up-1 text-gradient pb-2 line-height-1">')
content = content.replace('<p class="text-h5 text-medium-emphasis mb-8">', '<p class="text-h5 text-medium-emphasis mb-8 fade-up-2">')
content = content.replace('<div class="d-flex gap-4">', '<div class="d-flex gap-4 fade-up-3">')
content = content.replace('class="mx-auto"', 'class="mx-auto fade-up-3"')

# 5. Section 2: Services
content = content.replace('class="services-section py-16 bg-background"', 'class="services-section py-16 bg-background"')
content = content.replace('<VContainer>', '<VContainer v-intersect="onIntersect" class="reveal-hidden">', 1)  # Only first one after services section?
# Let's target specific containers
import re
def add_reveal(section_id, content):
    pattern = rf'<section\s+id="{section_id}"[^>]*>\s*<VContainer>'
    match = re.search(pattern, content)
    if match:
        repl = match.group(0).replace('<VContainer>', '<VContainer v-intersect="onIntersect" class="reveal-hidden">')
        content = content.replace(match.group(0), repl)
    return content

# We need to map without id as well
content = re.sub(r'<section class="clients-section py-16 bg-background">\s*<VContainer>', '<section class="clients-section py-16 bg-background">\s*<VContainer v-intersect="onIntersect" class="reveal-hidden">', content)
content = re.sub(r'<section class="how-it-works-section py-16 bg-background">\s*<VContainer>', '<section class="how-it-works-section py-16 bg-background">\n      <VContainer v-intersect="onIntersect" class="reveal-hidden">', content)
content = re.sub(r'<section class="cta-section py-16 bg-primary text-white text-center">\s*<VContainer>', '<section class="cta-section py-16 bg-primary text-white text-center">\n      <VContainer v-intersect="onIntersect" class="reveal-hidden">', content)

for section_id in ['services', 'plans', 'benefits', 'testimonials', 'about']:
    content = add_reveal(section_id, content)

# 6. Enhance Cards
content = content.replace('class="h-100 text-center pa-6"', 'class="h-100 text-center pa-6 premium-card"')
content = content.replace('class="h-100 d-flex flex-column plan-card rounded-xl overflow-hidden"', 'class="h-100 d-flex flex-column plan-card premium-card rounded-xl overflow-hidden"')
content = content.replace('class="h-100 pa-6"\n              elevation="3"', 'class="h-100 pa-6 premium-card"\n              elevation="0"')
content = content.replace('class="d-flex align-start mb-6"', 'class="d-flex align-start mb-6 pa-4 rounded-lg premium-card bg-surface"')

# Enhance Chips / Badges
content = content.replace('class="mb-4 font-weight-bold"\n            size="small"', 'class="mb-4 font-weight-bold glass-badge"\n            size="small"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
