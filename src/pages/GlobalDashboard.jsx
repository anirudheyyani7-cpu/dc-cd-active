import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe, Zap, Leaf, Activity, Server, X, ChevronRight,
  Wifi, Award, Users, Bot, ArrowLeft, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadDatacenters, calculateGlobalStats, formatDatacenterForAI, getCountrySummary } from '../services/datacenter-data';
import { getCountryColor, formatMW, getPUEColor } from '../utils/helpers';
import { Badge, TierBadge, StatusBadge } from '../components/shared/Badge';
import { LoadingDots } from '../components/shared/LoadingDots';
import AIChatPanel from '../components/ai-chat/AIChatPanel';
import useAppStore from '../store/appStore';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createDCIcon(country, isSelected = false) {
  const color = getCountryColor(country);
  const size = isSelected ? 42 : 34;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 42" width="${size}" height="${size * 1.17}">
    <defs>
      <filter id="s${Math.random().toString(36).slice(2,6)}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.4"/>
      </filter>
    </defs>
    <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 24 18 24S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}" filter="url(#s${Math.random().toString(36).slice(2,6)})"/>
    <circle cx="18" cy="18" r="9" fill="white" opacity="0.9"/>
    <circle cx="18" cy="18" r="5" fill="${color}"/>
    ${isSelected ? `<circle cx="18" cy="18" r="12" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>` : ''}
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size * 1.17],
    iconAnchor: [size / 2, size * 1.17],
    popupAnchor: [0, -size * 1.17],
  });
}

function PopupViewDetails({ dc, setSelectedDatacenter, setShowAIPanel }) {
  const map = useMap();
  return (
    <button
      onClick={() => {
        map.closePopup();
        setSelectedDatacenter(dc);
        setShowAIPanel(false);
      }}
      className="w-full mt-3 text-xs px-3 py-1.5 bg-[#00338D] text-white rounded-lg hover:bg-[#0044b8] transition-colors font-semibold"
    >
      View Details →
    </button>
  );
}

function MapController({ selectedCountry, selectedDC, dcData }) {
  const map = useMap();

  useEffect(() => {
    if (!dcData) return;
    const countrySummaries = dcData.country_summary;

    if (selectedDC) {
      map.flyTo([selectedDC.coordinates.lat, selectedDC.coordinates.lng], 12, { duration: 1.2 });
    } else if (selectedCountry && selectedCountry !== 'All') {
      const summary = countrySummaries[selectedCountry];
      if (summary) {
        map.flyTo(summary.map_center, summary.map_zoom, { duration: 1.2 });
      }
    } else {
      map.flyTo([20, 5], 2, { duration: 1.2 });
    }
  }, [selectedCountry, selectedDC, map, dcData]);

  return null;
}

function CountUpNumber({ target, duration = 2000, suffix = '', prefix = '', decimals = 0 }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = Date.now();
    const end = start + duration;
    const step = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  const display = decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString();

  return (
    <span ref={ref} className="font-mono font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {prefix}{display}{suffix}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, suffix = '', prefix = '', decimals = 0, color = '#0077C8' }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '25' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-white text-xl leading-none mb-0.5">
          <CountUpNumber target={Number(value)} suffix={suffix} prefix={prefix} decimals={decimals} />
        </div>
        <div className="text-white/45 text-xs">{label}</div>
      </div>
    </motion.div>
  );
}

