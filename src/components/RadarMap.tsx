import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Pause, ChevronRight, ChevronLeft, Navigation, Plus, Minus, Info, Settings, Map as MapIcon, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RadarMapProps {
  lat: number;
  lon: number;
  isDarkMode: boolean;
  onClose: () => void;
  t: any;
}

interface RadarFrame {
  time: number;
  path: string;
}

const RadarMap: React.FC<RadarMapProps> = ({ lat, lon, isDarkMode, onClose, t }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [nowIndex, setNowIndex] = useState(0);
  const [host, setHost] = useState('https://tilecache.rainviewer.com');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(600); // ms per frame
  const [loading, setLoading] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 7,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer(
      isDarkMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
      }
    ).addTo(map);

    // Add user location marker (Clime style blue dot)
    L.circleMarker([lat, lon], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 1
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => {
        map.invalidateSize();
    }, 500);

    return () => {
      map.remove();
    };
  }, [lat, lon, isDarkMode]);

  // Fetch Radar Frames
  const fetchFrames = async () => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      
      const pastFrames = data.radar.past || [];
      const nowcastFrames = data.radar.nowcast || [];
      
      // If we already have frames and nowcast is empty, don't overwrite with empty forecast
      // unless the past frames are also updated significantly.
      if (nowcastFrames.length === 0 && frames.length > 0) {
        console.warn('Fetched empty nowcast, preserving old forecast if possible');
        // Actually, Rainviewer nowcast usually resets every 30-60 mins.
      }

      const allRadarFrames = [...pastFrames, ...nowcastFrames];
      
      if (allRadarFrames.length > 0) {
        setFrames(allRadarFrames);
        setNowIndex(pastFrames.length - 1);
        setHost(data.host);
        // Only reset currentIndex if it's the first load or out of bounds
        if (loading || currentIndex >= allRadarFrames.length) {
          setCurrentIndex(pastFrames.length - 1);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch radar frames:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames();
    // Refresh data every 5 minutes to keep it live
    const refreshInterval = setInterval(fetchFrames, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Update Radar Layer when index changes
  useEffect(() => {
    if (!mapRef.current || frames.length === 0) return;

    const frame = frames[currentIndex];
    // Use 512px tiles for better quality, matching Clime's high-res look.
    // Scheme 8 is a vibrant rainbow scheme similar to premium weather apps.
    // tileSize 512 with zoomOffset -1 is a standard Leaflet pattern for high-res tiles.
    const url = `${host}${frame.path}/512/{z}/{x}/{y}/8/1_1.png`;

    if (radarLayerRef.current) {
      radarLayerRef.current.setUrl(url);
    } else {
      radarLayerRef.current = L.tileLayer(url, {
        opacity: 0.75,
        zIndex: 500,
        tileSize: 512,
        zoomOffset: -1,
        maxNativeZoom: 8, // Set to 8 (effectively 9 with offset) to be safe for RainViewer
        maxZoom: 18,
        className: 'radar-layer'
      }).addTo(mapRef.current);
    }
  }, [currentIndex, frames, host]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % frames.length);
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, speed]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const handleZoom = (delta: number) => {
    mapRef.current?.setZoom((mapRef.current.getZoom() ?? 7) + delta);
  };

  const handleRecenter = () => {
    mapRef.current?.setView([lat, lon], 9);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {/* Map Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative"
        style={{ zIndex: 1 }}
      />

      {/* Floating Zoom Controls */}
      <div className="absolute right-4 top-20 z-20 flex flex-col gap-2">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => handleZoom(1)}
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg backdrop-blur-md border ${isDarkMode ? 'bg-[#1E1F22]/80 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-[#001D36]'}`}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => handleZoom(-1)}
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg backdrop-blur-md border ${isDarkMode ? 'bg-[#1E1F22]/80 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-[#001D36]'}`}
        >
          <Minus className="w-5 h-5" />
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleRecenter}
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg backdrop-blur-md border ${isDarkMode ? 'bg-blue-500/80 border-white/10 text-white' : 'bg-[#002F66]/80 border-slate-200 text-white'}`}
        >
          <Navigation className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Radar Legend (Clime Style) */}
      <div className="absolute left-4 top-20 z-20 flex flex-col items-start gap-1 p-2 rounded-xl backdrop-blur-md border bg-black/30 border-white/10">
        <div className="h-20 w-1.5 rounded-full bg-gradient-to-t from-blue-400 via-green-400 via-yellow-400 via-orange-400 to-red-500" />
        <span className="text-[8px] font-bold text-white uppercase opacity-70">Rain</span>
      </div>

      {/* Immersive Control Pill */}
      <div className="absolute inset-x-0 bottom-6 z-20 px-4 pointer-events-none">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`max-w-md mx-auto w-full p-5 rounded-[40px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] pointer-events-auto backdrop-blur-2xl border ${isDarkMode ? 'bg-[#121212]/90 border-white/10' : 'bg-white/95 border-slate-200'}`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${frames[currentIndex]?.time > Date.now() / 1000 ? 'bg-blue-400' : 'bg-green-400'}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${isDarkMode ? 'text-white/40' : 'text-[#001D36]/40'}`}>
                    {frames[currentIndex]?.time > Date.now() / 1000 ? t.forecast : t.past}
                </span>
              </div>
              <span className={`text-2xl font-black tabular-nums ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
                {frames.length > 0 ? formatTime(frames[currentIndex].time) : '--:--'}
              </span>
            </div>

            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isDarkMode ? 'bg-white text-black' : 'bg-[#001D36] text-white'}`}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
            </div>
          </div>

          {/* New Modern Slider */}
          <div className="relative w-full h-8 flex items-center mb-2">
            <div className={`absolute inset-x-0 h-1.5 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
            
            {/* Markers */}
            <div className="absolute inset-x-0 flex justify-between px-1">
              {frames.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-0.5 rounded-full transition-all ${
                    i === nowIndex 
                      ? 'h-3 bg-blue-500 z-10' 
                      : (i % 6 === 0 ? 'h-1.5 bg-white/40' : 'h-1 bg-white/10')
                  }`} 
                />
              ))}
            </div>

            <input 
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(parseInt(e.target.value));
              }}
              className="absolute inset-x-0 w-full h-8 appearance-none bg-transparent cursor-pointer z-10 accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>

          <div className="flex justify-between mt-4">
             <button 
               onClick={() => {
                 setIsPlaying(false);
                 setCurrentIndex((prev) => (prev - 1 + frames.length) % frames.length);
               }}
               className={`flex items-center gap-2 text-xs font-bold transition-opacity hover:opacity-100 ${isDarkMode ? 'text-white/40' : 'text-[#001D36]/40'}`}
             >
               <ChevronLeft className="w-4 h-4" /> {t.back}
             </button>
             
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSpeed(s => s > 200 ? s - 200 : 800)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isDarkMode ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/5' : 'border-slate-200 text-[#001D36]/60 hover:text-[#001D36] hover:bg-slate-50'}`}
                >
                  {t.speedLabel}: {speed === 800 ? '0.5x' : speed === 600 ? '1x' : speed === 400 ? '2x' : '3x'}
                </button>
                
                <button 
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(nowIndex);
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${isDarkMode ? 'border-blue-500/30 text-blue-400' : 'border-blue-100 text-blue-600'}`}
                >
                  LIVE
                </button>
             </div>

             <button 
               onClick={() => {
                 setIsPlaying(false);
                 setCurrentIndex((prev) => (prev + 1) % frames.length);
               }}
               className={`flex items-center gap-2 text-xs font-bold transition-opacity hover:opacity-100 ${isDarkMode ? 'text-white/40' : 'text-[#001D36]/40'}`}
             >
               {t.next} <ChevronRight className="w-4 h-4" />
             </button>
          </div>
        </motion.div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-5">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              />
              <span className="text-white font-black tracking-[0.2em] text-[10px] uppercase opacity-80">Syncing Radar...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RadarMap;
