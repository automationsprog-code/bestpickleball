import { createClient } from '@supabase/supabase-js';
import { Court, Booking, AdminSettings } from './types';
import { INITIAL_COURTS, INITIAL_BOOKINGS, DEFAULT_ADMIN_SETTINGS } from './data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

  // 2. Try inserting into Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').insert([booking]).select().single();
      if (error) {
        console.warn('Supabase insert booking warning (saved locally):', error);
      } else if (data) {
        return data as Booking;
      }
    } catch (err) {
      console.warn('Supabase insert booking error, stored locally:', err);
    }
  }

  return booking;
}

export async function getAllUserBookings(): Promise<Booking[]> {
  let localBookings: Booking[] = INITIAL_BOOKINGS;
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    if (local) localBookings = JSON.parse(local);
  }

  let remoteBookings: Booking[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        remoteBookings = data as Booking[];
      }
    } catch (err) {
      console.warn('Supabase fetch all bookings error:', err);
    }
  }

  // Merge local & remote bookings, avoiding duplicates by id or reference_no
  const mergedMap = new Map<string, Booking>();
  localBookings.forEach(b => mergedMap.set(b.id || b.reference_no, b));
  remoteBookings.forEach(b => mergedMap.set(b.id || b.reference_no, b));

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
  if (supabase) {
    try {
      const updateData: Partial<Booking> = { status };
      if (paymentStatus) updateData.payment_status = paymentStatus;
      const { error } = await supabase.from('bookings').update(updateData).eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase update status error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    const existing: Booking[] = local ? JSON.parse(local) : INITIAL_BOOKINGS;
    const updated = existing.map(b => b.id === id ? { ...b, status, ...(paymentStatus ? { payment_status: paymentStatus } : {}) } : b);
    localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(updated));
    return true;
  }
  return false;
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
