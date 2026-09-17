'use client';

import React, { useState, useEffect } from 'react';
import DeviceSimulator from '@/components/DeviceSimulator';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CourtCard from '@/components/CourtCard';
import BookingModal from '@/components/BookingModal';
import LocationMap from '@/components/LocationMap';
import MyBookings from '@/components/MyBookings';
import Footer from '@/components/Footer';
import { Court, Booking } from '@/lib/types';
import { getCourts, getAllUserBookings } from '@/lib/supabase';
import { Trophy, Filter, Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState<boolean>(false);
  const [userBookingCount, setUserBookingCount] = useState<number>(0);

  // Load courts and user booking count
  useEffect(() => {
    async function loadInitialData() {
      const courtsData = await getCourts();
      setCourts(courtsData);

      const bookings = await getAllUserBookings();
      setUserBookingCount(bookings.length);
    }
    loadInitialData();
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

  const filteredCourts = courts.filter(court => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Indoor') return court.type === 'Indoor Covered';
    if (activeFilter === 'Outdoor') return court.type === 'Outdoor Pro';
    if (activeFilter === 'VIP') return court.type === 'VIP Covered';
    return true;
  });

  return (
    <DeviceSimulator>
      <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
        
        {/* Navbar */}
        <Navbar 
          onOpenMyBookings={() => setIsMyBookingsOpen(true)}
          onScrollToSection={scrollToSection}
          activeBookingCount={userBookingCount}
        />

        {/* Hero Section */}
        <HeroBanner 
          onBookClick={() => scrollToSection('courts')}
          onMapClick={() => scrollToSection('location')}
        />

        {/* Courts Section */}
        <section id="courts" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-lime-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Trophy className="w-4 h-4" />
                <span>Balamban BEST Inc. Courts</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Select a Pickleball Court to Book
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Pinaka-kompleto nga covered ug outdoor courts sa Balamban, Cebu with tournament acrylic surface.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start">
              {['All', 'Indoor', 'Outdoor', 'VIP'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === filter 
                      ? 'bg-lime-500 text-slate-950 shadow-md font-black' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Court Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                onBookCourt={(c) => setSelectedCourtForBooking(c)}
              />
            ))}
          </div>

        </section>

        {/* Rates & Facilities Showcase */}
        <section id="rates" className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Why Play at BEST Inc. Balamban?</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Desensyo alang sa beginners, enthusiasts, ug tournament players sa Balamban ug silingang lungsod.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Non-Slip Cushion Surface</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Pro-grade acrylic court surfacing system reducing knee strain and ensuring maximum ball bounce accuracy.
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Night Lighting & Roof</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  High-lumen LED floodlights for seamless evening matches up to 10:00 PM regardless of rain or heat.
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-500/10 text-lime-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Paddle Rental & Coaching</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Wala kay paddle? No problem! Naa tay pickleball paddle rentals (₱50/pc) ug certified coaches available.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Location & Map Section */}
        <LocationMap />

        {/* Footer */}
        <Footer />

        {/* Booking Reservation Modal */}
        {selectedCourtForBooking && (
          <BookingModal
            court={selectedCourtForBooking}
            onClose={() => setSelectedCourtForBooking(null)}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {/* My Bookings Drawer */}
        {isMyBookingsOpen && (
          <MyBookings
            onClose={() => setIsMyBookingsOpen(false)}
            onNewBookingClick={() => {
              setIsMyBookingsOpen(false);
              scrollToSection('courts');
            }}
          />
        )}

      </div>
    </DeviceSimulator>
  );
}
