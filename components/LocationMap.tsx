'use client';

import React from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink, Car, Coffee } from 'lucide-react';

import { AdminSettings } from '@/lib/types';

interface LocationMapProps {
  settings?: AdminSettings;
}

export default function LocationMap({ settings }: LocationMapProps) {
  const DEFAULT_MAPS_URL = "https://www.google.com/maps/place/BALAMBAN+EXTENSIVE+SKILLS+AND+TECHNOLOGY,+INC./@10.5124198,123.7272847,1193m/data=!3m2!1e3!4b1!4m6!3m5!1s0x33a909a00f7169d7:0xaef1d3f6c0a056e2!8m2!3d10.5124145!4d123.7298596!16s%2Fg%2F11ry0t7wjl?entry=ttu";

  const cardTitle = settings?.location_card_title || 'Balamban BEST Inc. Address';
  const addressText = settings?.location_address || 'BALAMBAN EXTENSIVE SKILLS AND TECHNOLOGY, INC. (BEST Inc.) Poblacion / Bano, Balamban, Cebu 6041';
  const gpsText = settings?.location_gps || '10.5124145, 123.7298596';
  const hoursText = settings?.location_hours_text || 'Monday - Sunday: 6:00 AM – 10:00 PM';
  const phoneText = settings?.contact_phone || '09458819427';
  const landlineText = settings?.contact_landline || '(032) 492-1234';
  const amenity1 = settings?.location_amenity_1 || 'Free Parking';
  const amenity2 = settings?.location_amenity_2 || 'Snack Lounge';
  const mapsUrl = settings?.google_maps_url || DEFAULT_MAPS_URL;

  return (
    <div id="location" className="py-12 px-4 sm:px-8 lg:px-12 bg-slate-50 border-t border-slate-200">
      <div className="max-w-[1700px] mx-auto space-y-8">
        
        {/* Section Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-lime-100 border border-lime-300 text-lime-800 text-xs font-bold">
            <MapPin className="w-3.5 h-3.5 text-lime-700" />
            <span>Balamban Venue & Location Map</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How to Get to BEST Inc. Pickleball Courts
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto font-medium">
            Situated right in the heart of Balamban, Cebu with spacious parking, lounge, and pro shop amenities.
          </p>
        </div>

        {/* Map Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Info Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-md">
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-lime-600" />
                <span>{cardTitle}</span>
              </h3>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-lime-600 shrink-0 mt-1" />
                  <div>
                    <strong className="text-slate-900 block">Official Address:</strong>
                    <p className="text-slate-600">{addressText}</p>
                    <p className="text-[11px] text-lime-700 font-mono font-bold mt-0.5">GPS: {gpsText}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-lime-600 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Operating Hours:</strong>
                    <p className="text-slate-600">{hoursText}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-lime-600 shrink-0" />
                  <div>
                    <strong className="text-slate-900">Court Hotline / GCash:</strong>
                    <p className="text-slate-600">{phoneText} / {landlineText}</p>
                  </div>
                </div>
              </div>

              {/* Amenities & Facility Badges */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-900">On-Site Amenities:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <Car className="w-3.5 h-3.5 text-lime-600" />
                    <span>{amenity1}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <Coffee className="w-3.5 h-3.5 text-lime-600" />
                    <span>{amenity2}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Google Maps Action Button */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>OPEN IN GOOGLE MAPS</span>
            </a>

          </div>

          {/* Right Embedded Interactive Google Map */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md min-h-[350px] relative">
            <iframe
              title="Balamban Pickleball Court Location Map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(gpsText)}&hl=en&z=16&output=embed`}
              className="w-full h-full min-h-[380px] border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>

      </div>
    </div>
  );
}
