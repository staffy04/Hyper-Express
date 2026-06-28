import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface TrackingMapProps {
  pickup: { address: string; lat: number; lng: number };
  dropoff: { address: string; lat: number; lng: number };
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  riderLocation?: { lat: number; lng: number };
  onLocationUpdate?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function TrackingMap({
  pickup,
  dropoff,
  status,
  riderLocation,
  onLocationUpdate,
  interactive = false
}: TrackingMapProps) {
  // We'll project the lat/lng coordinates onto a beautiful 2D vector city grid
  // Standard coordinates for Accra, Ghana or generic city
  // Pickup lat: 5.6037, lng: -0.1870
  // Let's create a beautiful styled SVG representing the city
  const [progress, setProgress] = useState(0); // 0 to 1 along the path
  const [eta, setEta] = useState(15); // minutes

  // City map features - static decorative streets
  const gridLines = Array.from({ length: 12 }, (_, i) => i * 40);

  // Calculate coordinates in SVG viewport space (400x300)
  // Let's map pickup to (80, 220) and dropoff to (320, 80)
  const pX = 80;
  const pY = 220;
  const dX = 320;
  const dY = 80;

  // Let's calculate rider current position
  let rX = pX;
  let rY = pY;

  if (status === 'accepted') {
    // Rider is on the way to pickup
    // Starts at some off-grid point (e.g. 50, 40) and heads to pickup
    const startX = 40;
    const startY = 60;
    rX = startX + (pX - startX) * progress;
    rY = startY + (pY - startY) * progress;
  } else if (status === 'picked_up') {
    // Rider is on the way to dropoff
    rX = pX + (dX - pX) * progress;
    rY = pY + (dY - pY) * progress;
  } else if (status === 'delivered') {
    rX = dX;
    rY = dY;
  } else {
    // pending or cancelled, rider is at some neutral location
    rX = 40;
    rY = 60;
  }

  // Animate progress
  useEffect(() => {
    if (status === 'pending' || status === 'cancelled') {
      setProgress(0);
      setEta(15);
      return;
    }
    if (status === 'delivered') {
      setProgress(1);
      setEta(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          return 0; // loop
        }
        const next = prev + 0.02;
        // calculate ETA based on progress
        const remaining = Math.max(1, Math.round((1 - next) * 12));
        setEta(remaining);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="relative w-full h-[280px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner select-none">
      {/* Background City Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Decorative Roads / Freeways */}
        <path d="M 0 100 L 400 100" stroke="#334155" strokeWidth="4" fill="none" />
        <path d="M 200 0 L 200 300" stroke="#334155" strokeWidth="4" fill="none" />
        <path d="M 0 250 L 400 50" stroke="#475569" strokeWidth="6" fill="none" />
        
        {/* Secondary Roads */}
        <path d="M 50 0 L 50 300" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" fill="none" />
        <path d="M 350 0 L 350 300" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" fill="none" />
        <path d="M 0 180 L 400 180" stroke="#1e293b" strokeWidth="2" strokeDasharray="4" fill="none" />
        
        {/* Scenic green parks & water */}
        <circle cx="280" cy="240" r="40" fill="#064e3b" opacity="0.4" />
        <rect x="20" y="120" width="60" height="40" rx="8" fill="#1e3a8a" opacity="0.4" />
      </svg>

      {/* SVG Interactive Layers */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
        {/* Route Line */}
        {(status === 'accepted' || status === 'picked_up' || status === 'delivered') && (
          <>
            {/* Base route path */}
            <path
              d={`M ${pX} ${pY} L ${dX} ${dY}`}
              stroke="#0b4db8"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="6 4"
              fill="none"
              className="opacity-40"
            />
            {/* Animating glow track */}
            <path
              d={`M ${pX} ${pY} L ${dX} ${dY}`}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="15 150"
              strokeDashoffset={-progress * 150}
            />
          </>
        )}

        {/* Pickup Pin */}
        <g transform={`translate(${pX}, ${pY})`}>
          <circle r="18" fill="#0b4db8" className="opacity-20 animate-ping" />
          <circle r="8" fill="#0b4db8" />
          <circle r="4" fill="#ffffff" />
        </g>

        {/* Dropoff Pin */}
        <g transform={`translate(${dX}, ${dY})`}>
          <circle r="18" fill="#ef4444" className="opacity-20 animate-ping" />
          <polygon points="0,-10 8,5 -8,5" fill="#ef4444" />
          <circle r="3" fill="#ffffff" cy="-1" />
        </g>

        {/* Rider Icon */}
        {(status === 'accepted' || status === 'picked_up' || status === 'delivered') && (
          <g transform={`translate(${rX}, ${rY})`}>
            {/* Glow */}
            <circle r="16" fill="#10b981" className="opacity-25 animate-pulse" />
            {/* Mini motorcycle base */}
            <circle r="10" fill="#10b981" />
            {/* Direction Indicator */}
            <g transform="rotate(-45)">
              <polygon points="0,-6 4,4 -4,4" fill="#ffffff" />
            </g>
          </g>
        )}
      </svg>

      {/* Real-time Status Overlay */}
      <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900/40 rounded-lg flex items-center justify-center border border-blue-800/60">
            <Navigation className="w-5 h-5 text-blue-400 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {status === 'pending' && 'Awaiting Rider Acceptance'}
              {status === 'accepted' && 'Rider heading to Pickup'}
              {status === 'picked_up' && 'In Transit to Destination'}
              {status === 'delivered' && 'Package Delivered'}
              {status === 'cancelled' && 'Delivery Cancelled'}
            </div>
            <div className="text-sm font-bold truncate max-w-[160px]">
              {status === 'pending' && 'Finding matches...'}
              {status === 'accepted' && 'Rider on the way'}
              {status === 'picked_up' && 'Delivering your package'}
              {status === 'delivered' && 'Arrived safely!'}
              {status === 'cancelled' && 'Cancelled'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400">EST. ARRIVAL</div>
          <div className="text-lg font-black text-blue-400">
            {status === 'delivered' ? '0 min' : status === 'pending' ? '--' : `${eta} mins`}
          </div>
        </div>
      </div>

      {/* Floating Compass Widget */}
      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-slate-800 text-slate-400">
        <Compass className="w-4 h-4 animate-spin-slow text-blue-400" />
      </div>
    </div>
  );
}
