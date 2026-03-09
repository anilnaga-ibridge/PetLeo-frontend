export const ERROR_MAPPINGS = {
  'PET_BUSY': {
    title: 'Pet Already Booked',
    message: 'This pet already has an appointment or is currently in a visit during the selected time.',
    icon: 'tabler-alert-triangle',
    color: 'error',
  },
  'RESOURCE_CAPACITY_EXCEEDED': {
    title: 'Resource at Capacity',
    message: 'All physical resources (rooms/tables) required for this service are fully occupied at this time.',
    icon: 'tabler-building-hospital',
    color: 'warning',
  },
  'LOCK_CONFLICT': {
    title: 'Slot Temporarily Reserved',
    message: 'Another user is currently booking this slot. It will be available if they do not complete the checkout within 5 minutes.',
    icon: 'tabler-lock-check',
    color: 'info',
  },
  'EMPLOYEE_UNAVAILABLE': {
    title: 'Staff Unavailable',
    message: 'The selected staff member is either not scheduled or already booked for a conflicting service.',
    icon: 'tabler-user-off',
    color: 'error',
  },
  'IDEMPOTENCY_RETRY': {
    title: 'Sync in Progress',
    message: 'We are already processing this booking request. Please check your visit list in a few seconds.',
    icon: 'tabler-refresh',
    color: 'primary',
  },
}

export const getFriendlyError = code => {
  return ERROR_MAPPINGS[code] || {
    title: 'Booking Error',
    message: 'An unexpected error occurred while coordinating this visit. Please try again.',
    icon: 'tabler-error-404',
    color: 'secondary',
  }
}
