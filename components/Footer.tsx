'use client';

import React from 'react';
import { MapPin, Phone, Mail, Trophy, Heart } from 'lucide-react';

import { AdminSettings } from '@/lib/types';

interface FooterProps {
  settings?: AdminSettings;
}

export default function Footer({ settings }: FooterProps) {
  const phoneText = settings?.contact_phone || '0917-888-9900';
  const emailText = settings?.contact_email || 'booking@balambanbest.ph';

  return (
    <footer id="contact" className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Info */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.jpg" alt="BEST Inc. Logo" className="w-6 h-6 rounded-full object-cover border border-lime-500 shadow-xs" />
            <span className="font-black text-base text-slate-900">BEST PICKLEBALL BALAMBAN</span>
          </div>
          <p className="text-slate-600 leading-relaxed max-w-md font-medium">
            Official Pickleball Court Booking Platform for Balamban Extensive Skills and Technology, Inc. (BEST Inc.), Balamban, Cebu. Built with Next.js, Supabase, Tailwind CSS & Vercel.
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 font-medium">
          <h4 className="font-black text-slate-900 text-sm">Contact & Booking</h4>
          <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-lime-600" /> Balamban, Cebu 6041</p>
          <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-lime-600" /> {phoneText}</p>
          <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-lime-600" /> {emailText}</p>
        </div>

        {/* Payment & Operating Hours */}
        <div className="space-y-2 font-medium">
          <h4 className="font-black text-slate-900 text-sm">Hours & Payments</h4>
          <p>Open Daily: 6:00 AM - 10:00 PM</p>
          <p>Accepted: GCash, Maya, Cash</p>
          <p className="text-lime-700 font-extrabold mt-1">Supabase Realtime Connected</p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px] font-medium">
        <p>© {new Date().getFullYear()} Balamban Extensive Skills and Technology, Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for Pickleball Community in Balamban
        </p>
      </div>
    </footer>
  );
}
