// Navigation types
export type View = 'dashboard' | 'create-details' | 'create-items' | 'create-review' | 'analytics' | 'customers-list' | 'customer-details' | 'inventory-list' | 'inventory-details' | 'money-tracking' | 'invoice-preview' | 'todo-list' | 'notes';
export type Module = 'data-input' | 'extra-feature' | 'analytics-dashboard' | 'customers-module' | 'inventory-module' | 'money-module' | 'invoices-module' | 'todo-module' | 'notes-module';
export type DashboardSubView = 'overview' | 'customers' | 'products';

// Product columns in Sales_Data (wide/pivoted format — each has Rate + Qty pair)
export const PRODUCT_COLS = [
  'YES', 'Yes 5G', 'DiGi', 'DiGi 6GB', 'DiGi 30GB',
  'uMobile', 'uMobile-Y', 'UniFi',
  'Celcom', 'Celcom 35', 'Celcom 39',
  'Hot30GB', 'Hot50GB', 'Hot60GB', 'Hot80GB', 'HotZun', 'HotUN',
  'RedOne', 'TuneTalk', 'XoX',
];

// Brand colors per product (telecom company branding)
export const PRODUCT_BRAND_COLORS: Record<string, string> = {
  'YES':       '#FF00FF',
  'Yes 5G':    '#FF00FF',
  'DiGi':      '#F7E901',
  'DiGi 6GB':  '#F7E901',
  'DiGi 30GB': '#F7E901',
  'uMobile':   '#FF8601',
  'uMobile-Y': '#FF8601',
  'UniFi':     '#FF6002',
  'Celcom':    '#005FBE',
  'Celcom 35': '#005FBE',
  'Celcom 39': '#005FBE',
  'Hot30GB':   '#FF0000',
  'Hot50GB':   '#FF0000',
  'Hot60GB':   '#FF0000',
  'Hot80GB':   '#FF0000',
  'HotZun':    '#FF0000',
  'HotUN':     '#FF0000',
  'RedOne':    '#990000',
  'TuneTalk':  '#F6B26B',
  'XoX':       '#000000',
};

export const STORAGE_TARGETS = (m: string) => `simcard_targets_${m}`;
export const STORAGE_COMPLETION = (m: string) => `simcard_completion_${m}`;
export const STORAGE_LAST_MONTH = 'simcard_last_target_month';
