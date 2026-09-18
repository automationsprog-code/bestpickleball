import { createClient } from '@supabase/supabase-js';
import { Court, Booking, AdminSettings } from './types';
import { INITIAL_COURTS, INITIAL_BOOKINGS, DEFAULT_ADMIN_SETTINGS } from './data';

const DEFAULT_SUPABASE_URL = 'https://ljzmpmflktjcsmzvltjr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqem1wbWZsa3RqY3NtenZsdGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MjcyMzgsImV4cCI6MjEwNTIwMzIzOH0.QIbb9fkDyZqr6BGuqr9e-b580V7lnKxnFUA8lVZGWY8';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

const isSupabaseConfigured = 
  supabaseUrl.length > 0 && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('sample-pickleball') &&
  supabaseAnonKey.length > 0;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper for tracking deleted court IDs locally so deleted courts never reappear on reload
function getDeletedCourtIds(): string[] {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('balamban_deleted_court_ids');
      if (local) return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

function markCourtAsDeletedLocally(id: string) {
  if (typeof window !== 'undefined') {
    try {
      const deletedIds = getDeletedCourtIds();
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('balamban_deleted_court_ids', JSON.stringify(deletedIds));
      }
      
      const local = localStorage.getItem('balamban_pickleball_courts');
      if (local) {
        const existing: Court[] = JSON.parse(local);
        const filtered = existing.filter(c => c.id !== id);
        localStorage.setItem('balamban_pickleball_courts', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Helper for tracking custom created courts locally so newly added courts never vanish
function getCustomCreatedCourts(): Court[] {
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('balamban_custom_created_courts');
      if (local) return JSON.parse(local);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
}

function saveCustomCreatedCourt(court: Court) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getCustomCreatedCourts();
      const updated = [...existing.filter(c => c.id !== court.id), court];
      localStorage.setItem('balamban_custom_created_courts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }
}

function removeCustomCreatedCourt(id: string) {
  if (typeof window !== 'undefined') {
    try {
      const existing = getCustomCreatedCourts();
      const filtered = existing.filter(c => c.id !== id);
      localStorage.setItem('balamban_custom_created_courts', JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  }
}

function generateValidUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper functions that query Supabase OR fallback smoothly to localStorage
export async function getCourts(): Promise<Court[]> {
  const deletedIds = getDeletedCourtIds();
  const customCourts = getCustomCreatedCourts();

  let baseCourts: Court[] = INITIAL_COURTS;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('courts').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        baseCourts = data as Court[];
      }
    } catch (err) {
      console.warn('Supabase fetch courts error, using local fallback:', err);
    }
  } else if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_courts');
    if (local !== null) {
      baseCourts = JSON.parse(local);
    }
  }

  // Merge baseCourts with customCourts so created courts always show up
  const mergedMap = new Map<string, Court>();
  baseCourts.forEach(c => mergedMap.set(c.id, c));
  customCourts.forEach(c => mergedMap.set(c.id, c));

  const allMerged = Array.from(mergedMap.values());
  let validCourts = allMerged.filter(c => !deletedIds.includes(c.id));

  // Safety fallback: If validCourts is empty, always show INITIAL_COURTS
  if (validCourts.length === 0) {
    validCourts = INITIAL_COURTS;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('balamban_pickleball_courts', JSON.stringify(validCourts));
  }

  return validCourts;
}

export async function createCourt(newCourtData: Omit<Court, 'id'>): Promise<Court> {
  const generatedId = generateValidUUID();
  const court: Court = {
    ...newCourtData,
    id: generatedId
  };

  // 1. Save locally first so newly created court NEVER disappears
  saveCustomCreatedCourt(court);

  // 2. Try inserting into Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from('courts').insert([court]).select().single();
      if (error) {
        console.warn('Supabase insert court warning (court saved locally):', error);
      }
    } catch (err) {
      console.warn('Supabase insert court error:', err);
    }
  }

  return court;
}

export async function updateCourtDetails(id: string, updates: Partial<Court>): Promise<boolean> {
  let success = false;

  if (typeof window !== 'undefined') {
    const custom = getCustomCreatedCourts();
    const target = custom.find(c => c.id === id);
    if (target) {
      saveCustomCreatedCourt({ ...target, ...updates });
    }
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('courts').update(updates).eq('id', id);
      if (!error) success = true;
    } catch (err) {
      console.warn('Supabase update court details error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const existing = await getCourts();
    const updated = existing.map(c => c.id === id ? { ...c, ...updates } : c);
    localStorage.setItem('balamban_pickleball_courts', JSON.stringify(updated));
    success = true;
  }
  return success;
}

export async function deleteCourt(id: string): Promise<boolean> {
  // 1. Mark ID as deleted locally & remove from custom created list so it NEVER reappears
  markCourtAsDeletedLocally(id);
  removeCustomCreatedCourt(id);

  // 2. Perform deletion in Supabase DB if connected
  if (supabase) {
    try {
      const { error } = await supabase.from('courts').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete error (court remains deleted locally):', error);
      }
    } catch (err) {
      console.warn('Supabase delete court error:', err);
    }
  }

  return true;
}

export async function updateCourtStatus(id: string, is_active: boolean): Promise<boolean> {
  return updateCourtDetails(id, { is_active });
}

function toDbBooking(b: Booking) {
  return {
    id: b.id,
    reference_no: b.reference_no,
    court_id: b.court_id || '11111111-1111-1111-1111-111111111111',
    customer_name: b.customer_name,
    customer_email: b.customer_email || 'customer@example.com',
    customer_phone: b.customer_phone,
    booking_date: b.booking_date,
    start_time: b.start_time,
    end_time: b.end_time,
    total_amount: b.total_amount,
    equipment_rentals: b.equipment_rentals || [],
    payment_method: b.payment_method || 'GCash',
    status: b.status || 'Confirmed',
    notes: b.notes || '',
    created_at: b.created_at || new Date().toISOString()
  };
}

function fromDbBooking(dbItem: any): Booking {
  const startTime = dbItem.start_time ? dbItem.start_time.substring(0, 5) : '06:00';
  const endTime = dbItem.end_time ? dbItem.end_time.substring(0, 5) : '07:00';

  const format12 = (timeStr: string) => {
    const [hStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };

  return {
    ...dbItem,
    start_time: startTime,
    end_time: endTime,
    court_name: dbItem.court_name || 'Court 1',
    time_slot_label: dbItem.time_slot_label || `${format12(startTime)} - ${format12(endTime)}`,
    payment_status: dbItem.payment_status || 'Paid',
  };
}

export async function createBooking(newBooking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  const generatedId = generateValidUUID();
  const created_at = new Date().toISOString();
  
  const booking: Booking = {
    ...newBooking,
    id: generatedId,
    created_at
  };

  // 1. ALWAYS store locally first so it is immediately locked & available in UI
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('balamban_pickleball_bookings');
      const existing: Booking[] = local ? JSON.parse(local) : INITIAL_BOOKINGS;
      const updated = [booking, ...existing.filter(b => b.id !== booking.id && b.reference_no !== booking.reference_no)];
      localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Try inserting into Supabase with sanitized payload
  if (supabase) {
    try {
      const payload = toDbBooking(booking);
      const { data, error } = await supabase.from('bookings').insert([payload]).select().single();
      if (error) {
        console.warn('Supabase insert booking warning:', error);
        if (error.code === '23503') {
          const fallbackPayload = { ...payload, court_id: null };
          const { data: fbData } = await supabase.from('bookings').insert([fallbackPayload]).select().single();
          if (fbData) return fromDbBooking(fbData);
        }
      } else if (data) {
        return fromDbBooking(data);
      }
    } catch (err) {
      console.warn('Supabase insert booking error, stored locally:', err);
    }
  }

  return booking;
}

export async function getAllUserBookings(): Promise<Booking[]> {
  let localBookings: Booking[] = [];
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    if (local) {
      try {
        localBookings = JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
  }

  let remoteBookings: Booking[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        remoteBookings = data.map(fromDbBooking);

        // Auto-sync any unsynced local bookings to Supabase
        const remoteRefs = new Set(remoteBookings.map(r => r.reference_no || r.id));
        const unsynced = localBookings.filter(l => (l.id || l.reference_no) && !remoteRefs.has(l.reference_no) && !remoteRefs.has(l.id));
        
        if (unsynced.length > 0) {
          const payloadList = unsynced.map(toDbBooking);
          const { error: syncError } = await supabase.from('bookings').insert(payloadList);
          if (!syncError) {
            const { data: refreshed } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
            if (refreshed) remoteBookings = refreshed.map(fromDbBooking);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetch all bookings error:', err);
    }
  }

  // Merge local & remote bookings, avoiding duplicates by id or reference_no
  const mergedMap = new Map<string, Booking>();
  remoteBookings.forEach(b => mergedMap.set(b.id || b.reference_no, b));
  localBookings.forEach(b => {
    const key = b.id || b.reference_no;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, b);
    }
  });

  const allMerged = Array.from(mergedMap.values());
  if (typeof window !== 'undefined') {
    localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(allMerged));
  }
  return allMerged;
}

export async function getBookingsForDate(date: string): Promise<Booking[]> {
  const allBookings = await getAllUserBookings();
  return allBookings.filter(b => b.booking_date === date && b.status !== 'Cancelled');
}

export async function updateBookingStatus(id: string, status: Booking['status'], paymentStatus?: Booking['payment_status']): Promise<boolean> {
  // 1. ALWAYS update local storage first so UI updates immediately & permanently
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('balamban_pickleball_bookings');
      const existing: Booking[] = local ? JSON.parse(local) : INITIAL_BOOKINGS;
      const updated = existing.map(b => (b.id === id || b.reference_no === id) ? { ...b, status, ...(paymentStatus ? { payment_status: paymentStatus } : {}) } : b);
      localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Update Supabase DB if connected (only valid columns)
  if (supabase) {
    try {
      await supabase.from('bookings').update({ status }).or(`id.eq.${id},reference_no.eq.${id}`);
    } catch (err) {
      console.warn('Supabase update status error:', err);
    }
  }

  return true;
}

export async function deleteBooking(idOrRef: string): Promise<boolean> {
  // 1. ALWAYS remove from local storage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('balamban_pickleball_bookings');
      if (local) {
        const existing: Booking[] = JSON.parse(local);
        const filtered = existing.filter(b => b.id !== idOrRef && b.reference_no !== idOrRef);
        localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Delete from Supabase DB
  if (supabase) {
    try {
      await supabase.from('bookings').delete().or(`id.eq.${idOrRef},reference_no.eq.${idOrRef}`);
    } catch (err) {
      console.warn('Supabase delete booking error:', err);
    }
  }

  return true;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (!error && data) {
        return data as AdminSettings;
      }
    } catch (err) {
      console.warn('Supabase settings error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_admin_settings');
    return local ? JSON.parse(local) : DEFAULT_ADMIN_SETTINGS;
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export async function updateAdminSettings(settings: AdminSettings): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase.from('settings').upsert([{ id: 'default', ...settings }]);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase update settings error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('balamban_pickleball_admin_settings', JSON.stringify(settings));
    return true;
  }
  return false;
}
