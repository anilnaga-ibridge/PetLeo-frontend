// Veterinary Navigation - All items with dedicated capability keys
// Capability keys map to backend VETERINARY_* codes via LEGACY_MAPPING in permissionStore.js
// For new direct keys, permissionStore.hasCapability() does a deep search in permissions.categories

export default [
  {
    // Visible to ALL veterinary staff (no capability restriction)
    title: 'Veterinary Dashboard',
    to: { name: 'veterinary-dashboard' },
    icon: { icon: 'tabler-dashboard' },
  },
  {
    title: 'Enterprise Hub',
    to: { name: 'enterprise-booking' },
    icon: { icon: 'tabler-layout-dashboard' },
    capability: 'VETERINARY_CORE',
  },
  {
    title: 'Visits',
    to: { name: 'veterinary-visits' },
    icon: { icon: 'tabler-stethoscope' },
    capability: 'VETERINARY_VISITS',
  },
  {
    // Visible to all (Basic patient management is needed by everyone)
    title: 'Patients',
    to: { name: 'veterinary-pets' },
    icon: { icon: 'tabler-paw' },
  },
  {
    title: 'Vitals',
    to: { name: 'veterinary-vitals' },
    icon: { icon: 'tabler-heart-rate-monitor' },
    capability: 'VETERINARY_VITALS',
  },
  {
    title: 'Doctor Station',
    to: { name: 'veterinary-doctor-board' },
    icon: { icon: 'tabler-stethoscope' },
    capability: 'VETERINARY_DOCTOR',
  },
  {
    title: 'Pharmacy',
    to: { name: 'veterinary-prescriptions' },
    icon: { icon: 'tabler-pill' },
    capability: 'VETERINARY_PHARMACY',
  },
  {
    title: 'Labs',
    to: { name: 'veterinary-labs' },
    icon: { icon: 'tabler-flask' },
    capability: 'VETERINARY_LABS',
  },
  {
    title: 'Online Consult',
    to: { name: 'veterinary-online-consult' },
    icon: { icon: 'tabler-video' },
    capability: 'VETERINARY_ONLINE_CONSULT',
  },
  {
    title: 'Offline Visits',
    to: { name: 'veterinary-offline-visits' },
    icon: { icon: 'tabler-building-hospital' },
    capability: 'VETERINARY_OFFLINE_VISIT',
  },
  {
    title: 'Medicine Reminders',
    to: { name: 'veterinary-medicine-reminders' },
    icon: { icon: 'tabler-bell' },
    capability: 'VETERINARY_MEDICINE_REMINDERS',
  },
  {
    // Schedule has its OWN capability - separate from Visits
    title: 'Schedule',
    to: { name: 'veterinary-schedule' },
    icon: { icon: 'tabler-calendar' },
    capability: 'VETERINARY_SCHEDULE',
  },
  {
    heading: 'Clinic Settings',
    capability: 'VETERINARY_ADMIN_SETTINGS',
  },
  {
    title: 'Metadata Management',
    to: { name: 'veterinary-admin-metadata' },
    icon: { icon: 'tabler-settings-automation' },
    capability: 'VETERINARY_ADMIN_SETTINGS',
  },
  {
    heading: 'Exit Module',
    capability: 'PROVIDER_ADMIN',
  },
  {
    title: 'Back to Provider',
    to: { name: 'provider-dashboard' },
    icon: { icon: 'tabler-arrow-left' },
    capability: 'PROVIDER_ADMIN',
  },
]
