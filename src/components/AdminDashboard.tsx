import React, { useState } from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Truck, 
  CreditCard, 
  Settings as SettingsIcon, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Plus, 
  MapPin, 
  Sparkles,
  Search,
  Eye,
  RefreshCw,
  Mail,
  Lock,
  LockKeyhole,
  Check,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { OrderData, RiderData, AppUser, PaymentData } from '../types';

interface AdminDashboardProps {
  currentUserId: string;
  currentUserEmail: string;
  onLogout: () => void;
  orders: OrderData[];
  riders: RiderData[];
  users: AppUser[];
  payments: PaymentData[];
  onUpdateOrderStatus: (orderId: string, status: OrderData['status'], riderName: string) => void;
  onApproveRider: (riderId: string) => void;
  onSuspendUser: (userId: string, suspended: boolean) => void;
  onSeedDatabase: () => void;
  onAssignRiderToOrder: (orderId: string, riderId: string, riderName: string) => void;
}

export default function AdminDashboard({
  currentUserId,
  currentUserEmail,
  onLogout,
  orders,
  riders,
  users,
  payments,
  onUpdateOrderStatus,
  onApproveRider,
  onSuspendUser,
  onSeedDatabase,
  onAssignRiderToOrder
}: AdminDashboardProps) {
  // Login flow
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState(currentUserEmail);
  const [adminPassword, setAdminPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'riders' | 'customers' | 'payments' | 'reports' | 'settings'>('dashboard');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      alert("Please enter credentials");
      return;
    }
    // Simulate/Authorize Admin Login
    setIsAdminLoggedIn(true);
  };

  // Stats derivation
  const totalOrders = orders.length;
  const activeRiders = riders.filter(r => r.onlineStatus).length;
  const totalCustomers = users.filter(u => u.role === 'customer').length;
  const totalRevenue = orders.reduce((sum, o) => o.status === 'delivered' ? sum + o.fee : sum, 0);

  // Assigning rider state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);

  // Handle Assign Rider Action
  const handleAssignRiderSubmit = async (orderId: string, riderId: string) => {
    const selectedRider = riders.find(r => r.id === riderId);
    const riderUser = users.find(u => u.id === riderId);
    if (!selectedRider || !riderUser) return;
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        riderId,
        riderName: riderUser.fullName,
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      onAssignRiderToOrder(orderId, riderId, riderUser.fullName);
      setAssigningOrderId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Filter lists based on Search
  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.pickupLocation.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.dropoffLocation.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.packageDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRiders = riders.map(r => {
    const user = users.find(u => u.id === r.id);
    return { ...r, userDetails: user };
  }).filter(r => 
    r.userDetails?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = users.filter(u => u.role === 'customer' && 
    (u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdminLoggedIn) {
    // RENDER THE ADMIN LOGIN SCREEN (EXACT REPLICATION OF MOCK DESIGN)
    return (
      <div className="flex-1 min-h-screen bg-slate-100 flex items-center justify-center p-4">
        {/* Container mimicking the uploaded layout */}
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[680px]">
          
          {/* LEFT BRANDING PANEL */}
          <div className="md:w-[42%] bg-gradient-to-b from-[#0B4DB8] to-[#042866] text-white p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Speed backdrop graphics */}
            <div className="absolute right-0 bottom-0 top-0 w-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                <path d="M 0 100 L 100 0 L 100 100 Z" />
              </svg>
            </div>

            {/* Top Logo */}
            <div className="flex items-center gap-1.5 z-10">
              <span className="text-xl font-black italic tracking-tighter">⚡ HYPER EXPRESS</span>
            </div>

            {/* Title & Copy */}
            <div className="space-y-4 my-auto z-10">
              <h2 className="text-3xl font-black leading-tight tracking-tight">
                Delivering<br />Excellence,<br />Every Time.
              </h2>
              <p className="text-xs text-blue-100 font-medium leading-relaxed max-w-[240px]">
                Manage deliveries, riders, customers and more from your admin dashboard.
              </p>
              
              {/* Rider Scooter Illustration built with custom CSS for robust rendering */}
              <div className="relative w-full h-36 bg-white/5 rounded-2xl border border-white/10 p-3 flex items-center justify-center overflow-hidden">
                <div className="absolute -left-10 w-24 h-24 bg-[#0B4DB8] blur-xl rounded-full opacity-30 animate-pulse"></div>
                {/* Simulated scooter icon */}
                <div className="text-center space-y-2">
                  <div className="text-5xl animate-bounce">🏍️</div>
                  <span className="text-[10px] text-blue-200 uppercase font-bold tracking-widest block">Hyper Delivery Fleet</span>
                </div>
              </div>
            </div>

            {/* Bottom Shield Tag */}
            <div className="flex items-center gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10 z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Secure Admin Access</h4>
                <p className="text-[9px] text-blue-200">Your data is protected with enterprise-grade security.</p>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN CARD */}
          <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full space-y-6">
              
              {/* Logo in Middle Top */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1 bg-blue-50 px-3.5 py-1.5 rounded-2xl border border-blue-100 text-[#0B4DB8] font-black italic text-lg">
                  ⚡ HYPER EXPRESS
                </div>
                <h3 className="text-2xl font-black text-slate-800 pt-3">Admin Login</h3>
                <p className="text-xs text-slate-400">Welcome back! Please sign in to continue.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleAdminLogin} className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-1.5 text-slate-600 font-semibold cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-[#0B4DB8] font-bold hover:underline">Forgot Password?</a>
                </div>

                {/* Login Button */}
                <button 
                  type="submit"
                  className="w-full py-3 bg-[#0B4DB8] hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <LockKeyhole className="w-4 h-4" />
                  <span>Login to Dashboard</span>
                </button>
              </form>

              {/* OR Line Separator */}
              <div className="flex items-center gap-3 text-xs text-slate-400 my-4">
                <div className="flex-1 h-[1px] bg-slate-200"></div>
                <span>OR</span>
                <div className="flex-1 h-[1px] bg-slate-200"></div>
              </div>

              {/* Google Sign In Button */}
              <button 
                type="button"
                onClick={() => setIsAdminLoggedIn(true)}
                className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="text-base">🌐</span>
                <span>Sign in with Google</span>
              </button>

              {/* Bottom Support Contacts */}
              <div className="text-center text-[11px] text-slate-500">
                Don't have an account? <a href="#" className="text-[#0B4DB8] font-semibold hover:underline">Contact System Administrator</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER THE INTERACTIVE ADMIN CONSOLE PANEL (ONCE LOGGED IN)
  return (
    <div className="flex-1 min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <div className="md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <span className="text-lg font-black italic text-white tracking-tight">⚡ HYPER EXPRESS</span>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1 text-xs">
            <button 
              onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button 
              onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'orders' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Management</span>
            </button>

            <button 
              onClick={() => { setActiveTab('riders'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'riders' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Rider Approval & Activity</span>
            </button>

            <button 
              onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'customers' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Accounts</span>
            </button>

            <button 
              onClick={() => { setActiveTab('payments'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'payments' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payments Logs</span>
            </button>

            <button 
              onClick={() => { setActiveTab('reports'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'reports' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>System Reports</span>
            </button>

            <button 
              onClick={() => { setActiveTab('settings'); setSearchTerm(''); }}
              className={`w-full py-2.5 px-3 rounded-lg flex items-center gap-3 font-semibold transition-all ${
                activeTab === 'settings' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Platform Config</span>
            </button>
          </nav>
        </div>

        {/* User logout section */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="text-xs">
            <span className="text-slate-500 block">Logged in as:</span>
            <span className="font-bold text-white truncate block">{adminEmail}</span>
          </div>
          <button 
            onClick={() => setIsAdminLoggedIn(false)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold rounded-lg text-xs transition-all"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top bar controls */}
        <div className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-sm shrink-0">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            {activeTab} Management Panel
          </h2>
          
          <div className="flex items-center gap-3">
            {/* Seed Button to make demo setup painless */}
            <button 
              onClick={onSeedDatabase}
              className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-[#0B4DB8] hover:from-blue-700 hover:to-blue-800 text-white text-[11px] font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Database (Vite + Firestore)</span>
            </button>

            {/* General search */}
            <div className="relative w-48 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resources..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Workspace body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Core Analytics Widgets Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[110px]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Total Orders</span>
                  <div className="flex justify-between items-end mt-2">
                    <h2 className="text-2xl font-black text-slate-800">{totalOrders}</h2>
                    <span className="text-xs bg-blue-50 text-[#0B4DB8] px-1.5 py-0.5 rounded font-bold">In System</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[110px]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Active Riders Online</span>
                  <div className="flex justify-between items-end mt-2">
                    <h2 className="text-2xl font-black text-emerald-600">{activeRiders}</h2>
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Live GPS</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[110px]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Total Customers</span>
                  <div className="flex justify-between items-end mt-2">
                    <h2 className="text-2xl font-black text-slate-800">{totalCustomers}</h2>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">Users</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[110px]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Total Revenue</span>
                  <div className="flex justify-between items-end mt-2">
                    <h2 className="text-2xl font-black text-slate-800">GHS {totalRevenue}.00</h2>
                    <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Seed instructions if database is cold */}
              {totalOrders === 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex gap-3">
                    <Sparkles className="w-8 h-8 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">Your Firebase Firestore database is empty!</h4>
                      <p className="text-xs text-slate-600 mt-1">Click the "Seed Database" button to automatically provision a full test workspace of mock orders, riders, and transaction history.</p>
                    </div>
                  </div>
                  <button 
                    onClick={onSeedDatabase}
                    className="py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0 shadow-md hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    Seed Test Data
                  </button>
                </div>
              )}

              {/* Quick List tables of active orders */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">Awaiting Rider Assignment</h3>
                
                {orders.filter(o => o.status === 'pending').length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No pending orders requiring rider allocation.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-2.5">ID</th>
                          <th className="py-2.5">Customer</th>
                          <th className="py-2.5">Route</th>
                          <th className="py-2.5">Package</th>
                          <th className="py-2.5">Fee</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {orders.filter(o => o.status === 'pending').map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-bold text-blue-600">{ord.id}</td>
                            <td className="py-2.5">{ord.customerName || 'Guest'}</td>
                            <td className="py-2.5 truncate max-w-[150px]">{ord.pickupLocation.address} → {ord.dropoffLocation.address}</td>
                            <td className="py-2.5 capitalize">{ord.packageDescription} ({ord.packageWeight}kg)</td>
                            <td className="py-2.5 font-bold text-slate-800">GHS {ord.fee}</td>
                            <td className="py-2.5 text-right relative">
                              {assigningOrderId === ord.id ? (
                                <select 
                                  onChange={(e) => handleAssignRiderSubmit(ord.id, e.target.value)}
                                  defaultValue=""
                                  className="text-[10px] p-1 border border-slate-200 rounded focus:outline-none"
                                >
                                  <option value="" disabled>Assign Rider</option>
                                  {riders.filter(r => r.onlineStatus).map((rid) => {
                                    const details = users.find(u => u.id === rid.id);
                                    return (
                                      <option key={rid.id} value={rid.id}>
                                        {details?.fullName || 'Rider'} ({rid.vehicleType})
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : (
                                <button 
                                  onClick={() => setAssigningOrderId(ord.id)}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px]"
                                >
                                  Dispatch Rider
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
            </div>
          )}

          {/* TAB 2: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">All Shipments and Deliveries</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">ID</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">From / To Address</th>
                      <th className="py-2.5">Specs</th>
                      <th className="py-2.5">Assigned Rider</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-blue-600">{ord.id}</td>
                        <td className="py-3 font-semibold">{ord.customerName || 'System'}</td>
                        <td className="py-3 text-[11px] max-w-[200px]">
                          <span className="block truncate text-slate-700 font-medium">Pickup: {ord.pickupLocation.address}</span>
                          <span className="block truncate text-slate-400 mt-0.5">Drop: {ord.dropoffLocation.address}</span>
                        </td>
                        <td className="py-3 capitalize text-[11px]">
                          {ord.packageType} ({ord.packageWeight}kg)
                        </td>
                        <td className="py-3 font-semibold text-slate-700">
                          {ord.riderName || <span className="text-amber-500 font-normal">Awaiting dispatch</span>}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                            ord.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {ord.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-800">GHS {ord.fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RIDER APPROVAL & STATS */}
          {activeTab === 'riders' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">hyper rider roster</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Vehicle specs</th>
                      <th className="py-2.5">rating</th>
                      <th className="py-2.5">earnings balance</th>
                      <th className="py-2.5">gps status</th>
                      <th className="py-2.5">account status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRiders.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-3">
                          <div className="font-bold text-slate-800">{r.userDetails?.fullName || 'Rider'}</div>
                          <div className="text-[10px] text-slate-400">{r.userDetails?.email}</div>
                        </td>
                        <td className="py-3 text-[11px]">
                          <span className="block font-semibold capitalize">{r.vehicleType}</span>
                          <span className="block text-slate-400 mt-0.5">Plate: {r.vehicleNumber}</span>
                        </td>
                        <td className="py-3 font-bold text-amber-500">★ {r.rating.toFixed(1)}</td>
                        <td className="py-3 font-semibold text-slate-700">GHS {r.earningsBalance.toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${r.onlineStatus ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.onlineStatus ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            <span>{r.onlineStatus ? 'Online' : 'Offline'}</span>
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.userDetails?.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {r.userDetails?.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {r.userDetails?.status === 'active' ? (
                            <button 
                              onClick={() => onSuspendUser(r.id, true)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button 
                              onClick={() => onSuspendUser(r.id, false)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-[10px] font-bold"
                            >
                              Unsuspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">registered customers</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Phone</th>
                      <th className="py-2.5">account status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50">
                        <td className="py-3 font-bold text-slate-800">{cust.fullName}</td>
                        <td className="py-3">{cust.email}</td>
                        <td className="py-3">{cust.phone || 'No phone'}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cust.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {cust.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {cust.status === 'active' ? (
                            <button 
                              onClick={() => onSuspendUser(cust.id, true)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold"
                            >
                              Disable Account
                            </button>
                          ) : (
                            <button 
                              onClick={() => onSuspendUser(cust.id, false)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-[10px] font-bold"
                            >
                              Enable Account
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS LOG */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-4 uppercase tracking-wider">payments and checkout records</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5">Transaction ID</th>
                      <th className="py-2.5">Order ID</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Method</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Refund Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-slate-800">{p.id}</td>
                        <td className="py-3 font-bold text-blue-600">{p.orderId}</td>
                        <td className="py-3">{p.customerName || 'Customer'}</td>
                        <td className="py-3 font-extrabold text-slate-700">GHS {p.amount}.00</td>
                        <td className="py-3 font-medium text-slate-500">{p.method}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {p.status === 'completed' ? (
                            <button 
                              onClick={() => {
                                alert(`Refund of GHS ${p.amount} initiated successfully for transaction ${p.id}.`);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold"
                            >
                              Refund
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Financial overview */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Financial performance summary</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Total Settlement Fee</span>
                      <span className="font-bold text-slate-800">GHS {totalRevenue + 45}.00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Company Service Fee (15%)</span>
                      <span className="font-bold text-slate-800">GHS {((totalRevenue + 45) * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs font-bold text-slate-700">Net Profit Margin</span>
                      <span className="font-black text-emerald-600">GHS {((totalRevenue + 45) * 0.85).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Rider delivery speeds */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">Rider Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Average Delivery Time</span>
                      <span className="font-bold text-slate-800">18.4 mins</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Order Fulfilment Rate</span>
                      <span className="font-bold text-slate-800">97.8%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Average Customer Rating</span>
                      <span className="font-bold text-slate-800">★ 4.8 / 5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CONFIGURATION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">System Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800">General Dispatch Rules</h4>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Auto-assign nearest online rider to new bookings</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                    <span>Send SMS confirmations on package delivery</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800">Pricing and Rate multiplier</h4>
                  <div className="space-y-1">
                    <span className="block text-slate-500">Base pickup fee (GHS)</span>
                    <input type="number" defaultValue="10" className="p-2 border border-slate-200 rounded-lg w-24 bg-slate-50 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-slate-500">Peak hour multiplier</span>
                    <input type="text" defaultValue="1.2x" className="p-2 border border-slate-200 rounded-lg w-24 bg-slate-50 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
