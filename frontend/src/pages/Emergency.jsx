import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import {
  AlertTriangle, MapPin, Phone, Clock, Star,
  Navigation, Search, CheckCircle, Loader, X,
  Globe, RefreshCw, Radio, Wifi, Calendar,
  Building2, Crosshair, AlertCircle, PhoneCall,
  Siren, Activity
} from 'lucide-react';

const API = 'http://localhost:8000';
const PATIENT_ID = parseInt(localStorage.getItem('uhlis_user_id') || '2');
const PATIENT_NAME = localStorage.getItem('uhlis_user_name') || 'Patient';

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Overpass API: fetch real hospitals/clinics near a point ─────────────────
async function fetchNearbyHospitals(lat, lng, radiusMeters = 5000) {
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      node["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
      node["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
      way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
      way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
      relation["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  const data = await resp.json();
  return data.elements || [];
}

// ─── Nominatim reverse geocode ────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await resp.json();
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ─── Leaflet Map ──────────────────────────────────────────────────────────────
const LiveMap = ({ userLat, userLng, facilities, selectedFacility, onSelect }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [userLat, userLng],
      zoom: 14,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap | © CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapInstanceRef.current = map;

    // User location marker with pulsing ring
    const userIcon = L.divIcon({
      html: `<div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid #06b6d4;opacity:0.4;animation:ripple 2s infinite;"></div>
        <div style="width:20px;height:20px;border-radius:50%;background:#06b6d4;border:3px solid white;box-shadow:0 0 15px rgba(6,182,212,0.9);"></div>
      </div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<div style="background:#0f172a;color:white;padding:8px 14px;border-radius:10px;font-family:sans-serif;border:1px solid #1e293b;"><b style="color:#06b6d4">📍 Your Live Location</b><br><span style="font-size:11px;color:#64748b">${userLat.toFixed(5)}, ${userLng.toFixed(5)}</span></div>`);

    addFacilityMarkers(map, facilities);
  }, [userLat, userLng]);

  const addFacilityMarkers = (map, list) => {
    const L = window.L;
    if (!L) return;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    list.forEach((f) => {
      const lat = f.lat ?? f.center?.lat;
      const lon = f.lon ?? f.center?.lon;
      if (!lat || !lon) return;

      const isHospital = (f.tags?.amenity === 'hospital' || f.tags?.healthcare === 'hospital');
      const color = isHospital ? '#f97316' : '#22c55e';
      const emoji = isHospital ? '🏥' : '🩺';

      const icon = L.divIcon({
        html: `<div style="background:${color};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 0 12px ${color}90;font-size:16px;cursor:pointer;">${emoji}</div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const name = f.tags?.name || (isHospital ? 'Hospital' : 'Clinic');
      const dist = haversine(userLat, userLng, lat, lon).toFixed(1);

      const marker = L.marker([lat, lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="background:#0f172a;color:white;padding:12px 16px;border-radius:12px;font-family:sans-serif;min-width:210px;border:1px solid #1e293b;">
            <div style="font-weight:800;font-size:14px;margin-bottom:4px;">${name}</div>
            <div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">${f.tags?.amenity || f.tags?.healthcare || 'Medical Facility'}</div>
            <div style="font-size:11px;color:#22c55e;font-weight:bold;">${dist} km away</div>
            ${f.tags?.phone ? `<div style="font-size:11px;color:#06b6d4;margin-top:4px;">📞 ${f.tags.phone}</div>` : ''}
          </div>
        `);

      marker.on('click', () => onSelect(f));
      markersRef.current.push(marker);
    });
  };

  // Reload Leaflet from CDN then init
  useEffect(() => {
    const load = () => {
      if (!window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };
    load();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Re-center when user location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLat && userLng) {
      mapInstanceRef.current.setView([userLat, userLng], 14, { animate: true });
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
      }
    }
  }, [userLat, userLng]);

  // Re-draw markers when facilities change
  useEffect(() => {
    if (mapInstanceRef.current && window.L && facilities.length > 0) {
      addFacilityMarkers(mapInstanceRef.current, facilities);
    }
  }, [facilities]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes ripple { 0%,100% { transform:scale(1);opacity:.4; } 50% { transform:scale(2.2);opacity:.1; } }
        .leaflet-popup-content-wrapper { background:transparent!important;box-shadow:none!important;padding:0!important; }
        .leaflet-popup-content { margin:0!important; }
        .leaflet-popup-tip-container { display:none; }
      `}</style>
      <div ref={mapRef} className="w-full h-full rounded-2xl" />
    </div>
  );
};

// ─── EMERGENCY TYPES ──────────────────────────────────────────────────────────
const EMERGENCY_TYPES = [
  { key: 'Cardiac', label: 'Cardiac Emergency', icon: '❤️', desc: 'Heart attack, chest pain, cardiac arrest' },
  { key: 'Trauma', label: 'Trauma / Accident', icon: '🚨', desc: 'Road accident, fall, severe injury' },
  { key: 'Respiratory', label: 'Breathing Difficulty', icon: '🫁', desc: 'Asthma attack, choking, breathlessness' },
  { key: 'Neurological', label: 'Neurological', icon: '🧠', desc: 'Stroke, seizure, loss of consciousness' },
  { key: 'Burn', label: 'Burns / Chemical', icon: '🔥', desc: 'Fire burns, chemical or acid exposure' },
  { key: 'General', label: 'General Emergency', icon: '🏥', desc: 'Other critical medical emergency' },
];

const STATUS_STEPS = ['Dispatched', 'En Route', 'Nearby', 'Arrived'];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const Emergency = () => {
  const [tab, setTab] = useState('ambulance');

  // ── GPS State ──
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | loading | success | denied

  // ── Ambulance ──
  const [emergencyType, setEmergencyType] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [history, setHistory] = useState([]);
  const [etaCountdown, setEtaCountdown] = useState(null);
  const [statusIdx, setStatusIdx] = useState(0);

  // ── Map / Nearby ──
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityType, setFacilityType] = useState('all'); // all | hospital | clinic
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [radius, setRadius] = useState(5000);

  // ── Get GPS location ──────────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setMapError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('loading');
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);
        setGpsStatus('success');

        // Reverse geocode
        try {
          const addr = await reverseGeocode(lat, lng);
          setUserAddress(addr);
          setPickupAddress(addr);
        } catch {
          setUserAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          setPickupAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }

        // Fetch nearby hospitals
        loadNearbyFacilities(lat, lng, radius);
      },
      (err) => {
        setGpsStatus('denied');
        setMapError(
          err.code === 1
            ? 'Location access denied. Please allow location permission in your browser.'
            : 'Unable to get your location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [radius]);

  // ── Load facilities from Overpass ─────────────────────────────────────────
  const loadNearbyFacilities = async (lat, lng, radiusM = 5000) => {
    setMapLoading(true);
    setMapError('');
    try {
      const elements = await fetchNearbyHospitals(lat, lng, radiusM);
      // Deduplicate and enrich
      const seen = new Set();
      const enriched = [];
      for (const el of elements) {
        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        const name = el.tags?.name;
        if (!elLat || !elLon || !name) continue;
        const key = name.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        enriched.push({
          ...el,
          _lat: elLat,
          _lon: elLon,
          _dist: haversine(lat, lng, elLat, elLon),
          _name: name,
          _type: el.tags?.amenity || el.tags?.healthcare || 'medical',
        });
      }
      enriched.sort((a, b) => a._dist - b._dist);
      setFacilities(enriched);
      setFilteredFacilities(enriched);
      if (enriched.length === 0) {
        setMapError(`No medical facilities found within ${radiusM / 1000} km. Try increasing the radius.`);
      }
    } catch (e) {
      setMapError('Failed to load nearby facilities. Check your internet connection.');
    } finally {
      setMapLoading(false);
    }
  };

  // Auto-request location on mount
  useEffect(() => { requestLocation(); }, []);

  // Re-fetch when radius changes
  useEffect(() => {
    if (userLat && userLng) loadNearbyFacilities(userLat, userLng, radius);
  }, [radius]);

  // Filter facilities
  useEffect(() => {
    let list = facilities;
    if (facilityType !== 'all') {
      list = list.filter(f => {
        const t = f._type;
        if (facilityType === 'hospital') return t === 'hospital';
        if (facilityType === 'clinic') return ['clinic', 'doctors'].includes(t);
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => f._name.toLowerCase().includes(q) || f._type.includes(q));
    }
    setFilteredFacilities(list);
  }, [searchQuery, facilityType, facilities]);

  // ── Ambulance booking ─────────────────────────────────────────────────────
  const handleBookAmbulance = async () => {
    if (!emergencyType) { setBookingError('Please select an emergency type.'); return; }
    if (!pickupAddress.trim()) { setBookingError('Please enter your pickup address.'); return; }
    setBookingError('');
    setBookingLoading(true);
    try {
      const res = await fetch(`${API}/ambulance/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: PATIENT_ID,
          patient_name: PATIENT_NAME,
          pickup_address: pickupAddress,
          emergency_type: emergencyType,
          notes,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setBooking(data);
        setEtaCountdown(data.eta_minutes * 60);
        setStatusIdx(0);
        fetchHistory();
      } else {
        setBookingError('Booking failed. Please try again.');
      }
    } catch {
      setBookingError('Cannot reach server. Check that the backend is running.');
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/ambulance/history/${PATIENT_ID}`);
      setHistory(await res.json());
    } catch {}
  };

  useEffect(() => { fetchHistory(); }, []);

  // ETA countdown
  useEffect(() => {
    if (etaCountdown === null || etaCountdown <= 0) return;
    const t = setInterval(() => setEtaCountdown(p => (p <= 1 ? (clearInterval(t), 0) : p - 1)), 1000);
    return () => clearInterval(t);
  }, [etaCountdown]);

  // Status progression simulation (in real app, poll backend)
  useEffect(() => {
    if (!booking) return;
    const timers = [
      setTimeout(() => setStatusIdx(1), 4000),
      setTimeout(() => setStatusIdx(2), booking.eta_minutes * 60000 * 0.7),
      setTimeout(() => setStatusIdx(3), booking.eta_minutes * 60000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [booking]);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ─── GPS Status Banner ────────────────────────────────────────────────────
  const GpsBanner = () => {
    if (gpsStatus === 'success') return null;
    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border mb-6 ${
        gpsStatus === 'loading' ? 'bg-cyan-900/20 border-cyan-500/30' :
        gpsStatus === 'denied' ? 'bg-red-900/20 border-red-500/30' :
        'bg-slate-900/40 border-white/5'
      }`}>
        {gpsStatus === 'loading' ? (
          <><Loader className="animate-spin text-cyan-400 shrink-0" size={20} />
          <span className="text-cyan-300 text-sm font-medium">Detecting your real-time location via GPS…</span></>
        ) : gpsStatus === 'denied' ? (
          <><AlertCircle className="text-red-400 shrink-0" size={20} />
          <div className="flex-1 text-sm text-red-300">{mapError}</div>
          <button onClick={requestLocation} className="px-4 py-2 bg-red-600/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold hover:bg-red-600/30 transition-colors">
            Retry
          </button></>
        ) : (
          <><Crosshair className="text-slate-400 shrink-0" size={20} />
          <span className="text-slate-400 text-sm">Waiting for location…</span>
          <button onClick={requestLocation} className="ml-auto px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs font-bold">
            Allow Location
          </button></>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans">
      <Navbar />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-32 left-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 pt-28 pb-16">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <Siren className="text-red-400" size={20} />
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Emergency <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Services</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm ml-1">
              {gpsStatus === 'success'
                ? <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" /> Live GPS Active — {userLat?.toFixed(4)}, {userLng?.toFixed(4)}</span>
                : 'Real-time location tracking & emergency dispatch'}
            </p>
          </div>

          {/* Big SOS Call Button */}
          <a href="tel:108"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 border border-red-500/50 hover:from-red-500 hover:to-red-600 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)] group"
          >
            <PhoneCall size={24} className="text-white group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-black text-xl text-white leading-tight">CALL 108</div>
              <div className="text-xs text-red-200">National Ambulance (Free)</div>
            </div>
          </a>
        </div>

        {/* GPS Banner */}
        <GpsBanner />

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button onClick={() => setTab('ambulance')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'ambulance' ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-slate-400 hover:text-white'}`}>
            🚑 Ambulance Booking
          </button>
          <button onClick={() => setTab('map')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'map' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-slate-400 hover:text-white'}`}>
            <Globe size={16} /> Nearby Hospitals Map
          </button>
        </div>

        {/* ═══════════════════ AMBULANCE TAB ═══════════════════ */}
        {tab === 'ambulance' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT: Form */}
            <div className="xl:col-span-7 space-y-5">

              {/* SOS Banner */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-500/30">
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center animate-pulse text-2xl">🚨</div>
                  <div className="flex-1">
                    <div className="text-lg font-black text-red-300">Emergency Ambulance Dispatch</div>
                    <div className="text-sm text-slate-400 mt-1">Ambulances dispatched from nearest station. Always call <b className="text-red-300">108</b> for life-threatening emergencies.</div>
                  </div>
                  <a href="tel:108" className="hidden sm:flex flex-col items-center hover:scale-105 transition-transform">
                    <span className="text-3xl font-black text-red-400">108</span>
                    <span className="text-xs text-slate-500">Direct</span>
                  </a>
                </div>
              </div>

              {!booking ? (
                <>
                  {/* Your Location */}
                  <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center justify-center font-black border border-red-500/30">1</span>
                      Your Pickup Location
                    </h2>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                          value={pickupAddress}
                          onChange={e => setPickupAddress(e.target.value)}
                          placeholder={gpsStatus === 'loading' ? 'Detecting GPS location…' : 'Enter address or use GPS…'}
                          className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                      </div>
                      <button
                        onClick={() => { setPickupAddress(userAddress); }}
                        disabled={gpsStatus !== 'success'}
                        title="Use real GPS location"
                        className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-30"
                      >
                        <Crosshair size={18} />
                      </button>
                      <button
                        onClick={requestLocation}
                        title="Refresh GPS"
                        className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        <RefreshCw size={18} className={gpsStatus === 'loading' ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    {gpsStatus === 'success' && userAddress && (
                      <p className="text-xs text-green-400 mt-2 flex items-center gap-1.5">
                        <CheckCircle size={12} /> GPS detected: {userAddress.substring(0, 80)}…
                      </p>
                    )}
                  </div>

                  {/* Emergency Type */}
                  <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center justify-center font-black border border-red-500/30">2</span>
                      Emergency Type
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {EMERGENCY_TYPES.map(e => (
                        <button key={e.key} onClick={() => setEmergencyType(e.key)}
                          className={`p-3 rounded-xl border text-left transition-all ${emergencyType === e.key ? 'border-red-500/60 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-white/5 bg-slate-950/50 hover:border-white/15'}`}>
                          <div className="text-xl mb-1.5">{e.icon}</div>
                          <div className="font-bold text-xs text-white leading-tight">{e.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{e.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] flex items-center justify-center font-black border border-red-500/30">3</span>
                      Situation Details <span className="text-slate-600 font-normal normal-case">(optional)</span>
                    </h2>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      placeholder="Patient condition, known allergies, floor number, landmark…"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/40 resize-none transition-all"
                    />
                  </div>

                  {bookingError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <AlertTriangle size={16} /> {bookingError}
                    </div>
                  )}

                  <button onClick={handleBookAmbulance} disabled={bookingLoading}
                    className="w-full py-5 rounded-2xl font-black text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] flex items-center justify-center gap-3">
                    {bookingLoading ? <><Loader className="animate-spin" size={22} /> Dispatching…</> : <><span className="text-2xl">🚑</span> DISPATCH AMBULANCE</>}
                  </button>

                  <p className="text-center text-xs text-slate-600">For life-threatening emergencies, call <a href="tel:108" className="text-red-400 font-bold">108</a> directly for fastest response.</p>
                </>
              ) : (
                /* Active Booking Tracker */
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                        <CheckCircle className="text-green-400" size={22} />
                      </div>
                      <div>
                        <div className="font-black text-green-300 text-lg">Ambulance Confirmed</div>
                        <div className="text-xs text-slate-400">Booking #{booking.booking_id} · {booking.ambulance_id}</div>
                      </div>
                    </div>

                    {/* Countdown */}
                    <div className="text-center py-6 bg-slate-950/50 rounded-xl border border-white/5 mb-5">
                      <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">ETA</div>
                      <div className="text-7xl font-black text-white tabular-nums">{etaCountdown !== null ? fmt(etaCountdown) : '--:--'}</div>
                      <div className="text-xs text-slate-500 mt-2">Estimated based on current traffic</div>
                    </div>

                    {/* Status steps */}
                    <div className="flex items-center gap-1 mb-5">
                      {STATUS_STEPS.map((step, i) => (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${i < statusIdx ? 'bg-green-500 border-green-500' : i === statusIdx ? 'bg-red-500 border-red-500 animate-pulse' : 'bg-slate-900 border-slate-700'}`}>
                              {i < statusIdx ? <CheckCircle size={14} className="text-white" /> : i === statusIdx ? <Radio size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                            </div>
                            <span className={`text-[10px] mt-1 font-bold ${i <= statusIdx ? 'text-white' : 'text-slate-600'}`}>{step}</span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${i < statusIdx ? 'bg-green-500' : 'bg-slate-800'}`} />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Driver info */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                        <div className="text-xs text-slate-500 mb-1">Vehicle</div>
                        <div className="font-black text-cyan-400">{booking.ambulance_id}</div>
                      </div>
                      <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                        <div className="text-xs text-slate-500 mb-1">Driver</div>
                        <div className="font-bold text-xs text-white">{booking.driver_name}</div>
                      </div>
                      <a href={`tel:${booking.driver_phone}`} className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center hover:bg-green-500/20 transition-colors">
                        <div className="text-xs text-slate-500 mb-1">Call Driver</div>
                        <div className="flex items-center justify-center gap-1 text-green-400 text-xs font-bold"><Phone size={12} /> Call</div>
                      </a>
                    </div>
                  </div>

                  <button onClick={() => { setBooking(null); setStatusIdx(0); setEtaCountdown(null); setEmergencyType(''); setPickupAddress(userAddress); setNotes(''); }}
                    className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm font-bold">
                    Book Another Ambulance
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Emergency contacts + history */}
            <div className="xl:col-span-5 space-y-5">
              {/* Map mini-preview of user location */}
              {gpsStatus === 'success' && (
                <div className="rounded-2xl overflow-hidden border border-white/5" style={{ height: '200px' }}>
                  <LiveMap userLat={userLat} userLng={userLng} facilities={facilities.slice(0, 5)} selectedFacility={null} onSelect={() => {}} />
                </div>
              )}

              {/* Emergency Numbers */}
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Emergency Hotlines</h2>
                {[
                  { label: 'National Ambulance', num: '108', icon: '🚑', primary: true },
                  { label: 'Police', num: '100', icon: '🚔' },
                  { label: 'Fire Brigade', num: '101', icon: '🔥' },
                  { label: 'Disaster Management', num: '1078', icon: '🆘' },
                  { label: "Women's Helpline", num: '1091', icon: '🛡️' },
                ].map(c => (
                  <a key={c.num} href={`tel:${c.num}`}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors group ${c.primary ? 'bg-red-900/20 border border-red-500/20 mb-2 hover:bg-red-900/30' : 'hover:bg-white/5'}`}>
                    <span className="text-xl">{c.icon}</span>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${c.primary ? 'text-red-300' : 'text-white'}`}>{c.label}</div>
                    </div>
                    <span className={`font-black text-lg ${c.primary ? 'text-red-400' : 'text-slate-400 group-hover:text-white'} transition-colors`}>{c.num}</span>
                  </a>
                ))}
              </div>

              {/* First Aid */}
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick First Aid</h2>
                {[
                  { icon: '❤️', label: 'Cardiac Arrest', tip: '30 compressions + 2 breaths. Continue until help arrives.' },
                  { icon: '🩸', label: 'Heavy Bleeding', tip: 'Apply firm pressure with clean cloth. Elevate the limb.' },
                  { icon: '🫁', label: 'Choking Adult', tip: '5 firm back blows, then 5 abdominal thrusts. Repeat.' },
                  { icon: '⚡', label: 'Seizure', tip: 'Clear area, do not restrain. Time it. Recovery position after.' },
                ].map(item => (
                  <div key={item.label} className="flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="font-bold text-sm text-white">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.tip}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Booking History */}
              {history.length > 0 && (
                <div className="bg-slate-900/60 rounded-2xl border border-white/5 p-5">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Bookings</h2>
                  <div className="space-y-2">
                    {history.slice(0, 4).map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-xl">
                        <span className="text-lg">🚑</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{b.emergency_type}</div>
                          <div className="text-xs text-slate-500 truncate">{b.pickup_address?.substring(0, 40)}…</div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${b.status === 'Arrived' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════ MAP TAB ═══════════════════ */}
        {tab === 'map' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT: Controls + Facility List */}
            <div className="xl:col-span-4 space-y-4">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search hospitals, clinics…"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'hospital', 'clinic'].map(t => (
                  <button key={t} onClick={() => setFacilityType(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all capitalize ${facilityType === t ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
                    {t === 'all' ? '🏥 All' : t === 'hospital' ? '🏨 Hospitals' : '🩺 Clinics'}
                  </button>
                ))}
                <select value={radius} onChange={e => setRadius(Number(e.target.value))}
                  className="ml-auto bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none">
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={20000}>20 km</option>
                </select>
                <button onClick={() => userLat && loadNearbyFacilities(userLat, userLng, radius)}
                  className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors">
                  <RefreshCw size={16} className={mapLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/60 rounded-xl border border-white/5 p-3 text-center">
                  <div className="text-xl font-black text-white">{filteredFacilities.length}</div>
                  <div className="text-[10px] text-slate-500">Found</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl border border-white/5 p-3 text-center">
                  <div className="text-xl font-black text-orange-400">{filteredFacilities.filter(f => f._type === 'hospital').length}</div>
                  <div className="text-[10px] text-slate-500">Hospitals</div>
                </div>
                <div className="bg-slate-900/60 rounded-xl border border-white/5 p-3 text-center">
                  <div className="text-xl font-black text-green-400">{filteredFacilities.filter(f => ['clinic','doctors'].includes(f._type)).length}</div>
                  <div className="text-[10px] text-slate-500">Clinics</div>
                </div>
              </div>

              {mapError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30 text-yellow-300 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> {mapError}
                </div>
              )}

              {/* Facility List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {mapLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader className="animate-spin text-cyan-400" size={32} />
                    <p className="text-slate-500 text-sm text-center">Querying OpenStreetMap for<br />real medical facilities near you…</p>
                  </div>
                ) : gpsStatus !== 'success' ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <Crosshair className="text-slate-600" size={40} />
                    <div>
                      <p className="text-slate-400 font-bold">Location Required</p>
                      <p className="text-slate-600 text-xs mt-1">Allow GPS access to see real nearby hospitals</p>
                    </div>
                    <button onClick={requestLocation} className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/40 rounded-xl text-cyan-300 text-sm font-bold hover:bg-cyan-600/30 transition-colors">
                      Enable Location
                    </button>
                  </div>
                ) : filteredFacilities.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">No facilities found. Try a wider radius.</div>
                ) : (
                  filteredFacilities.map((f, idx) => {
                    const isHosp = f._type === 'hospital';
                    return (
                      <button key={f.id || idx} onClick={() => setSelectedFacility(selectedFacility?.id === f.id ? null : f)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${selectedFacility?.id === f.id ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_12px_rgba(6,182,212,0.15)]' : 'border-white/5 bg-slate-900/60 hover:border-white/15'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${isHosp ? 'bg-orange-500/10 border-orange-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                            {isHosp ? '🏥' : '🩺'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-white truncate">{f._name}</div>
                            <div className="text-xs text-slate-400 capitalize mt-0.5">{f._type}</div>
                            {f.tags?.['addr:street'] && <div className="text-xs text-slate-600 truncate">{f.tags['addr:street']}</div>}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-cyan-400 font-bold flex items-center gap-1">
                                <MapPin size={10} /> {f._dist.toFixed(1)} km
                              </span>
                              <span className="text-xs text-slate-500">~{Math.ceil(f._dist / 0.5)} min drive</span>
                              {f.tags?.phone && <span className="text-xs text-green-400">{f.tags.phone}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Expanded */}
                        {selectedFacility?.id === f.id && (
                          <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-fade-in">
                            {f.tags?.opening_hours && (
                              <div className="text-xs text-slate-400 flex items-center gap-2">
                                <Clock size={12} /> {f.tags.opening_hours}
                              </div>
                            )}
                            {f.tags?.website && (
                              <a href={f.tags.website} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 underline truncate block">{f.tags.website}</a>
                            )}
                            <div className="flex gap-2">
                              {f.tags?.phone && (
                                <a href={`tel:${f.tags.phone}`} className="flex-1 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold text-center hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1">
                                  <Phone size={12} /> Call
                                </a>
                              )}
                              <a href={`https://www.google.com/maps/dir/?api=1&destination=${f._lat},${f._lon}`} target="_blank" rel="noreferrer"
                                className="flex-1 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-1">
                                <Navigation size={12} /> Directions
                              </a>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Full Map */}
            <div className="xl:col-span-8">
              <div className="bg-slate-900/60 rounded-2xl border border-white/5 overflow-hidden" style={{ height: '680px' }}>
                {/* Map Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${gpsStatus === 'success' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <span className="text-sm font-bold text-white">
                      {gpsStatus === 'success' ? `Live Map · ${userLat?.toFixed(4)}, ${userLng?.toFixed(4)}` : 'Waiting for GPS…'}
                    </span>
                    {mapLoading && <Loader className="animate-spin text-cyan-400" size={14} />}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> You</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Hospital</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Clinic</span>
                    <span className="text-slate-600">Real OSM data</span>
                  </div>
                </div>

                <div style={{ height: 'calc(100% - 45px)' }}>
                  {gpsStatus === 'success' ? (
                    <LiveMap
                      userLat={userLat}
                      userLng={userLng}
                      facilities={filteredFacilities}
                      selectedFacility={selectedFacility}
                      onSelect={setSelectedFacility}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-slate-950">
                      <Crosshair className="text-slate-700" size={64} />
                      <div className="text-center">
                        <p className="text-slate-400 font-bold text-lg">GPS Location Required</p>
                        <p className="text-slate-600 text-sm mt-1 max-w-xs">Allow location access to see a real-time map of hospitals and clinics near you.</p>
                      </div>
                      <button onClick={requestLocation} className="px-6 py-3 bg-cyan-600/20 border border-cyan-500/40 rounded-xl text-cyan-300 font-bold hover:bg-cyan-600/30 transition-colors flex items-center gap-2">
                        <Crosshair size={18} /> {gpsStatus === 'loading' ? 'Locating…' : 'Enable GPS'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Facility Bottom Bar */}
              {selectedFacility && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 flex items-center gap-4 animate-fade-in">
                  <span className="text-3xl">{selectedFacility._type === 'hospital' ? '🏥' : '🩺'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white">{selectedFacility._name}</div>
                    <div className="text-sm text-slate-400 capitalize">{selectedFacility._type} · {selectedFacility._dist.toFixed(1)} km away · ~{Math.ceil(selectedFacility._dist / 0.5)} min drive</div>
                  </div>
                  <div className="flex gap-2">
                    {selectedFacility.tags?.phone && (
                      <a href={`tel:${selectedFacility.tags.phone}`} className="px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/25 transition-colors flex items-center gap-2">
                        <Phone size={15} /> Call
                      </a>
                    )}
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility._lat},${selectedFacility._lon}`} target="_blank" rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm font-bold hover:bg-blue-500/25 transition-colors flex items-center gap-2">
                      <Navigation size={15} /> Navigate
                    </a>
                    <button onClick={() => setSelectedFacility(null)} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default Emergency;
