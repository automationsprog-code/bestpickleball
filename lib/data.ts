import { Court, Booking } from './types';

export const INITIAL_COURTS: Court[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Court 1 - Championship Covered',
    type: 'Indoor Covered',
    surface: 'Tournament Cushioned Acrylic',
    hourly_rate: 350,
    description: 'Premier covered pickleball court equipped with high-performance LED lighting and official court dimensions.',
    features: ['Covered Roof', 'LED Night Lighting', 'Official Net System', 'Spectator Seating'],
    image_url: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=1200&q=80',
    is_active: true
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Court 2 - Outdoor Pro Court',
    type: 'Outdoor Pro',
    surface: 'Pro-Grid Acrylic Court',
    hourly_rate: 250,
    description: 'Open-air pickleball court with optimal traction, surrounded by lush Balamban mountain views.',
    features: ['Mountain View', 'Outdoor Ventilation', 'High-Traction Surface', 'Shaded Bench'],
    image_url: 'https://images.unsplash.com/photo-1599586120429-48281b6f0eca?auto=format&fit=crop&w=1200&q=80',
    is_active: true
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Court 3 - Covered Training Court',
    type: 'Indoor Covered',
    surface: 'Shock-Absorbing Composite',
    hourly_rate: 300,
    description: 'Ideal court for regular practice matches, coaching lessons, and drill sessions.',
    features: ['Covered Roof', 'Ball Machine Available', 'Coaching Ready', 'LED Lighting'],
    image_url: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1200&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Court 4 - VIP Covered Arena',
    type: 'VIP Covered',
    surface: 'Premium Pro Cushion Turf',
    hourly_rate: 400,
    description: 'Exclusive private court with dedicated lounge area, sound system, and refreshment station.',
    features: ['Private Lounge', 'Covered Roof', 'Dedicated Sound System', 'Free Cold Water', 'LED Night Lighting'],
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    is_active: true
  }
];

export const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-101',
    reference_no: 'BEST-PKL-9821',
    court_id: '11111111-1111-1111-1111-111111111111',
    court_name: 'Court 1 - Championship Covered',
    customer_name: 'Juan Dela Cruz',
    customer_email: 'juan@example.com',
    customer_phone: '09171234567',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '17:00',
    end_time: '18:00',
    total_amount: 350,
    equipment_rentals: [{ id: 'pad-1', name: 'Pro Paddle', price: 50, quantity: 2 }],
    payment_method: 'GCash',
    status: 'Confirmed',
    notes: 'Please prepare 2 extra paddles.',
    created_at: new Date().toISOString()
  }
];
