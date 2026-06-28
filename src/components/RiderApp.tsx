import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  User as UserIcon, 
  MapPin, 
  Package, 
  Navigation, 
  CheckCircle, 
  Power, 
  LogOut, 
  DollarSign, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { OrderData, RiderData } from '../types';
import TrackingMap from './TrackingMap';

interface RiderAppProps {
  currentUserId: string;
  currentUserEmail: string;
  onLogout: () => void;
  orders: OrderData[];
  onUpdateOrderStatus: (orderId: string, status: OrderData['status'], riderName: string) => void;
  riderData: RiderData;
  onUpdateRiderOnlineStatus: (status: boolean) => void;
  onAddRiderEarnings: (amount: number) => void;
}

export default function RiderApp({
  currentUserId,
  currentUserEmail,
  onLogout,
  orders,
  onUpdateOrderStatus,
  riderData,
  onUpdateRiderOnlineStatus,
  onAddRiderEarnings
}: RiderAppProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'earnings' | 'profile'>('dashboard');
  const [navigatingOrder, setNavigatingOrder] = useState<OrderData | null>(null);

  // Available orders for assignment (pending status)
  const availableOrders = orders.filter(o => o.status === 'pending');
  // Rider's active orders (accepted, picked_up)
  const myActiveOrders = orders.filter(o => o.riderId === currentUserId && (o.status === 'accepted' || o.status === 'picked_up'));
  // Completed orders
  const completedOrders = orders.filter(o => o.riderId === currentUserId && o.status === 'delivered');

  // Handle Accept Order
  const handleAcceptOrder = async (order: OrderData) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      const riderName = currentUserEmail.split('@')[0];
      
      await updateDoc(orderRef, {
        status: 'accepted',
        riderId: currentUserId,
        riderName: riderName,
        updatedAt: serverTimestamp()
      });

      // Update local state via handler
      onUpdateOrderStatus(order.id, 'accepted', riderName);
      
      // Auto open navigation panel
      const updatedOrder = { ...order, status: 'accepted' as const, riderId: currentUserId, riderName };
      setNavigatingOrder(updatedOrder);
      setActiveTab('orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  // Handle Pickup package
  const handlePickupPackage = async (order: OrderData) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'picked_up',
        updatedAt: serverTimestamp()
      });

      onUpdateOrderStatus(order.id, 'picked_up', order.riderName || '');
      if (navigatingOrder?.id === order.id) {
        setNavigatingOrder({ ...navigatingOrder, status: 'picked_up' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  // Handle Delivered package
  const handleDeliverPackage = async (order: OrderData) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'delivered',
        updatedAt: serverTimestamp()
      });

      // Add Rider Earnings
      const riderRef = doc(db, 'riders', currentUserId);
      const newEarnings = riderData.earningsBalance + order.fee;
      await updateDoc(riderRef, {
        earningsBalance: newEarnings,
        updatedAt: serverTimestamp()
      });

      // Log wallet transaction
      const txnId = `txn_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, 'walletTransactions', txnId), {
        id: txnId,
        userId: currentUserId,
        amount: order.fee,
        type: 'earnings',
        description: `Earnings for delivery ${order.id}`,
        createdAt: serverTimestamp()
      });

      onUpdateOrderStatus(order.id, 'delivered', order.riderName || '');
      onAddRiderEarnings(order.fee);
      
      if (navigatingOrder?.id === order.id) {
        setNavigatingOrder(null);
      }
      alert(`Awesome job! You earned GHS ${order.fee}.00 for this delivery.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  // Handle toggle online status
  const handleToggleOnline = async () => {
    try {
      const riderRef = doc(db, 'riders', currentUserId);
      const nextStatus = !riderData.onlineStatus;
      await updateDoc(riderRef, {
        onlineStatus: nextStatus,
        updatedAt: serverTimestamp()
      });
      onUpdateRiderOnlineStatus(nextStatus);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `riders/${currentUserId}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#0B4DB8] text-white pt-6 pb-4 px-4 shadow-md rounded-b-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              🏍️
            </div>
            <div>
              <div className="text-[10px] text-slate-300 uppercase tracking-wider">Hyper Rider</div>
              <div className="text-sm font-bold truncate max-w-[150px]">{currentUserEmail.split('@')[0]}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online / Offline Toggle */}
            <button 
              onClick={handleToggleOnline}
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1.5 transition-all shadow-sm ${
                riderData.onlineStatus 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{riderData.onlineStatus ? 'Online' : 'Offline'}</span>
            </button>
            
            <button 
              onClick={onLogout}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Earnings</span>
                <h3 className="text-xl font-black text-slate-800 mt-1">GHS {riderData.earningsBalance.toFixed(2)}</h3>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Rider Rating</span>
                <h3 className="text-xl font-black text-amber-500 mt-1">★ {riderData.rating.toFixed(1)}</h3>
              </div>
            </div>

            {/* Offline warning */}
            {!riderData.onlineStatus && (
              <div className="bg-amber-50 border border-amber-200/60 text-amber-800 p-3 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">You are currently Offline.</span>
                  <span className="block mt-0.5 text-amber-700">Go online to receive and accept available delivery orders around you.</span>
                </div>
              </div>
            )}

            {/* Available Orders feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Orders ({availableOrders.length})</h4>
                {riderData.onlineStatus && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>}
              </div>

              {!riderData.onlineStatus ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                  Toggle Online to scan for live package orders.
                </div>
              ) : availableOrders.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <Package className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                  <span>Scanning for requests near you...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableOrders.map((ord) => (
                    <div key={ord.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                          {ord.packageType}
                        </span>
                        <span className="font-black text-sm text-slate-800">GHS {ord.fee}</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">From: {ord.pickupLocation.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">To: {ord.dropoffLocation.address}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAcceptOrder(ord)}
                          className="flex-1 py-2 bg-[#0B4DB8] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
                        >
                          Accept Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE NAVIGATION & CURRENT WORKLOAD */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800">Current Assignments</h3>

            {myActiveOrders.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                You have no active assignments. Accept an order from the dashboard to begin.
              </div>
            ) : (
              <div className="space-y-4">
                {myActiveOrders.map(ord => (
                  <div key={ord.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-blue-600">Active Order {ord.id}</span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {ord.status === 'accepted' ? 'Assigned' : 'In Transit'}
                      </span>
                    </div>

                    {/* Integrated mini tracker map */}
                    <TrackingMap 
                      pickup={ord.pickupLocation}
                      dropoff={ord.dropoffLocation}
                      status={ord.status}
                    />

                    <div className="space-y-2 text-xs text-slate-600 pt-2">
                      <div>
                        <span className="font-bold text-slate-800 block">Pickup from:</span>
                        <span className="text-[11px] block text-slate-500">{ord.pickupLocation.address}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Deliver to:</span>
                        <span className="text-[11px] block text-slate-500">{ord.dropoffLocation.address}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Package Details:</span>
                        <span className="text-[11px] block text-slate-500">{ord.packageDescription} ({ord.packageWeight}kg)</span>
                      </div>
                    </div>

                    {/* Workflow actions */}
                    <div className="pt-2 border-t border-slate-100">
                      {ord.status === 'accepted' ? (
                        <button 
                          onClick={() => handlePickupPackage(ord)}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirm Package Picked Up</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleDeliverPackage(ord)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirm Package Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EARNINGS & WORK RECAP */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800">Earnings Center</h3>

            {/* Total Balance block */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Unpaid Earnings</span>
                <h2 className="text-2xl font-black mt-1 text-emerald-400">GHS {riderData.earningsBalance.toFixed(2)}</h2>
              </div>
              <button 
                onClick={() => {
                  if (riderData.earningsBalance <= 0) {
                    alert("No balance available to withdraw.");
                    return;
                  }
                  alert(`Withdrawal of GHS ${riderData.earningsBalance} requested successfully to your registered MTN Mobile Money wallet!`);
                }}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
              >
                Cash Out
              </button>
            </div>

            {/* Historical Earnings recap list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Deliveries</h4>
              {completedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No completed deliveries recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {completedOrders.map(ord => (
                    <div key={ord.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Order {ord.id}</span>
                        <span className="text-[9px] text-slate-400 capitalize">{ord.packageType} • Delivered</span>
                      </div>
                      <span className="font-bold text-xs text-emerald-600">+GHS {ord.fee}.00</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800">Rider Profile</h3>

            {/* Profile Overview */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-lg uppercase shadow-inner">
                {currentUserEmail[0]}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{currentUserEmail.split('@')[0]}</h4>
                <p className="text-xs text-slate-400">{currentUserEmail}</p>
              </div>
            </div>

            {/* Vehicle configuration details */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase">Vehicle Type</span>
                  <span className="font-semibold text-slate-800 capitalize">{riderData.vehicleType}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase">License Plate</span>
                  <span className="font-semibold text-slate-800 uppercase">{riderData.vehicleNumber}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">License Number</span>
                  <span className="font-semibold text-slate-800">{riderData.licenseNumber}</span>
                </div>
              </div>
            </div>

            {/* Settings lists */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-xs text-slate-600 divide-y divide-slate-50">
              <div className="py-2.5 flex justify-between items-center cursor-pointer" onClick={onLogout}>
                <span className="text-red-600 font-bold">Sign Out</span>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Rider Tab bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-16 flex items-center justify-around text-slate-400 z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-[#0B4DB8]' : ''}`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-[#0B4DB8]' : ''}`}
        >
          <div className="relative">
            <Navigation className="w-5 h-5" />
            {myActiveOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0B4DB8] rounded-full"></span>
            )}
          </div>
          <span className="text-[9px] font-bold">Active</span>
        </button>

        <button 
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'earnings' ? 'text-[#0B4DB8]' : ''}`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] font-bold">Earnings</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#0B4DB8]' : ''}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
}
