export const roles = {
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};

export const permissions = {
  [roles.ADMIN]: ['create_project', 'import_data', 'edit_records', 'delete_records', 'share_project', 'manage_users'],
  [roles.TEACHER]: ['create_project', 'import_data', 'edit_records', 'share_project'],
  [roles.EDITOR]: ['import_data', 'edit_records'],
  [roles.VIEWER]: ['view_records'],
};
