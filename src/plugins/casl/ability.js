// import { createMongoAbility } from '@casl/ability'

// export const ability = createMongoAbility()
// src/plugins/casl/ability.js
import { createMongoAbility } from '@casl/ability'

// Create a reusable ability instance
export const ability = createMongoAbility()

// Function to update user abilities dynamically (after login)
export function defineAbilitiesFor(user) {
  const role = user?.role?.toLowerCase() || 'guest'

  switch (role) {
    case 'superadmin':
      return [
        { action: 'manage', subject: 'all' },
      ]
    case 'admin':
      return [
        { action: 'read', subject: 'dashboard' },
        { action: 'access', subject: 'logistics' },
        { action: 'manage', subject: 'all' },
      ]
    case 'client':
      return [
        { action: 'read', subject: 'public' },
      ]
    default:
      return [
        { action: 'read', subject: 'public' },
      ]
  }
}
