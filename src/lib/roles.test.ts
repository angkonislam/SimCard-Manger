import { describe, it, expect } from 'vitest';
import { can, canViewModule } from './roles';

describe('roles.can', () => {
  it('admin has every permission incl. profit + user mgmt', () => {
    expect(can('admin', 'manage:users')).toBe(true);
    expect(can('admin', 'view:profit')).toBe(true);
    expect(can('admin', 'edit:data')).toBe(true);
    expect(can('admin', 'delete:data')).toBe(true);
    expect(can('admin', 'manage:money')).toBe(true);
  });

  it('manager has all except manage:users and view:profit', () => {
    expect(can('manager', 'manage:users')).toBe(false);
    expect(can('manager', 'view:profit')).toBe(false);
    expect(can('manager', 'edit:data')).toBe(true);
    expect(can('manager', 'delete:data')).toBe(true);
    expect(can('manager', 'manage:money')).toBe(true);
    expect(can('manager', 'view:money')).toBe(true);
    expect(can('manager', 'view:inventory')).toBe(true);
  });

  it('staff only dashboard + customers + invoice create', () => {
    expect(can('staff', 'view:dashboard')).toBe(true);
    expect(can('staff', 'view:customers')).toBe(true);
    expect(can('staff', 'view:invoice-create')).toBe(true);
    expect(can('staff', 'edit:data')).toBe(true);
    // Locked
    expect(can('staff', 'view:inventory')).toBe(false);
    expect(can('staff', 'view:money')).toBe(false);
    expect(can('staff', 'view:todo')).toBe(false);
    expect(can('staff', 'view:notes')).toBe(false);
    expect(can('staff', 'view:profit')).toBe(false);
    expect(can('staff', 'delete:data')).toBe(false);
    expect(can('staff', 'manage:money')).toBe(false);
    expect(can('staff', 'manage:users')).toBe(false);
  });

  it('null role denies all', () => {
    expect(can(null, 'view:dashboard')).toBe(false);
    expect(can(null, 'edit:data')).toBe(false);
  });
});

describe('roles.canViewModule', () => {
  it('staff only sees 3 modules', () => {
    expect(canViewModule('staff', 'analytics-dashboard')).toBe(true);
    expect(canViewModule('staff', 'customers-module')).toBe(true);
    expect(canViewModule('staff', 'data-input')).toBe(true);
    expect(canViewModule('staff', 'inventory-module')).toBe(false);
    expect(canViewModule('staff', 'money-module')).toBe(false);
    expect(canViewModule('staff', 'todo-module')).toBe(false);
    expect(canViewModule('staff', 'notes-module')).toBe(false);
  });

  it('manager sees everything (profit gated separately)', () => {
    const all = ['analytics-dashboard','customers-module','inventory-module','money-module','data-input','todo-module','notes-module'] as const;
    for (const m of all) expect(canViewModule('manager', m)).toBe(true);
  });

  it('admin sees everything', () => {
    const all = ['analytics-dashboard','customers-module','inventory-module','money-module','data-input','todo-module','notes-module'] as const;
    for (const m of all) expect(canViewModule('admin', m)).toBe(true);
  });
});
