export type Brand = 'Twisted Twig' | 'Wood Grain Alchemist';

export type PricingStrategy = 
  | 'Cost Plus' 
  | 'Competitive' 
  | 'Market Share' 
  | 'Value Added' 
  | 'Project Based' 
  | 'Bundle' 
  | 'None';

export interface InventoryItem {
  id?: string;
  inventoryNumber: string;
  owner: Brand;
  type: 'Raw Material' | 'Furniture Piece' | 'Supply';
  name: string;
  quantity: number;
  acquisition_cost: number;
  current_condition?: number; // 1-10
  location: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFinancials {
  item_cost: number;
  supplies_cost: number;
  labor_hours?: number;
  hourly_rate?: number;
  pricing_strategy?: PricingStrategy;
  target_sale_price: number;
  actual_sale_price?: number;
}

export interface WorkLogEntry {
  timestamp: string;
  action: string;
  notes: string;
}

export interface Project {
  id?: string;
  brand: Brand;
  title?: string;
  description?: string;
  client_id?: string;
  inventory_item_id?: string;
  status: 'Intake' | 'Assessment' | 'Structural Repair' | 'Finishing' | 'Complete';
  assigned_to: string;
  financials: ProjectFinancials;
  work_log: WorkLogEntry[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
  date_completed?: string;
}

export interface Customer {
  id?: string;
  name: string;
  contact: string;
  purchase_history: string[];
}

export interface ShopNote {
  id?: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id?: string;
  brand: Brand;
  vendor: string;
  date: string;
  total_amount: number;
  status: 'Draft' | 'Ordered' | 'Received' | 'Cancelled';
  items: {
    description: string;
    quantity: number;
    unit_price: number;
    inventory_item_id?: string;
  }[];
  receipt_url?: string;
  notes?: string;
  createdAt: string;
  received_date?: string;
}

export interface Purchase {
  id?: string;
  vendor: string;
  items: {
    description: string;
    quantity: number;
    price: number;
  }[];
  total_cost: number;
  date: string;
  linked_project_id?: string;
  receipt_url?: string;
  owner: Brand;
  createdAt?: string;
  updatedAt?: string;
}
