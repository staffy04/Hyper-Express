import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, 
  Briefcase, 
  Wallet, 
  Bell, 
  User as UserIcon, 
  MapPin, 
  Package, 
  Weight, 
  ArrowRight, 
  Plus, 
  CreditCard, 
  LogOut, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Navigation,
  Sparkles,
  Loader2,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import TrackingMap from './TrackingMap';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { OrderData, PaymentData, WalletTransaction, AppNotification } from '../types';

interface CustomerAppProps {
  currentUserId: string;
  currentUserEmail: string;
  onLogout: () => void;
  orders: OrderData[];
  onAddOrder: (order: OrderData) => void;
  walletBalance: number;
  onUpdateWallet: (amount: number) => void;
  notifications: AppNotification[];
  onAddNotification: (title: string, message: string) => void;
}

export default function CustomerApp({
  currentUserId,
  currentUserEmail,
  onLogout,
  orders,
  onAddOrder,
  walletBalance,
  onUpdateWallet,
  notifications,
  onAddNotification
}: CustomerAppProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'bookings' | 'wallet' | 'notifications' | 'profile'>('home');
  
  // Book Delivery Form State
  const [pickupAddress, setPickupAddress] = useState('P. O. Box Sk 779, Sakumono, Tema');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [packageType, setPackageType] = useState<'small' | 'large' | 'document' | 'box'>('small');
  const [packageWeight, setPackageWeight] = useState<number>(1);
  const [packageDescription, setPackageDescription] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(15);
  
  // Payment selection
  const [paymentMethod, setPaymentMethod] = useState<'MTN Mobile Money' | 'Telecel Cash' | 'AirtelTigo Cash' | 'Card'>('MTN Mobile Money');

  // Track page active order selection
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<OrderData | null>(null);

  // Auto calculate fee when weight or package type changes
  useEffect(() => {
    let base = packageType === 'small' ? 10 : packageType === 'document' ? 8 : packageType === 'box' ? 20 : 30;
    let weightAdd = Math.max(0, packageWeight - 1) * 3;
    setEstimatedFee(base + weightAdd);
  }, [packageType, packageWeight]);

  // Handle Book order
  const handleBookDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropoffAddress) {
      alert("Please enter a drop-off location");
      return;
    }
    
    setIsBooking(true);
    
    const newOrder: OrderData = {
      id: `ord_${Math.random().toString(36).substring(2, 9)}`,
      customerId: currentUserId,
      customerName: currentUserEmail.split('@')[0],
      pickupLocation: {
        address: pickupAddress,
        lat: 5.6037,
        lng: -0.1870
      },
      dropoffLocation: {
        address: dropoffAddress,
        lat: 5.6147,
        lng: -0.1970
      },
      packageType,
      packageWeight,
      packageDescription: packageDescription || `${packageType} package`,
      fee: estimatedFee,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: deliveryNotes
    };

    try {
      // Save order to Firestore
      const orderRef = doc(db, 'orders', newOrder.id);
      await setDoc(orderRef, {
        ...newOrder,
        createdAt: serverTimestamp()
      });

      // Save transaction if from Wallet, or create initial Payment record
      const paymentId = `pay_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, 'payments', paymentId), {
        id: paymentId,
        orderId: newOrder.id,
        customerId: currentUserId,
        customerName: currentUserEmail.split('@')[0],
        amount: estimatedFee,
        method: paymentMethod,
        status: 'completed',
        createdAt: serverTimestamp()
      });

      // Add notify
      const notifyId = `not_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, 'notifications', notifyId), {
        id: notifyId,
        userId: currentUserId,
        title: 'Order Placed Successfully!',
        message: `Your package booking ${newOrder.id} has been created. Awaiting rider assignment.`,
        createdAt: serverTimestamp(),
        read: false
      });

      // Update local wallet if paying with card / wallet balance
      onUpdateWallet(-estimatedFee);
      onAddOrder(newOrder);
      
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setActiveTab('bookings');
        setDropoffAddress('');
        setPackageDescription('');
        setDeliveryNotes('');
      }, 2500);

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
    } finally {
      setIsBooking(false);
    }
  };

  // Add mock funds
  const handleAddFunds = async (amount: number) => {
    try {
      const transactionId = `txn_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, 'walletTransactions', transactionId), {
        id: transactionId,
        userId: currentUserId,
        amount,
        type: 'deposit',
        description: 'Wallet top-up via Card',
        createdAt: serverTimestamp()
      });
      onUpdateWallet(amount);
      onAddNotification('Wallet Credited', `GHS ${amount} has been successfully added to your wallet.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'walletTransactions');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B4DB8] to-blue-700 text-white pt-6 pb-4 px-4 shadow-md rounded-b-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              HE
            </div>
            <div>
              <div className="text-[10px] text-blue-100 uppercase tracking-wider">Hyper Express Client</div>
              <div className="text-sm font-bold truncate max-w-[150px]">{currentUserEmail.split('@')[0]}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {/* TAB 1: HOME SCREEN */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Welcome Banner */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute right-2 bottom-0 w-28 h-28 opacity-10 bg-blue-600 rounded-full blur-xl"></div>
              <div className="relative">
                <span className="text-xs font-semibold text-[#0B4DB8] bg-blue-50 px-2 py-1 rounded-full">⚡ Quick Deliver</span>
                <h3 className="text-lg font-black text-slate-800 mt-2">Where are we picking up?</h3>
                <div className="mt-2.5 flex items-center gap-2 text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
                  <span className="truncate">{pickupAddress}</span>
                </div>
              </div>
            </div>

            {/* Service Grid - Book Delivery / Track package / Services / Price estimate */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('bookings')}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left flex flex-col justify-between hover:border-blue-200 transition-all h-[110px]"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0B4DB8]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">Book Delivery</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Send a parcel instantly</div>
                </div>
              </button>

              <button 
                onClick={() => {
                  const activeOrd = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
                  if (activeOrd) {
                    setSelectedOrderForTracking(activeOrd);
                    setActiveTab('bookings');
                  } else {
                    alert("No active orders to track. Try placing an order first!");
                  }
                }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left flex flex-col justify-between hover:border-blue-200 transition-all h-[110px]"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">Track Package</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Live rider location</div>
                </div>
              </button>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left flex flex-col justify-between h-[110px]">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">Our Services</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Corporate & logistics</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-left flex flex-col justify-between h-[110px]">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-800">Price Estimate</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Instant quotes</div>
                </div>
              </div>
            </div>

            {/* Fast Delivery Advertisement banner */}
            <div className="bg-gradient-to-r from-blue-600 to-[#0B4DB8] text-white p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                  <path d="M 0 100 L 100 0 L 100 100 Z" />
                </svg>
              </div>
              <div className="max-w-[70%]">
                <h4 className="font-black text-sm">Fast Delivery You Can Trust</h4>
                <p className="text-[10px] opacity-80 mt-1">We deliver on-time, every time safely across Ghana.</p>
              </div>
            </div>

            {/* Active order quick tracking if any */}
            {orders.length > 0 && orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled') && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Ongoing Shipment</h4>
                {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').slice(0, 1).map(ord => (
                  <div key={ord.id} className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-800 truncate max-w-[150px]">{ord.packageDescription}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Status: <span className="text-blue-600 font-semibold">{ord.status.replace('_', ' ')}</span></div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedOrderForTracking(ord);
                        setActiveTab('bookings');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKINGS / BOOK DELIVERY */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {selectedOrderForTracking ? (
              // LIVE TRACKING DETAILED SCREEN
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedOrderForTracking(null)}
                    className="text-xs font-bold text-slate-500 flex items-center gap-1"
                  >
                    ← Back to List
                  </button>
                  <span className="text-xs font-bold bg-blue-50 text-[#0B4DB8] px-2.5 py-1 rounded-full border border-blue-100 uppercase">
                    Order {selectedOrderForTracking.id}
                  </span>
                </div>

                {/* Map */}
                <TrackingMap 
                  pickup={selectedOrderForTracking.pickupLocation}
                  dropoff={selectedOrderForTracking.dropoffLocation}
                  status={selectedOrderForTracking.status}
                />

                {/* Delivery Details */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 border-b border-slate-50 pb-2">Delivery Details</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Package Type</span>
                      <span className="font-semibold text-slate-700 capitalize">{selectedOrderForTracking.packageType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Weight</span>
                      <span className="font-semibold text-slate-700">{selectedOrderForTracking.packageWeight} kg</span>
                    </div>
                  </div>

                  <div className="text-xs border-t border-slate-50 pt-2">
                    <span className="text-slate-400 block">Pickup Address</span>
                    <span className="font-semibold text-slate-700">{selectedOrderForTracking.pickupLocation.address}</span>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-400 block">Dropoff Address</span>
                    <span className="font-semibold text-slate-700">{selectedOrderForTracking.dropoffLocation.address}</span>
                  </div>

                  {selectedOrderForTracking.notes && (
                    <div className="text-xs">
                      <span className="text-slate-400 block">Notes</span>
                      <span className="font-medium text-slate-500 italic">{selectedOrderForTracking.notes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">Rider Assigned</span>
                    <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {selectedOrderForTracking.riderName || 'Awaiting rider...'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // BOOK DELIVERY FORM SCREEN
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-800">Book Delivery</h3>

                {bookingSuccess ? (
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6 animate-bounce" />
                    </div>
                    <h4 className="font-bold text-emerald-800">Booking Confirmed!</h4>
                    <p className="text-xs text-slate-500">Your shipment order has been saved successfully in Firebase.</p>
                  </div>
                ) : (
                  <form onSubmit={handleBookDelivery} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                    {/* Pickup Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Pickup Location</label>
                      <input 
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder="Enter pickup address"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Drop-off Address */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Drop-off Location</label>
                      <input 
                        type="text"
                        value={dropoffAddress}
                        onChange={(e) => setDropoffAddress(e.target.value)}
                        placeholder="Enter drop-off address"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Package Type & Weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Package Type</label>
                        <select 
                          value={packageType}
                          onChange={(e: any) => setPackageType(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        >
                          <option value="small">Small (Envelope)</option>
                          <option value="document">Document</option>
                          <option value="box">Box (up to 10kg)</option>
                          <option value="large">Large Cargo</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Weight (kg)</label>
                        <input 
                          type="number"
                          min="1"
                          max="50"
                          value={packageWeight}
                          onChange={(e) => setPackageWeight(Number(e.target.value))}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Package Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Package Description</label>
                      <input 
                        type="text"
                        value={packageDescription}
                        onChange={(e) => setPackageDescription(e.target.value)}
                        placeholder="e.g., Office documents, laptop"
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Payment Method</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      >
                        <option value="MTN Mobile Money">MTN Mobile Money</option>
                        <option value="Telecel Cash">Telecel Cash</option>
                        <option value="AirtelTigo Cash">AirtelTigo Cash</option>
                        <option value="Card">Visa/MasterCard</option>
                      </select>
                    </div>

                    {/* Delivery Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Extra Notes (Optional)</label>
                      <textarea 
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Driver instructions..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none h-16 resize-none"
                      />
                    </div>

                    {/* Estimated Pricing */}
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block">Calculated Price</span>
                        <span className="font-bold text-slate-400">Ghanaian Cedi</span>
                      </div>
                      <div className="text-lg font-black text-[#0B4DB8]">
                        GHS {estimatedFee}.00
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit"
                      disabled={isBooking}
                      className="w-full py-3 bg-[#0B4DB8] hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Shipment...</span>
                        </>
                      ) : (
                        <span>Continue</span>
                      )}
                    </button>
                  </form>
                )}

                {/* History list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Shipment History</h4>
                  {orders.length === 0 ? (
                    <div className="text-center p-6 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                      No bookings yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((ord) => (
                        <div 
                          key={ord.id}
                          onClick={() => setSelectedOrderForTracking(ord)}
                          className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-800 truncate max-w-[150px]">{ord.packageDescription}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{new Date(ord.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xs block">GHS {ord.fee}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 uppercase ${
                              ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                              ord.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800">My Wallet</h3>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-[#0B4DB8] to-indigo-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/5 rounded-full"></div>
              <span className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold">Available Balance</span>
              <h1 className="text-3xl font-black mt-1">GHS {walletBalance.toFixed(2)}</h1>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => handleAddFunds(50)}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deposit GHS 50</span>
                </button>
                <button 
                  onClick={() => handleAddFunds(100)}
                  className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deposit GHS 100</span>
                </button>
              </div>
            </div>

            {/* MTN MoMo, Telecel Cash Integrations */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Supported Payment Methods</h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 border border-amber-100 bg-amber-50/50 rounded-xl text-[11px] font-bold text-amber-700">
                  MTN Mobile Money
                </div>
                <div className="p-2 border border-red-100 bg-red-50/50 rounded-xl text-[11px] font-bold text-red-700">
                  Telecel Cash
                </div>
                <div className="p-2 border border-indigo-100 bg-indigo-50/50 rounded-xl text-[11px] font-bold text-[#0B4DB8]">
                  AirtelTigo Cash
                </div>
                <div className="p-2 border border-slate-100 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700">
                  Credit/Debit Card
                </div>
              </div>
            </div>

            {/* Mock Transaction History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction History</h4>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 divide-y divide-slate-100">
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Deposit Approved</span>
                      <span className="text-[10px] text-slate-400 block">Mobile Money</span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600">+GHS 50.00</span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0B4DB8] flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Package Booking</span>
                      <span className="text-[10px] text-slate-400 block">Order Delivery Fee</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-700">-GHS 15.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800">Notifications</h3>
            {notifications.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <span>You're all caught up!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((not) => (
                  <div 
                    key={not.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
                  >
                    {!not.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                    )}
                    <h4 className="font-bold text-xs text-slate-800">{not.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{not.message}</p>
                    <span className="text-[9px] text-slate-400 mt-2 block">{new Date(not.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800">My Profile</h3>

            {/* Profile Header card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0B4DB8] font-bold flex items-center justify-center text-lg uppercase shadow-inner">
                {currentUserEmail[0]}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{currentUserEmail.split('@')[0]}</h4>
                <p className="text-xs text-slate-400">{currentUserEmail}</p>
              </div>
            </div>

            {/* Saved addresses */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Saved Addresses</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold block text-slate-800">Home</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">P. O. Box Sk 779, Sakumono, Tema</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold block text-slate-800">Office</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">Kojo Thompson Road, Adabraka, Accra</span>
                </div>
              </div>
            </div>

            {/* Settings links */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-xs text-slate-600 divide-y divide-slate-50">
              <div className="py-2.5 flex justify-between items-center cursor-pointer">
                <span>Account Security</span>
                <span className="text-slate-400">→</span>
              </div>
              <div className="py-2.5 flex justify-between items-center cursor-pointer">
                <span>Language & Region</span>
                <span className="text-slate-400">English</span>
              </div>
              <div className="py-2.5 flex justify-between items-center cursor-pointer" onClick={onLogout}>
                <span className="text-red-600 font-bold">Sign Out</span>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-16 flex items-center justify-around text-slate-400 z-50">
        <button 
          onClick={() => { setActiveTab('home'); setSelectedOrderForTracking(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#0B4DB8]' : ''}`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'bookings' ? 'text-[#0B4DB8]' : ''}`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[9px] font-bold">Bookings</span>
        </button>

        <button 
          onClick={() => { setActiveTab('wallet'); setSelectedOrderForTracking(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-[#0B4DB8]' : ''}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[9px] font-bold">Wallet</span>
        </button>

        <button 
          onClick={() => { setActiveTab('notifications'); setSelectedOrderForTracking(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'notifications' ? 'text-[#0B4DB8]' : ''}`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </div>
          <span className="text-[9px] font-bold">Alerts</span>
        </button>

        <button 
          onClick={() => { setActiveTab('profile'); setSelectedOrderForTracking(null); }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#0B4DB8]' : ''}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
}
