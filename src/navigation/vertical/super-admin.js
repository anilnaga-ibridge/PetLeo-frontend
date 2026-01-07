import { icon } from "@/views/demos/components/badge/demoCodeBadge";

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
        title: "Services & Plans",
        icon: { icon: "tabler-wand" },
        children: [
          {
            title: "Services Builder",
            to: "superadmin-builder-services",
          },
          {
            title: "Plans Builder",
            to: "superadmin-builder-plans",
          },
        ],
      },
      {
        title: "Advanced Configuration",
        icon: { icon: "tabler-settings-automation" },
        children: [
          {
            title: "Services",
            icon: { icon: "tabler-tool" },
            children: [
              {
                title: "Dynamic Services",
                to: "superadmin-dynamicservicecrud-dynamicservices",
              },
              {
                title: "Categories",
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
              { title: "Plans Builder", to: "superadmin-plans-builder" },
              { title: "Plans", to: "superadmin-plans-planss" },
              { title: "Billing Cycles", to: "superadmin-plans-billing-cycles" },
              { title: "Coupons", to: "superadmin-plans-coupon" },
              {
                title: 'Plan Capabilities',
                to: 'superadmin-plans-plan-capabilities',
              },
            ],
          },
        ]
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
            title: "Dynamic Doc Fields",
            to: "superadmin-dynamic-providerfields-sdocuments-form"
          }
          ,
          {
            title: "Provider Dynamic Form Values",
            to: "superadmin-dynamic-providerfields-dynamicprofileform",
          },
          {
            title: "Provider Profile Crud",
            to: "superadmin-dynamic-providerfields-docdynamic"
          },
          {
            title: "Profile",
            to: "superadmin-dynamic-providerfields-profile-documets"
          }
        ],
      },
      {
        title: "Roles & Permissions",
        icon: { icon: "tabler-shield-lock" },
        children: [
          {
            title: "Role",
            iicon: { icon: "tabler-user-shield" },
            to: "superadmin-roles-permissions-roles",
          },
          {
            title: "Permissions",
            iicon: { icon: "tabler-lock" },
            to: "superadmin-roles-permissions-permissions",
          }
        ]
      },
      {
        title: "Document & Verification",
        icon: { icon: "tabler-file-check" },
        children: [
          {
            title: "Documents Verification",
            iicon: { icon: "tabler-user-shield" },
            to: "superadmin-documents-verification-provider-docverification",
          },
        ]
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
