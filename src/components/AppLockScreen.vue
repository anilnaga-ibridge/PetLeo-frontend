<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'
import { useIdleTimer } from '@/composables/useIdleTimer'
import { useRouter } from 'vue-router'
import MultiBoxPinInput from '@/components/MultiBoxPinInput.vue'
import { useMouse, useWindowSize } from '@vueuse/core'

const { isLocked } = useIdleTimer()
const router = useRouter()
const pin = ref('')
const loading = ref(false)
const error = ref('')

// 3D Tilt Logic
const { x, y } = useMouse()
const { width, height } = useWindowSize()

const cardTransform = computed(() => {
  if (!isLocked.value) return {}
  
  const rotateX = (y.value - height.value / 2) / 20
  const rotateY = (x.value - width.value / 2) / 20
  
  return {
    transform: `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`,
  }
})

// Parallax for Orbs
const orb1Style = computed(() => ({
  transform: `translate(${x.value / 30}px, ${y.value / 30}px)`
}))

const orb2Style = computed(() => ({
  transform: `translate(${x.value / -40}px, ${y.value / -40}px)`
}))

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const userData = useCookie('userData')
const user = computed(() => userData.value || {})

const unlock = async () => {
  if (pin.value.length < 4) return
  
  loading.value = true
  error.value = ''
  
  try {
    console.log("🔓 Unlocking with:", { pin: pin.value, action: 'reverify' })

    await axios.post(`${API_BASE}/auth/login-with-pin/`, {
      pin: pin.value,
      action: 'reverify'
    }, {
      headers: { Authorization: `Bearer ${useCookie('accessToken').value}` }
    })
    
    // Unlock success with exit animation
    const card = document.querySelector('.glass-card')
    if (card) {
      card.style.transform = 'scale(1.1) translateY(-20px)'
      card.style.opacity = '0'
    }
    
    setTimeout(() => {
      isLocked.value = false
      pin.value = ''
    }, 300)
    
  } catch (err) {
    console.error("🔓 Unlock Error:", err)
    if (err.response) {
      error.value = err.response.data.detail || "Invalid PIN"
    } else {
      error.value = "Backend not responding"
    }
    pin.value = ''
  } finally {
    loading.value = false
  }
}



// Canvas Particle Logic
const canvasRef = ref(null)
let animationFrameId
let resize
let particles = []

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  
  resize = () => {
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
  }
  
  window.addEventListener('resize', resize)
  resize()
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height
      this.vx = (Math.random() - 0.5) * 0.5 // Moderate speed
      this.vy = (Math.random() - 0.5) * 0.5
      this.size = Math.random() * 2 + 1
    }
    
    update() {
      this.x += this.vx
      this.y += this.vy
      
      // Wrap around screen
      if (this.x < 0) this.x = canvas.width
      if (this.x > canvas.width) this.x = 0
      if (this.y < 0) this.y = canvas.height
      if (this.y > canvas.height) this.y = 0
    }
    
    draw() {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  // Create particles
  particles = []
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle())
  }
  
  const animate = () => {
    if (!canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    particles.forEach((p, index) => {
      p.update()
      p.draw()
      
      // Connect particles
      for (let j = index + 1; j < particles.length; j++) {
        const p2 = particles[j]
        const dx = p.x - p2.x
        const dy = p.y - p2.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 150) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - dist/1500})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }
      }
    })
    
    animationFrameId = requestAnimationFrame(animate)
  }
  
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  if (resize) {
    window.removeEventListener('resize', resize)
  }
})

const logout = () => {
  isLocked.value = false
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  router.replace('/login')
}
</script>

<template>
  <div v-if="isLocked" class="lock-overlay">
    <!-- Moderate Animated Particle Background -->
    <canvas ref="canvasRef" class="particle-canvas"></canvas>

    <div class="lock-content" :style="cardTransform">
      <div class="text-center mb-8">
        <VAvatar color="primary" size="96" class="mb-6 elevation-10 ring-4 ring-white ring-opacity-20 avatar-pulse">
          <VIcon icon="tabler-lock" size="48" color="white" />
        </VAvatar>
        <h2 class="text-h3 font-weight-bold text-white mb-2 tracking-tight typing-effect">
          Welcome Back
        </h2>
        <p class="text-white text-opacity-90 text-subtitle-1 font-weight-medium fade-in-up">
          {{ user.full_name || 'User' }}
        </p>
      </div>

      <VCard width="400" class="pa-8 rounded-xl elevation-24 glass-card">
        <p class="text-center text-body-1 mb-6 text-medium-emphasis font-weight-medium">
          Enter your PIN to unlock screen
        </p>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          density="comfortable"
          class="mb-6"
          icon="tabler-alert-circle"
        >
          {{ error }}
        </VAlert>

        <div class="mb-8 d-flex justify-center">
          <MultiBoxPinInput
            v-model="pin"
            :length="4"
            :error="!!error"
            @complete="unlock"
          />
        </div>

        <VBtn
          block
          color="primary"
          size="x-large"
          rounded="lg"
          :loading="loading"
          @click="unlock"
          class="mb-6 font-weight-bold text-button btn-gradient"
          elevation="4"
        >
          Unlock
        </VBtn>

        <div class="text-center">
          <VBtn
            variant="text"
            color="error"
            size="small"
            @click="logout"
            class="text-caption font-weight-bold opacity-80 hover:opacity-100"
          >
            Forgot PIN? / Logout
          </VBtn>
        </div>
      </VCard>
    </div>
  </div>
</template>

<style scoped>
.lock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  backdrop-filter: blur(15px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Particle Canvas */
.particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let clicks pass through */
  z-index: 1;
}

.lock-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Initial entrance animation handled by Vue transition or separate class if needed, 
     but removed here to avoid conflict with dynamic tilt transform */
}

/* Pulse Animation for Avatar */
.avatar-pulse {
  animation: pulse-glow 3s infinite;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}

/* Premium Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.v-theme--dark .glass-card {
  background: rgba(30, 41, 59, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Gradient Button */
.btn-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Typing Effect */
.typing-effect {
  overflow: hidden;
  white-space: nowrap;
  animation: typing 3.5s steps(40, end);
}

@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

/* Fade In Up */
.fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
  opacity: 0;
  animation-delay: 0.5s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lock-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Smooth transition for tilt effect */
  transition: transform 0.1s ease-out; 
}

:deep(input::-webkit-outer-spin-button),
:deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>
