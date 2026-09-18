'use client';

import React, { useState, useEffect } from 'react';
import { Court, Booking, EquipmentRental, AdminSettings } from '@/lib/types';
import { HOURLY_SLOTS, HourlySlot, DEFAULT_ADMIN_SETTINGS, generateHourlySlots } from '@/lib/data';
import { getBookingsForDate, createBooking, getAdminSettings } from '@/lib/supabase';
import { X, Calendar, Clock, CheckCircle2, QrCode, Ticket, Loader2 } from 'lucide-react';

interface BookingModalProps {
  court: Court | null;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export default function BookingModal({ court, onClose, onBookingSuccess }: BookingModalProps) {
  if (!court) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [availableSlots, setAvailableSlots] = useState<HourlySlot[]>(HOURLY_SLOTS);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<HourlySlot>(HOURLY_SLOTS[0] || HOURLY_SLOTS[2]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya' | 'Landbank'>('GCash');
  const [notes, setNotes] = useState('');

  // Equipment add-ons
  const [paddleQty, setPaddleQty] = useState<number>(0);
  const [ballQty, setBallQty] = useState<number>(0);
  const [coachAdded, setCoachAdded] = useState<boolean>(false);

  // Confirmation view
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Load Admin Settings & Generate Dynamic Hourly Slots
  useEffect(() => {
    async function loadInitialData() {
      const sets = await getAdminSettings();
      setAdminSettings(sets);
      const generated = generateHourlySlots(sets.opening_hour || 6, sets.closing_hour || 22);
      setAvailableSlots(generated);
      if (generated.length > 0) setSelectedSlot(generated[0]);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const bookings = await getBookingsForDate(selectedDate);
        const slotsForThisCourt = bookings
          .filter(b => b.court_id === court?.id || (b.court_name && court?.name && b.court_name === court?.name))
          .flatMap(b => {
            const list: string[] = [];
            if (b.start_time) {
              list.push(b.start_time);
              list.push(b.start_time.substring(0, 5));
            }
            if (b.time_slot_label) {
              list.push(b.time_slot_label);
            }
            return list;
          });
        setBookedSlots(slotsForThisCourt);
        
        // Auto-select first available slot if taken
        if (slotsForThisCourt.includes(selectedSlot.startTime) || slotsForThisCourt.includes(selectedSlot.label)) {
          const firstAvail = availableSlots.find(s => !slotsForThisCourt.includes(s.startTime) && !slotsForThisCourt.includes(s.label));
          if (firstAvail) setSelectedSlot(firstAvail);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedDate, court, availableSlots]);

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
      payment_status: 'Paid',
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold border border-lime-300">
              <Ticket className="w-5 h-5 text-lime-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {confirmedBooking ? 'Booking Confirmed!' : `Reserve ${court.name}`}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Balamban Extensive Skills and Technology, Inc.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {confirmedBooking ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-300 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-lime-100 text-lime-800 font-mono font-bold text-xs border border-lime-300 mb-1">
                Ref: {confirmedBooking.reference_no}
              </span>
              <h3 className="text-xl font-black text-slate-900">Reservation Confirmed!</h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Salamat, <strong>{confirmedBooking.customer_name}</strong>! Na-book na ang {court.name}.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Court & Schedule:</span>
                <strong className="text-slate-900">{court.name} ({confirmedBooking.booking_date})</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Time Slot:</span>
                <span className="font-bold text-lime-800 font-mono">{confirmedBooking.time_slot_label}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-semibold text-slate-800">{confirmedBooking.payment_method} QR</span>
              </div>
              <div className="flex justify-between text-base font-black pt-1">
                <span className="text-slate-800">Total Amount:</span>
                <span className="text-lime-700">₱{confirmedBooking.total_amount}</span>
              </div>
            </div>

            {/* Admin QR Code Scan-to-Pay Container */}
            <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-2xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-blue-700 font-bold text-xs">
                <QrCode className="w-4 h-4" />
                <span>Scan QR Code to Pay via {confirmedBooking.payment_method}</span>
              </div>

              <div className="w-44 h-44 bg-white p-2.5 rounded-2xl mx-auto shadow-md border-2 border-lime-500 overflow-hidden">
                <img
                  src={
                    confirmedBooking.payment_method === 'Maya' ? (adminSettings.maya_qr_url || adminSettings.qr_code_url) :
                    confirmedBooking.payment_method === 'Landbank' ? (adminSettings.landbank_qr_url || adminSettings.qr_code_url) :
                    adminSettings.qr_code_url
                  }
                  alt={`Official ${confirmedBooking.payment_method} Payment QR Code`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-lime-700">
                  {confirmedBooking.payment_method === 'Maya' ? adminSettings.maya_number :
                   confirmedBooking.payment_method === 'Landbank' ? adminSettings.landbank_number :
                   adminSettings.gcash_number}
                </p>
                <p className="text-xs font-bold text-slate-900">
                  {confirmedBooking.payment_method === 'Maya' ? adminSettings.maya_name :
                   confirmedBooking.payment_method === 'Landbank' ? adminSettings.landbank_name :
                   adminSettings.gcash_name}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">Palihug i-send ang <strong>₱{confirmedBooking.total_amount}</strong> ug i-pakita ang Ref No. inig abot sa venue.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition shadow-md"
            >
              DONE & BACK TO HOMEPAGE
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* 1. Date Selector */}
            <div>
              <label className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-lime-600" />
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
                        ? 'bg-lime-500 text-slate-950 border-lime-600 font-extrabold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider opacity-80 font-bold">{item.dayName}</div>
                    <div className="text-base font-black">{item.dayNum}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Time Slot Selector (Per Hour) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-lime-600" />
                  2. Select Hourly Time Slot (Booked slots are disabled):
                </label>
                {loadingSlots && <span className="text-[11px] text-lime-700 flex items-center gap-1 font-bold"><Loader2 className="w-3 h-3 animate-spin" /> Checking slots...</span>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot.startTime) || bookedSlots.includes(`${slot.startTime}:00`) || bookedSlots.includes(slot.label);
                  const isSelected = selectedSlot.startTime === slot.startTime;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                        isBooked
                          ? 'bg-rose-50/80 border-rose-200 text-rose-500 line-through cursor-not-allowed font-medium opacity-60'
                          : isSelected
                          ? 'bg-lime-500 text-slate-950 border-lime-600 shadow-sm font-extrabold'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-lime-500'
                      }`}
                    >
                      <div className="font-extrabold text-[11px] tracking-tight">{slot.label}</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${
                        isBooked ? 'text-rose-600 font-extrabold' : isSelected ? 'text-slate-950 font-black' : 'text-emerald-700'
                      }`}>
                        {isBooked ? '❌ TAKEN / BOOKED' : '✅ AVAILABLE'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Add-on Equipment Rentals */}
            <div>
              <label className="text-xs font-bold text-slate-800 mb-2 block">
                3. Optional Equipment & Coaching Rental:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Pro Paddle</p>
                    <p className="text-[10px] text-slate-500">₱50 / unit</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPaddleQty(Math.max(0, paddleQty - 1))}
                      className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs"
                    >-</button>
                    <span className="text-xs font-mono font-bold text-lime-700">{paddleQty}</span>
                    <button
                      type="button"
                      onClick={() => setPaddleQty(paddleQty + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs"
                    >+</button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Balls (Pack of 3)</p>
                    <p className="text-[10px] text-slate-500">₱30 / pack</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setBallQty(Math.max(0, ballQty - 1))}
                      className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs"
                    >-</button>
                    <span className="text-xs font-mono font-bold text-lime-700">{ballQty}</span>
                    <button
                      type="button"
                      onClick={() => setBallQty(ballQty + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs"
                    >+</button>
                  </div>
                </div>

                <div 
                  onClick={() => setCoachAdded(!coachAdded)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                    coachAdded ? 'bg-lime-100 border-lime-400 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">Personal Coach</p>
                    <p className="text-[10px] text-slate-500">₱300 / hr</p>
                  </div>
                  <input type="checkbox" checked={coachAdded} onChange={() => {}} className="accent-lime-600" />
                </div>
              </div>
            </div>

            {/* 4. Customer Information Inputs */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-800 block">
                4. Customer Contact Details:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Dela Cruz"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. juan@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                />
              </div>
            </div>

            {/* 5. Payment Option & Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Select Scan-to-Pay QR:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GCash')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      paymentMethod === 'GCash' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >GCash QR</button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Maya')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      paymentMethod === 'Maya' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >Maya QR</button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Landbank')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      paymentMethod === 'Landbank' ? 'bg-teal-700 text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >Landbank QR</button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Selected Slot & Total:</p>
                  <p className="text-[11px] text-lime-700 font-extrabold">{selectedSlot.label}</p>
                </div>
                <div className="text-xl font-black text-lime-700 font-mono">
                  ₱{totalPrice}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-sm tracking-wider transition-all shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2"
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
