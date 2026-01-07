export const VETERINARY_ROLES = [
    {
        title: 'Doctor',
        value: 'doctor',
        description: 'Can diagnose, prescribe, and view all patient records.',
        capabilities: ['VETERINARY_PRESCRIPTIONS', 'VETERINARY_VISITS', 'VETERINARY_CORE']
    },
    {
        title: 'Receptionist',
        value: 'receptionist',
        description: 'Can manage appointments and check-ins.',
        capabilities: ['VETERINARY_VISITS', 'VETERINARY_CORE']
    },
    {
        title: 'Vitals Staff / Nurse',
        value: 'nurse',
        description: 'Can record patient vitals and triage.',
        capabilities: ['VETERINARY_VITALS', 'VETERINARY_CORE']
    },
    {
        title: 'Lab Technician',
        value: 'lab_tech',
        description: 'Can manage lab orders and results.',
        capabilities: ['VETERINARY_LABS', 'VETERINARY_CORE']
    },
    {
        title: 'Pharmacy',
        value: 'pharmacy',
        description: 'Can dispense medicines and manage inventory.',
        capabilities: ['VETERINARY_MEDICINE_REMINDERS', 'VETERINARY_CORE']
    }
]
