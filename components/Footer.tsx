'use client';

import React from 'react';
import { MapPin, Phone, Mail, Trophy, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 border-t border-slate-900 py-10 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Info */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-lime-400" />
            <span className="font-extrabold text-base text-white">BEST PICKLEBALL BALAMBAN</span>
          </div>
          <p className="text-slate-400 leading-relaxed max-w-md">
            Official Pickleball Court Booking Platform for Balamban Extensive Skills and Technology, Inc. (BEST Inc.), Balamban, Cebu. Built with Next.js, Supabase, Tailwind CSS & Vercel.
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm">Contact & Booking</h4>
          <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-lime-400" /> Balamban, Cebu 6041</p>
          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-lime-400" /> 0917-888-9900</p>
          <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-lime-400" /> booking@balambanbest.ph</p>
        </div>

        {/* Payment & Operating Hours */}
        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm">Hours & Payments</h4>
          <p>Open Daily: 6:00 AM - 10:00 PM</p>
          <p>Accepted: GCash, Maya, Cash</p>
          <p className="text-lime-400 font-semibold mt-1">Supabase Realtime Ready</p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
        <p>© {new Date().getFullYear()} Balamban Extensive Skills and Technology, Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Pickleball Community in Balamban
        </p>
      </div>
    </footer>
  );
}
