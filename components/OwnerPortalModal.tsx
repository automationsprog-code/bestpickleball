'use client';

import React, { useState, useEffect } from 'react';
import { Booking, AdminSettings, Court } from '@/lib/types';
import { getAllUserBookings, updateBookingStatus, getAdminSettings, updateAdminSettings, getCourts, createCourt, updateCourtStatus } from '@/lib/supabase';
import { DEFAULT_ADMIN_SETTINGS } from '@/lib/data';
import { X, ShieldCheck, QrCode, Search, User, CheckCircle2, Save, RefreshCw, AlertCircle, Lock, KeyRound, LogOut, Plus, Trophy, ToggleLeft, ToggleRight } from 'lucide-react';

interface OwnerPortalModalProps {
  onClose: () => void;
  onCourtsUpdated?: () => void;
}

export default function OwnerPortalModal({ onClose, onCourtsUpdated }: OwnerPortalModalProps) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Tab & Data states
  const [activeTab, setActiveTab] = useState<'bookings' | 'courts' | 'qrcode'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Add Court Form state
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtType, setNewCourtType] = useState<Court['type']>('Indoor Covered');
  const [newCourtRate, setNewCourtRate] = useState<number>(300);
  const [newCourtSurface, setNewCourtSurface] = useState('Tournament Acrylic Surface');
  const [newCourtDesc, setNewCourtDesc] = useState('');
  const [newCourtFeatures, setNewCourtFeatures] = useState('Covered Roof, LED Lighting, Net System');
  const [newCourtImageUrl, setNewCourtImageUrl] = useState('https://images.unsplash.com/photo-1599586120429-48281b6f0eca?auto=format&fit=crop&w=1200&q=80');
  const [creatingCourt, setCreatingCourt] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'bestadmin' && password.trim() === 'admin12345') {
      setIsAuthenticated(true);
      setLoginError(false);
      loadData();
    } else {
      setLoginError(true);
    }
  };

  const loadData = async () => {
    setLoadingBookings(true);
    try {
      const data = await getAllUserBookings();
      setBookings(data);
      const courtsData = await getCourts();
      setCourts(courtsData);
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

  const handleToggleCourtActive = async (courtId: string, currentActive: boolean) => {
    await updateCourtStatus(courtId, !currentActive);
    await loadData();
    if (onCourtsUpdated) onCourtsUpdated();
  };

  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName) {
      alert('Palihug ibutang ang Court Name.');
      return;
    }

    setCreatingCourt(true);
    try {
      const featuresArr = newCourtFeatures.split(',').map(f => f.trim()).filter(Boolean);
      await createCourt({
        name: newCourtName,
        type: newCourtType,
        hourly_rate: Number(newCourtRate),
        surface: newCourtSurface,
        description: newCourtDesc || `Premier ${newCourtType} court located at Balamban BEST Inc.`,
        features: featuresArr.length > 0 ? featuresArr : ['Covered Roof', 'LED Lighting'],
        image_url: newCourtImageUrl,
        is_active: true
      });

      setShowAddCourtModal(false);
      setNewCourtName('');
      await loadData();
      if (onCourtsUpdated) onCourtsUpdated();
      alert('Court created successfully!');
    } catch (err) {
      alert('Failed to create court.');
    } finally {
      setCreatingCourt(false);
    }
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center font-bold border border-lime-300">
              <ShieldCheck className="w-5 h-5 text-lime-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Pickleball Owner & Admin Portal
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">BEST Inc. Balamban Court Reservations, Courts & QR Management</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 px-2.5"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LOGIN FORM IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="p-8 sm:p-12 max-w-md mx-auto space-y-6 text-center">
            <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto text-lime-700 border border-lime-300 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Owner Portal Login</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Palihug ibutang ang Admin Username ug Password.</p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Sayop ang Username o Password! Sulayi pag-usab.</span>
              </div>
            )}

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Username *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. bestadmin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition shadow-md"
            >
              LOGIN TO OWNER PORTAL
            </button>
          </form>
        ) : (
          /* AUTHENTICATED DASHBOARD CONTENT */
          <>
            {/* Tab Navigation */}
            <div className="bg-slate-50 px-6 pt-3 border-b border-slate-200 flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                  activeTab === 'bookings'
                    ? 'border-lime-600 text-lime-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Reservations List ("Kinsay Ning Book")</span>
                <span className="bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border border-lime-300">
                  {bookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('courts')}
                className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                  activeTab === 'courts'
                    ? 'border-lime-600 text-lime-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Manage & Add Courts ({courts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('qrcode')}
                className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                  activeTab === 'qrcode'
                    ? 'border-lime-600 text-lime-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Upload Payment QR Code</span>
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                    />
                    {filterDate && (
                      <button onClick={() => setFilterDate('')} className="text-xs text-slate-500 hover:text-slate-900 font-bold">Clear</button>
                    )}
                    <button
                      onClick={loadData}
                      className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                      title="Refresh bookings list"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bookings Data Table */}
                {loadingBookings ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-medium">Loading reservations...</div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-800">Walay nakit-an nga booking record.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Ref & Customer</th>
                          <th className="p-3">Court & Date</th>
                          <th className="p-3">Hourly Slot</th>
                          <th className="p-3">Amount & Payment</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition">
                            <td className="p-3">
                              <span className="font-mono font-bold text-lime-800 text-[11px] block">{b.reference_no}</span>
                              <strong className="text-slate-900 text-xs block">{b.customer_name}</strong>
                              <span className="text-[11px] text-slate-500">{b.customer_phone}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{b.court_name || 'Court'}</span>
                              <span className="text-slate-500 text-[11px]">{b.booking_date}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-lime-800">
                              {b.time_slot_label || `${b.start_time} - ${b.end_time}`}
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-black text-slate-900 block">₱{b.total_amount}</span>
                              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200">{b.payment_method}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                b.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {b.status} ({b.payment_status || 'Paid'})
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {b.status === 'Confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(b.id, 'Completed', 'Paid')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-500 hover:text-white font-bold text-[10px] transition border border-emerald-300"
                                >
                                  Mark Completed
                                </button>
                              )}
                              {b.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleStatusChange(b.id, 'Cancelled')}
                                  className="px-2 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-500 hover:text-white font-bold text-[10px] transition border border-rose-300"
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

            {/* Tab 2: Manage & Add Courts */}
            {activeTab === 'courts' && (
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Balamban Courts List:</h3>
                    <p className="text-xs text-slate-500">Maka-add ka og bag-ong courts (e.g. Court 2, Court 3) para magamit ug ma-book sa mga customer sa future.</p>
                  </div>
                  <button
                    onClick={() => setShowAddCourtModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Court (e.g. Court 2)</span>
                  </button>
                </div>

                {/* Courts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.map((court) => (
                    <div key={court.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start justify-between space-x-3">
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] font-bold bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full border border-lime-300">
                          {court.type}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">{court.name}</h4>
                        <p className="text-xs text-lime-700 font-bold">₱{court.hourly_rate} / hour</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{court.description}</p>
                      </div>

                      <button
                        onClick={() => handleToggleCourtActive(court.id, court.is_active)}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                          court.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                        }`}
                        title="Toggle active status"
                      >
                        {court.is_active ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        <span>{court.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Court Modal Popup */}
                {showAddCourtModal && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleCreateCourt} className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="text-base font-black text-slate-900">Create New Pickleball Court</h4>
                        <button type="button" onClick={() => setShowAddCourtModal(false)} className="p-1 rounded-lg hover:bg-slate-200">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Court Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Court 2 - Outdoor Pro Court"
                          value={newCourtName}
                          onChange={(e) => setNewCourtName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">Court Type *</label>
                          <select
                            value={newCourtType}
                            onChange={(e) => setNewCourtType(e.target.value as Court['type'])}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                          >
                            <option value="Indoor Covered">Indoor Covered</option>
                            <option value="Outdoor Pro">Outdoor Pro</option>
                            <option value="VIP Covered">VIP Covered</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">Hourly Rate (₱) *</label>
                          <input
                            type="number"
                            required
                            min={50}
                            value={newCourtRate}
                            onChange={(e) => setNewCourtRate(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Surface Type</label>
                        <input
                          type="text"
                          value={newCourtSurface}
                          onChange={(e) => setNewCourtSurface(e.target.value)}
                          placeholder="e.g. Pro-Grid Acrylic Surface"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Court Image URL</label>
                        <input
                          type="text"
                          value={newCourtImageUrl}
                          onChange={(e) => setNewCourtImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>

                      <div className="pt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddCourtModal(false)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingCourt}
                          className="px-5 py-2 bg-lime-500 hover:bg-lime-600 rounded-xl text-xs font-black text-slate-950 shadow-md"
                        >
                          {creatingCourt ? 'Creating...' : 'Save & Create Court'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Upload Payment QR Code */}
            {activeTab === 'qrcode' && (
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {saveSuccessMsg && (
                  <div className="bg-emerald-100 border border-emerald-300 p-3.5 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Na-save na sa Admin Settings ang bag-ong Payment QR Code ug Details!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">GCash Account Details:</h3>
                      <p className="text-xs text-slate-500 mb-3 font-medium">Mao kini ang ipakita sa customer inig booking aron maka scan-to-pay via GCash.</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">GCash Account Number *</label>
                      <input
                        type="text"
                        required
                        value={settings.gcash_number}
                        onChange={(e) => setSettings({ ...settings, gcash_number: e.target.value })}
                        placeholder="e.g. 0917-888-9900"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">GCash Account Name *</label>
                      <input
                        type="text"
                        required
                        value={settings.gcash_name}
                        onChange={(e) => setSettings({ ...settings, gcash_name: e.target.value })}
                        placeholder="e.g. BEST INC. BALAMBAN"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">GCash QR Code Image URL *</label>
                      <input
                        type="text"
                        required
                        value={settings.qr_code_url}
                        onChange={(e) => setSettings({ ...settings, qr_code_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        Tip: I-upload ang imong GCash QR code image sa Imgur o Supabase Storage ug i-paste ang URL diri.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>SAVE QR CODE & PAYMENT DETAILS</span>
                      </button>
                    </div>

                  </div>

                  {/* QR Code Live Preview */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-300">
                      <QrCode className="w-3.5 h-3.5 text-blue-700" />
                      <span>Customer Scan-to-Pay Preview</span>
                    </div>

                    <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-md border-4 border-lime-500 flex items-center justify-center">
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
                      <p className="text-xs font-mono font-bold text-lime-800">{settings.gcash_number}</p>
                      <p className="text-xs font-bold text-slate-900">{settings.gcash_name}</p>
                    </div>
                  </div>

                </div>

              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
