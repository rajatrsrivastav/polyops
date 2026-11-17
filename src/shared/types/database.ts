export type { Profile, UserRole } from '@/features/auth/schemas/profile-schema';

export type AttendanceStatus = 'present' | 'absent' | 'half_day';
export type DocumentStatus = 'draft' | 'final';

export type Factory = {
  id: string;
  name: string;
  address: string | null;
  gstin: string | null;
  phone: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** Factory roster — separate from auth profiles so workers can exist without login. */
export type Employee = {
  id: string;
  factory_id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  client_id: string;
  factory_id: string;
  created_by: string;
  amount: number;
  category: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

export type Attendance = {
  id: string;
  client_id: string;
  factory_id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  marked_by: string;
  created_at: string;
};

export type Customer = {
  id: string;
  factory_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  client_id: string;
  factory_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  status: DocumentStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

export type InvoiceWithItems = Invoice & {
  invoice_items: InvoiceItem[];
};

export type Challan = {
  id: string;
  client_id: string;
  factory_id: string;
  customer_id: string;
  challan_number: string;
  challan_date: string;
  vehicle_no: string | null;
  notes: string | null;
  status: DocumentStatus;
  pdf_url: string | null;
  created_at: string;
};

export type ChallanItem = {
  id: string;
  challan_id: string;
  description: string;
  qty: number;
  unit: string | null;
};

export type ChallanWithItems = Challan & {
  challan_items: ChallanItem[];
};

/** Numeric columns come back as strings from Postgres — normalize in parsers. */
export type DbNumeric = number | string;
