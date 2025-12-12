import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'

// Initialize from localStorage to persist across refreshes
const isLocked = ref(localStorage.getItem('isAppLocked') === 'true')

// Watch for changes and update localStorage
watch(isLocked, (newValue) => {
    localStorage.setItem('isAppLocked', newValue)
})

const lastActivity = ref(Date.now())
const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export function useIdleTimer() {
    const router = useRouter()
    let timer = null

    const resetTimer = () => {
        lastActivity.value = Date.now()
        if (isLocked.value) return // Don't reset if already locked

        clearTimeout(timer)
        timer = setTimeout(() => {
            // Only lock if user is logged in (check cookie or store)
            const accessToken = document.cookie.includes('accessToken')
            if (accessToken) {
                isLocked.value = true
            }
        }, IDLE_TIMEOUT)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

    onMounted(() => {
        events.forEach(event => {
            window.addEventListener(event, resetTimer)
        })
        resetTimer()
    })

    onUnmounted(() => {
        events.forEach(event => {
            window.removeEventListener(event, resetTimer)
        })
        clearTimeout(timer)
    })

    return {
        isLocked,
        resetTimer
    }
}
