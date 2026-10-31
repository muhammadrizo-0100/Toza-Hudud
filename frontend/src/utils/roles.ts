import { AdminRole, AdminUser } from '../types';

export const isSuperAdmin = (role?: AdminRole | null): boolean => role === 'SuperAdmin';
export const isManager = (role?: AdminRole | null): boolean => role === 'Manager';
export const isDispatcher = (role?: AdminRole | null): boolean => role === 'Dispatcher';
export const isInspector = (role?: AdminRole | null): boolean => role === 'Inspector';
export const isDriver = (role?: AdminRole | null): boolean => role === 'Driver';
export const isFieldExecutor = (role?: AdminRole | null): boolean => role === 'Inspector' || role === 'Driver';

export function getRoleLabel(role?: AdminRole | null): string {
  switch (role) {
    case 'SuperAdmin':
      return 'Viloyat Bosh Administratori';
    case 'Manager':
      return 'Tuman Tozalik Boshlig‘i';
    case 'Dispatcher':
      return 'Tuman Dispetcheri';
    case 'Inspector':
      return 'Hudud nazoratchisi / Usta';
    case 'Driver':
      return 'Maxsus texnika haydovchisi';
    default:
      return 'Xodim';
  }
}

export function getUserRoleBadgeText(user?: AdminUser | null): string {
  if (!user) return 'Xodim';
  if (user.role === 'SuperAdmin') {
    return 'Viloyat Bosh Administratori';
  }
  if (user.role === 'Manager') {
    return `${user.district?.name || 'Tuman'} Boshlig‘i`;
  }
  if (user.role === 'Dispatcher') {
    return `${user.district?.name || 'Tuman'} Dispetcheri`;
  }
  if (user.role === 'Inspector') {
    return `${user.district?.name || 'Hudud'} Nazoratchisi`;
  }
  if (user.role === 'Driver') {
    return `${user.district?.name || 'Tuman'} Haydovchisi`;
  }
  return 'Xodim';
}
