'use client';

import React, { useState, useEffect } from 'react';
import { Booking, AdminSettings } from '@/lib/types';
import { getAllUserBookings, updateBookingStatus, getAdminSettings, updateAdminSettings } from '@/lib/supabase';
import { DEFAULT_ADMIN_SETTINGS } from '@/lib/data';
import { X, ShieldCheck, QrCode, Search, Calendar, User, Phone, CheckCircle2, Clock, Upload, Save, RefreshCw, AlertCircle, DollarSign } from 'lucide-react';

interface OwnerPortalModalProps {
  onClose: () => void;
}

export default function OwnerPortalModal({ onClose }: OwnerPortalModalProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'qrcode'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Settings state
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const loadData = async () => {
    setLoadingBookings(true);
    try {
      const data = await getAllUserBookings();
      setBookings(data);
      const adminSets = await getAdminSettings();
      setSettings(adminSets);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Booking['status'], payStatus?: Booking['payment_status']) => {
    await updateBookingStatus(id, newStatus, payStatus);
    loadData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateAdminSettings(settings);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customer_phone.includes(searchQuery) ||
      b.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.court_name && b.court_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDate = !filterDate || b.booking_date === filterDate;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 text-lime-400 flex items-center justify-center font-bold border border-lime-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Pickleball Owner & Admin Dashboard
              </h2>
              <p className="text-[11px] text-slate-400">BEST Inc. Balamban Court Reservations & QR Management</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 px-6 pt-3 border-b border-slate-800 flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-lime-500 text-lime-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Reservations List ("Kinsay Ning Book")</span>
            <span className="bg-lime-500/10 text-lime-400 px-2 py-0.5 rounded-full text-[10px] font-mono border border-lime-500/20">
              {bookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'qrcode'
                ? 'border-lime-500 text-lime-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Upload Payment QR Code (GCash / Maya)</span>
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-500"
                />
                {filterDate && (
                  <button onClick={() => setFilterDate('')} className="text-xs text-slate-400 hover:text-white">Clear</button>
                )}
                <button
                  onClick={loadData}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Refresh bookings list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bookings Data Table */}
            {loadingBookings ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading reservations...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-300">Walay nakit-an nga booking record.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Ref & Customer</th>
                      <th className="p-3">Court & Date</th>
                      <th className="p-3">Hourly Slot</th>
                      <th className="p-3">Amount & Payment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3">
                          <span className="font-mono font-bold text-lime-400 text-[11px] block">{b.reference_no}</span>
                          <strong className="text-white text-xs block">{b.customer_name}</strong>
                          <span className="text-[11px] text-slate-400">{b.customer_phone}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-white block">{b.court_name || 'Court'}</span>
                          <span className="text-slate-400 text-[11px]">{b.booking_date}</span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-lime-300">
                          {b.time_slot_label || `${b.start_time} - ${b.end_time}`}
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-black text-white block">₱{b.total_amount}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">{b.payment_method}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            b.status === 'Completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {b.status} ({b.payment_status || 'Paid'})
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {b.status === 'Confirmed' && (
                            <button
                              onClick={() => handleStatusChange(b.id, 'Completed', 'Paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[10px] transition"
                            >
                              Mark Completed
                            </button>
                          )}
                          {b.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleStatusChange(b.id, 'Cancelled')}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-[10px] transition"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Upload Payment QR Code */}
        {activeTab === 'qrcode' && (
          <form onSubmit={handleSaveSettings} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {saveSuccessMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 p-3.5 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Na-save na sa Admin Settings ang bag-ong Payment QR Code ug Details!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">GCash Account Details:</h3>
                  <p className="text-xs text-slate-400 mb-3">Mao kini ang ipakita sa customer inig booking aron maka scan-to-pay via GCash.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">GCash Account Number *</label>
                  <input
                    type="text"
                    required
                    value={settings.gcash_number}
                    onChange={(e) => setSettings({ ...settings, gcash_number: e.target.value })}
                    placeholder="e.g. 0917-888-9900"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">GCash Account Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.gcash_name}
                    onChange={(e) => setSettings({ ...settings, gcash_name: e.target.value })}
                    placeholder="e.g. BEST INC. BALAMBAN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">GCash QR Code Image URL *</label>
                  <input
                    type="text"
                    required
                    value={settings.qr_code_url}
                    onChange={(e) => setSettings({ ...settings, qr_code_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tip: I-upload ang imong GCash QR code image sa Imgur o Supabase Storage ug i-paste ang URL diri.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>SAVE QR CODE & PAYMENT DETAILS</span>
                  </button>
                </div>

              </div>

              {/* QR Code Live Preview */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Customer Scan-to-Pay Preview</span>
                </div>

                <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-xl border-4 border-lime-500 flex items-center justify-center">
                  <img
                    src={settings.qr_code_url}
                    alt="Payment QR Code Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN';
                    }}
                  />
                </div>

                <div>
                  <p className="text-xs font-mono font-bold text-lime-400">{settings.gcash_number}</p>
                  <p className="text-xs font-bold text-white">{settings.gcash_name}</p>
                </div>
              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}
