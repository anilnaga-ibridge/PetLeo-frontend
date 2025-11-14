export default [
  {
    heading: 'Super Admin',
  },

  // ==============================
  // 🚀 Dynamic Service Management
  // ==============================
  {
    title: 'Dynamic Service Management',
    icon: { icon: 'tabler-layout-dashboard' },
    children: [
      {
        title: 'Dashboard',
        to: 'superadmin-dashboard',
      },
      {
        title: 'Services',
        icon: { icon: 'tabler-tool' },
        children: [
          { title: 'Add Service', to: 'superadmin-dynamicservicecrud-dynamicservices' },
          { title: 'Service List', to: 'superadmin-dynamicservicecrud-createcategory' },
        ],
      },
      {
        title: 'Orders',
        icon: { icon: 'tabler-shopping-cart' },
        children: [
          { title: 'Order List', to: 'apps-ecommerce-order-list' },
          { title: 'Order Details', to: { name: 'apps-ecommerce-order-details-id', params: { id: '9042' } } },
        ],
      },
      {
        title: 'Customers',
        icon: { icon: 'tabler-users' },
        children: [
          { title: 'Customer List', to: 'apps-ecommerce-customer-list' },
          { title: 'Customer Details', to: { name: 'apps-ecommerce-customer-details-id', params: { id: 478426 } } },
        ],
      },
      {
        title: 'Manage Reviews',
        icon: { icon: 'tabler-star' },
        to: 'apps-ecommerce-manage-review',
      },
      {
        title: 'Referrals',
        icon: { icon: 'tabler-user-plus' },
        to: 'apps-ecommerce-referrals',
      },
      {
        title: 'Settings',
        icon: { icon: 'tabler-settings' },
        to: 'apps-ecommerce-settings',
      },
    ],
  },

  // ==============================
  // ✅ Verified User Management
  // ==============================
  {
    title: 'Verified User Management',
    icon: { icon: 'tabler-users-group' },
    children: [
      {
        title: 'Verified Users',
        icon: { icon: 'tabler-user-check' },
        to: 'superadmin-verify-users-getallverifiedusers',
      },
    ],
  },
]
