export const ACTION_LABELS = {
  can_view: 'View / Read Access',
  can_create: 'Create / Add',
  can_edit: 'Edit / Update',
  can_delete: 'Delete / Remove',
}

export const getLabel = key => {
  return ACTION_LABELS[key] || key
}
