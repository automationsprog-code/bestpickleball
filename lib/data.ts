import { Court, Booking, AdminSettings } from './types';

export interface HourlySlot {
  id: string;
  startTime: string; // 24h format e.g. "06:00"
  endTime: string;   // 24h format e.g. "07:00"
  label: string;     // Display format e.g. "6:00 AM - 7:00 AM"
}

export function generateHourlySlots(startHour: number = 6, endHour: number = 24): HourlySlot[] {
  const slots: HourlySlot[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const sHourNorm = hour % 24;
    const sTime = `${sHourNorm < 10 ? '0' : ''}${sHourNorm}:00`;
    const nextHour = hour + 1;
    const eHourNorm = nextHour % 24;
    const eTime = `${eHourNorm < 10 ? '0' : ''}${eHourNorm}:00`;

    const format12 = (h: number) => {
      const normalizedHour = h % 24;
      if (normalizedHour === 0 && h > 0) return '12:00 Midnight';
      if (normalizedHour === 0 && h === 0) return '12:00 AM';
      const ampm = normalizedHour >= 12 ? 'PM' : 'AM';
      const h12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
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

export const HOURLY_SLOTS: HourlySlot[] = generateHourlySlots(6, 24);

export function isSlotTakenByBooking(slot: HourlySlot, b: Booking, courtId?: string, courtName?: string): boolean {
  if (courtId || courtName) {
    const isSameCourt = !b.court_id || b.court_id === courtId || (b.court_name && courtName && b.court_name === courtName);
    if (!isSameCourt) return false;
  }

  const slotStartNum = parseInt(slot.startTime.replace(':', ''), 10);
  let slotEndNum = parseInt(slot.endTime.replace(':', ''), 10);
  if (slotEndNum === 0) slotEndNum = 2400;

  if (b.time_slot_label && b.time_slot_label.includes(',')) {
    const parts = b.time_slot_label.split(',').map(p => p.trim());
    return parts.some(part => part.includes(slot.label));
  }

  if (b.start_time && b.end_time) {
    const bStartNum = parseInt(b.start_time.substring(0, 5).replace(':', ''), 10);
    let bEndNum = parseInt(b.end_time.substring(0, 5).replace(':', ''), 10);
    if (bEndNum === 0) bEndNum = 2400;

    if (!isNaN(bStartNum) && !isNaN(bEndNum) && bEndNum > bStartNum) {
      return slotStartNum < bEndNum && slotEndNum > bStartNum;
    }
  }

  if (b.time_slot_label && b.time_slot_label.includes(slot.label)) {
    return true;
  }

  if (b.start_time && b.start_time.substring(0, 5) === slot.startTime) {
    return true;
  }

  return false;
}

export function formatSelectedSlotsLabel(sortedSlots: HourlySlot[]): string {
  if (sortedSlots.length === 0) return 'Palihug pagpili og time slot';
  if (sortedSlots.length === 1) return sortedSlots[0].label;

  let isContinuous = true;
  for (let i = 0; i < sortedSlots.length - 1; i++) {
    if (sortedSlots[i].endTime !== sortedSlots[i + 1].startTime) {
      isContinuous = false;
      break;
    }
  }

  if (isContinuous) {
    const startLabel = sortedSlots[0].label.split(' - ')[0];
    const endLabel = sortedSlots[sortedSlots.length - 1].label.split(' - ')[1];
    return `${startLabel} - ${endLabel} (${sortedSlots.length} Hours)`;
  } else {
    return `${sortedSlots.map(s => s.label).join(', ')} (${sortedSlots.length} Hours)`;
  }
}

export function formatDisplayTimeSlot(timeSlotLabel?: string, startTime?: string, endTime?: string): string {
  if (!timeSlotLabel && !startTime) return '';

  if (timeSlotLabel && !timeSlotLabel.includes(',')) {
    return timeSlotLabel;
  }

  const format12 = (timeStr: string) => {
    const [hStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };

  if (startTime && endTime) {
    const startH = parseInt(startTime.substring(0, 5).split(':')[0], 10);
    let endH = parseInt(endTime.substring(0, 5).split(':')[0], 10);
    if (endH === 0) endH = 24;

    if (!isNaN(startH) && !isNaN(endH) && endH > startH) {
      const hoursCount = endH - startH;
      const start12 = format12(startTime);
      const end12 = format12(endTime);
      return `${start12} - ${end12} (${hoursCount} Hours)`;
    }
  }

  return timeSlotLabel || `${startTime} - ${endTime}`;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  gcash_number: '0917-888-9900',
  gcash_name: 'BEST INC. BALAMBAN',
  qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN_BEST_INC_09178889900',
  maya_number: '0917-888-9900',
  maya_name: 'BEST INC. BALAMBAN',
  maya_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA_BALAMBAN_BEST_INC_09178889900',
  landbank_number: '1234-5678-9012',
  landbank_name: 'BEST INC. BALAMBAN',
  landbank_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LANDBANK_BALAMBAN_BEST_INC_123456789012',
  opening_hour: 6,
  closing_hour: 22,

  hero_title: 'Book Your Pickleball Court in Balamban, Cebu',
  hero_subtitle: 'Duwa na og Pickleball sa pinakanindot ug kompleto nga venue sa Balamban! High-traction covered & outdoor courts with LED night lighting, paddle rentals, ug easy online slot reservations via Supabase & GCash.',

  contact_phone: '0917-888-9900',
  contact_landline: '(032) 492-1234',
  contact_email: 'booking@balambanbest.ph',
  location_address: 'BALAMBAN EXTENSIVE SKILLS AND TECHNOLOGY, INC. (BEST Inc.) Poblacion / Bano, Balamban, Cebu 6041',

  feature_1_title: 'Non-Slip Cushion Surface',
  feature_1_desc: 'Pro-grade acrylic court surfacing system reducing knee strain and ensuring maximum ball bounce accuracy.',
  feature_1_active: true,

  feature_2_title: 'Night Lighting & Roof',
  feature_2_desc: 'High-lumen LED floodlights for seamless evening matches up to 10:00 PM regardless of rain or heat.',
  feature_2_active: true,

  feature_3_title: 'Paddle Rental & Coaching',
  feature_3_desc: 'Wala kay paddle? No problem! Naa tay pickleball paddle rentals (₱50/pc) ug certified coaches available.',
  feature_3_active: true,

  pill_1_title: 'Pickleball Courts',
  pill_1_sub: 'Covered & Outdoor',
  pill_1_active: true,

  pill_2_title: 'LED Night Lighting',
  pill_2_sub: 'Play until 10 PM',
  pill_2_active: true,

  pill_3_title: 'Instant Booking',
  pill_3_sub: 'Real-time slots',
  pill_3_active: true,

  pill_4_title: 'GCash / Maya',
  pill_4_sub: 'Easy Payment',
  pill_4_active: true,

  why_play_title: 'Why Play at BEST Inc. Balamban?',
  why_play_subtitle: 'Gidisenyo alang sa beginners, enthusiasts, ug tournament players sa Balamban ug silingang lungsod.',
  why_play_active: true,

  location_card_title: 'Balamban BEST Inc. Address',
  location_gps: '10.5124145, 123.7298596',
  location_hours_text: 'Monday - Sunday: 6:00 AM – 10:00 PM',
  location_amenity_1: 'Free Parking',
  location_amenity_2: 'Snack Lounge',
  google_maps_url: 'https://www.google.com/maps/place/BALAMBAN+EXTENSIVE+SKILLS+AND+TECHNOLOGY,+INC./@10.5124198,123.7272847,1193m/data=!3m2!1e3!4b1!4m6!3m5!1s0x33a909a00f7169d7:0xaef1d3f6c0a056e2!8m2!3d10.5124145!4d123.7298596!16s%2Fg%2F11ry0t7wjl?entry=ttu',

  footer_hours_header: 'Hours & Payments',
  footer_hours_text: 'Open Daily: 6:00 AM - 10:00 PM',
  footer_payments_text: 'Accepted: GCash, Maya, Cash',
  footer_status_text: 'Supabase Realtime Connected'
};

export const INITIAL_COURTS: Court[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Court 1',
    type: 'Indoor Covered',
    surface: 'Tournament Acrylic Surface',
    hourly_rate: 250,
    description: 'Premier Indoor Covered court located at Balamban BEST Inc.',
    features: ['Covered Roof', 'LED Lighting', 'Net System'],
    image_url: 'https://images.unsplash.com/photo-1599586120429-48281b6f0eca?auto=format&fit=crop&w=1200&q=80',
    is_active: true
  }
];

export const INITIAL_BOOKINGS: Booking[] = [];
