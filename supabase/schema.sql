-- ========================================================
-- BALAMBAN PICKLEBALL COURT BOOKING SYSTEM - SUPABASE SCHEMA
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
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  equipment_rentals JSONB DEFAULT '[]'::jsonb,
  payment_method VARCHAR(50) DEFAULT 'GCash',
  status VARCHAR(50) DEFAULT 'Confirmed' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INITIAL SAMPLE DATA (Balamban BEST Inc Courts)
INSERT INTO public.courts (id, name, type, surface, hourly_rate, description, features, image_url)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Court 1 - Championship Covered',
    'Indoor Covered',
    'Tournament Cushioned Acrylic',
    350.00,
    'Premier covered pickleball court equipped with high-performance LED lighting and official court dimensions.',
    ARRAY['Covered Roof', 'LED Night Lighting', 'Official Net System', 'Spectator Seating'],
    'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Court 2 - Outdoor Pro Court',
    'Outdoor Pro',
    'Pro-Grid Acrylic Court',
    250.00,
    'Open-air pickleball court with optimal traction, surrounded by lush Balamban mountain views.',
    ARRAY['Mountain View', 'Outdoor Ventilation', 'High-Traction Surface', 'Shaded Bench'],
    'https://images.unsplash.com/photo-1599586120429-48281b6f0eca?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Court 3 - Covered Training Court',
    'Indoor Covered',
    'Shock-Absorbing Composite',
    300.00,
    'Ideal court for regular practice matches, coaching lessons, and drill sessions.',
    ARRAY['Covered Roof', 'Ball Machine Available', 'Coaching Ready', 'LED Lighting'],
    'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Court 4 - VIP Covered Arena',
    'VIP Covered',
    'Premium Pro Cushion Turf',
    400.00,
    'Exclusive private court with dedicated lounge area, sound system, and refreshment station.',
    ARRAY['Private Lounge', 'Covered Roof', 'Dedicated Sound System', 'Free Cold Water', 'LED Night Lighting'],
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'
  )
ON CONFLICT (id) DO NOTHING;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to courts
CREATE POLICY "Allow public read access to courts" ON public.courts FOR SELECT USING (true);

-- Allow public read and insert access to bookings
CREATE POLICY "Allow public read access to bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to bookings" ON public.bookings FOR INSERT WITH CHECK (true);
