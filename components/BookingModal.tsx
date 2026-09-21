'use client';

import React, { useState, useEffect } from 'react';
import { Court, Booking, EquipmentRental, AdminSettings } from '@/lib/types';
import { HOURLY_SLOTS, HourlySlot, DEFAULT_ADMIN_SETTINGS, generateHourlySlots, formatSelectedSlotsLabel, isSlotTakenByBooking } from '@/lib/data';
import { getBookingsForDate, createBooking, getAdminSettings } from '@/lib/supabase';
import { X, Calendar, Clock, CheckCircle2, QrCode, Ticket, Loader2, Upload, AlertCircle, Maximize2 } from 'lucide-react';

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
  const [selectedSlots, setSelectedSlots] = useState<HourlySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya' | 'Landbank'>('GCash');
  const [notes, setNotes] = useState('');

  // Equipment rental state
  const [paddleQty, setPaddleQty] = useState(0);
  const [ballQty, setBallQty] = useState(0);
  const [coachAdded, setCoachAdded] = useState(false);

  // Receipt image upload
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [paymentRefNoInput, setPaymentRefNoInput] = useState<string>('');

  // Confirmation view
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Load Admin Settings & Generate Dynamic Hourly Slots
  useEffect(() => {
    async function loadInitialData() {
      const sets = await getAdminSettings();
      setAdminSettings(sets);
      const generated = generateHourlySlots(sets.opening_hour || 6, sets.closing_hour || 22);
      setAvailableSlots(generated);
      // Leave empty initially so booker must pick their own slot
      setSelectedSlots([]);
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const bookings = await getBookingsForDate(selectedDate);
        const bookedSlotsList: string[] = [];

        availableSlots.forEach(slot => {
          const isTaken = bookings.some(b => isSlotTakenByBooking(slot, b, court?.id, court?.name));

          if (isTaken) {
            bookedSlotsList.push(slot.startTime);
          }
        });

        setBookedSlots(bookedSlotsList);
        
        // Remove any booked slots from user selection
        setSelectedSlots(prev => prev.filter(s => !bookedSlotsList.includes(s.startTime)));
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

  // Toggle multi-selection slot
  const handleToggleSlot = (slot: HourlySlot) => {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.id === slot.id);
      if (exists) {
        return prev.filter(s => s.id !== slot.id);
      } else {
        return [...prev, slot];
      }
    });
  };

  // Sort selected slots chronologically
  const sortedSelectedSlots = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const selectedSlotsCount = sortedSelectedSlots.length;

  // Formatted multi-slot label (formats continuous slots as "7:00 PM - 10:00 PM (3 Hours)")
  const selectedSlotsFormattedLabel = formatSelectedSlotsLabel(sortedSelectedSlots);

  // Calculate pricing with multi-slot multiplier
  const courtPrice = court.hourly_rate * selectedSlotsCount;
  const paddlePrice = paddleQty * 50;
  const ballPrice = ballQty * 30;
  const coachPrice = coachAdded ? 300 : 0;
  const totalPrice = courtPrice + paddlePrice + ballPrice + coachPrice;

  // Compress uploaded receipt proof image to lightweight JPEG Data URL (~80-120KB)
  const handleProofImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPaymentProofUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const sanitizeInput = (str: string): string => {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = sanitizeInput(customerName);
    const cleanPhone = sanitizeInput(customerPhone);
    const cleanEmail = sanitizeInput(customerEmail);
    const cleanRefInput = sanitizeInput(paymentRefNoInput);
    const cleanNotes = sanitizeInput(notes);

    if (!cleanName || !cleanPhone) {
      alert('Palihug ibutang ang imong Pangalan ug Phone Number.');
      return;
    }

    if (sortedSelectedSlots.length === 0) {
      alert('Palihug pagpili og bisan unsang time slot.');
      return;
    }

    if (!paymentProofUrl) {
      alert('Payment First Policy: Palihug i-scan ang QR Code ug i-upload ang screenshot/photo sa imong Payment Receipt sa dili pa i-confirm ang booking.');
      return;
    }

    setSubmitting(true);

    try {
      // Re-verify if any selected slot is already taken in DB
      const freshBookings = await getBookingsForDate(selectedDate);
      const takenSlot = sortedSelectedSlots.find(slot => {
        return freshBookings.some(b => isSlotTakenByBooking(slot, b, court.id, court.name));
      });

      if (takenSlot) {
        alert(`Dili na pwede i-book kining orasa! Naa na'y nag-book sa ${takenSlot.label}. Palihug sa pagpili og laing oras.`);
        setBookedSlots(prev => Array.from(new Set([...prev, takenSlot.startTime])));
        setSubmitting(false);
        return;
      }

      const rentals: EquipmentRental[] = [];
      if (paddleQty > 0) rentals.push({ id: 'pad', name: 'Pickleball Paddle', price: 50, quantity: paddleQty });
      if (ballQty > 0) rentals.push({ id: 'ball', name: 'Franklin X-40 Balls', price: 30, quantity: ballQty });
      if (coachAdded) rentals.push({ id: 'coach', name: 'Personal Coach', price: 300, quantity: 1 });

      const refNo = `BEST-PKL-${Math.floor(1000 + Math.random() * 9000)}`;

      const mainBookingData: Omit<Booking, 'id' | 'created_at'> = {
        reference_no: refNo,
        court_id: court.id,
        court_name: court.name,
        customer_name: cleanName,
        customer_email: cleanEmail || 'customer@balamban.ph',
        customer_phone: cleanPhone,
        booking_date: selectedDate,
        time_slot_label: selectedSlotsFormattedLabel,
        start_time: sortedSelectedSlots[0].startTime,
        end_time: sortedSelectedSlots[sortedSelectedSlots.length - 1].endTime,
        total_amount: totalPrice,
        equipment_rentals: rentals,
        payment_method: paymentMethod,
        payment_status: 'Paid',
        status: 'Confirmed',
        payment_proof_url: paymentProofUrl,
        payment_ref_no: cleanRefInput,
        notes: cleanNotes || `Multi-slot reservation (${sortedSelectedSlots.length} hrs)`
      };

      // Create single main booking record
      const created = await createBooking(mainBookingData);

      setConfirmedBooking(created);
      onBookingSuccess(created);
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('May problema sa pag-save sa reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeQrUrl = 
    paymentMethod === 'Maya' ? (adminSettings.maya_qr_url || adminSettings.qr_code_url) :
    paymentMethod === 'Landbank' ? (adminSettings.landbank_qr_url || adminSettings.qr_code_url) :
    adminSettings.qr_code_url;

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
            className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
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
                <span className="text-slate-500 font-medium">Time Slot(s):</span>
                <span className="font-bold text-lime-800 font-mono text-right">{confirmedBooking.time_slot_label}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-semibold text-slate-800">{confirmedBooking.payment_method} QR</span>
              </div>
              <div className="flex justify-between text-base font-black pt-1">
                <span className="text-slate-800">Total Amount Paid:</span>
                <span className="text-lime-700">₱{confirmedBooking.total_amount}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-2 text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Na-received na ang imong payment receipt proof. Daghang salamat!</span>
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
                <span>1. Select Reservation Date:</span>
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

            {/* 2. Time Slot Selector (Multi-Selection Supported!) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-lime-600" />
                  <span>2. Select Time Slot (Multi-Selection Allowed):</span>
                </label>
                {loadingSlots && <span className="text-[11px] text-lime-700 flex items-center gap-1 font-bold"><Loader2 className="w-3 h-3 animate-spin" /> Checking slots...</span>}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mb-2.5">
                💡 Pinduta ang 1 o labaw pa nga oras aron maka-book og sunod-sunod nga mga slot (e.g. 3-4 PM, 4-5 PM, 5-6 PM).
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot.startTime);
                  const isSelected = selectedSlots.some(s => s.id === slot.id);

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleToggleSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                        isBooked
                          ? 'bg-rose-50/80 border-rose-200 text-rose-500 line-through cursor-not-allowed font-medium opacity-60'
                          : isSelected
                          ? 'bg-lime-500 text-slate-950 border-lime-600 shadow-sm font-extrabold ring-2 ring-lime-400'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-lime-500'
                      }`}
                    >
                      <div className="font-extrabold text-[11px] tracking-tight">{slot.label}</div>
                      <div className={`text-[10px] font-bold mt-0.5 ${
                        isBooked ? 'text-rose-600 font-extrabold' : isSelected ? 'text-slate-950 font-black' : 'text-emerald-700'
                      }`}>
                        {isBooked ? '❌ TAKEN / BOOKED' : isSelected ? '✓ SELECTED' : '✅ AVAILABLE'}
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

            {/* 5. Payment First Policy, Large QR Code & Proof Upload */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-4">
              
              {/* Payment First Notice Badge */}
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl text-xs text-amber-900 font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>PAYMENT FIRST POLICY: Palihug i-scan ang QR code sa ubos, bayri ang ₱{totalPrice}, ug i-upload ang screenshot sa Payment Receipt sa dili pa i-confirm ang slot.</span>
              </div>

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

              {/* Large Display selected QR Code image */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Scan QR Code to Pay ₱{totalPrice} via {paymentMethod}:
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="text-[11px] font-bold text-lime-800 bg-lime-100 hover:bg-lime-200 px-2.5 py-1 rounded-lg border border-lime-300 transition flex items-center gap-1"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Enlarge QR</span>
                  </button>
                </div>

                <div 
                  onClick={() => setShowQrModal(true)}
                  className="w-full max-w-[280px] sm:max-w-[320px] aspect-square bg-white p-3 rounded-2xl mx-auto shadow-md border-4 border-lime-500 overflow-hidden cursor-pointer hover:scale-102 transition flex items-center justify-center relative group"
                >
                  <img
                    src={activeQrUrl}
                    alt={`Official ${paymentMethod} Payment QR Code`}
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 rounded-xl backdrop-blur-[1px]">
                    <Maximize2 className="w-4 h-4" />
                    <span>Click to View Full Screen QR</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="text-xs text-lime-800 font-extrabold bg-lime-100 hover:bg-lime-200 border border-lime-300 px-3.5 py-1.5 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>🔍 TAP / CLICK TO ENLARGE QR CODE</span>
                </button>
              </div>

              {/* Payment Proof File Upload (Required for Payment First Policy) */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-900 block flex items-center gap-1">
                  <span>Upload Payment Receipt / Proof Screenshot</span>
                  <span className="text-rose-600 font-black">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  {paymentProofUrl && (
                    <img src={paymentProofUrl} alt="Receipt Proof" className="w-16 h-16 rounded-xl object-cover border-2 border-lime-500 shadow-sm shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 text-xs font-black cursor-pointer transition shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>{paymentProofUrl ? '✓ Receipt Attached (Change)' : 'Upload Payment Screenshot *'}</span>
                      <input type="file" accept="image/*" onChange={handleProofImageUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">I-upload ang imong GCash/Maya/Bank screenshot sa bayad.</p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">Transaction Ref No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1029384756"
                    value={paymentRefNoInput}
                    onChange={(e) => setPaymentRefNoInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <div className="pr-2">
                  <p className="text-xs font-bold text-slate-900">Selected Slot(s) ({selectedSlotsCount} hr{selectedSlotsCount > 1 ? 's' : ''}):</p>
                  <p className="text-[11px] text-lime-700 font-extrabold">{selectedSlotsFormattedLabel}</p>
                </div>
                <div className="text-xl font-black text-lime-700 font-mono shrink-0">
                  ₱{totalPrice}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                paymentProofUrl
                  ? 'bg-lime-500 hover:bg-lime-600 text-slate-950 shadow-lime-500/20'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SAVING RESERVATION...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {paymentProofUrl ? `CONFIRM & BOOK SLOT (₱${totalPrice})` : `PAY & UPLOAD RECEIPT TO BOOK (₱${totalPrice})`}
                  </span>
                </>
              )}
            </button>

          </form>
        )}

        {/* Lightbox Modal for Large High-Res QR Code Preview */}
        {showQrModal && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-lime-400 font-black text-sm">
                  <QrCode className="w-5 h-5" />
                  <span>Official {paymentMethod} Scan-to-Pay QR</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-3xl border-4 border-lime-500 w-full max-w-[340px] aspect-square flex items-center justify-center shadow-2xl">
                <img
                  src={activeQrUrl}
                  alt="High Res QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="text-slate-300 text-xs font-semibold space-y-1">
                <p className="font-bold text-white text-sm">Total Amount to Pay: ₱{totalPrice}</p>
                <p className="text-[11px] text-slate-400">Pahinumdom: screenshot kini nga dako nga QR code para dali ra ma-scan sa Maya, GCash, o Bank App gallery upload.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition shadow-md"
              >
                DONE / CLOSE QR
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
