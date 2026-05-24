-- Supabase Schema Initialization for SimCard Manager
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (to "remove ager entry")
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.inventory;
DROP TABLE IF EXISTS public.customers;

-- 3. Create Customers Table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "customerId" TEXT,
    name TEXT NOT NULL,
    email TEXT,
    initials TEXT,
    contact TEXT,
    location TEXT,
    "group" TEXT,
    balance NUMERIC DEFAULT 0,
    "creditLimit" NUMERIC DEFAULT 0,
    "paymentTerms" TEXT,
    "taxId" TEXT,
    address TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Inventory Table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    "supplierName" TEXT,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    price NUMERIC DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    status TEXT,
    "lastUpdated" TEXT,
    "additionalSuppliers" JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Transactions Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('Income', 'Expense')),
    category TEXT,
    amount NUMERIC NOT NULL,
    date TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('Completed', 'Pending', 'Failed')),
    "referenceId" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Invoices Table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "invoiceNumber" TEXT UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    "issueDate" TEXT,
    "dueDate" TEXT,
    "paymentTerms" TEXT,
    notes TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT CHECK (status IN ('unpaid', 'draft', 'paid')),
    subtotal NUMERIC DEFAULT 0,
    vat NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- 8. Enable Row Level Security (RLS) - For development, we'll allow all access.
-- WARNING: In production, you should set proper policies.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
-- 9. Insert Sample Data (Optional)

-- Customers
INSERT INTO public.customers (id, "customerId", name, email, initials, contact, location, "group", balance, "creditLimit", "paymentTerms", address)
VALUES 
('c1000000-0000-0000-0000-000000000001', 'C-001', 'Didar Vai Store', 'didar@gmail.com', 'DV', '+601135073235', 'Gemas', 'Standard', 0, 5000, 'Net 30', 'Main St 12, Gemas'),
('c1000000-0000-0000-0000-000000000002', 'C-002', 'Atiq Vai Trading', 'atiq@gmail.com', 'AV', '+60124567890', 'TM', 'Standard', 1500, 2000, 'Net 15', 'TM Plaza, Suite 4'),
('c1000000-0000-0000-0000-000000000003', 'C-003', 'Basir Vai Brothers', 'basir@gmail.com', 'BV', '+60139876543', 'Bacang', 'Regular', 0, 3000, 'Net 30', 'Bacang Industrial Area');

-- Inventory
INSERT INTO public.inventory (sku, name, category, "supplierName", stock, unit, price, cost, status, "lastUpdated")
VALUES 
('SKU-HOT80', 'Hot80GB Prepaid', 'Prepaid', 'KS', 150, 'pcs', 35, 28, 'In Stock', '2026-03-20'),
('SKU-HOT60', 'Hot60GB Prepaid', 'Prepaid', 'KS', 45, 'pcs', 25, 20, 'Low Stock', '2026-03-21'),
('SKU-HOTUN', 'Hot Unlimited', 'Prepaid', 'KS', 210, 'pcs', 45, 38, 'In Stock', '2026-03-22');

-- Transactions
INSERT INTO public.transactions (type, category, amount, date, description, status)
VALUES 
('Income', 'Sales', 4500, '2026-03-24', 'Payment from MF Hossen', 'Completed'),
('Expense', 'Inventory', 1200, '2026-03-23', 'Restock Hot Unlimited SIMs', 'Completed');

-- Invoices
INSERT INTO public.invoices ("invoiceNumber", customer_id, "issueDate", "dueDate", "paymentTerms", status, subtotal, vat, total)
VALUES 
('INV-2026-0041', 'c1000000-0000-0000-0000-000000000002', '2026-01-15', '2026-01-31', 'Net 14 days', 'unpaid', 6200, 620, 6820);
