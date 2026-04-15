export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  unit: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  date: Date;
  customerName?: string;
  notes?: string;
}

export interface SaleItem {
  id: string;
  type: 'product' | 'service' | 'manual';
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  purchasePrice?: number; // For manual items to track cost
}

export interface Service {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  description?: string;
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplierName?: string;
  date: Date;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
  receiptNumber?: string;
  notes?: string;
}

export type TicketStatus =
  | 'új'
  | 'folyamatban'
  | 'diagnosztika'
  | 'alkatrész rendelés'
  | 'javítás'
  | 'lezárva'
  | 'visszautasítva';

export type DeviceType =
  | 'számítógép'
  | 'nyomtató'
  | 'telefon'
  | 'tablet'
  | 'konzol'
  | 'egyéb';

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deviceType: DeviceType;
  deviceModel?: string;
  deviceSerialNumber?: string;
  problem: string;
  status: TicketStatus;
  priority: 'alacsony' | 'normál' | 'magas' | 'sürgős';
  estimatedCost?: number;
  finalCost?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  query: string;
  category: 'all' | 'products' | 'sales' | 'purchases' | 'expenses';
  dateFrom?: Date;
  dateTo?: Date;
  priceFrom?: number;
  priceTo?: number;
}