export default [
  {
    title: 'Veterinary Dashboard',
    to: { name: 'veterinary-dashboard' },
    icon: { icon: 'tabler-dashboard' },

    // Visible to all veterinary staff
  },
  {
    title: 'Visits',
    to: { name: 'veterinary-visits' },
    icon: { icon: 'tabler-stethoscope' },
    capability: 'VETERINARY_VISITS',
  },
  {
    title: 'Patients',
    to: { name: 'veterinary-pets' },
    icon: { icon: 'tabler-paw' },

    // Visible to all (Basic patient management is needed by everyone)
  },
  {
    title: 'Vitals',
    to: { name: 'veterinary-vitals' },
    icon: { icon: 'tabler-heart-rate-monitor' },
    capability: 'VETERINARY_VITALS',
  },
  {
    title: 'Doctors',
    to: { name: 'veterinary-doctor-board' },
    icon: { icon: 'tabler-stethoscope' },
    capability: 'VETERINARY_DOCTOR',
  },
  {
    title: 'Prescriptions',
    to: { name: 'veterinary-prescriptions' },
    icon: { icon: 'tabler-prescription' },
    capability: 'VETERINARY_PRESCRIPTIONS',
  },
  {
    title: 'Labs',
    to: { name: 'veterinary-labs' },
    icon: { icon: 'tabler-flask' },
    capability: 'VETERINARY_LABS',
  },
  {
    title: 'Pharmacy',
    to: { name: 'veterinary-pharmacy' },
    icon: { icon: 'tabler-pill' },
    capability: 'VETERINARY_PHARMACY',
  },
  {
    title: 'Online Consult',
    to: { name: 'veterinary-online-consult' },
    icon: { icon: 'tabler-video' },
    capability: 'VETERINARY_DOCTOR',
  },
  {
    title: 'Offline Visits',
    to: { name: 'veterinary-offline-visits' },
    icon: { icon: 'tabler-building-hospital' },
    capability: 'VETERINARY_VISITS',
  },
  {
    title: 'Medicine Reminders',
    to: { name: 'veterinary-medicine-reminders' },
    icon: { icon: 'tabler-bell' },
    capability: 'VETERINARY_MEDICINE_REMINDERS',
  },
  {
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
  { heading: 'Exit Module' },
  {
    title: 'Back to Provider',
    to: { name: 'provider-dashboard' },
    icon: { icon: 'tabler-arrow-left' },
    action: 'read',
    subject: 'Auth',
  },
]