function DatacenterDetailPanel({ dc, onClose, onAskAI }) {
  const aiContext = dc ? formatDatacenterForAI(dc) : '';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-0 right-0 h-full w-96 bg-[#1A1F36] border-l border-white/10 z-[900] flex flex-col shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${getCountryColor(dc.country)} 0%, #1A1F36 100%)` }}
      >
        <div className="flex justify-between items-start mb-3">
          <StatusBadge status={dc.status} />
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <h2 className="text-white font-bold text-base leading-tight mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {dc.name}
        </h2>
        <p className="text-white/60 text-sm">{dc.operator} · {dc.city}, {dc.country}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Capacity', value: `${dc.capacity_mw} MW`, color: '#0077C8' },
            { label: 'Tier Rating', value: dc.tier_rating, color: '#D4A017' },
            { label: 'PUE', value: dc.pue.toFixed(2), color: getPUEColor(dc.pue) },
            { label: 'Renewable', value: `${dc.renewable_energy_pct}%`, color: '#00A36C' },
          ].map((m, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="text-xs text-white/40 mb-1">{m.label}</div>
              <div className="font-bold text-base" style={{ color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-[#D4A017]" />
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Certifications</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dc.certifications?.map((cert, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-[#D4A017]/10 text-[#D4A017] rounded-md border border-[#D4A017]/20 font-medium">
                {cert}
              </span>
            ))}
          </div>
        </div>

        {/* Key Tenants */}
        {dc.key_tenants?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-[#0077C8]" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Key Tenants</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dc.key_tenants.map((t, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-white/5 text-white/70 rounded-md border border-white/10">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connectivity */}
        {dc.connectivity?.submarine_cables?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wifi size={14} className="text-[#00A36C]" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Submarine Cables</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dc.connectivity.submarine_cables.map((c, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-[#00A36C]/10 text-[#00A36C] rounded-md border border-[#00A36C]/20">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cloud On-Ramps */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Server size={14} className="text-[#0077C8]" />
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Cloud On-Ramps</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dc.connectivity?.cloud_on_ramps?.map((c, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-[#0077C8]/10 text-[#0077C8] rounded-md border border-[#0077C8]/20">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Notable Facts */}
        {dc.notable_facts?.length > 0 && (
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Notable Facts</div>
            <ul className="space-y-1.5">
              {dc.notable_facts.map((fact, i) => (
                <li key={i} className="flex gap-2 text-xs text-white/60 leading-relaxed">
                  <span className="text-[#0077C8] mt-0.5 flex-shrink-0">▸</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Ask AI button */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onAskAI}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00338D] hover:bg-[#0044b8] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Bot size={16} />
          Ask AI about this facility
        </button>
      </div>
    </motion.div>
  );
}

const COUNTRIES = ['All', 'India', 'Singapore', 'Ireland', 'United Kingdom', 'United States'];

export default function GlobalDashboard() {
  const navigate = useNavigate();
  const [dcData, setDcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedCountry, setSelectedCountry, selectedDatacenter, setSelectedDatacenter } = useAppStore();
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDatacenters().then(data => {
      setDcData(data);
      setStats(calculateGlobalStats(data.datacenters));
      setLoading(false);
    });
    return () => {
      setSelectedDatacenter(null);
    };
  }, []);

  const filteredDCs = dcData?.datacenters.filter(dc => {
    const matchesCountry = selectedCountry === 'All' || dc.country === selectedCountry;
    const matchesSearch = !searchQuery || dc.name.toLowerCase().includes(searchQuery.toLowerCase()) || dc.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  }) ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1428] flex items-center justify-center pt-16">
        <div className="text-center">
          <LoadingDots color="#0077C8" size={12} />
          <p className="text-white/40 text-sm mt-4">Loading global datacenter intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1428] pt-16 flex flex-col">
      {/* Header */}
      <div className="bg-[#1A1F36] border-b border-white/8 px-6 py-4 flex-shrink-0">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-white/50 hover:text-white/80 transition-colors flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft size={16} />
              Back to Lifecycle
            </button>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#0077C8]" />
              <h1 className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Global Datacenter Dashboard
              </h1>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <StatCard icon={Server} label="Total Facilities" value={stats.total} color="#0077C8" />
              <StatCard icon={Zap} label="Combined Capacity" value={stats.totalCapacity} suffix=" MW" color="#D4A017" />
              <StatCard icon={Globe} label="Countries Covered" value={stats.countries} color="#00A36C" />
              <StatCard icon={Activity} label="Average PUE" value={stats.avgPUE} decimals={2} color="#0077C8" />
              <StatCard icon={Leaf} label="Avg Renewable %" value={stats.avgRenewable} suffix="%" color="#00A36C" />
            </div>
          )}

          {/* Filter row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {COUNTRIES.map(c => (
                <button
                  key={c}
                  onClick={() => { setSelectedCountry(c); setSelectedDatacenter(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCountry === c
                      ? 'bg-[#0077C8] text-white shadow-lg'
                      : 'bg-white/8 text-white/60 hover:text-white hover:bg-white/12 border border-white/10'
                  }`}
                >
                  {c === 'United Kingdom' ? 'UK' : c === 'United States' ? 'USA' : c}
                  {c !== 'All' && dcData && (
                    <span className="ml-1.5 opacity-60">
                      {dcData.datacenters.filter(d => d.country === c).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search facilities..."
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#0077C8]/50 w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[20, 5]}
            zoom={2}
            style={{ width: '100%', height: '100%', minHeight: 500 }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={19}
            />

            <MapController
              selectedCountry={selectedCountry}
              selectedDC={selectedDatacenter}
              dcData={dcData}
            />

            {filteredDCs.map(dc => (
              <Marker
                key={dc.id}
                position={[dc.coordinates.lat, dc.coordinates.lng]}
                icon={createDCIcon(dc.country, selectedDatacenter?.id === dc.id)}
              >
                <Popup className="dc-popup">
                  <div className="p-3 min-w-[200px]">
                    <div className="text-white font-bold text-sm mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {dc.name}
                    </div>
                    <div className="text-white/50 text-xs mb-3">{dc.operator}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className="text-[#0077C8] font-bold font-mono">{dc.capacity_mw}MW</div>
                        <div className="text-white/40 text-xs">Capacity</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold font-mono" style={{ color: getPUEColor(dc.pue) }}>{dc.pue}</div>
                        <div className="text-white/40 text-xs">PUE</div>
                      </div>
                    </div>
                    <PopupViewDetails
                      dc={dc}
                      setSelectedDatacenter={setSelectedDatacenter}
                      setShowAIPanel={setShowAIPanel}
                    />
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Facility count overlay */}
          <div className="absolute top-4 left-4 z-10 glass-dark rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00A36C] animate-pulse" />
              <span className="text-white/80 text-sm font-semibold">
                {filteredDCs.length} {filteredDCs.length === 1 ? 'facility' : 'facilities'} displayed
              </span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedDatacenter && (
            showAIPanel ? (
              <motion.div
                key="ai-panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute top-0 right-0 h-full w-96 bg-[#1A1F36] border-l border-white/10 z-[900] flex flex-col"
              >
                <div className="flex items-center gap-3 p-4 border-b border-white/10 flex-shrink-0">
                  <button
                    onClick={() => setShowAIPanel(false)}
                    className="text-white/50 hover:text-white/80 transition-colors"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <div className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      AI Analysis
                    </div>
                    <div className="text-white/40 text-xs">{selectedDatacenter.name}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-4">
                  <AIChatPanel
                    context={`You are analyzing this specific datacenter:\n\n${formatDatacenterForAI(selectedDatacenter)}`}
                    title={`${selectedDatacenter.name} AI Advisor`}
                    className="h-full"
                  />
                </div>
              </motion.div>
            ) : (
              <DatacenterDetailPanel
                key="detail-panel"
                dc={selectedDatacenter}
                onClose={() => setSelectedDatacenter(null)}
                onAskAI={() => setShowAIPanel(true)}
              />
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
