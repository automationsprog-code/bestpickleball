'use client';

import React from 'react';
import { MapPin, Calendar, Sun, Trophy, ExternalLink, Shield, Clock } from 'lucide-react';

import { AdminSettings } from '@/lib/types';

interface HeroBannerProps {
  onBookClick: () => void;
  onMapClick: () => void;
  settings?: AdminSettings;
}

export default function HeroBanner({ onBookClick, onMapClick, settings }: HeroBannerProps) {
  const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/BALAMBAN+EXTENSIVE+SKILLS+AND+TECHNOLOGY,+INC./@10.5124198,123.7272847,1193m/data=!3m2!1e3!4b1!4m6!3m5!1s0x33a909a00f7169d7:0xaef1d3f6c0a056e2!8m2!3d10.5124145!4d123.7298596!16s%2Fg%2F11ry0t7wjl?entry=ttu";

  const title = settings?.hero_title || 'Book Your Pickleball Court in Balamban, Cebu';
  const subtitle = settings?.hero_subtitle || 'Duwa na og Pickleball sa pinakanindot ug kompleto nga venue sa Balamban! High-traction covered & outdoor courts with LED night lighting, paddle rentals, ug easy online slot reservations via Supabase & GCash.';

  return (
    <div id="hero" className="relative overflow-hidden bg-gradient-to-b from-slate-100 via-lime-50/20 to-slate-50 pt-6 sm:pt-8 pb-12 px-4 sm:px-8 lg:px-12 border-b border-slate-200">
      
      {/* Decorative Glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[250px] bg-lime-400/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1700px] mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
          
          {/* Location & Brand Badge with Official Logo */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-lime-500/40 text-lime-900 text-xs font-bold shadow-sm">
            <img src="/logo.jpg" alt="BEST Inc. Logo" className="w-5 h-5 rounded-full object-cover border border-lime-500 shadow-xs" />
            <span>Balamban Extensive Skills and Technology, Inc. (BEST Inc.)</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
            {subtitle}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onBookClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-sm tracking-wide transition shadow-lg shadow-lime-500/25 active:scale-95 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>BOOK A COURT NOW</span>
            </button>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs"
            >
              <MapPin className="w-4 h-4 text-lime-600" />
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Quick Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-3 shadow-xs">
              <div className="p-2 rounded-xl bg-lime-100 text-lime-700">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Pickleball Courts</p>
                <p className="text-[11px] text-slate-500 font-medium">Covered & Outdoor</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-3 shadow-xs">
              <div className="p-2 rounded-xl bg-lime-100 text-lime-700">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">LED Night Lighting</p>
                <p className="text-[11px] text-slate-500 font-medium">Play until 10 PM</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-3 shadow-xs">
              <div className="p-2 rounded-xl bg-lime-100 text-lime-700">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Instant Booking</p>
                <p className="text-[11px] text-slate-500 font-medium">Real-time slots</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-3 shadow-xs">
              <div className="p-2 rounded-xl bg-lime-100 text-lime-700">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">GCash / Maya</p>
                <p className="text-[11px] text-slate-500 font-medium">Easy Payment</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
