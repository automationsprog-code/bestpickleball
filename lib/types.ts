export interface Court {
  id: string;
  name: string;
  type: 'Indoor Covered' | 'Outdoor Pro' | 'VIP Covered';
  surface: string;
  hourly_rate: number;
  description: string;
  features: string[];
  image_url: string;
  is_active: boolean;
}

export interface EquipmentRental {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  reference_no: string;
  court_id: string;
  court_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:00
  end_time: string;     // HH:00
  total_amount: number;
  equipment_rentals: EquipmentRental[];
  payment_method: 'GCash' | 'Maya' | 'Pay at Court';
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  created_at: string;
}

export type ViewportMode = 'responsive' | 'desktop' | 'tablet' | 'mobile';

export interface ViewportPreset {
  id: ViewportMode;
  name: string;
  width: number | '100%';
  height: number | 'auto';
  label: string;
  iconName: string;
}
