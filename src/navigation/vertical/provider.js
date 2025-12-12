export default [
    {
        title: 'Dashboard',
        to: { name: 'provider-dashboard' },
        icon: { icon: 'tabler-smart-home' },
    },
    {
        title: 'Bookings',
        to: { name: 'provider-bookings' },
        icon: { icon: 'tabler-calendar' },
        permission: 'view_bookings',
    },
    {
        title: 'Plan Cart',
        to: { name: 'provider-cart' },
        icon: { icon: 'tabler-shopping-cart' },
    },
    {
        title: 'Plan Bookings',
        to: { name: 'provider-plan-bookings' },
        icon: { icon: 'tabler-list-check' },
    },
    {
        title: 'Services',
        to: { name: 'provider-services' },
        icon: { icon: 'tabler-briefcase' },
        permission: 'create_service',
    },

]
