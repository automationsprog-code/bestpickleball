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
  time_slot_label: string; // e.g. "6:00 AM - 7:00 AM"
  start_time: string;   // 06:00
  end_time: string;     // 07:00
  total_amount: number;
  equipment_rentals: EquipmentRental[];
  payment_method: 'GCash' | 'Maya' | 'Landbank';
  payment_status: 'Pending' | 'Paid' | 'Verified';
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  created_at: string;
}

export interface AdminSettings {
  gcash_number: string;
  gcash_name: string;
  qr_code_url: string;
  maya_number: string;
  maya_name: string;
  maya_qr_url: string;
  landbank_number: string;
  landbank_name: string;
  landbank_qr_url: string;
  opening_hour?: number; // e.g. 6 (6 AM)
  closing_hour?: number; // e.g. 22 (10 PM)

  // Editable Website Content Text
  hero_title?: string;
  hero_subtitle?: string;
  contact_phone?: string;
  contact_landline?: string;
  contact_email?: string;
  location_address?: string;

  feature_1_title?: string;
  feature_1_desc?: string;
  feature_1_active?: boolean;

  feature_2_title?: string;
  feature_2_desc?: string;
  feature_2_active?: boolean;

  feature_3_title?: string;
  feature_3_desc?: string;
  feature_3_active?: boolean;

  // Hero Quick Feature Pills (4 Pills)
  pill_1_title?: string;
  pill_1_sub?: string;
  pill_1_active?: boolean;

  pill_2_title?: string;
  pill_2_sub?: string;
  pill_2_active?: boolean;

  pill_3_title?: string;
  pill_3_sub?: string;
  pill_3_active?: boolean;

  pill_4_title?: string;
  pill_4_sub?: string;
  pill_4_active?: boolean;

  why_play_title?: string;
  why_play_subtitle?: string;
  why_play_active?: boolean;

  // Location & Contact Card Editable Fields
  location_card_title?: string;
  location_gps?: string;
  location_hours_text?: string;
  location_amenity_1?: string;
  location_amenity_2?: string;
  google_maps_url?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'bot';
  sender_name: string;
  text: string;
  timestamp: string;
}

export type ViewportMode = 'responsive' | 'desktop' | 'tablet' | 'mobile';
