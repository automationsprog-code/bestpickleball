'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import CourtCard from '@/components/CourtCard';
import BookingModal from '@/components/BookingModal';
import OwnerPortalModal from '@/components/OwnerPortalModal';
import LocationMap from '@/components/LocationMap';
import MyBookings from '@/components/MyBookings';
import Footer from '@/components/Footer';
import { Court, Booking } from '@/lib/types';
import { getCourts, getAllUserBookings } from '@/lib/supabase';
import { Trophy, Zap, Sparkles, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedCourtForBooking, setSelectedCourtForBooking] = useState<Court | null>(null);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState<boolean>(false);
  const [isOwnerPortalOpen, setIsOwnerPortalOpen] = useState<boolean>(false);
  const [userBookingCount, setUserBookingCount] = useState<number>(0);

  const loadInitialData = async () => {
    const courtsData = await getCourts();
    setCourts(courtsData);

    const bookings = await getAllUserBookings();
    setUserBookingCount(bookings.length);
  };

  useEffect(() => {
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
    <div className="bg-white min-h-screen text-slate-900 flex flex-col font-sans selection:bg-lime-500 selection:text-slate-950">
      
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
      />

      {/* Courts Selection Section */}
      <section id="courts" className="py-14 px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto w-full space-y-8 bg-white">
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              onBookCourt={(c) => setSelectedCourtForBooking(c)}
            />
          ))}
        </div>

      </section>

      {/* Rates & Amenities Section */}
      <section id="rates" className="py-14 px-4 sm:px-8 lg:px-12 bg-slate-50 border-y border-slate-200">
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
              <h3 className="text-lg font-black text-slate-900">Non-Slip Cushion Surface</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Pro-grade acrylic court surfacing system reducing knee strain and ensuring maximum ball bounce accuracy.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Night Lighting & Roof</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                High-lumen LED floodlights for seamless evening matches up to 10:00 PM regardless of rain or heat.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-2xl bg-lime-100 text-lime-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Paddle Rental & Coaching</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium">
                Wala kay paddle? No problem! Naa tay pickleball paddle rentals (₱50/pc) ug certified coaches available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Map Section */}
      <LocationMap />

      {/* Footer */}
      <Footer />

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

    </div>
  );
}
