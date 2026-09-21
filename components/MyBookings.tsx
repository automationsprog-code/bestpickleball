'use client';

import React, { useState, useEffect } from 'react';
import { Booking } from '@/lib/types';
import { getAllUserBookings, supabase } from '@/lib/supabase';
import { formatDisplayTimeSlot } from '@/lib/data';
import { Ticket, Calendar, X, RefreshCw } from 'lucide-react';

interface MyBookingsProps {
  onClose: () => void;
  onNewBookingClick: () => void;
}

export default function MyBookings({ onClose, onNewBookingClick }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllUserBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const client = supabase;
    if (client) {
      const channel = client
        .channel('realtime-my-bookings-modal')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          fetchBookings();
        })
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white border-l border-slate-200 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-slate-900">
        
        {/* Drawer Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-lime-600" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">My Reservations</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchBookings}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">Loading reservations...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Wala pa kay active court booking.</p>
              <p className="text-xs text-slate-500 font-medium">Pinduta ang button sa ubos aron maka-reserve og Pickleball court slot!</p>
              <button
                onClick={() => { onClose(); onNewBookingClick(); }}
                className="mt-2 px-4 py-2 bg-lime-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
              >
                Book Court Now
              </button>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative hover:border-lime-500 transition shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-lime-800 bg-lime-100 px-2.5 py-0.5 rounded-full border border-lime-300">
                    {booking.reference_no}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {booking.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {booking.court_name || 'Pickleball Court'}
                  </h4>
                  <p className="text-xs text-slate-700 mt-1 flex items-center gap-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-lime-600" />
                    <span>{booking.booking_date} ({formatDisplayTimeSlot(booking.time_slot_label, booking.start_time, booking.end_time)})</span>
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600 font-medium">
                  <p><strong className="text-slate-900">Customer:</strong> {booking.customer_name}</p>
                  <p><strong className="text-slate-900">Payment:</strong> {booking.payment_method}</p>
                  {booking.equipment_rentals && booking.equipment_rentals.length > 0 && (
                    <p><strong className="text-slate-900">Rentals:</strong> {booking.equipment_rentals.map(r => `${r.quantity}x ${r.name}`).join(', ')}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs font-mono font-bold">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="text-lime-700 font-black">₱{booking.total_amount}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200">
          <button
            onClick={() => { onClose(); onNewBookingClick(); }}
            className="w-full py-3 bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md"
          >
            + BOOK ANOTHER COURT
          </button>
        </div>

      </div>
    </div>
  );
}
