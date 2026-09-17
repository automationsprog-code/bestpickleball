'use client';

import React, { useState, useEffect } from 'react';
import { Court, Booking, EquipmentRental, AdminSettings } from '@/lib/types';
import { HOURLY_SLOTS, HourlySlot, DEFAULT_ADMIN_SETTINGS } from '@/lib/data';
import { getBookingsForDate, createBooking, getAdminSettings } from '@/lib/supabase';
import { X, Calendar, Clock, User, Phone, Mail, CheckCircle2, ShieldCheck, DollarSign, QrCode, Ticket, Loader2 } from 'lucide-react';

interface BookingModalProps {
  court: Court | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export default function BookingModal({ court, onClose, onBookingSuccess }: BookingModalProps) {
  if (!court) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<HourlySlot>(HOURLY_SLOTS[2]); // Default 8:00 AM - 9:00 AM
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya' | 'Pay at Court'>('GCash');
  const [notes, setNotes] = useState('');

  // Equipment add-ons
  const [paddleQty, setPaddleQty] = useState<number>(0);
  const [ballQty, setBallQty] = useState<number>(0);
  const [coachAdded, setCoachAdded] = useState<boolean>(false);

  // Confirmation view
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Load Admin QR Settings & Booked Slots
  useEffect(() => {
    async function loadInitialData() {
      const sets = await getAdminSettings();
      setAdminSettings(sets);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const bookings = await getBookingsForDate(selectedDate);
        const slotsForThisCourt = bookings
          .filter(b => b.court_id === court?.id)
          .map(b => b.start_time);
        setBookedSlots(slotsForThisCourt);
        
        // Auto-select first available slot if taken
        if (slotsForThisCourt.includes(selectedSlot.startTime)) {
          const firstAvail = HOURLY_SLOTS.find(s => !slotsForThisCourt.includes(s.startTime));
          if (firstAvail) setSelectedSlot(firstAvail);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDate, court]);

  // Generate next 7 days for quick date picker
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    return { dateStr, dayName, dayNum, isToday: i === 0 };
  });

  // Calculate pricing
  const courtPrice = court.hourly_rate;
  const paddlePrice = paddleQty * 50;
  const ballPrice = ballQty * 30;
  const coachPrice = coachAdded ? 300 : 0;
  const totalPrice = courtPrice + paddlePrice + ballPrice + coachPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('Palihug ibutang ang imong Pangalan ug Phone Number.');
      return;
    }

    setSubmitting(true);

    const rentals: EquipmentRental[] = [];
    if (paddleQty > 0) rentals.push({ id: 'pad', name: 'Pickleball Paddle', price: 50, quantity: paddleQty });
    if (ballQty > 0) rentals.push({ id: 'ball', name: 'Franklin X-40 Balls', price: 30, quantity: ballQty });
    if (coachAdded) rentals.push({ id: 'coach', name: 'Personal Coach', price: 300, quantity: 1 });

