import { Court, Booking, AdminSettings } from './types';

export interface HourlySlot {
  id: string;
  startTime: string; // 24h format e.g. "06:00"
  endTime: string;   // 24h format e.g. "07:00"
  label: string;     // Display format e.g. "6:00 AM - 7:00 AM"
}

export function generateHourlySlots(startHour: number = 6, endHour: number = 22): HourlySlot[] {
  const slots: HourlySlot[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const sTime = `${hour < 10 ? '0' : ''}${hour}:00`;
    const nextHour = hour + 1;
    const eTime = `${nextHour < 10 ? '0' : ''}${nextHour}:00`;

    const format12 = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:00 ${ampm}`;
    };

    const label = `${format12(hour)} - ${format12(nextHour)}`;
    slots.push({
      id: `s${hour}`,
      startTime: sTime,
      endTime: eTime,
      label
    });
  }
  return slots;
}

export const HOURLY_SLOTS: HourlySlot[] = generateHourlySlots(6, 22);

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  gcash_number: '0917-888-9900',
  gcash_name: 'BEST INC. BALAMBAN',
  qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN_BEST_INC_09178889900',
  maya_number: '0917-888-9900',
  maya_name: 'BEST INC. BALAMBAN',
  maya_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA_BALAMBAN_BEST_INC_09178889900',
  opening_hour: 6,
  closing_hour: 22
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

export const INITIAL_BOOKINGS: Booking[] = [];
