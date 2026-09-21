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

  let remoteCourts: Court[] = [];
  let isRemoteConnected = false;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('courts').select('*').order('created_at', { ascending: true });
      if (!error && data !== null) {
        if (data.length === 0) {
          try {
            const { data: seeded } = await supabase.from('courts').insert(INITIAL_COURTS).select();
            if (seeded) remoteCourts = seeded as Court[];
          } catch (e) {
            console.warn('Auto seed courts warning:', e);
          }
        } else {
          remoteCourts = data as Court[];
        }
        isRemoteConnected = true;
      }
    } catch (err) {
      console.warn('Supabase fetch courts error, using local fallback:', err);
    }
  }

  // When Supabase Cloud DB is connected, it is 100% the SINGLE SOURCE OF TRUTH across all devices!
  if (isRemoteConnected && remoteCourts.length > 0) {
    const courtMap = new Map<string, Court>();
    remoteCourts.forEach(c => {
      const normKey = c.name ? c.name.toLowerCase().trim() : c.id;
      if (!courtMap.has(c.id) && !courtMap.has(normKey)) {
        courtMap.set(normKey, c);
      }
    });
    const validRemote = Array.from(courtMap.values());
    if (typeof window !== 'undefined') {
      localStorage.setItem('balamban_pickleball_courts', JSON.stringify(validRemote));
      localStorage.removeItem('balamban_custom_created_courts');
      localStorage.removeItem('balamban_deleted_court_ids');
    }
    return validRemote;
  }

  const customCourts = getCustomCreatedCourts();
  const mergedMap = new Map<string, Court>();
  INITIAL_COURTS.forEach(c => mergedMap.set(c.id, c));
  customCourts.forEach(c => mergedMap.set(c.id, c));

  const allMerged = Array.from(mergedMap.values()).filter(c => !deletedIds.includes(c.id));
  return allMerged.length > 0 ? allMerged : INITIAL_COURTS;
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

  // 1. Update Supabase Cloud DB first (including court image)
  if (supabase) {
    try {
      const { error } = await supabase.from('courts').update(updates).eq('id', id);
      if (!error) success = true;
      else console.warn('Supabase update court warning:', error);
    } catch (err) {
      console.warn('Supabase update court details error:', err);
    }
  }

  // 2. Update local storage caches
  if (typeof window !== 'undefined') {
    const custom = getCustomCreatedCourts();
    const targetIndex = custom.findIndex(c => c.id === id);
    if (targetIndex !== -1) {
      custom[targetIndex] = { ...custom[targetIndex], ...updates };
      localStorage.setItem('balamban_custom_created_courts', JSON.stringify(custom));
    }

    const local = localStorage.getItem('balamban_pickleball_courts');
    if (local) {
      try {
        const existing: Court[] = JSON.parse(local);
        const updated = existing.map(c => c.id === id ? { ...c, ...updates } : c);
        localStorage.setItem('balamban_pickleball_courts', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    success = true;
  }

  return success;
}

export async function deleteCourt(id: string): Promise<boolean> {
  // 1. Mark ID as deleted locally & remove from custom created list so it NEVER reappears
  markCourtAsDeletedLocally(id);
  removeCustomCreatedCourt(id);

  // 2. Remove all local bookings associated with this deleted court
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('balamban_pickleball_bookings');
      if (local) {
        const existing: Booking[] = JSON.parse(local);
        const filtered = existing.filter(b => b.court_id !== id);
        localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 3. Perform deletion in Supabase DB if connected (delete associated bookings first, then court)
  if (supabase) {
    try {
      await supabase.from('bookings').delete().eq('court_id', id);
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
    payment_proof_url: b.payment_proof_url || '',
    payment_ref_no: b.payment_ref_no || '',
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

  // Parse proof URL / Ref No if embedded in notes
  let proofUrl = dbItem.payment_proof_url;
  let refNo = dbItem.payment_ref_no;
  if (!proofUrl && dbItem.notes && typeof dbItem.notes === 'string' && dbItem.notes.includes('___PROOF___:')) {
    const parts = dbItem.notes.split('___PROOF___:');
    if (parts[1]) {
      const proofParts = parts[1].split('___REF___:');
      proofUrl = proofParts[0];
      if (proofParts[1]) refNo = proofParts[1];
    }
  }

  return {
    ...dbItem,
    court_id: dbItem.court_id || '11111111-1111-1111-1111-111111111111',
    court_name: dbItem.court_name || 'Court 1',
    start_time: startTime,
    end_time: endTime,
    time_slot_label: dbItem.time_slot_label || `${format12(startTime)} - ${format12(endTime)}`,
    payment_status: dbItem.payment_status || 'Paid',
    payment_proof_url: proofUrl || undefined,
    payment_ref_no: refNo || undefined,
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

  // 2. Try inserting into Supabase Cloud DB with 3-tier insertion ladder
  if (supabase) {
    try {
      const activeCourts = await getCourts();
      const validCourtId = (activeCourts.length > 0 && activeCourts[0].id) 
        ? activeCourts[0].id 
        : '11111111-1111-1111-1111-111111111111';

      const targetCourtId = booking.court_id || validCourtId;

      let embeddedNotes = booking.notes || '';
      if (booking.payment_proof_url) embeddedNotes += ` ___PROOF___:${booking.payment_proof_url}`;
      if (booking.payment_ref_no) embeddedNotes += ` ___REF___:${booking.payment_ref_no}`;

      // Attempt 1: Full payload with custom columns
      const fullPayload = toDbBooking({ ...booking, court_id: targetCourtId });
      const { data, error } = await supabase.from('bookings').insert([fullPayload]).select().single();

      if (!error && data) {
        return fromDbBooking(data);
      }

      console.warn('Supabase full insert warning, attempting standard schema insert:', error);

      // Attempt 2: Standard Supabase Schema Payload with valid court_id and embedded proof/ref notes
      const standardPayload: any = {
        id: booking.id,
        reference_no: booking.reference_no,
        court_id: targetCourtId,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email || 'customer@example.com',
        customer_phone: booking.customer_phone,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        total_amount: booking.total_amount,
        equipment_rentals: booking.equipment_rentals || [],
        payment_method: booking.payment_method || 'GCash',
        status: booking.status || 'Confirmed',
        notes: embeddedNotes,
        created_at: booking.created_at || new Date().toISOString()
      };

      const { data: data2, error: error2 } = await supabase.from('bookings').insert([standardPayload]).select().single();

      if (!error2 && data2) {
        return fromDbBooking(data2);
      }

      console.warn('Supabase standard insert warning, attempting fallback UUID insert:', error2);

      // Attempt 3: Fallback with default UUID '11111111-1111-1111-1111-111111111111'
      const minimalPayload: any = {
        ...standardPayload,
        court_id: '11111111-1111-1111-1111-111111111111'
      };

      const { data: data3, error: error3 } = await supabase.from('bookings').insert([minimalPayload]).select().single();

      if (!error3 && data3) {
        return fromDbBooking(data3);
      }

      console.warn('Supabase minimal insert failed:', error3);

    } catch (err) {
      console.warn('Supabase insert booking exception:', err);
    }
  }

  return booking;
}

export async function getAllUserBookings(): Promise<Booking[]> {
  // 1. Read local bookings first for fallback or image data preservation
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
  let isRemoteConnected = false;

  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        remoteBookings = data.map(fromDbBooking);
        isRemoteConnected = true;
      }
    } catch (err) {
      console.warn('Supabase fetch all bookings error:', err);
    }
  }

  // 2. When Supabase is connected, Cloud DB is the authoritative source across all devices
  if (isRemoteConnected) {
    const localMap = new Map<string, Booking>();
    localBookings.forEach(b => {
      if (b && (b.reference_no || b.id)) {
        localMap.set(b.reference_no || b.id, b);
      }
    });

    const syncedBookings = remoteBookings
      .filter(b => {
        if (!b) return false;
        if (b.reference_no && b.reference_no.match(/-\d+$/)) return false;
        if (b.total_amount === 0 && b.notes && b.notes.includes('Slot lock')) return false;
        return true;
      })
      .map(rb => {
        const key = rb.reference_no || rb.id;
        const localVer = localMap.get(key);
        return {
          ...rb,
          payment_proof_url: rb.payment_proof_url || localVer?.payment_proof_url,
          payment_ref_no: rb.payment_ref_no || localVer?.payment_ref_no
        };
      });

    // Sync localStorage so deletions on another device immediately update local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(syncedBookings));
      } catch (e) {
        console.error(e);
      }
    }

    return syncedBookings;
  }

  return localBookings.filter(b => {
    if (!b) return false;
    if (b.reference_no && b.reference_no.match(/-\d+$/)) return false;
    if (b.total_amount === 0 && b.notes && b.notes.includes('Slot lock')) return false;
    return true;
  });
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
        const filtered = existing.filter(b => b.id !== idOrRef && b.reference_no !== idOrRef && !b.reference_no?.startsWith(`${idOrRef}-`));
        localStorage.setItem('balamban_pickleball_bookings', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Delete from Supabase DB (including any sub-slot records)
  if (supabase) {
    try {
      await supabase.from('bookings').delete().or(`id.eq.${idOrRef},reference_no.eq.${idOrRef}`);
      await supabase.from('bookings').delete().ilike('reference_no', `${idOrRef}%`);
    } catch (err) {
      console.warn('Supabase delete booking error:', err);
    }
  }

  return true;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  let localSettings: Partial<AdminSettings> = {};
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('balamban_pickleball_admin_settings');
    if (local) {
      try {
        localSettings = JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
  }

  let dbSettings: Partial<AdminSettings> = {};
  if (supabase) {
    try {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (!error && data) {
        Object.keys(data).forEach((key) => {
          if (data[key] !== null && data[key] !== undefined) {
            (dbSettings as any)[key] = data[key];
          }
        });

        // Unpack serialized custom JSON payload if stored in hero_subtitle
        if (typeof data.hero_subtitle === 'string' && data.hero_subtitle.includes('___JSON___')) {
          const parts = data.hero_subtitle.split('___JSON___');
          dbSettings.hero_subtitle = parts[0];
          try {
            const parsedCustom = JSON.parse(parts[1]);
            Object.assign(dbSettings, parsedCustom);
          } catch (e) {
            console.error('Failed to parse custom settings JSON:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase settings error:', err);
    }
  }

  // Base merge: DEFAULT_ADMIN_SETTINGS merged with localSettings
  const baseSettings: AdminSettings = {
    ...DEFAULT_ADMIN_SETTINGS,
    ...localSettings
  };

  // Supabase Cloud DB settings (dbSettings) take ultimate precedence across ALL devices!
  const merged: AdminSettings = {
    ...baseSettings,
    ...dbSettings
  };

  return merged;
}

export async function updateAdminSettings(settings: AdminSettings): Promise<boolean> {
  // 1. ALWAYS store in localStorage first
  if (typeof window !== 'undefined') {
    localStorage.setItem('balamban_pickleball_admin_settings', JSON.stringify(settings));
  }

  // 2. Persist to Supabase DB if connected
  if (supabase) {
    try {
      // Serialize custom fields into hero_subtitle with ___JSON___ marker
      const customPayload = {
        why_play_active: settings.why_play_active,
        feature_1_active: settings.feature_1_active,
        feature_2_active: settings.feature_2_active,
        feature_3_active: settings.feature_3_active,
        pill_1_active: settings.pill_1_active,
        pill_2_active: settings.pill_2_active,
        pill_3_active: settings.pill_3_active,
        pill_4_active: settings.pill_4_active,
        pill_1_title: settings.pill_1_title,
        pill_1_sub: settings.pill_1_sub,
        pill_2_title: settings.pill_2_title,
        pill_2_sub: settings.pill_2_sub,
        pill_3_title: settings.pill_3_title,
        pill_3_sub: settings.pill_3_sub,
        pill_4_title: settings.pill_4_title,
        pill_4_sub: settings.pill_4_sub,
        feature_1_title: settings.feature_1_title,
        feature_1_desc: settings.feature_1_desc,
        feature_2_title: settings.feature_2_title,
        feature_2_desc: settings.feature_2_desc,
        feature_3_title: settings.feature_3_title,
        feature_3_desc: settings.feature_3_desc,
        why_play_title: settings.why_play_title,
        why_play_subtitle: settings.why_play_subtitle,
        location_card_title: settings.location_card_title,
        location_gps: settings.location_gps,
        location_hours_text: settings.location_hours_text,
        location_amenity_1: settings.location_amenity_1,
        location_amenity_2: settings.location_amenity_2,
        google_maps_url: settings.google_maps_url,
        footer_hours_header: settings.footer_hours_header,
        footer_hours_text: settings.footer_hours_text,
        footer_payments_text: settings.footer_payments_text,
        footer_status_text: settings.footer_status_text
      };

      const rawSub = settings.hero_subtitle || '';
      const cleanSub = rawSub.split('___JSON___')[0];
      const combinedSub = cleanSub + '___JSON___' + JSON.stringify(customPayload);

      const dbPayload = {
        id: 'default',
        opening_hour: settings.opening_hour || 6,
        closing_hour: settings.closing_hour || 22,
        contact_phone: settings.contact_phone || '09458819427',
        contact_landline: settings.contact_landline || '(032) 492-1234',
        contact_email: settings.contact_email || 'booking@balambanbest.ph',
        location_address: settings.location_address || 'BALAMBAN EXTENSIVE SKILLS AND TECHNOLOGY, INC...',
        gcash_number: settings.gcash_number || '',
        gcash_name: settings.gcash_name || '',
        qr_code_url: settings.qr_code_url || '',
        maya_number: settings.maya_number || '',
        maya_name: settings.maya_name || '',
        maya_qr_url: settings.maya_qr_url || '',
        landbank_number: settings.landbank_number || '',
        landbank_name: settings.landbank_name || '',
        landbank_qr_url: settings.landbank_qr_url || '',
        hero_title: settings.hero_title || '',
        hero_subtitle: combinedSub
      };

      const { error } = await supabase.from('settings').upsert([dbPayload]);
      if (error) {
        console.warn('Supabase settings upsert error:', error);
      }
    } catch (err) {
      console.warn('Supabase update settings error:', err);
    }
  }

  return true;
}
