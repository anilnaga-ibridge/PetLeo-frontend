import { ref } from 'vue'

export function useBiometric() {
    const biometricAvailable = ref(false)
    const biometricLoading = ref(false)
    const biometricError = ref('')

    // Check if biometric authentication is available
    const checkAvailability = async () => {
        if (!window.PublicKeyCredential) {
            biometricAvailable.value = false
            return false
        }

        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
            biometricAvailable.value = available
            return available
        } catch (err) {
            console.error('Biometric check failed:', err)
            biometricAvailable.value = false
            return false
        }
    }

    // Authenticate using biometric (simplified version for lock screen)
    const authenticate = async () => {
        biometricLoading.value = true
        biometricError.value = ''

        try {
            // Generate a random challenge
            const challenge = new Uint8Array(32)
            crypto.getRandomValues(challenge)

            // Request biometric authentication
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    timeout: 60000,
                    userVerification: 'required',
                    allowCredentials: [], // Empty to use platform authenticator
                }
            })

            biometricLoading.value = false
            return { success: true, credential }
        } catch (err) {
            console.error('Biometric authentication failed:', err)

            if (err.name === 'NotAllowedError') {
                biometricError.value = 'Authentication cancelled'
            } else if (err.name === 'NotSupportedError') {
                biometricError.value = 'Biometric not supported'
            } else {
                biometricError.value = 'Authentication failed'
            }

            biometricLoading.value = false
            return { success: false, error: biometricError.value }
        }
    }

    return {
        biometricAvailable,
        biometricLoading,
        biometricError,
        checkAvailability,
        authenticate,
    }
}