    const refNo = `BEST-PKL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBookingData: Omit<Booking, 'id' | 'created_at'> = {
      reference_no: refNo,
      court_id: court.id,
      court_name: court.name,
      customer_name: customerName,
      customer_email: customerEmail || 'customer@balamban.ph',
      customer_phone: customerPhone,
      booking_date: selectedDate,
      time_slot_label: selectedSlot.label,
      start_time: selectedSlot.startTime,
      end_time: selectedSlot.endTime,
      total_amount: totalPrice,
      equipment_rentals: rentals,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'Pay at Court' ? 'Pending' : 'Paid',
      status: 'Confirmed',
      notes
    };

    try {
      const created = await createBooking(newBookingData);
      setConfirmedBooking(created);
      onBookingSuccess(created);
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('May problema sa pag-save sa reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-400 flex items-center justify-center font-bold">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {confirmedBooking ? 'Booking Confirmed!' : `Reserve ${court.name}`}
              </h2>
              <p className="text-[11px] text-slate-400">Balamban Extensive Skills and Technology, Inc.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {confirmedBooking ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto text-lime-400 border border-lime-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 bg-lime-500/10 text-lime-400 text-xs font-mono font-bold rounded-full border border-lime-500/30">
                REF: {confirmedBooking.reference_no}
              </span>
              <h3 className="text-2xl font-black text-white mt-2">Daghan Kaayong Salamat!</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                Na-confirm na ang imong Pickleball court slot sa Balamban BEST Inc.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 text-left space-y-3 font-sans text-xs sm:text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Court:</span>
                <span className="font-bold text-white">{court.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Date & Hourly Slot:</span>
                <span className="font-bold text-lime-400">{confirmedBooking.booking_date} ({confirmedBooking.time_slot_label})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-semibold text-white">{confirmedBooking.customer_name} ({confirmedBooking.customer_phone})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Payment Option:</span>
                <span className="font-semibold text-slate-200">{confirmedBooking.payment_method}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-1">
                <span className="text-slate-300">Total Amount:</span>
                <span className="text-lime-400">₱{confirmedBooking.total_amount}</span>
              </div>
            </div>

            {/* Admin QR Code Scan-to-Pay Container */}
            {confirmedBooking.payment_method === 'GCash' && (
              <div className="bg-blue-950/40 border border-blue-800/50 p-5 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-xs">
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code to Pay via GCash</span>
                </div>

                <div className="w-40 h-40 bg-white p-2.5 rounded-2xl mx-auto shadow-xl border-2 border-lime-500">
                  <img
                    src={adminSettings.qr_code_url}
                    alt="Official Payment QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs font-mono font-bold text-lime-400">{adminSettings.gcash_number}</p>
                  <p className="text-xs font-bold text-white">{adminSettings.gcash_name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Palihug i-send ang <strong>₱{confirmedBooking.total_amount}</strong> ug i-pakita ang Ref No. inig abot sa venue.</p>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs tracking-wider transition shadow-lg"
            >
              DONE & BACK TO HOMEPAGE
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* 1. Date Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-lime-400" />
                1. Select Reservation Date:
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {upcomingDates.map((item) => (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`p-2.5 rounded-xl text-center border transition-all ${
                      selectedDate === item.dateStr
                        ? 'bg-lime-500 text-slate-950 border-lime-400 font-extrabold shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider opacity-80">{item.dayName}</div>
                    <div className="text-base font-black">{item.dayNum}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Time Slot Selector (Per Hour) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-lime-400" />
                  2. Select Hourly Time Slot (Sample: 6:00 AM - 7:00 AM):
                </label>
                {loadingSlots && <span className="text-[11px] text-lime-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking slots...</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HOURLY_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot.startTime);
                  const isSelected = selectedSlot.startTime === slot.startTime;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                        isBooked
                          ? 'bg-slate-950 border-slate-800 text-slate-600 line-through cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-lime-500 text-slate-950 border-lime-400 shadow-md font-extrabold'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-lime-500/50'
                      }`}
                    >
                      <div className="font-bold text-[11px] tracking-tight">{slot.label}</div>
                      <div className="text-[10px] opacity-75">{isBooked ? 'Booked' : 'Available'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Add-on Equipment Rentals */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block">
                3. Optional Equipment & Coaching Rental:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Pro Paddle</p>
                    <p className="text-[10px] text-slate-400">₱50 / unit</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPaddleQty(Math.max(0, paddleQty - 1))}
                      className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
                    >-</button>
                    <span className="text-xs font-mono font-bold text-lime-400">{paddleQty}</span>
                    <button
                      type="button"
                      onClick={() => setPaddleQty(paddleQty + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
                    >+</button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Balls (Pack of 3)</p>
                    <p className="text-[10px] text-slate-400">₱30 / pack</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setBallQty(Math.max(0, ballQty - 1))}
                      className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
                    >-</button>
                    <span className="text-xs font-mono font-bold text-lime-400">{ballQty}</span>
                    <button
                      type="button"
                      onClick={() => setBallQty(ballQty + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs"
                    >+</button>
                  </div>
                </div>

                <div 
                  onClick={() => setCoachAdded(!coachAdded)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                    coachAdded ? 'bg-lime-500/10 border-lime-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">Personal Coach</p>
                    <p className="text-[10px] text-slate-400">₱300 / hr</p>
                  </div>
                  <input type="checkbox" checked={coachAdded} onChange={() => {}} className="accent-lime-500" />
                </div>
              </div>
            </div>

            {/* 4. Customer Information Inputs */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-300 block">
                4. Customer Contact Details:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. juan@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                />
              </div>
            </div>

            {/* 5. Payment Option & Summary */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Payment Option:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GCash')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      paymentMethod === 'GCash' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >GCash QR</button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Pay at Court')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      paymentMethod === 'Pay at Court' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >Pay at Venue</button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Selected Slot & Total:</p>
                  <p className="text-[11px] text-lime-400 font-semibold">{selectedSlot.label}</p>
                </div>
                <div className="text-xl font-black text-lime-400 font-mono">
                  ₱{totalPrice}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm tracking-wider transition-all shadow-xl shadow-lime-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SAVING RESERVATION...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>CONFIRM & BOOK SLOT (₱{totalPrice})</span>
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
