'use client';

import React from 'react';
import { MapPin, Calendar, Sparkles, Shield, Clock, Sun, Trophy, ExternalLink } from 'lucide-react';

interface HeroBannerProps {
  onBookClick: () => void;
  onMapClick: () => void;
}

export default function HeroBanner({ onBookClick, onMapClick }: HeroBannerProps) {
  const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/BALAMBAN+EXTENSIVE+SKILLS+AND+TECHNOLOGY,+INC./@10.5124198,123.7272847,1193m/data=!3m2!1e3!4b1!4m6!3m5!1s0x33a909a00f7169d7:0xaef1d3f6c0a056e2!8m2!3d10.5124145!4d123.7298596!16s%2Fg%2F11ry0t7wjl?entry=ttu";

  return (
    <div id="hero" className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60">
      
      {/* Decorative Glow background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-lime-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
          
          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-lime-500/30 text-lime-400 text-xs font-semibold shadow-lg shadow-lime-950/40">
            <MapPin className="w-3.5 h-3.5 text-lime-400" />
            <span>Balamban Extensive Skills and Technology, Inc. (BEST Inc.)</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Book Your Pickleball Court in <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-300">Balamban, Cebu</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            Duwa na og Pickleball sa pinakanindot ug kompleto nga venue sa Balamban! High-traction covered & outdoor courts with LED night lighting, paddle rentals, ug easy online slot reservations via Supabase & GCash.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onBookClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-lime-500/30 active:scale-95 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>BOOK A COURT NOW</span>
            </button>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-lime-400" />
              <span>Get Directions</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Quick Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
            <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">4 Courts</p>
                <p className="text-[11px] text-slate-400">Covered & Outdoor</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">LED Night Lighting</p>
                <p className="text-[11px] text-slate-400">Play until 10 PM</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Instant Booking</p>
                <p className="text-[11px] text-slate-400">Real-time slots</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-2xl border border-slate-700/60 flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">GCash / Maya</p>
                <p className="text-[11px] text-slate-400">Easy Payment</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
