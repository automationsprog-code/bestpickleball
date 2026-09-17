'use client';

import React from 'react';
import { Court } from '@/lib/types';
import { CheckCircle, Calendar } from 'lucide-react';

interface CourtCardProps {
  court: Court;
  onBookCourt: (court: Court) => void;
}

export default function CourtCard({ court, onBookCourt }: CourtCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 hover:border-lime-500 transition-all duration-300 overflow-hidden flex flex-col group shadow-md hover:shadow-xl">
      
      {/* Court Image Banner */}
      <div className="relative h-48 sm:h-56 w-full bg-slate-100 overflow-hidden">
        <img
          src={court.image_url}
          alt={court.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20"></div>

        {/* Type Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-900 border border-slate-200 shadow-sm">
          {court.type}
        </div>

        {/* Hourly Rate Chip */}
        <div className="absolute bottom-3 right-3 bg-lime-500 text-slate-950 px-3.5 py-1 rounded-xl text-sm font-black shadow-lg">
          ₱{court.hourly_rate} <span className="text-[11px] font-semibold opacity-90">/ hr</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-lime-700 transition-colors">
            {court.name}
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed font-medium">
            {court.description}
          </p>

          <div className="mt-3 text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <span className="text-lime-700 font-bold">Surface:</span>
            <span>{court.surface}</span>
          </div>

          {/* Features Grid */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {court.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => onBookCourt(court)}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-lime-500 text-white hover:text-slate-950 font-black text-xs tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <Calendar className="w-4 h-4" />
            <span>RESERVE THIS COURT</span>
          </button>
        </div>

      </div>

    </div>
  );
}
