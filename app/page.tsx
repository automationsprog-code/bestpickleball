'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CourtCard from '@/components/CourtCard';
import BookingModal from '@/components/BookingModal';
import OwnerPortalModal from '@/components/OwnerPortalModal';
import LocationMap from '@/components/LocationMap';
import MyBookings from '@/components/MyBookings';
import ChatSupport from '@/components/ChatSupport';
import Footer from '@/components/Footer';
import { Court, Booking, AdminSettings } from '@/lib/types';
import { getCourts, getAllUserBookings, getAdminSettings, supabase } from '@/lib/supabase';
import { purgeStaleLocalCaches } from '@/lib/version';
import { Trophy, Zap, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

import { INITIAL_COURTS } from '@/lib/data';

export default function Home() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [settings, setSettings] = useState<AdminSettings | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState<boolean>(false);
  const [isOwnerPortalOpen, setIsOwnerPortalOpen] = useState<boolean>(false);
  const [userBookingCount, setUserBookingCount] = useState<number>(0);

  const loadInitialData = async () => {
    purgeStaleLocalCaches(); // Wipe stale localStorage on version mismatch (all devices)
    const courtsData = await getCourts();
    setCourts(courtsData);

    const settingsData = await getAdminSettings();
    setSettings(settingsData);

    const bookings = await getAllUserBookings();
    setUserBookingCount(bookings.length);
  };

  useEffect(() => {
    loadInitialData();

    const client = supabase;
    if (client) {
      const channel = client
        .channel('realtime-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          loadInitialData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, () => {
          loadInitialData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
          loadInitialData();
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, []);

  const handleBookingSuccess = (newBooking: Booking) => {
    setUserBookingCount(prev => prev + 1);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Active courts list for bookers (respects empty court list when courts are deleted)
  const activeCourtsForBookers = courts.filter(court => court.is_active !== false && (court.is_active as any) !== 'false');
  const courtsPool = activeCourtsForBookers;

  const filteredCourts = courtsPool.filter(court => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Indoor') return court.type?.toLowerCase().includes('indoor') || court.type?.toLowerCase().includes('covered');
    if (activeFilter === 'Outdoor') return court.type?.toLowerCase().includes('outdoor') || court.type?.toLowerCase().includes('pro');
    if (activeFilter === 'VIP') return court.type?.toLowerCase().includes('vip');
    return true;
  });

  return (
    <div className="bg-white min-h-screen text-slate-900 flex flex-col font-sans selection:bg-lime-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Official Full-Page Background Watermark Logo (Spans across entire site background) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] z-0 overflow-hidden select-none">
        <img 
          src="/logo.jpg" 
          alt="Balamban BEST Inc. Watermark Background" 
          className="w-[650px] sm:w-[950px] max-w-none h-[650px] sm:h-[950px] object-contain rounded-full mix-blend-multiply filter contrast-125"
        />
      </div>

      {/* Navbar Header */}
      <Navbar 
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenOwnerPortal={() => setIsOwnerPortalOpen(true)}
        onScrollToSection={scrollToSection}
        activeBookingCount={userBookingCount}
      />

      {/* Hero Banner Section */}
      <HeroBanner 
        onBookClick={() => scrollToSection('courts')}
        onMapClick={() => scrollToSection('location')}
        settings={settings}
      />

      {/* Courts Selection Section */}
      <section id="courts" className="py-14 px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto w-full space-y-8 bg-white/90 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-lime-800 text-xs font-black uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-lime-600" />
              <span>Balamban BEST Inc. Courts</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Select a Pickleball Court to Book
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
              Covered & Outdoor pickleball courts sa Balamban, Cebu with tournament acrylic surface.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start">
            {['All', 'Indoor', 'Outdoor', 'VIP'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === filter 
                    ? 'bg-lime-500 text-slate-950 shadow-sm font-black' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Court Cards Grid */}
        {filteredCourts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Walay active court sa karon.</h3>
            <p className="text-xs text-slate-500 font-medium">Palihug tan-awa pag-usab unya o i-contact ang BEST Inc. Balamban management.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                onBookCourt={(c) => setSelectedCourtForBooking(c)}
              />
            ))}
          </div>
        )}

      </section>

      {/* Rates & Amenities Section */}
      <section id="rates" className="py-14 px-4 sm:px-8 lg:px-12 bg-slate-50/80 backdrop-blur-xs border-y border-slate-200 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Why Play at BEST Inc. Balamban?</h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              Gidisenyo alang sa beginners, enthusiasts, ug tournament players sa Balamban ug silingang lungsod.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {settings?.feature_1_title || 'Non-Slip Cushion Surface'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {settings?.feature_1_desc || 'Pro-grade acrylic court surfacing system reducing knee strain and ensuring maximum ball bounce accuracy.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {settings?.feature_2_title || 'Night Lighting & Roof'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {settings?.feature_2_desc || 'High-lumen LED floodlights for seamless evening matches up to 10:00 PM regardless of rain or heat.'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {settings?.feature_3_title || 'Paddle Rental & Coaching'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                {settings?.feature_3_desc || 'Wala kay paddle? No problem! Naa tay pickleball paddle rentals (₱50/pc) ug certified coaches available.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <LocationMap settings={settings} />

      {/* Footer */}
      <Footer settings={settings} />

      {/* Customer Booking Reservation Modal */}
      {selectedCourtForBooking && (
        <BookingModal
          court={selectedCourtForBooking}
          onClose={() => setSelectedCourtForBooking(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Owner / Admin Portal Modal */}
      {isOwnerPortalOpen && (
        <OwnerPortalModal
          onClose={() => setIsOwnerPortalOpen(false)}
          onCourtsUpdated={loadInitialData}
        />
      )}

      {/* Customer Reservations Drawer */}
      {isMyBookingsOpen && (
        <MyBookings
          onClose={() => setIsMyBookingsOpen(false)}
          onNewBookingClick={() => {
            setIsMyBookingsOpen(false);
            scrollToSection('courts');
          }}
        />
      )}

      {/* Live Chat Support Floating Widget */}
      <ChatSupport settings={settings} />

    </div>
  );
}
