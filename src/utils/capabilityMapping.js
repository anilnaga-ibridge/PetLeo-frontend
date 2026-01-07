export const featureMapping = {
    'VETERINARY_VISITS': 'Reception Desk',
    'VETERINARY_VITALS': 'Vitals / Nurse Station',
    'VETERINARY_DOCTOR': 'Doctor Consultation',
    'VETERINARY_LABS': 'Laboratory',
    'VETERINARY_PHARMACY': 'Pharmacy',
    'VETERINARY_PRESCRIPTIONS': 'Prescriptions (Legacy)',
    'VETERINARY_MEDICINE_REMINDERS': 'Medicine Reminders',
    'VETERINARY_ONLINE_CONSULT': 'Online Consultation',
    'VETERINARY_OFFLINE_VISIT': 'Offline Visits',
    'VETERINARY_CORE': 'Veterinary Core'
};

export const formatFeatureName = (name) => {
    if (!name) return '';
    // Try exact match
    if (featureMapping[name]) return featureMapping[name];

    // Try matching without VETERINARY_ prefix if DB has different naming
    const upper = name.toUpperCase();
    if (featureMapping[upper]) return featureMapping[upper];

    // Fallback: Title Case if it looks like a code
    if (upper.includes('_')) {
        return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return name;
};
