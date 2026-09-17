'use client';

import React, { useState } from 'react';
import { MapPin, Calendar, Trophy, PhoneCall, Clock, Menu, X, Ticket } from 'lucide-react';

interface NavbarProps {
  onOpenMyBookings: () => void;
  onScrollToSection: (sectionId: string) => void;
  activeBookingCount: number;
}

export default function Navbar({ onOpenMyBookings, onScrollToSection, activeBookingCount }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    onScrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Location */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('hero')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-500 to-emerald-400 p-0.5 shadow-lg shadow-lime-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-lime-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  BEST <span className="text-lime-400">PICKLEBALL</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-lime-500/10 text-lime-400 border border-lime-500/30 rounded-full">
                  BALAMBAN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-lime-400" />
                Balamban Extensive Skills & Tech, Inc.
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-300">
            <button 
              onClick={() => handleNavClick('courts')}
              className="hover:text-lime-400 transition-colors py-1"
            >
              Pickleball Courts
            </button>
            <button 
              onClick={() => handleNavClick('rates')}
              className="hover:text-lime-400 transition-colors py-1"
            >
              Rates & Amenities
            </button>
            <button 
              onClick={() => handleNavClick('location')}
              className="hover:text-lime-400 transition-colors py-1"
            >
              Location & Map
            </button>
            <button 
              onClick={() => handleNavClick('contact')}
              className="hover:text-lime-400 transition-colors py-1"
            >
              Contact Us
            </button>
          </div>

          {/* Actions & My Bookings Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenMyBookings}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <Ticket className="w-4 h-4 text-lime-400" />
              <span>My Reservations</span>
              {activeBookingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-lime-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {activeBookingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('courts')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-extrabold text-xs tracking-wide transition-all shadow-lg shadow-lime-500/25 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Court Now</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-3 pb-5 space-y-3 font-medium text-sm text-slate-200 shadow-xl">
          <button
            onClick={() => handleNavClick('courts')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-lime-400"
          >
            Pickleball Courts
          </button>
          <button
            onClick={() => handleNavClick('rates')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-lime-400"
          >
            Rates & Equipment
          </button>
          <button
            onClick={() => handleNavClick('location')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-lime-400"
          >
            Location & Map
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-800 hover:text-lime-400"
          >
            Contact & GCash Info
          </button>
          <div className="pt-2 border-t border-slate-800">
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
