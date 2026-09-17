import { Court, Booking, AdminSettings } from './types';

export interface HourlySlot {
  id: string;
  startTime: string; // 24h format e.g. "06:00"
  endTime: string;   // 24h format e.g. "07:00"
  label: string;     // Display format e.g. "6:00 AM - 7:00 AM"
}

export const HOURLY_SLOTS: HourlySlot[] = [
  { id: 's06', startTime: '06:00', endTime: '07:00', label: '6:00 AM - 7:00 AM' },
  { id: 's07', startTime: '07:00', endTime: '08:00', label: '7:00 AM - 8:00 AM' },
  { id: 's08', startTime: '08:00', endTime: '09:00', label: '8:00 AM - 9:00 AM' },
  { id: 's09', startTime: '09:00', endTime: '10:00', label: '9:00 AM - 10:00 AM' },
  { id: 's10', startTime: '10:00', endTime: '11:00', label: '10:00 AM - 11:00 AM' },
  { id: 's11', startTime: '11:00', endTime: '12:00', label: '11:00 AM - 12:00 PM' },
  { id: 's12', startTime: '12:00', endTime: '13:00', label: '12:00 PM - 1:00 PM' },
  { id: 's13', startTime: '13:00', endTime: '14:00', label: '1:00 PM - 2:00 PM' },
  { id: 's14', startTime: '14:00', endTime: '15:00', label: '2:00 PM - 3:00 PM' },
  { id: 's15', startTime: '15:00', endTime: '16:00', label: '3:00 PM - 4:00 PM' },
  { id: 's16', startTime: '16:00', endTime: '17:00', label: '4:00 PM - 5:00 PM' },
  { id: 's17', startTime: '17:00', endTime: '18:00', label: '5:00 PM - 6:00 PM' },
  { id: 's18', startTime: '18:00', endTime: '19:00', label: '6:00 PM - 7:00 PM' },
  { id: 's19', startTime: '19:00', endTime: '20:00', label: '7:00 PM - 8:00 PM' },
  { id: 's20', startTime: '20:00', endTime: '21:00', label: '8:00 PM - 9:00 PM' },
  { id: 's21', startTime: '21:00', endTime: '22:00', label: '9:00 PM - 10:00 PM' },
];

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  gcash_number: '0917-888-9900',
  gcash_name: 'BEST INC. BALAMBAN',
  qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN_BEST_INC_09178889900',
  maya_number: '0917-888-9900',
  maya_name: 'BEST INC. BALAMBAN',
  maya_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA_BALAMBAN_BEST_INC_09178889900',
};

export const INITIAL_COURTS: Court[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Court 1 - Championship Covered Court',
    type: 'Indoor Covered',
    surface: 'Tournament Cushioned Acrylic Surface',
    hourly_rate: 350,
    description: 'Premier covered pickleball court equipped with high-performance LED lighting and official tournament court dimensions.',
    features: ['Covered Roof Structure', 'High-Lumen LED Night Lights', 'Official Net System', 'Spectator Seating Lounge'],
    image_url: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=1200&q=80',
    is_active: true
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-101',
    reference_no: 'BEST-PKL-9821',
    court_id: '11111111-1111-1111-1111-111111111111',
    court_name: 'Court 1 - Championship Covered Court',
    customer_name: 'Juan Dela Cruz',
    customer_email: 'juan@example.com',
    customer_phone: '0917-123-4567',
    booking_date: new Date().toISOString().split('T')[0],
    time_slot_label: '5:00 PM - 6:00 PM',
    start_time: '17:00',
    end_time: '18:00',
    total_amount: 350,
    equipment_rentals: [{ id: 'pad-1', name: 'Pro Paddle', price: 50, quantity: 2 }],
    payment_method: 'GCash',
    payment_status: 'Paid',
    status: 'Confirmed',
    notes: 'Prepared 2 extra paddles.',
    created_at: new Date().toISOString()
  }
];
