import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { redirects, routes } from './additional-routes'
import { setupGuards } from './guards'
import { api } from '@/plugins/axios'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
  extendRoutes: pages => {
    const patchLayout = (routesList) => {
      return routesList.map(route => {
        const isBuilder = (route.path && route.path.includes('superadmin/builder')) ||
          (route.name && String(route.name).includes('superadmin-builder'))

        const isPetOwner = (route.path && route.path.includes('pet-owner')) ||
          (route.name && String(route.name).includes('pet-owner'))

        const isInternalArea = (route.path && (route.path.includes('/provider/') || route.path.includes('/employee/'))) ||
          (route.name && (String(route.name).startsWith('provider-') || String(route.name).startsWith('employee-')))

        const isVeterinary = (route.path && route.path.toLowerCase().includes('veterinary')) ||
          (route.name && String(route.name).toLowerCase().includes('veterinary'))

        if (isBuilder || isPetOwner || isInternalArea || isVeterinary) {
          route.meta = { ...route.meta, layout: 'blank' }
        }

        if (route.children) {
          route.children = patchLayout(route.children)
        }

        return route
      })
    }

    const allRoutes = patchLayout([...pages, ...routes])
    const laidOutRoutes = setupLayouts(allRoutes)

    // STAGE 2: Force patch after setupLayouts to handle any variations
    const finalRoutes = laidOutRoutes.map(route => {
      const isInternalArea = (route.path && (route.path.includes('/provider/') || route.path.includes('/employee/'))) ||
        (route.name && (String(route.name).startsWith('provider-') || String(route.name).startsWith('employee-')))

      const isVeterinary = (route.path && route.path.toLowerCase().includes('veterinary')) ||
        (route.name && String(route.name).toLowerCase().includes('veterinary'))

      if (isInternalArea || isVeterinary) {
        // Ensure meta is set on the top-level route object returned by setupLayouts
        route.meta = { ...route.meta, layout: 'blank' }
      }

      return route
    })

    console.log('🛣️ Router: Final Routes Sample:', finalRoutes.slice(0, 5).map(r => ({ path: r.path, name: r.name, layout: r.meta?.layout })))

    return [...redirects, ...finalRoutes]
  },
})

setupGuards(router)
export { router }
export default function (app) {
  app.use(router)
}
