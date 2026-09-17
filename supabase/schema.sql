-- ========================================================
-- BESTPICKLEBALL COURT BOOKING SYSTEM - SUPABASE SCHEMA
-- Location: Balamban Extensive Skills and Technology, Inc. (BEST Inc.)
-- ========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COURTS TABLE
CREATE TABLE IF NOT EXISTS public.courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Indoor Covered', 'Outdoor Pro', 'VIP Covered')),
  surface VARCHAR(100) NOT NULL DEFAULT 'Cushioned Acrylic Surface',
  hourly_rate NUMERIC(10, 2) NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_no VARCHAR(20) UNIQUE NOT NULL,
  court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  booking_date DATE NOT NULL,
  time_slot_label VARCHAR(100) DEFAULT '8:00 AM - 9:00 AM',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  equipment_rentals JSONB DEFAULT '[]'::jsonb,
  payment_method VARCHAR(50) DEFAULT 'GCash',
  payment_status VARCHAR(50) DEFAULT 'Paid',
  status VARCHAR(50) DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SETTINGS TABLE (ADMIN QR CODE & PAYMENTS)
CREATE TABLE IF NOT EXISTS public.settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  gcash_number VARCHAR(100) DEFAULT '0917-888-9900',
  gcash_name VARCHAR(255) DEFAULT 'BEST INC. BALAMBAN',
  qr_code_url TEXT DEFAULT 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN_BEST_INC_09178889900',
  maya_number VARCHAR(100) DEFAULT '0917-888-9900',
  maya_name VARCHAR(255) DEFAULT 'BEST INC. BALAMBAN',
  maya_qr_url TEXT DEFAULT 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA_BALAMBAN_BEST_INC_09178889900',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Settings Row
INSERT INTO public.settings (id, gcash_number, gcash_name, qr_code_url)
VALUES ('default', '0917-888-9900', 'BEST INC. BALAMBAN', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN_BEST_INC_09178889900')
ON CONFLICT (id) DO NOTHING;

-- 4. INITIAL SAMPLE COURTS DATA
INSERT INTO public.courts (id, name, type, surface, hourly_rate, description, features, image_url)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Court 1 - Championship Covered Court',
    'Indoor Covered',
    'Tournament Cushioned Acrylic Surface',
    350.00,
    'Premier covered pickleball court equipped with high-performance LED lighting and official tournament court dimensions.',
    ARRAY['Covered Roof', 'LED Night Lighting', 'Official Net System', 'Spectator Seating'],
    'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=1200&q=80'
  )
ON CONFLICT (id) DO NOTHING;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to courts" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to courts" ON public.courts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to courts" ON public.courts FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to bookings" ON public.bookings FOR UPDATE USING (true);

CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public update settings" ON public.settings FOR ALL USING (true);
