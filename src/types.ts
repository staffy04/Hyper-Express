export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'customer' | 'rider' | 'admin';
  profilePhoto?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface CustomerData {
  id: string;
  userId: string;
  walletBalance: number;
}

export interface RiderData {
  id: string;
  userId: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car';
  vehicleNumber: string;
  licenseNumber: string;
  rating: number;
  earningsBalance: number;
  onlineStatus: boolean;
}

export interface OrderData {
  id: string;
  customerId: string;
  customerName?: string;
  riderId?: string;
  riderName?: string;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoffLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  packageType: 'small' | 'large' | 'document' | 'box';
  packageWeight: number;
  packageDescription: string;
  fee: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  createdAt: string;
  notes?: string;
}

export interface TrackingPoint {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface PaymentData {
  id: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  amount: number;
  method: 'MTN Mobile Money' | 'Telecel Cash' | 'AirtelTigo Cash' | 'Card';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earnings';
  description: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
