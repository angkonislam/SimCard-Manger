// Role-based access control. Single source of truth for what each role can do.

import type { Module } from '../constants';

export type Role = 'admin' | 'manager' | 'staff';

export type Permission =
  // Module-level visibility
  | 'view:dashboard'
  | 'view:customers'
  | 'view:inventory'
  | 'view:money'
  | 'view:invoice-create'
  | 'view:todo'
  | 'view:notes'
  | 'view:profit'    // profit subtab inside inventory
  // Action-level
  | 'edit:data'      // create/update customers, inventory, invoices
  | 'delete:data'    // delete customers, invoices, transactions, products
  | 'manage:money'   // create/edit money tracking entries
  | 'manage:users';  // settings → user mgmt

const MATRIX: Record<Role, Permission[]> = {
  admin: [
    'view:dashboard', 'view:customers', 'view:inventory', 'view:money',
    'view:invoice-create', 'view:todo', 'view:notes', 'view:profit',
    'edit:data', 'delete:data', 'manage:money', 'manage:users',
  ],
  manager: [
    // All access EXCEPT manage:users + view:profit
    'view:dashboard', 'view:customers', 'view:inventory', 'view:money',
    'view:invoice-create', 'view:todo', 'view:notes',
    'edit:data', 'delete:data', 'manage:money',
  ],
  staff: [
    // Dashboard + customers + invoice create only
    'view:dashboard', 'view:customers', 'view:invoice-create',
    'edit:data',
  ],
};

export function can(role: Role | null, perm: Permission): boolean {
  if (!role) return false;
  return MATRIX[role].includes(perm);
}

// Map Module → Permission so Sidebar can filter nav items.
export const MODULE_PERMISSIONS: Record<Module, Permission> = {
  'analytics-dashboard': 'view:dashboard',
  'customers-module':    'view:customers',
  'inventory-module':    'view:inventory',
  'money-module':        'view:money',
  'data-input':          'view:invoice-create',
  'invoices-module':     'view:invoice-create',
  'todo-module':         'view:todo',
  'notes-module':        'view:notes',
  'extra-feature':       'view:dashboard',
};

export function canViewModule(role: Role | null, m: Module): boolean {
  return can(role, MODULE_PERMISSIONS[m]);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};
