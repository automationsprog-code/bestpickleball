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

// Helper functions that query Supabase OR fallback smoothly to localStorage
export async function getCourts(): Promise<Court[]> {
  const deletedIds = getDeletedCourtIds();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('courts').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        const validCourts = (data as Court[]).filter(c => !deletedIds.includes(c.id));
        if (typeof window !== 'undefined') {
          localStorage.setItem('balamban_pickleball_courts', JSON.stringify(validCourts));
        }
        return validCourts;
      }
    } catch (err) {
      console.warn('Supabase fetch courts error, using local fallback:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_courts');
    if (local !== null) {
      const parsed: Court[] = JSON.parse(local);
      return parsed.filter(c => !deletedIds.includes(c.id));
    }
  }
  return INITIAL_COURTS.filter(c => !deletedIds.includes(c.id));
}

export async function createCourt(newCourtData: Omit<Court, 'id'>): Promise<Court> {
  const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c-' + Date.now();
  const court: Court = {
    ...newCourtData,
    id: generatedId
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('courts').insert([court]).select().single();
      if (!error && data) {
        if (typeof window !== 'undefined') {
          const existing = await getCourts();
          const updated = [...existing.filter(c => c.id !== data.id), data];
          localStorage.setItem('balamban_pickleball_courts', JSON.stringify(updated));
        }
        return data as Court;
      }
    } catch (err) {
      console.warn('Supabase insert court error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const existing = await getCourts();
    const updated = [...existing, court];
    localStorage.setItem('balamban_pickleball_courts', JSON.stringify(updated));
  }
  return court;
}

export async function updateCourtDetails(id: string, updates: Partial<Court>): Promise<boolean> {
  let success = false;

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
  // 1. Mark ID as deleted locally so it NEVER reappears on page refresh or re-login
  markCourtAsDeletedLocally(id);

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

export async function getBookingsForDate(date: string): Promise<Booking[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').eq('booking_date', date);
      if (!error && data) {
        return data as Booking[];
      }
    } catch (err) {
      console.warn('Supabase fetch bookings error, using local fallback:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    const allBookings: Booking[] = local ? JSON.parse(local) : INITIAL_BOOKINGS;
    return allBookings.filter(b => b.booking_date === date && b.status !== 'Cancelled');
  }

  return INITIAL_BOOKINGS.filter(b => b.booking_date === date);
}

export async function createBooking(newBooking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b-' + Date.now();
  const created_at = new Date().toISOString();
  
  const booking: Booking = {
    ...newBooking,
    id: generatedId,
    created_at
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').insert([booking]).select().single();
      if (!error && data) {
        return data as Booking;
      }
    } catch (err) {
      console.warn('Supabase insert error, storing locally:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    const existing: Booking[] = local ? JSON.parse(local) : INITIAL_BOOKINGS;
    const updated = [booking, ...existing];
    localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(updated));
  }

  return booking;
}

export async function getAllUserBookings(): Promise<Booking[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Booking[];
      }
    } catch (err) {
      console.warn('Supabase fetch all bookings error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    return local ? JSON.parse(local) : INITIAL_BOOKINGS;
  }
  return INITIAL_BOOKINGS;
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
