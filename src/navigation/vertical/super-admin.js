export default [
  {
    heading: "Super Admin",
  },
  {
    title: "Dynamic Service Management",
    icon: { icon: "tabler-layout-dashboard" },
    children: [
      {
        title: "Dashboard",
        to: "superadmin-dashboard",
      },
      {
        title: "Services",
        icon: { icon: "tabler-tool" },
        children: [
          {
            title: "Dynamic Services",
            to: "superadmin-dynamicservicecrud-dynamicservices",
          },
          {
            title: "Create Category",
            to: "superadmin-dynamicservicecrud-createcategory",
          },
          {
            title: "Facilities",
            to: "superadmin-dynamicservicecrud-addfacility",
          },
          { title: "Pricing", to: "superadmin-dynamicservicecrud-addpricing" },
        ],
      },
      {
        title: "Plans & Billing",
        icon: { icon: "tabler-shopping-cart" },
        children: [
          { title: "Billing-Cycle", to: "superadmin-plans-bill" },
          { title: "Plans", to: "superadmin-plans-planss" },
          { title: "Plan Prices", to: "superadmin-plans-plan-prices" },

          { title: "Coupons", to: "superadmin-plans-coupon" },
          { title: "Plan Items", to: "superadmin-plans-plan-items" },
        ],
      },
      {
        title: "Pet Types & Breeds",
        icon: { icon: "tabler-shopping-cart" },
        children: [
          { title: "Pet Types", to: "superadmin-pets-types" },
          { title: "Pet Breeds", to: "superadmin-pets-breeds" },
        ],
      },
      
      {
        title: "Providers",
        icon: { icon: "tabler-users" },
        children: [
          {
            title: "Dynamic Profile Fields",
            to: "superadmin-dynamic-providerfields-sprofile-form",
          },
          {
            title:" Dynamic Doc Fields",
            to:"superadmin-dynamic-providerfields-sdocuments-form"
          }
          ,
          {
            title: "Provider Dynamic Form Values",
            to: "superadmin-dynamic-providerfields-dynamicprofileform",
          },
          {
            title: "Provider Profile Crud",
            to:"superadmin-dynamic-providerfields-docdynamic"
          },
          {
            title:"Profile",
            to:"superadmin-dynamic-providerfields-profile-documets"
          }
        ],
      },
      {
        title: "Manage Reviews",
        icon: { icon: "tabler-star" },
        to: "apps-ecommerce-manage-review",
      },
      {
        title: "Referrals",
        icon: { icon: "tabler-user-plus" },
        to: "apps-ecommerce-referrals",
      },
      {
        title: "Settings",
        icon: { icon: "tabler-settings" },
        to: "apps-ecommerce-settings",
      },
    ],
  },

  // ==============================
  // ✅ Verified User Management
  // ==============================
  {
    title: "Verified User Management",
    icon: { icon: "tabler-users-group" },
    children: [
      {
        title: "Verified Users",
        icon: { icon: "tabler-user-check" },
        to: "superadmin-verify-users-getallverifiedusers",
      },
    ],
  },
  {
    title: "Email Templates builder",
    icon: { icon: "tabler-mail" },
    to: "emailbuilder",
  },
];
