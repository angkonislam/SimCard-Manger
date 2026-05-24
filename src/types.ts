export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type InvoiceStatus = 'unpaid' | 'draft' | 'paid';

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Failed';
  referenceId?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplierName: string;
  stock: number;
  unit: string;
  price: number;
  cost: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
  additionalSuppliers?: { id: string; supplierName: string; stock: number; cost: number }[];
}

export interface Customer {
  id: string;
  customerId: string;      // Client ID (number as string)
  name: string;            // Customer Name
  email: string;
  initials: string;        // computed from name
  shortName?: string;      // Short Name
  contact?: string;        // Contact
  location?: string;       // Location
  whatsappGroup?: string;  // Whatsapp Group Name
  group?: string;
  balance?: number;        // Due Amount💲
  dueAmount?: number;      // Due Amount💲 (alias)
  lastMonthSales?: number; // Last Month Sales💲
  lastPaymentDate?: string;// Last Payment Date
  lastPaid?: number;       // Last Paid💲
  status?: string;         // Status
  creditLimit?: number;
  paymentTerms?: string;
  taxId?: string;
  address?: string;
  remarks?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  notes?: string;
  items: LineItem[];
  status: InvoiceStatus;
  subtotal: number;
  vat: number;
  total: number;
  isOverdue?: boolean;
  itemCosts?: Record<string, number>;
}

export interface DbProduct {
  id: number;
  name: string;
  company_name: string;
  stock_qty: number | null;
  is_hidden: boolean;
  avg_cost?: number | null;
}

export interface DbSupplier {
  id: number;
  product_name: string;
  supplier_name: string;
  qty: number;
  unit_price: number;
}

export interface SalesRow {
  date: string;
  list_id: string;
  customer_name: string;
  product: string;
  qty: number;
  rate: number;
}
