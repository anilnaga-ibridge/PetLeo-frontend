import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import { ability } from './ability'

export default function (app) {
  const userAbilityRules = useCookie('userAbilityRules')

  // Update the shared ability instance with initial rules
  ability.update(userAbilityRules.value ?? [])

  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  })
}
