'use client';

import React, { useState, useEffect } from 'react';
import { Booking, AdminSettings, Court } from '@/lib/types';
import { getAllUserBookings, updateBookingStatus, deleteBooking, getAdminSettings, updateAdminSettings, getCourts, createCourt, updateCourtDetails, updateCourtStatus, deleteCourt } from '@/lib/supabase';
import { DEFAULT_ADMIN_SETTINGS, formatDisplayTimeSlot } from '@/lib/data';
import { X, ShieldCheck, QrCode, Search, User, CheckCircle2, Save, RefreshCw, AlertCircle, Lock, KeyRound, LogOut, Plus, Trophy, ToggleLeft, ToggleRight, Edit3, DollarSign, Image as ImageIcon, Upload, Trash2, Clock, Globe, Sparkles, Phone, Zap, Loader2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'bookings' | 'courts' | 'qrcode' | 'content'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  // Add Court Form state
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtType, setNewCourtType] = useState<Court['type']>('Indoor Covered');
  const [newCourtRate, setNewCourtRate] = useState<number>(350);
  const [newCourtSurface, setNewCourtSurface] = useState('Tournament Acrylic Surface');
  const [newCourtDesc, setNewCourtDesc] = useState('');
  const [newCourtFeatures, setNewCourtFeatures] = useState('Covered Roof, LED Lighting, Net System');
  const [newCourtImageUrl, setNewCourtImageUrl] = useState('https://images.unsplash.com/photo-1599586120429-48281b6f0eca?auto=format&fit=crop&w=1200&q=80');
  const [creatingCourt, setCreatingCourt] = useState(false);

  // Edit Court / Rate / Image state
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [editRate, setEditRate] = useState<number>(350);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Court['type']>('Indoor Covered');
  const [editSurface, setEditSurface] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editFeatures, setEditFeatures] = useState('Covered Roof, LED Lighting, Net System');
  const [savingEdit, setSavingEdit] = useState(false);

  // Settings state (QR Code Upload & Operating Hours)
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(false);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setLoginError(false);
        loadData();
      } else {
        setLoginError(true);
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setLoginError(true);
    } finally {
      setLoggingIn(false);
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

  const handleDeleteBooking = async (idOrRef: string) => {
    if (confirm('Sigurado ka nga gusto nimo i-DELETE kini nga booking record?')) {
      setBookings(prev => prev.filter(b => b.id !== idOrRef && b.reference_no !== idOrRef));
      await deleteBooking(idOrRef);
      loadData();
    }
  };

  // Immediate Optimistic Delete Court Handler
  const handleDeleteCourt = async (courtId: string, courtName: string) => {
    if (confirm(`Sigurado ka nga gusto nimo i-DELETE ang "${courtName}"?`)) {
      // 1. Optimistically remove court from UI immediately
      setCourts(prev => prev.filter(c => c.id !== courtId));

      // 2. Perform deletion in Supabase & localStorage
      await deleteCourt(courtId);

      // 3. Sync with parent homepage
      if (onCourtsUpdated) onCourtsUpdated();
    }
  };

  // Immediate Optimistic Active / Inactive Toggle
  const handleToggleCourtActive = async (courtId: string, currentActive: boolean) => {
    const nextActiveState = !currentActive;
    
    // 1. Optimistically update local courts state immediately
    setCourts(prev => prev.map(c => c.id === courtId ? { ...c, is_active: nextActiveState } : c));

    // 2. Persist to Supabase and localStorage
    await updateCourtStatus(courtId, nextActiveState);
    
    // 3. Notify parent homepage to update booking courts list
    if (onCourtsUpdated) onCourtsUpdated();
  };

  // Open Edit Modal
  const openEditModal = (court: Court) => {
    setEditingCourt(court);
    setEditRate(court.hourly_rate);
    setEditName(court.name);
    setEditType(court.type);
    setEditSurface(court.surface || '');
    setEditDesc(court.description || '');
    setEditImageUrl(court.image_url || '');
    setEditFeatures(
      court.features && Array.isArray(court.features) && court.features.length > 0
        ? court.features.join(', ')
        : 'Covered Roof, LED Lighting, Net System'
    );
  };

  // Compress uploaded images via HTML5 Canvas to lightweight ~80-120KB JPEGs
  const compressImageFile = (file: File, maxWidth = 1000, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle Uploading Court Image File
  const handleCourtImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setEditImageUrl(compressed);
      } catch (err) {
        console.error('Failed to compress court image:', err);
      }
    }
  };

  // Handle Uploading New Court Image File
  const handleNewCourtImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setNewCourtImageUrl(compressed);
      } catch (err) {
        console.error('Failed to compress court image:', err);
      }
    }
  };

  // Handle Uploading GCash QR Image File
  const handleGCashQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSettings(prev => ({ ...prev, qr_code_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Uploading Maya QR Image File
  const handleMayaQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSettings(prev => ({ ...prev, maya_qr_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Uploading Landbank QR Image File
  const handleLandbankQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSettings(prev => ({ ...prev, landbank_qr_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCourtEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;

    setSavingEdit(true);
    try {
      const featuresArr = editFeatures.split(',').map(f => f.trim()).filter(Boolean);
      await updateCourtDetails(editingCourt.id, {
        name: editName,
        type: editType,
        surface: editSurface,
        hourly_rate: Number(editRate),
        description: editDesc,
        image_url: editImageUrl,
        features: featuresArr
      });
      setEditingCourt(null);
      await loadData();
      if (onCourtsUpdated) onCourtsUpdated();
      alert('Na-update na ang Court info, price ug picture!');
    } catch (err) {
      alert('Failed to update court details.');
    } finally {
      setSavingEdit(false);
    }
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
      alert('New Court created successfully!');
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
      if (onCourtsUpdated) onCourtsUpdated();
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
              <p className="text-[11px] text-slate-500 font-medium">BEST Inc. Balamban Court Reservations, Rates & QR Management</p>
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
                    placeholder="Enter username"
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
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-slate-950 font-black text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2"
            >
              {loggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VERIFYING CREDENTIALS...</span>
                </>
              ) : (
                'LOGIN TO OWNER PORTAL'
              )}
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
                <DollarSign className="w-4 h-4" />
                <span>Edit Info, Price & Delete Courts ({courts.length})</span>
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
                <span>Payment QR & Time Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
                  activeTab === 'content'
                    ? 'border-lime-600 text-lime-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 text-lime-600" />
                <span>Edit Website Text & Content</span>
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
                              {formatDisplayTimeSlot(b.time_slot_label, b.start_time, b.end_time)}
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-black text-slate-900 block">₱{b.total_amount}</span>
                              <div className="flex flex-col items-start gap-1 mt-0.5">
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200">{b.payment_method}</span>
                                {b.payment_ref_no && (
                                  <span className="text-[10px] text-slate-500 font-mono">Ref: {b.payment_ref_no}</span>
                                )}
                                {b.payment_proof_url ? (
                                  <button
                                    onClick={() => setSelectedProofImage(b.payment_proof_url!)}
                                    className="text-[10px] bg-lime-500 hover:bg-lime-600 text-slate-950 border border-lime-600 px-2 py-1 rounded-lg font-black flex items-center gap-1 transition mt-1 shadow-xs"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5 text-slate-950" />
                                    <span>View Payment Receipt</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic block mt-0.5">No receipt uploaded</span>
                                )}
                              </div>
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
                                  className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white font-bold text-[10px] transition border border-amber-300"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBooking(b.id || b.reference_no)}
                                className="px-2 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-[10px] transition border border-rose-700 shadow-xs"
                                title="Delete this booking record permanently"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

            {/* Tab 2: Manage & Add Courts / Edit Info & Price / Delete Court */}
            {activeTab === 'courts' && (
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Courts, Photos & Pricing Management:</h3>
                    <p className="text-xs text-slate-500 font-medium">Maka-edit ka sa Info/Price/Photo sa Court 1, o maka-delete o maka-add ug Court 2.</p>
                  </div>
                  <button
                    onClick={() => setShowAddCourtModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Court</span>
                  </button>
                </div>

                {/* Courts Grid with Delete & Edit Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.map((court) => (
                    <div key={court.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={court.image_url}
                            alt={court.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                          />
                          <div>
                            <span className="text-[10px] font-bold bg-lime-100 text-lime-800 px-2 py-0.5 rounded-full border border-lime-300">
                              {court.type}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">{court.name}</h4>
                          </div>
                        </div>

                        <span className="text-base font-black text-lime-800 font-mono bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                          ₱{court.hourly_rate} <span className="text-[10px] font-normal text-slate-500">/ hr</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 font-medium">{court.description}</p>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(court)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-lime-600 text-white hover:text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Info & Price</span>
                          </button>

                          {/* Delete Court Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCourt(court.id, court.name)}
                            className="p-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition border border-rose-300 flex items-center gap-1 font-bold text-xs shadow-xs cursor-pointer"
                            title="Delete this Court permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {/* Active / Inactive Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleCourtActive(court.id, court.is_active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
                            court.is_active 
                              ? 'bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600' 
                              : 'bg-rose-500 text-white border border-rose-600 hover:bg-rose-600'
                          }`}
                          title="Click to switch between Active and Inactive"
                        >
                          {court.is_active ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-lime-200" />
                              <span>🟢 Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-rose-200" />
                              <span>🔴 Inactive</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Price & Picture Modal Popup */}
                {editingCourt && (
                  <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleSaveCourtEdit} className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                          <Edit3 className="w-5 h-5 text-lime-600" />
                          <span>Edit Court Details, Price & Picture</span>
                        </h4>
                        <button type="button" onClick={() => setEditingCourt(null)} className="p-1 rounded-lg hover:bg-slate-200">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Court Name *</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">Price Per Hour (₱) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₱</span>
                            <input
                              type="number"
                              required
                              min={50}
                              value={editRate}
                              onChange={(e) => setEditRate(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">Court Type</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as Court['type'])}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                          >
                            <option value="Indoor Covered">Indoor Covered</option>
                            <option value="Outdoor Pro">Outdoor Pro</option>
                            <option value="VIP Covered">VIP Covered</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Surface Type</label>
                        <input
                          type="text"
                          value={editSurface}
                          onChange={(e) => setEditSurface(e.target.value)}
                          placeholder="e.g. Tournament Cushioned Acrylic"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                        />
                      </div>

                      {/* Court Features & Badges Editor */}
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Court Features & Badges (Active Badges)
                        </label>
                        <input
                          type="text"
                          value={editFeatures}
                          onChange={(e) => setEditFeatures(e.target.value)}
                          placeholder="Covered Roof, LED Lighting, Net System"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                        />
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                          I-type ang features (comma separated) o i-click ang quick badge buttons sa ubos para ma-Active/Inactive:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {['Covered Roof', 'LED Lighting', 'Net System', 'Pro Acrylic Surface', 'Night Floodlights', 'Air Conditioned', 'Bleachers', 'Paddle Rental'].map((tag) => {
                            const currentList = editFeatures.split(',').map(f => f.trim()).filter(Boolean);
                            const isPresent = currentList.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isPresent) {
                                    const newList = currentList.filter(f => f !== tag);
                                    setEditFeatures(newList.join(', '));
                                  } else {
                                    const newList = [...currentList, tag];
                                    setEditFeatures(newList.join(', '));
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  isPresent
                                    ? 'bg-lime-500 text-slate-950 border-lime-600 shadow-xs'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {isPresent ? `✓ ${tag} (ACTIVE)` : `+ ${tag}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Photo Uploader */}
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Upload / Change Court Picture *</label>
                        <div className="flex items-center space-x-3 mb-2">
                          {editImageUrl && (
                            <img src={editImageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-slate-300 shadow-xs" />
                          )}
                          <div className="flex-1 space-y-2">
                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold cursor-pointer transition text-slate-800">
                              <Upload className="w-4 h-4 text-lime-600" />
                              <span>Choose Photo File...</span>
                              <input type="file" accept="image/*" onChange={handleCourtImageFileUpload} className="hidden" />
                            </label>
                            <p className="text-[10px] text-slate-500 font-medium">O i-paste ang Image URL sa ubos:</p>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                        />
                      </div>

                      <div className="pt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingCourt(null)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingEdit}
                          className="px-5 py-2 bg-lime-500 hover:bg-lime-600 rounded-xl text-xs font-black text-slate-950 shadow-md"
                        >
                          {savingEdit ? 'Saving...' : 'Save Court Details'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

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
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Court Features & Badges (Comma-separated)
                        </label>
                        <input
                          type="text"
                          value={newCourtFeatures}
                          onChange={(e) => setNewCourtFeatures(e.target.value)}
                          placeholder="Covered Roof, LED Lighting, Net System"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {['Covered Roof', 'LED Lighting', 'Net System', 'Pro Acrylic Surface', 'Night Floodlights', 'Air Conditioned', 'Bleachers', 'Paddle Rental'].map((tag) => {
                            const currentList = newCourtFeatures.split(',').map(f => f.trim()).filter(Boolean);
                            const isPresent = currentList.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isPresent) {
                                    const newList = currentList.filter(f => f !== tag);
                                    setNewCourtFeatures(newList.join(', '));
                                  } else {
                                    const newList = [...currentList, tag];
                                    setNewCourtFeatures(newList.join(', '));
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  isPresent
                                    ? 'bg-lime-500 text-slate-950 border-lime-600 shadow-xs'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                              >
                                {isPresent ? `✓ ${tag} (ACTIVE)` : `+ ${tag}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Upload Court Picture</label>
                        <div className="flex items-center space-x-2 mb-2">
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold cursor-pointer transition text-slate-800">
                            <Upload className="w-4 h-4 text-lime-600" />
                            <span>Select Photo File...</span>
                            <input type="file" accept="image/*" onChange={handleNewCourtImageFileUpload} className="hidden" />
                          </label>
                        </div>
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

            {/* Tab 3: Upload Payment QR Code & Operating Hours */}
            {activeTab === 'qrcode' && (
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {saveSuccessMsg && (
                  <div className="bg-emerald-100 border border-emerald-300 p-3.5 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Na-save na sa Admin Settings ang Payment QR Code ug Operating Hours!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">GCash, Maya & Landbank QR Details:</h3>
                      <p className="text-xs text-slate-500 mb-3 font-medium">Configure GCash, Maya, and Landbank QR codes and operating hours schedule.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Opening Hour (AM) *</label>
                        <select
                          value={settings.opening_hour || 6}
                          onChange={(e) => setSettings({ ...settings, opening_hour: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                        >
                          <option value={5}>5:00 AM</option>
                          <option value={6}>6:00 AM</option>
                          <option value={7}>7:00 AM</option>
                          <option value={8}>8:00 AM</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Closing Hour (PM/AM) *</label>
                        <select
                          value={settings.closing_hour || 24}
                          onChange={(e) => setSettings({ ...settings, closing_hour: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                        >
                          <option value={20}>8:00 PM</option>
                          <option value={21}>9:00 PM</option>
                          <option value={22}>10:00 PM</option>
                          <option value={23}>11:00 PM</option>
                          <option value={24}>12:00 Midnight</option>
                          <option value={25}>1:00 AM (Next Day)</option>
                          <option value={26}>2:00 AM (Next Day)</option>
                        </select>
                      </div>
                    </div>

                    {/* GCash Settings */}
                    <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-blue-600" />
                          <span>GCash Scan-to-Pay QR Code</span>
                        </p>
                        {settings.qr_code_url && (
                          <img src={settings.qr_code_url} alt="GCash QR" className="w-10 h-10 object-contain border border-blue-300 bg-white rounded-lg p-0.5" />
                        )}
                      </div>
                      
                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-blue-100 border border-blue-300 text-xs font-bold text-blue-900 cursor-pointer transition shadow-xs">
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span>Upload GCash QR Image...</span>
                        <input type="file" accept="image/*" onChange={handleGCashQRUpload} className="hidden" />
                      </label>
                    </div>

                    {/* Maya Settings */}
                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>Maya Scan-to-Pay QR Code</span>
                        </p>
                        {settings.maya_qr_url && (
                          <img src={settings.maya_qr_url} alt="Maya QR" className="w-10 h-10 object-contain border border-emerald-300 bg-white rounded-lg p-0.5" />
                        )}
                      </div>

                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-900 cursor-pointer transition shadow-xs">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Upload Maya QR Image...</span>
                        <input type="file" accept="image/*" onChange={handleMayaQRUpload} className="hidden" />
                      </label>
                    </div>

                    {/* Landbank Settings */}
                    <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-teal-600" />
                          <span>Landbank Scan-to-Pay QR Code</span>
                        </p>
                        {settings.landbank_qr_url && (
                          <img src={settings.landbank_qr_url} alt="Landbank QR" className="w-10 h-10 object-contain border border-teal-300 bg-white rounded-lg p-0.5" />
                        )}
                      </div>

                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-teal-100 border border-teal-300 text-xs font-bold text-teal-900 cursor-pointer transition shadow-xs">
                        <Upload className="w-4 h-4 text-teal-600" />
                        <span>Upload Landbank QR Image...</span>
                        <input type="file" accept="image/*" onChange={handleLandbankQRUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>SAVE QR CODE & TIME SETTINGS</span>
                      </button>
                    </div>

                  </div>

                  {/* QR Code Live Preview Side Panel */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-lime-100 text-lime-800 rounded-full text-xs font-bold border border-lime-300">
                      <QrCode className="w-3.5 h-3.5 text-lime-700" />
                      <span>Customer Payment QR Previews</span>
                    </div>

                    <div className="space-y-4">
                      {/* GCash Preview */}
                      <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-xs flex flex-col items-center">
                        <span className="text-[11px] font-black text-blue-900 mb-2">GCash QR Code</span>
                        <div className="w-36 h-36 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={settings.qr_code_url}
                            alt="GCash QR Code Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=GCASH_BALAMBAN';
                            }}
                          />
                        </div>
                      </div>

                      {/* Maya Preview */}
                      <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs flex flex-col items-center">
                        <span className="text-[11px] font-black text-emerald-900 mb-2">Maya QR Code</span>
                        <div className="w-36 h-36 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={settings.maya_qr_url}
                            alt="Maya QR Code Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MAYA_BALAMBAN';
                            }}
                          />
                        </div>
                      </div>

                      {/* Landbank Preview */}
                      <div className="bg-white p-3 rounded-2xl border border-teal-200 shadow-xs flex flex-col items-center">
                        <span className="text-[11px] font-black text-teal-900 mb-2">Landbank QR Code</span>
                        <div className="w-36 h-36 bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={settings.landbank_qr_url}
                            alt="Landbank QR Code Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LANDBANK_BALAMBAN';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </form>
            )}

            {/* Tab 4: Live Website Text & Content Editor */}
            {activeTab === 'content' && (
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {saveSuccessMsg && (
                  <div className="bg-emerald-100 border border-emerald-300 p-3.5 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Na-save ug na-update na sa Live Website ang tanang Text ug Content!</span>
                  </div>
                )}

                <div className="space-y-5 text-left">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Live Website Text & Content Editor:</h3>
                    <p className="text-xs text-slate-500 font-medium">Bisan unsay imong i-edit ug i-save diri, automatic nga mo-update sa live website alang sa tanang bisita/booker.</p>
                  </div>

                  {/* Hero Banner Title & Subtitle */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-lime-600" />
                      <span>Hero Banner Headline & Description</span>
                    </h4>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Hero Title Headline</label>
                      <input
                        type="text"
                        value={settings.hero_title || ''}
                        onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                        placeholder="Book Your Pickleball Court in Balamban, Cebu"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Hero Subtitle Description</label>
                      <textarea
                        rows={3}
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        placeholder="Duwa na og Pickleball sa pinakanindot..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                      />
                    </div>
                  </div>

                  {/* Contact & Location Info */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Phone className="w-4 h-4 text-lime-600" />
                      <span>Court Contact Numbers, Email & Address</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Court Hotline / Mobile Phone</label>
                        <input
                          type="text"
                          value={settings.contact_phone || ''}
                          onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                          placeholder="0917-888-9900"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Landline Phone</label>
                        <input
                          type="text"
                          value={settings.contact_landline || ''}
                          onChange={(e) => setSettings({ ...settings, contact_landline: e.target.value })}
                          placeholder="(032) 492-1234"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Email Address</label>
                        <input
                          type="email"
                          value={settings.contact_email || ''}
                          onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                          placeholder="booking@balambanbest.ph"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Venue Full Address</label>
                      <input
                        type="text"
                        value={settings.location_address || ''}
                        onChange={(e) => setSettings({ ...settings, location_address: e.target.value })}
                        placeholder="BALAMBAN EXTENSIVE SKILLS AND TECHNOLOGY, INC..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Location Card Header Title</label>
                        <input
                          type="text"
                          value={settings.location_card_title || ''}
                          onChange={(e) => setSettings({ ...settings, location_card_title: e.target.value })}
                          placeholder="Balamban BEST Inc. Address"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">GPS Coordinates</label>
                        <input
                          type="text"
                          value={settings.location_gps || ''}
                          onChange={(e) => setSettings({ ...settings, location_gps: e.target.value })}
                          placeholder="10.5124145, 123.7298596"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Operating Hours Display Text</label>
                      <input
                        type="text"
                        value={settings.location_hours_text || ''}
                        onChange={(e) => setSettings({ ...settings, location_hours_text: e.target.value })}
                        placeholder="Monday - Sunday: 6:00 AM – 10:00 PM"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">On-Site Amenity Badge 1</label>
                        <input
                          type="text"
                          value={settings.location_amenity_1 || ''}
                          onChange={(e) => setSettings({ ...settings, location_amenity_1: e.target.value })}
                          placeholder="Free Parking"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">On-Site Amenity Badge 2</label>
                        <input
                          type="text"
                          value={settings.location_amenity_2 || ''}
                          onChange={(e) => setSettings({ ...settings, location_amenity_2: e.target.value })}
                          placeholder="Snack Lounge"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Google Maps Button URL Link</label>
                      <input
                        type="text"
                        value={settings.google_maps_url || ''}
                        onChange={(e) => setSettings({ ...settings, google_maps_url: e.target.value })}
                        placeholder="https://www.google.com/maps/place/..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                      />
                    </div>
                  </div>

                  {/* Footer Hours & Payments Text Editor */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-lime-600" />
                      <span>Footer Hours & Payments Info Editor</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Footer Hours Header Title</label>
                        <input
                          type="text"
                          value={settings.footer_hours_header || ''}
                          onChange={(e) => setSettings({ ...settings, footer_hours_header: e.target.value })}
                          placeholder="Hours & Payments"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Footer Operating Hours Text</label>
                        <input
                          type="text"
                          value={settings.footer_hours_text || ''}
                          onChange={(e) => setSettings({ ...settings, footer_hours_text: e.target.value })}
                          placeholder="Open Daily: 6:00 AM - 10:00 PM"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Footer Accepted Payments Text</label>
                        <input
                          type="text"
                          value={settings.footer_payments_text || ''}
                          onChange={(e) => setSettings({ ...settings, footer_payments_text: e.target.value })}
                          placeholder="Accepted: GCash, Maya, Cash"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Footer Status Tag Text</label>
                        <input
                          type="text"
                          value={settings.footer_status_text || ''}
                          onChange={(e) => setSettings({ ...settings, footer_status_text: e.target.value })}
                          placeholder="Supabase Realtime Connected"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-lime-700 focus:outline-none focus:border-lime-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Quick Feature Pills Controls (4 Pills) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <h4 className="text-xs font-black text-slate-900 flex items-center justify-between uppercase tracking-wide">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-lime-600" />
                        <span>Hero Quick Feature Pills (4 Badges)</span>
                      </div>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Maka-edit ka sa title/sub o maka-Active/Inactive sa matag feature pill sa Hero banner.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Pill 1 */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-lime-800 uppercase">Pill 1</span>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, pill_1_active: settings.pill_1_active === false })}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                              settings.pill_1_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {settings.pill_1_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{settings.pill_1_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settings.pill_1_title || ''}
                          onChange={(e) => setSettings({ ...settings, pill_1_title: e.target.value })}
                          placeholder="Pickleball Courts"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={settings.pill_1_sub || ''}
                          onChange={(e) => setSettings({ ...settings, pill_1_sub: e.target.value })}
                          placeholder="Covered & Outdoor"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900"
                        />
                      </div>

                      {/* Pill 2 */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-lime-800 uppercase">Pill 2</span>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, pill_2_active: settings.pill_2_active === false })}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                              settings.pill_2_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {settings.pill_2_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{settings.pill_2_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settings.pill_2_title || ''}
                          onChange={(e) => setSettings({ ...settings, pill_2_title: e.target.value })}
                          placeholder="LED Night Lighting"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={settings.pill_2_sub || ''}
                          onChange={(e) => setSettings({ ...settings, pill_2_sub: e.target.value })}
                          placeholder="Play until 10 PM"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900"
                        />
                      </div>

                      {/* Pill 3 */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-lime-800 uppercase">Pill 3</span>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, pill_3_active: settings.pill_3_active === false })}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                              settings.pill_3_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {settings.pill_3_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{settings.pill_3_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settings.pill_3_title || ''}
                          onChange={(e) => setSettings({ ...settings, pill_3_title: e.target.value })}
                          placeholder="Instant Booking"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={settings.pill_3_sub || ''}
                          onChange={(e) => setSettings({ ...settings, pill_3_sub: e.target.value })}
                          placeholder="Real-time slots"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900"
                        />
                      </div>

                      {/* Pill 4 */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-lime-800 uppercase">Pill 4</span>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, pill_4_active: settings.pill_4_active === false })}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                              settings.pill_4_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {settings.pill_4_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{settings.pill_4_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={settings.pill_4_title || ''}
                          onChange={(e) => setSettings({ ...settings, pill_4_title: e.target.value })}
                          placeholder="GCash / Maya"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={settings.pill_4_sub || ''}
                          onChange={(e) => setSettings({ ...settings, pill_4_sub: e.target.value })}
                          placeholder="Easy Payment"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Why Play at BEST Inc. Cards (3 Cards) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <Zap className="w-4 h-4 text-lime-600" />
                        <span>"Why Play at BEST Inc." Feature Section</span>
                      </h4>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, why_play_active: settings.why_play_active === false })}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
                          settings.why_play_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {settings.why_play_active !== false ? <ToggleRight className="w-4 h-4 text-lime-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        <span>{settings.why_play_active !== false ? 'SECTION ACTIVE' : 'SECTION INACTIVE'}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={settings.why_play_title || ''}
                        onChange={(e) => setSettings({ ...settings, why_play_title: e.target.value })}
                        placeholder="Why Play at BEST Inc. Balamban?"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={settings.why_play_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, why_play_subtitle: e.target.value })}
                        placeholder="Gidisenyo alang sa beginners..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900"
                      />
                    </div>
                    
                    {/* Feature 1 */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-lime-800 uppercase">Card 1</span>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, feature_1_active: settings.feature_1_active === false })}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                            settings.feature_1_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {settings.feature_1_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{settings.feature_1_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={settings.feature_1_title || ''}
                        onChange={(e) => setSettings({ ...settings, feature_1_title: e.target.value })}
                        placeholder="Non-Slip Cushion Surface"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                      <textarea
                        rows={2}
                        value={settings.feature_1_desc || ''}
                        onChange={(e) => setSettings({ ...settings, feature_1_desc: e.target.value })}
                        placeholder="Description for Card 1..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900"
                      />
                    </div>

                    {/* Feature 2 */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-lime-800 uppercase">Card 2</span>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, feature_2_active: settings.feature_2_active === false })}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                            settings.feature_2_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {settings.feature_2_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{settings.feature_2_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={settings.feature_2_title || ''}
                        onChange={(e) => setSettings({ ...settings, feature_2_title: e.target.value })}
                        placeholder="Night Lighting & Roof"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                      <textarea
                        rows={2}
                        value={settings.feature_2_desc || ''}
                        onChange={(e) => setSettings({ ...settings, feature_2_desc: e.target.value })}
                        placeholder="Description for Card 2..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900"
                      />
                    </div>

                    {/* Feature 3 */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-lime-800 uppercase">Card 3</span>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, feature_3_active: settings.feature_3_active === false })}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                            settings.feature_3_active !== false ? 'bg-lime-100 text-lime-800 border border-lime-300' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {settings.feature_3_active !== false ? <ToggleRight className="w-3.5 h-3.5 text-lime-600" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{settings.feature_3_active !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={settings.feature_3_title || ''}
                        onChange={(e) => setSettings({ ...settings, feature_3_title: e.target.value })}
                        placeholder="Paddle Rental & Coaching"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                      />
                      <textarea
                        rows={2}
                        value={settings.feature_3_desc || ''}
                        onChange={(e) => setSettings({ ...settings, feature_3_desc: e.target.value })}
                        placeholder="Description for Card 3..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-slate-950 font-black text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingSettings ? 'SAVING...' : 'SAVE WEBSITE TEXT & CONTENT'}</span>
                    </button>
                  </div>

                </div>

              </form>
            )}
          </>
        )}

        {/* Lightbox Modal for Payment Receipt Preview */}
        {selectedProofImage && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-lime-400 font-bold text-sm">
                  <ImageIcon className="w-4 h-4" />
                  <span>Customer Payment Receipt Proof</span>
                </div>
                <button
                  onClick={() => setSelectedProofImage(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto flex items-center justify-center rounded-2xl bg-black p-2 w-full">
                <img
                  src={selectedProofImage}
                  alt="Payment Receipt Proof"
                  className="max-w-full max-h-[65vh] object-contain rounded-xl"
                />
              </div>
              <div className="w-full mt-3 flex justify-end">
                <button
                  onClick={() => setSelectedProofImage(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
