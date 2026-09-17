import { createClient } from '@supabase/supabase-js';
import { Court, Booking } from './types';
import { INITIAL_COURTS, INITIAL_BOOKINGS } from './data';

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

// Helper functions that query Supabase OR fallback smoothly to localStorage
export async function getCourts(): Promise<Court[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('courts').select('*').eq('is_active', true);
      if (!error && data && data.length > 0) {
        return data as Court[];
      }
    } catch (err) {
      console.warn('Supabase fetch courts error, using local fallback:', err);
    }
  }
  return INITIAL_COURTS;
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

  // Local fallback
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

  // Save to localStorage
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    const existing: Booking[] = local ? JSON.parse(local) : INITIAL_BOOKINGS;
    const updated = [booking, ...existing];
    localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(updated));
  }

  return booking;
}

export async function getAllUserBookings(): Promise<Booking[]> {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_bookings');
    return local ? JSON.parse(local) : INITIAL_BOOKINGS;
  }
  return INITIAL_BOOKINGS;
}
