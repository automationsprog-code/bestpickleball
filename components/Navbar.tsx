'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Trophy, Ticket, Menu, X, ShieldCheck, Lock } from 'lucide-react';

interface NavbarProps {
  onOpenMyBookings: () => void;
  onOpenOwnerPortal: () => void;
  onScrollToSection: (sectionId: string) => void;
  activeBookingCount: number;
}

export default function Navbar({ onOpenMyBookings, onOpenOwnerPortal, onScrollToSection, activeBookingCount }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onScrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-sm">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Location */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('hero')}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-600 to-emerald-500 p-0.5 shadow-md shadow-lime-500/20 flex-shrink-0">
              <img src="/logo.jpg" alt="Balamban BEST Inc. Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">
                  best<span className="text-lime-600">pickleball</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-lime-100 text-lime-800 border border-lime-300 rounded-full">
                  BALAMBAN
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-lime-600" />
                Balamban Extensive Skills & Tech, Inc.
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-bold text-slate-700">
            <button 
              onClick={() => handleNavClick('courts')}
              className="hover:text-lime-600 transition-colors py-1"
            >
              Pickleball Courts
            </button>
            <button 
              onClick={() => handleNavClick('rates')}
              className="hover:text-lime-600 transition-colors py-1"
            >
              Rates & Amenities
            </button>
            <button 
              onClick={() => handleNavClick('location')}
              className="hover:text-lime-600 transition-colors py-1"
            >
              Location Map
            </button>
          </div>

          {/* Actions: Owner Portal, My Reservations & Book Now */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Owner Portal Trigger */}
            <button
              onClick={onOpenOwnerPortal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition shadow-xs"
              title="Court Owner Dashboard"
            >
              <Lock className="w-3.5 h-3.5 text-lime-600" />
              <span className="hidden sm:inline">Owner Portal</span>
            </button>

            {/* My Reservations Button */}
            <button
              onClick={onOpenMyBookings}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition shadow-xs"
            >
              <Ticket className="w-3.5 h-3.5 text-lime-600" />
              <span className="hidden sm:inline">My Bookings</span>
              {activeBookingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-lime-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {activeBookingCount}
                </span>
              )}
            </button>

            {/* Book Now Button */}
            <button
              onClick={() => handleNavClick('courts')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-extrabold text-xs tracking-wide transition shadow-md shadow-lime-500/20 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Court</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 font-medium text-sm text-slate-800 shadow-xl">
          <button
            onClick={() => handleNavClick('courts')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 hover:text-lime-700 font-semibold"
          >
            Pickleball Courts
          </button>
          <button
            onClick={() => handleNavClick('rates')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 hover:text-lime-700 font-semibold"
          >
            Rates & Equipment
          </button>
          <button
            onClick={() => handleNavClick('location')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-100 hover:text-lime-700 font-semibold"
          >
            Location & Map
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); onOpenOwnerPortal(); }}
            className="block w-full text-left py-2 px-3 rounded-lg bg-lime-100 text-lime-900 font-bold border border-lime-300"
          >
            Owner / Admin Portal (Login Required)
          </button>
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => handleNavClick('courts')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-lime-500 text-slate-950 font-bold"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Court Now</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
