import { Customer, InventoryItem, Transaction, Invoice } from '../types';

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', customerId: 'C-001', name: 'Didar Vai Store', email: 'didar@gmail.com', initials: 'DV', contact: '+601135073235', location: 'Gemas', group: 'Standard', balance: 0, creditLimit: 5000, paymentTerms: 'Net 30', taxId: 'GST-12345', address: 'Main St 12, Gemas', remarks: 'Good customer' },
  { id: 'c2', customerId: 'C-002', name: 'Atiq Vai Trading', email: 'atiq@gmail.com', initials: 'AV', contact: '+60124567890', location: 'TM', group: 'Standard', balance: 1500, creditLimit: 2000, paymentTerms: 'Net 15', taxId: 'GST-67890', address: 'TM Plaza, Suite 4', remarks: '' },
  { id: 'c3', customerId: 'C-003', name: 'Basir Vai Brothers', email: 'basir@gmail.com', initials: 'BV', contact: '+60139876543', location: 'Bacang', group: 'Regular', balance: 0, creditLimit: 3000, paymentTerms: 'Net 30', taxId: 'GST-11223', address: 'Bacang Industrial Area', remarks: '' },
  { id: 'c4', customerId: 'C-004', name: 'MF Hossen Store', email: 'hossen@gmail.com', initials: 'MH', contact: '+60144455667', location: 'Central', group: 'VIP', balance: 4500, creditLimit: 10000, paymentTerms: 'COD', taxId: 'GST-44556', address: 'Central Market Block A', remarks: 'High volume buyer' },
  { id: 'c5', customerId: 'C-005', name: 'Arif Vai Trading', email: 'arif@gmail.com', initials: 'Ar', contact: '+60155566778', location: 'Kota Laxmana', group: 'Regular', balance: 0, creditLimit: 1500, paymentTerms: 'Net 7', taxId: 'GST-77889', address: 'Jalan Laxmana 5', remarks: '' },
  { id: 'c6', customerId: 'C-006', name: 'Rasel Enterprise', email: 'rasel@gmail.com', initials: 'RE', contact: '+60166677889', location: 'Bahaul', group: 'Standard', balance: 2200, creditLimit: 5000, paymentTerms: 'Net 30', taxId: 'GST-99001', address: 'Bahaul Town Center', remarks: '' },
  { id: 'c7', customerId: 'C-007', name: 'Utpol Dah Bros', email: 'utpol@gmail.com', initials: 'UD', contact: '+60177788990', location: 'Central', group: 'Standard', balance: 0, creditLimit: 2000, paymentTerms: 'Net 14', taxId: 'GST-22334', address: 'Central Point Mall', remarks: '' },
  { id: 'c8', customerId: 'C-008', name: 'Azmas Maju Pvt', email: 'azmas@gmail.com', initials: 'AM', contact: '+60188899001', location: 'Central', group: 'VIP', balance: 12000, creditLimit: 20000, paymentTerms: 'Net 60', taxId: 'GST-55667', address: 'Industrial Zone 2', remarks: 'Priority client' },
  { id: 'c9', customerId: 'C-009', name: 'Azim Trading Co', email: 'azim@gmail.com', initials: 'AT', contact: '+60199900112', location: 'Penang', group: 'Regular', balance: 0, creditLimit: 1000, paymentTerms: 'COD', taxId: 'GST-88990', address: 'Penang Wharf Rd', remarks: '' },
  { id: 'c10', customerId: 'C-010', name: 'Elias Mamul Store', email: 'elias@gmail.com', initials: 'EM', contact: '+60111122334', location: 'Central', group: 'Standard', balance: 900, creditLimit: 3000, paymentTerms: 'Net 30', taxId: 'GST-12121', address: 'Market St 45', remarks: '' },
  { id: 'c11', customerId: 'C-011', name: 'Shopno General', email: 'shopno@gmail.com', initials: 'SG', contact: '+60122233445', location: 'Melaka', group: 'Standard', balance: 0, creditLimit: 2500, paymentTerms: 'Net 15', taxId: 'GST-23232', address: 'Melaka Central Mall', remarks: '' },
  { id: 'c12', customerId: 'C-012', name: 'Bhai Bhai Ent', email: 'bba@gmail.com', initials: 'BB', contact: '+60133344556', location: 'Johor', group: 'Regular', balance: 350, creditLimit: 1500, paymentTerms: 'Net 7', taxId: 'GST-34343', address: 'Johor Baru Sec 3', remarks: '' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'i1', sku: 'SKU-HOT80', name: 'Hot80GB Prepaid', category: 'Prepaid', supplierName: 'KS', stock: 150, unit: 'pcs', price: 35, cost: 28, status: 'In Stock', lastUpdated: '2026-03-20' },
  { id: 'i2', sku: 'SKU-HOT60', name: 'Hot60GB Prepaid', category: 'Prepaid', supplierName: 'KS', stock: 45, unit: 'pcs', price: 25, cost: 20, status: 'Low Stock', lastUpdated: '2026-03-21' },
  { id: 'i3', sku: 'SKU-HOTUN', name: 'Hot Unlimited', category: 'Prepaid', supplierName: 'KS', stock: 210, unit: 'pcs', price: 45, cost: 38, status: 'In Stock', lastUpdated: '2026-03-22' },
  { id: 'i4', sku: 'SKU-YES5G', name: 'YES 5G Infinite', category: 'Sim Card', supplierName: 'KS', stock: 12, unit: 'pcs', price: 58, cost: 45, status: 'Low Stock', lastUpdated: '2026-03-19' },
  { id: 'i5', sku: 'SKU-DIGI30', name: 'DiGi 30 Days Pack', category: 'Top Up', supplierName: 'KS', stock: 500, unit: 'pcs', price: 30, cost: 27, status: 'In Stock', lastUpdated: '2026-03-23' },
  { id: 'i6', sku: 'SKU-CELCOM', name: 'Celcom Xpax', category: 'Sim Card', supplierName: 'KS', stock: 0, unit: 'pcs', price: 10, cost: 8, status: 'Out of Stock', lastUpdated: '2026-03-18' },
  { id: 'i7', sku: 'SKU-UMOBILE', name: 'uMobile GX30', category: 'Prepaid', supplierName: 'KS', stock: 85, unit: 'pcs', price: 30, cost: 24, status: 'In Stock', lastUpdated: '2026-03-24' },
  { id: 'i8', sku: 'SKU-REDONE', name: 'RedOne Postpaid', category: 'Postpaid', supplierName: 'KS', stock: 25, unit: 'pcs', price: 50, cost: 40, status: 'In Stock', lastUpdated: '2026-03-25' },
  { id: 'i9', sku: 'SKU-MAXIS', name: 'Maxis Hotlink 365', category: 'Sim Card', supplierName: 'KS', stock: 10, unit: 'pcs', price: 33, cost: 25, status: 'Low Stock', lastUpdated: '2026-03-26' },
  { id: 'i10', sku: 'SKU-DIGIVID', name: 'DiGi Video Freedom', category: 'Top Up', supplierName: 'KS', stock: 120, unit: 'pcs', price: 15, cost: 12, status: 'In Stock', lastUpdated: '2026-03-26' },
  { id: 'i11', sku: 'SKU-CELNET', name: 'Celcom Internet Pass', category: 'Top Up', supplierName: 'KS', stock: 75, unit: 'pcs', price: 20, cost: 16, status: 'In Stock', lastUpdated: '2026-03-27' },
  { id: 'i12', sku: 'SKU-UNIFI', name: 'Unifi Mobile Bebas', category: 'Sim Card', supplierName: 'KS', stock: 30, unit: 'pcs', price: 35, cost: 28, status: 'Low Stock', lastUpdated: '2026-03-27' },
  { id: 'i13', sku: 'SKU-HOT10', name: 'Hotlink RM10 Topup', category: 'Top Up', supplierName: 'KS', stock: 250, unit: 'pcs', price: 10, cost: 9.5, status: 'In Stock', lastUpdated: '2026-03-27' },
  { id: 'i14', sku: 'SKU-HOT30', name: 'Hotlink RM30 Topup', category: 'Top Up', supplierName: 'KS', stock: 180, unit: 'pcs', price: 30, cost: 28.5, status: 'In Stock', lastUpdated: '2026-03-27' },
  { id: 'i15', sku: 'SKU-HOT50', name: 'Hotlink RM50 Topup', category: 'Top Up', supplierName: 'KS', stock: 90, unit: 'pcs', price: 50, cost: 47.5, status: 'In Stock', lastUpdated: '2026-03-27' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-0041',
    customer: MOCK_CUSTOMERS[1],
    issueDate: '2026-01-15',
    dueDate: '2026-01-31',
    paymentTerms: 'Net 14 days',
    items: [],
    status: 'unpaid',
    subtotal: 6200,
    vat: 620,
    total: 6820,
    isOverdue: true,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-0040',
    customer: MOCK_CUSTOMERS[2],
    issueDate: '2026-01-10',
    dueDate: '2026-01-25',
    paymentTerms: 'Net 14 days',
    items: [],
    status: 'unpaid',
    subtotal: 4390,
    vat: 439,
    total: 4829,
    isOverdue: true,
  },
];
