export default [
    {
        title: 'Veterinary Dashboard',
        to: { name: 'veterinary-dashboard' },
        icon: { icon: 'tabler-dashboard' },
        capability: 'VETERINARY_CORE',
    },
    {
        title: 'Visits',
        to: { name: 'veterinary-visits' },
        icon: { icon: 'tabler-stethoscope' },
        capability: 'VETERINARY_VISITS'
    },
    {
        title: 'Vitals',
        to: { name: 'veterinary-vitals' },
        icon: { icon: 'tabler-heart-rate-monitor' },
        capability: 'VETERINARY_VITALS'
    },
    {
        title: 'Prescriptions',
        to: { name: 'veterinary-prescriptions' },
        icon: { icon: 'tabler-pill' },
        capability: 'VETERINARY_DOCTOR' // Changed from VETERINARY_PRESCRIPTIONS
    },
    {
        title: 'Lab Tests',
        to: { name: 'veterinary-labs' },
        icon: { icon: 'tabler-flask' },
        capability: 'VETERINARY_LABS'
    },
    {
        title: 'Online Consult',
        to: { name: 'veterinary-online-consult' },
        icon: { icon: 'tabler-video' },
        capability: 'VETERINARY_DOCTOR' // Changed from VETERINARY_ONLINE_CONSULT
    },
    {
        title: 'Offline Visits',
        to: { name: 'veterinary-offline-visits' },
        icon: { icon: 'tabler-building-hospital' },
        capability: 'VETERINARY_VISITS' // Changed from VETERINARY_OFFLINE_VISIT
    },
    {
        title: 'Medicine Reminders',
        to: { name: 'veterinary-medicine-reminders' },
        icon: { icon: 'tabler-bell' },
        capability: 'VETERINARY_PHARMACY' // Changed from VETERINARY_MEDICINE_REMINDERS
    },
    {
        title: 'Schedule',
        to: { name: 'veterinary-schedule' },
        icon: { icon: 'tabler-calendar' },
        capability: 'VETERINARY_CORE',
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
