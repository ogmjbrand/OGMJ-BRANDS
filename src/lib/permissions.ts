export type PermissionRole = 'admin' | 'manager' | 'editor' | 'viewer';
export type PermissionScope =
  | 'business'
  | 'crm'
  | 'builder'
  | 'videos'
  | 'support'
  | 'analytics'
  | 'settings'
  | 'payments';

export type PermissionMap = Record<PermissionScope, boolean>;

export type ErrorType =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server';

export function hasPermission(
  permissions: PermissionMap,
  scope: PermissionScope
): boolean {
  return Boolean(permissions && permissions[scope]);
}

export function createDefaultPermissions(): PermissionMap {
  return {
    business: false,
    crm: false,
    builder: false,
    videos: false,
    support: false,
    analytics: false,
    settings: false,
    payments: false,
  };
}
