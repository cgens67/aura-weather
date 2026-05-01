import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
const MIcon = (name: string) => ({ className, fill }: any) => {
  let size = '24px';
  if (className?.includes('w-3.5')) size = '14px';
  else if (className?.includes('w-3')) size = '12px';
  if (className?.includes('w-4')) size = '17px';
  if (className?.includes('w-5')) size = '20px';
  if (className?.includes('w-6')) size = '24px';
  if (className?.includes('w-7')) size = '28px';
  if (className?.includes('w-8')) size = '32px';
  if (className?.includes('w-12')) size = '48px';
  if (className?.includes('w-16')) size = '64px';
  
  return <span className={`material-symbols-rounded flex-shrink-0 ${fill ? '' : 'icon-unfilled'} ${className || ''}`} style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2', overflow: 'visible', verticalAlign: 'middle' }}>{name}</span>;
};

const ArrowLeft = MIcon('arrow_back');
const Search = MIcon('search');
const Plus = MIcon('add');
const Map = MIcon('map');
const CloudLightning = MIcon('thunderstorm');
const ChevronLeft = MIcon('chevron_left');
const ChevronRight = MIcon('chevron_right');
const Wind = MIcon('air');
const Droplets = MIcon('water_drop');
const Sun = MIcon('sunny');
const Eye = MIcon('visibility');
const Navigation = MIcon('navigation');
const Settings = MIcon('settings');
const Check = MIcon('check');
const Compass = MIcon('explore');
const Bell = MIcon('notifications');
const Type = MIcon('text_fields');
const Globe = MIcon('public');
const Zap = MIcon('bolt');
const ArrowDownToLine = MIcon('download');
const ChevronDown = MIcon('expand_more');
const X = MIcon('close');
const Activity = MIcon('light_mode');
const CloudRain = MIcon('rainy');
const Cloud = MIcon('cloud');
const Moon = MIcon('clear_night');
const CloudSun = MIcon('partly_cloudy_day');
const CloudMoon = MIcon('partly_cloudy_night');
const Star = MIcon('grade');
import RadarMap from './RadarMap';
import { translations } from '../lib/translations';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const getBortleScale = (lat: number, lon: number) => {
  const val = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 43758.5453;
  const hash = val - Math.floor(val);
  return Math.max(1, Math.min(9, Math.floor(hash * 9) + 1));
};

const getBortleDesc = (scale: number, t: any) => {
  if (scale <= 2) return t.bortleExcellent || "Excellent Dark Sky";
  if (scale <= 4) return t.bortleRural || "Rural Sky";
  if (scale <= 6) return t.bortleSuburban || "Suburban Sky";
  if (scale <= 8) return t.bortleCity || "City Sky";
  return t.bortleInnerCity || "Inner-City Sky";
};

interface WeatherDashboardProps {
  fontToggle: { isCustom: boolean; toggle: () => void };
  languageState: { current: 'en' | 'fr' | 'zh' | 'ms'; set: (lang: 'en' | 'fr' | 'zh' | 'ms') => void };
}

interface ParsedWeather {
  currentPrecip?: number;
  currentWind?: number;
  currentWindDir?: number;
  currentUv?: number;
  currentUvMax?: number;
  currentVisibility?: string;
  currentHumidity?: number;
  currentDewPoint?: number;
  bortleScale?: number;
  sunriseTime: string;
  sunsetTime: string;
}

// Weather code mapping
const getWeatherInfo = (code: number, t: any, isNight: boolean = false) => {
  switch (code) {
    case 0: return { label: t.clear || 'Clear', icon: isNight ? Moon : Sun };
    case 1: return { label: t.mainlyClear || 'Mainly Clear', icon: isNight ? CloudMoon : CloudSun };
    case 2: return { label: t.partlyCloudy || 'Partly Cloudy', icon: isNight ? CloudMoon : CloudSun };
    case 3: return { label: t.overcast || 'Overcast', icon: Cloud };
    case 45: case 48: return { label: t.foggy || 'Foggy', icon: Cloud };
    case 51: case 53: case 55: return { label: t.drizzle || 'Drizzle', icon: CloudRain };
    case 61: case 63: case 65: return { label: t.rain || 'Rain', icon: CloudRain };
    case 66: case 67: return { label: t.freezingRain || 'Freezing Rain', icon: CloudRain };
    case 71: case 73: case 75: return { label: t.snow || 'Snow', icon: Activity };
    case 77: return { label: t.snowGrains || 'Snow Grains', icon: Activity };
    case 80: case 81: case 82: return { label: t.rainShowers || 'Rain Showers', icon: CloudRain };
    case 85: case 86: return { label: t.snowShowers || 'Snow Showers', icon: Activity };
    case 95: return { label: t.thunderstorms || 'Thunderstorms', icon: CloudLightning };
    case 96: case 99: return { label: t.thunderstormsWithHail || 'Thunderstorms with Hail', icon: CloudLightning };
    default: return { label: t.unknown || 'Unknown', icon: Cloud };
  }
};

const getVisibilityLabel = (km: number, t: any) => {
  if (km >= 15) return t.visibilityExcellent;
  if (km >= 10) return t.visibilityGood;
  if (km >= 5) return t.visibilityModerate;
  if (km >= 2) return t.visibilityPoor;
  return t.visibilityVeryPoor;
};

const getHumidityLabel = (humidity: number, t: any) => {
  if (humidity >= 80) return t.humidityVeryHumid;
  if (humidity >= 60) return t.humidityHumid;
  if (humidity >= 40) return t.humidityComfortable;
  return t.humidityDry;
};

const getUvLabel = (uv: number, t: any) => {
  if (uv >= 11) return t.uvExtreme;
  if (uv >= 8) return t.uvVeryHigh;
  if (uv >= 6) return t.uvHigh;
  if (uv >= 3) return t.uvModerate;
  return t.uvLow;
};

// Reusable detailed stats component for the Bottom Sheet
const DetailContent = ({ type, t, parsed, isDarkMode, isMetric, weatherData, safeStartIndex }: { type: string, t: any, parsed: ParsedWeather, isDarkMode: boolean, isMetric: boolean, weatherData: any, safeStartIndex: number }) => {
  switch (type) {
    case 'precipitation':
      return (
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
            <Droplets className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
              {isMetric ? (parsed.currentPrecip ?? 0).toFixed(1) : ((parsed.currentPrecip ?? 0) * 0.0393701).toFixed(2)} {isMetric ? 'mm' : 'in'}
            </h3>
            <p className={isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}>{t.totalRain}</p>
          </div>
          <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}>
             <h4 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{t.last24Hours}</h4>
             <div className="flex items-end h-32 gap-2 text-xs font-bold text-[#44474E]">
                {[10, 30, 20, 60, 100, 80, 40].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2">
                    <motion.div 
                      className={`w-full rounded-t-lg ${isDarkMode ? 'bg-blue-400' : 'bg-[#0061A4]'}`} 
                      initial={{ height: 0 }} animate={{ height: `${h}%` }}
                      transition={{ delay: i * 0.05, type: 'spring' }}
                    />
                    <span className={isDarkMode ? 'text-slate-400' : ''}>{`${i * 4}h`}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      );
    case 'wind':
      const getWindDirLabel = (deg: number) => {
        const idx = Math.round(deg / 45) % 8;
        const labels = [t.n, t.ne, t.e, t.se, t.s, t.sw, t.w, t.nw];
        return labels[idx];
      };
      return (
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
            <Wind className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
            <h3 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{(parsed.currentWind ?? 0).toFixed(1)} <span className="text-xl">{isMetric ? 'km/h' : 'mph'}</span></h3>
            <p className={`text-lg font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{t.from} {getWindDirLabel(parsed.currentWindDir)}</p>
          </div>
          <div className={`rounded-3xl p-6 border relative flex items-center justify-center ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}>
             <div className={`w-48 h-48 rounded-full border-4 flex items-center justify-center relative ${isDarkMode ? 'border-blue-500/20' : 'border-[#0061A4]/20'}`}>
               <span className={`absolute top-2 font-bold ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>N</span>
               <span className={`absolute bottom-2 font-bold ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>S</span>
               <span className={`absolute left-4 font-bold ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>W</span>
               <span className={`absolute right-4 font-bold ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>E</span>
               <motion.div 
                 initial={{ rotate: -90 }} animate={{ rotate: parsed.currentWindDir }} transition={{ type: "spring", bounce: 0.5 }}
                 className="absolute inset-0 flex items-center justify-center"
               >
                 <Navigation className={`w-8 h-8 fill-current ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
               </motion.div>
             </div>
          </div>
        </div>
      );
    case 'sunrise':
      return (
        <div className="flex flex-col gap-6 p-4">
           <div className="text-center">
            <Sun className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{t.sunriseSunset}</h3>
          </div>
          <div className={`rounded-3xl p-6 border flex flex-col gap-4 ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}>
            <div className={`flex justify-between items-center p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{t.sunriseTime}</span>
              <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{parsed.sunriseTime}</span>
            </div>
            <div className={`flex justify-between items-center p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{t.sunsetTime}</span>
              <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{parsed.sunsetTime}</span>
            </div>
            <div className={`flex justify-between items-center p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{t.daylightMap}</span>
              <Globe className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`}/>
            </div>
          </div>
        </div>
      );
    case 'uv':
      return (
        <div className="flex flex-col p-4 text-[#1A1C1E] dark:text-white">
          <div className="flex items-center gap-2 mb-6 text-2xl font-normal">
            <Activity className="w-8 h-8" />
            <span>{t.uvIndex}</span>
          </div>

          <div className={`text-white rounded-3xl p-6 relative mb-8 flex flex-col justify-between ${isDarkMode ? 'bg-[#1E1F22]' : 'bg-[#1A1C1E]'}`}>
            <div>
               <div className="text-sm text-gray-400 mb-1">{t.uvIndexTodayHigh}</div>
               <div className="flex items-end gap-2 mb-8">
                 <span className="text-5xl font-light">{parsed.currentUvMax}</span>
                 <span className="text-2xl mb-1">{t.low}</span>
               </div>
            </div>
            
            <div className="absolute top-6 right-6 flex gap-2">
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                 <ChevronLeft className="w-5 h-5 text-gray-300" />
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                 <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* UV Graph */}
            <div className="flex justify-between items-end h-40 border-b border-white/10 pb-2 mb-2 relative overflow-x-auto hide-scrollbar gap-2">
               {weatherData?.hourly?.time?.slice(safeStartIndex, safeStartIndex + 10).map((time: string, idx: number) => {
                 const hDate = new Date(time);
                 const hHrs = hDate.getHours();
                 const hAmpm = hHrs >= 12 ? 'pm' : 'am';
                 const hFormat = hHrs % 12 || 12;
                 const hUv = weatherData?.hourly?.uv_index?.[safeStartIndex + idx] ?? 0;
                 const hCode = weatherData?.hourly?.weather_code?.[safeStartIndex + idx] ?? 0;
                 const { icon: HIcon } = getWeatherInfo(hCode, t, hHrs < 6 || hHrs > 18);
                 
                 return (
                   <div key={idx} className="flex flex-col items-center justify-end h-full gap-2 relative group w-8 flex-shrink-0">
                      <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: Math.max(hUv * 12, 4) + 'px' }}
                        className={`w-3 rounded-full ${hUv <= 2 ? 'bg-green-400' : hUv <= 5 ? 'bg-yellow-500' : hUv <= 7 ? 'bg-orange-500' : 'bg-red-500'}`}
                      />
                      <span className="text-sm font-medium">{Math.round(hUv)}</span>
                      <div className="h-6 flex items-center justify-center">
                        <HIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{hFormat}{hAmpm}</span>
                   </div>
                 );
               }) || [1,2,3,4,5,6,7,8,9,10].map(i => (
                 <div key={i} className="flex flex-col items-center justify-end h-full gap-2 relative group w-8 flex-shrink-0 opacity-20">
                    <div className="w-3 h-4 bg-gray-600 rounded-full" />
                    <span className="text-sm font-medium">0</span>
                    <div className="h-6" />
                    <span className="text-[10px] text-gray-400">--</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="space-y-6 text-[15px] leading-relaxed dark:text-gray-300 text-gray-800">
            <p>
              {t.uvDesc1}
            </p>
            <p>
              {t.uvDesc2}
            </p>
            <div>
              <strong className="block text-black dark:text-white mb-1">{t.uvLowNoProtection}</strong>
              {t.uvSafeOutside}
            </div>
            <div>
              <strong className="block text-black dark:text-white mb-1">{t.uvModProtection}</strong>
              {t.uvSeekShade}
            </div>
          </div>
        </div>
      );
    case 'visibility':
      return (
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
            <Eye className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
            <h3 className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{parsed.currentVisibility} <span className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`}>{isMetric ? 'km' : 'mi'}</span></h3>
          </div>
          <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}>
             <p className={`font-medium leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
               {getVisibilityLabel(isMetric ? parseFloat(parsed.currentVisibility) : parseFloat(parsed.currentVisibility) / 0.621371, t)}
             </p>
          </div>
        </div>
      );
    case 'humidity':
      return (
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
             <div className={`w-16 h-16 mx-auto mb-4 rounded-full rounded-t-full flex items-center justify-center ${isDarkMode ? 'bg-blue-400' : 'bg-[#001D36]'}`}>
               <Droplets className="w-8 h-8 text-white" />
             </div>
            <h3 className={`text-5xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{parsed.currentHumidity !== undefined ? parsed.currentHumidity.toFixed(0) : '--'}%</h3>
            <p className={`font-bold mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{parsed.currentDewPoint !== undefined ? parsed.currentDewPoint.toFixed(0) : '--'}° {t.dewPoint}</p>
          </div>
          <div className={`rounded-3xl p-6 border ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}>
             <p className={`font-medium leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
               {getHumidityLabel(parsed.currentHumidity ?? 0, t)}
             </p>
          </div>
        </div>
      );
    case 'bortle':
      return (
        <div className="flex flex-col gap-6 p-4">
          <div className="text-center">
            <Star className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-[#D4AF37]'}`} />
            <h3 className={`text-5xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{parsed.bortleScale !== undefined ? parsed.bortleScale : '--'}</h3>
            <p className={`font-bold mt-2 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{t.bortleScale}</p>
          </div>
          <div className={`rounded-3xl p-6 border flex flex-col gap-2 ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}>
             <p className={`font-medium leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
               {getBortleDesc(parsed.bortleScale ?? 5, t)}
             </p>
             <p className={`text-sm opacity-80 ${isDarkMode ? 'text-slate-300' : 'text-[#001D36]'}`}>
               {t.bortleDesc || "Measures the night sky's brightness."}
             </p>
          </div>
        </div>
      );
    default:
      return null;
  }
};

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

export default function WeatherDashboard({ fontToggle, languageState }: WeatherDashboardProps) {
  const t = translations[languageState.current];

  const [locations, setLocations] = useState<LocationData[]>([]);
  const [currentLocIndex, setCurrentLocIndex] = useState(0);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showLocations, setShowLocations] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  
  const locationName = locations[currentLocIndex]?.name || t.locating;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [backTapCount, setBackTapCount] = useState(0);

  const handleSearch = async () => {
    const query = newLocationInput.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
          headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        let newLocName = data[0].name || data[0].display_name.split(',')[0];
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        
        const existingIdx = locations.findIndex(l => l.name === newLocName);
        if (existingIdx === -1) {
           setLocations([...locations, { name: newLocName, lat: newLat, lon: newLon }]);
           setCurrentLocIndex(locations.length);
        } else {
           setCurrentLocIndex(existingIdx);
        }
        setNewLocationInput('');
        setShowLocations(false);
      } else {
        setToastMessage(t.locationNotFound || 'Location not found');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      setToastMessage(t.searchFailed || 'Search failed');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackPress = () => {
     if (backTapCount === 0) {
        setBackTapCount(1);
        setToastMessage(t.pressBackToExit);
        setTimeout(() => {
           setBackTapCount(0);
           setToastMessage(null);
        }, 2000);
     } else {
        // Mock app exit or PWA close
        setToastMessage(t.closingApp);
        setTimeout(() => {
           setToastMessage(null);
           window.close();
           // if window.close doesn't work, just navigate back
           window.history.back();
        }, 500);
     }
  };

  // Settings State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMetric, setIsMetric] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const hourlyRef = useRef<HTMLDivElement>(null);
  const dailyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      import('@capacitor/core').then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          StatusBar.setStyle({ style: isDarkMode ? Style.Dark : Style.Light }).catch(()=>{});
        }
      });
    }).catch(()=>{});
  }, [isDarkMode]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 200;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const daysArr = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];
  const currentHourTimeStr = weatherData?.current?.time?.substring(0, 14) + "00";
  const startIndex = weatherData?.hourly?.time?.indexOf(currentHourTimeStr);
  const safeStartIndex = startIndex !== -1 && startIndex !== undefined ? startIndex : 0;

  // Dynamic Hourly Data
  const hourlyItems = weatherData?.hourly?.time?.slice(safeStartIndex, safeStartIndex + 24).map((time: string, i: number) => {
    const d = new Date(time);
    const hrs = d.getHours();
    const ampm = hrs >= 12 ? 'pm' : 'am';
    const formatHrs = hrs % 12 || 12;
    const isNight = hrs < 6 || hrs > 18;
    
    const weatherCode = weatherData?.hourly?.weather_code?.[safeStartIndex + i] ?? 0;
    const { icon: IconComponent, label } = getWeatherInfo(weatherCode, t, isNight);
    
    let iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    if (label === t.clear || label === t.mainlyClear) iconColor = isNight ? 'text-blue-300' : 'text-yellow-500';
    if (label.includes(t.thunderstorms || 'Thunder')) iconColor = 'text-yellow-500';
    if (label.includes(t.rain || 'Rain')) iconColor = 'text-blue-400';

    const tempVal = weatherData?.hourly?.temperature_2m?.[safeStartIndex + i] ?? 27;
    const displayTemp = isMetric ? Math.round(tempVal) : Math.round(tempVal * 9/5 + 32);

    return {
      time: i === 0 ? t.now : `${formatHrs} ${ampm}`,
      temp: `${displayTemp}°`,
      chance: weatherData?.hourly?.precipitation_probability?.[safeStartIndex + i] > 0 ? `${weatherData?.hourly?.precipitation_probability?.[safeStartIndex + i]}%` : '',
      icon: <IconComponent className={`w-6 h-6 ${iconColor}`} fill="currentColor"/>
    };
  }) || [];

  // Dynamic Daily Data
  const dailyItems = weatherData?.daily?.time?.map((time: string, i: number) => {
    const d = new Date(time);
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    
    const weatherCode = weatherData?.daily?.weather_code?.[i] ?? 0;
    const { icon: IconComponent, label } = getWeatherInfo(weatherCode, t);
    
    let iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    if (label === t.clear || label === t.mainlyClear) iconColor = 'text-yellow-500';
    if (label.includes(t.thunderstorms || 'Thunder')) iconColor = 'text-yellow-500';
    if (label.includes(t.rain || 'Rain')) iconColor = 'text-blue-400';

    const highVal = weatherData?.daily?.temperature_2m_max?.[i] ?? 33;
    const lowVal = weatherData?.daily?.temperature_2m_min?.[i] ?? 25;
    const displayHigh = isMetric ? Math.round(highVal) : Math.round(highVal * 9/5 + 32);
    const displayLow = isMetric ? Math.round(lowVal) : Math.round(lowVal * 9/5 + 32);

    return {
      day: i === 0 ? t.today : daysArr[d.getDay()],
      date: `${dayStr}/${monthStr}`,
      high: `${displayHigh}°`,
      low: `${displayLow}°`,
      chance: `${weatherData?.daily?.precipitation_probability_max?.[i] ?? 0}%`,
      active: i === 0,
      icon: <IconComponent className={`w-7 h-7 ${iconColor}`} fill="currentColor"/>
    };
  }) || [];

  // Geolocation detection on mount
  useEffect(() => {
    let isMounted = true;
    
    const fallbackTimer = setTimeout(() => {
      if (isMounted && loadingLocation) {
        setLoadingLocation(false);
        if (locations.length === 0) setLocations([{ name: 'Malacca', lat: 2.196, lon: 102.2405 }]);
      }
    }, 8000); // 8 second timeout

    const fetchLocation = async () => {
      if (locations.length > 0) return;
      try {
        let coords: {latitude: number, longitude: number};
        if (Capacitor.isNativePlatform()) {
          const hasPerms = await Geolocation.checkPermissions();
          if (hasPerms.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
          const position = await Geolocation.getCurrentPosition({ timeout: 7000, maximumAge: 60000 });
          coords = position.coords;
        } else if ("geolocation" in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 7000, maximumAge: 60000 });
          });
          coords = position.coords;
        } else {
          throw new Error("Geolocation not supported");
        }

        if (!isMounted) return;

        try {
          // add a timeout to the fetch as well
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          const locName = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.state || 'Malacca';
          setLocations([{ name: locName, lat: coords.latitude, lon: coords.longitude }]);
        } catch(e) {
          setLocations([{ name: t.locationFound || 'Location Found', lat: coords.latitude, lon: coords.longitude }]);
        }
      } catch (error) {
        if (!isMounted) return;
        setLocations([{ name: 'Malacca', lat: 2.196, lon: 102.2405 }]);
        console.error("Geolocation error:", error);
      } finally {
        if (isMounted) {
          setLoadingLocation(false);
          clearTimeout(fallbackTimer);
        }
      }
    };

    fetchLocation();
    
    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      const loc = locations[currentLocIndex];
      if (!loc) return;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,visibility,uv_index,dew_point_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        if (isMounted && !data.error) {
          setWeatherData(data);
        } else if (data.error) {
           console.error("Open-Meteo API Error:", data.reason);
           setToastMessage("Weather Data: " + data.reason);
           setTimeout(() => setToastMessage(null), 3000);
        }
      } catch (e) {
        console.error("Failed to fetch weather data:", e);
        setToastMessage("Network error fetching weather");
        setTimeout(() => setToastMessage(null), 3000);
      }
    };
    if (locations.length > 0) fetchWeather();
    return () => { isMounted = false; };
  }, [currentLocIndex, locations]);

  const currentPrecip = weatherData?.current?.precipitation;
  const rawWind = weatherData?.current?.wind_speed_10m;
  const currentWind = rawWind !== undefined ? (isMetric ? rawWind : rawWind / 1.609) : undefined;
  const currentWindDir = weatherData?.current?.wind_direction_10m;
  const currentUv = weatherData?.current?.uv_index;
  const currentUvMax = weatherData?.daily?.uv_index_max?.[0];
  const currentVisibilityRaw = weatherData?.current?.visibility !== undefined ? weatherData.current.visibility / 1000 : undefined;
  const currentVisibility = currentVisibilityRaw !== undefined ? (isMetric ? currentVisibilityRaw.toFixed(0) : (currentVisibilityRaw * 0.621371).toFixed(1)) : undefined;
  const currentVisibilityUnit = isMetric ? 'km' : 'mi';
  const currentHumidity = weatherData?.current?.relative_humidity_2m;
  const rawDewPoint = weatherData?.current?.dew_point_2m;
  const currentDewPoint = rawDewPoint !== undefined ? (isMetric ? rawDewPoint : (rawDewPoint * 9/5 + 32)) : undefined;
  
  const [cityTime, setCityTime] = useState<string>('--:--');
  useEffect(() => {
    if (!weatherData) return;
    const updateTime = () => {
      if (weatherData.utc_offset_seconds === undefined) return;
      const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
      const cityDate = new Date(utc + (weatherData.utc_offset_seconds * 1000));
      let hours = cityDate.getHours();
      const minutes = String(cityDate.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      setCityTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [weatherData]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    const parts = isoString.split('T');
    if (parts.length < 2) return '--:--';
    const timeParts = parts[1].split(':');
    let hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const currentLocationTime = cityTime;
  const sunriseTime = formatTime(weatherData?.daily?.sunrise?.[0]);
  const sunsetTime = formatTime(weatherData?.daily?.sunset?.[0]);

  const rawTemp = weatherData?.current?.temperature_2m;
  const rawApparent = weatherData?.current?.apparent_temperature;
  const rawHigh = weatherData?.daily?.temperature_2m_max?.[0];
  const rawLow = weatherData?.daily?.temperature_2m_min?.[0];

  const currentTemp = rawTemp !== undefined ? (isMetric ? rawTemp : (rawTemp * 9/5 + 32)) : undefined;
  const currentApparentTemp = rawApparent !== undefined ? (isMetric ? rawApparent : (rawApparent * 9/5 + 32)) : undefined;
  const currentHigh = rawHigh !== undefined ? (isMetric ? rawHigh : (rawHigh * 9/5 + 32)) : undefined;
  const currentLow = rawLow !== undefined ? (isMetric ? rawLow : (rawLow * 9/5 + 32)) : undefined;
  
  const loc = locations[currentLocIndex];
  const bortleScale = loc ? getBortleScale(loc.lat, loc.lon) : undefined;

  const parsedData: ParsedWeather = {
    currentPrecip,
    currentWind,
    currentWindDir,
    currentUv,
    currentUvMax,
    currentVisibility,
    currentHumidity,
    currentDewPoint,
    bortleScale,
    sunriseTime,
    sunsetTime
  };

  return (
    <div className={`relative w-full h-full min-h-screen max-w-md mx-auto shadow-2xl overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#131314] text-white' : 'bg-[#F7F9FF] text-[#1A1C1E]'}`} style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* Main Scrollable Content */}
      <div className="relative z-10 h-screen overflow-y-auto overflow-x-hidden hide-scrollbar pb-24">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-8 sticky top-0 z-20 backdrop-blur-md">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleBackPress}
            className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#001D36]'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex flex-col items-center">
            {loadingLocation && <div className="text-xs uppercase tracking-widest opacity-60 mb-1 animate-pulse">{t.locating}</div>}
            <motion.button 
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowLocations(true)}
               className={`flex flex-col items-center hover:opacity-80 transition`}
            >
               <div className="flex items-center gap-1">
                 <motion.h1 
                    key={locationName}
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className={`text-2xl tracking-normal font-bold ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}
                 >
                   {locationName}
                 </motion.h1>
                 <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`} />
               </div>
               {!loadingLocation && weatherData?.current?.time && (
                 <span className={`text-sm font-medium opacity-70 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                    {currentLocationTime}
                 </span>
               )}
            </motion.button>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#001D36]'}`}
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </header>

        {/* Current Weather summary */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center pt-8 pb-10 mt-2 mx-4 mb-6 bg-gradient-to-br from-[#D3E4FF] to-[#99CBFF] rounded-[40px] shadow-sm relative overflow-hidden"
        >
          {/* Subtle noise pattern overlay for texture */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay pointer-events-none"></div>

          {(() => {
             const { label, icon: CurrentIcon } = getWeatherInfo(weatherData?.current?.weather_code ?? 0, t);
             return (
               <div className="flex items-center gap-2 mb-2 relative z-10">
                 <CurrentIcon className="w-8 h-8 text-[#001D36]" fill="currentColor" />
                 <span className="text-xl text-[#001D36] font-semibold">{label}</span>
               </div>
             );
          })()}
          
          <motion.div 
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.6 }}
            className="text-[120px] leading-none font-black tracking-tighter text-[#001D36] pr-4 relative z-10"
          >
            {currentTemp !== undefined ? Math.round(currentTemp) : '--'}°
          </motion.div>
          
          <div className="flex flex-col items-center mt-4 gap-1.5 relative z-10">
            <span className="text-xl font-medium text-[#001D36]">{t.feelsLike} {currentApparentTemp !== undefined ? Math.round(currentApparentTemp) : '--'}°</span>
            <span className="text-lg font-medium text-[#001D36] opacity-80">{t.high} {currentHigh !== undefined ? Math.round(currentHigh) : '--'}° · {t.low} {currentLow !== undefined ? Math.round(currentLow) : '--'}°</span>
          </div>
        </motion.div>

        {/* Forecast Cards Container */}
        <div className="px-4 space-y-4">
          
          {/* Hourly Forecast */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`rounded-[32px] p-5 shadow-sm border ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${isDarkMode ? 'border-white' : 'border-[#001D36]'}`}>L</div>
                <span className="font-bold text-[15px]">{t.hourlyForecast}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollContainer(hourlyRef, 'left')} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-white/10 text-white/50' : 'bg-[#F1F3F9] text-[#44474E]'}`}><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => scrollContainer(hourlyRef, 'right')} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-[#F1F3F9] text-[#0061A4]'}`}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div ref={hourlyRef} className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 snap-x">
               {hourlyItems.map((item, i) => (
                 <div key={i} className="flex flex-col items-center justify-between min-w-[50px] gap-2 snap-start">
                   <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-[#1A1C1E]'}`}>{item.temp}</span>
                   <div className="py-2">{item.icon}</div>
                   <span className={`text-xs font-bold h-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`}>{item.chance}</span>
                   <span className={`text-sm mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{item.time}</span>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* 10-day forecast */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`rounded-[32px] p-5 shadow-sm border ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
          >
           <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
                <div className={`w-4 h-4 rounded-sm border-2 ${isDarkMode ? 'border-white' : 'border-[#001D36]'}`}></div>
                <span className="font-bold text-[15px]">{t.tenDayForecast}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => scrollContainer(dailyRef, 'left')} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-white/10 text-white/50' : 'bg-[#F1F3F9] text-[#44474E]'}`}><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => scrollContainer(dailyRef, 'right')} className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-[#F1F3F9] text-[#0061A4]'}`}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div ref={dailyRef} className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 snap-x">
              {dailyItems.map((item, i) => (
                <div key={i} className={`flex flex-col items-center min-w-[70px] p-3 rounded-full border ${item.active ? (isDarkMode ? 'bg-blue-500/20 border-blue-400' : 'bg-[#D3E4FF] border-[#0061A4]') : 'border-transparent'} gap-1 snap-start`}>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1A1C1E]'}`}>{item.high}</span>
                  <span className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{item.low}</span>
                  {item.icon}
                  <span className={`text-xs font-bold mt-1 mb-2 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`}>{item.chance}</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#1A1C1E]'}`}>{item.day}</span>
                  <span className={`opacity-70 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{item.date}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interactive Map Entry */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowRadar(true)}
            className={`rounded-[40px] p-5 shadow-sm border relative overflow-hidden h-48 group cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#E1E2EC] border-[#DCE2F9]'}`}
          >
            <div className={`absolute inset-0 mix-blend-multiply z-0 ${isDarkMode ? 'bg-slate-800/50' : 'bg-blue-100/50'}`}></div>
            {/* Map preview graphics */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent z-0"></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-2xl rounded-full z-0 ${isDarkMode ? 'bg-green-500/20' : 'bg-green-500/30'}`}></div>
            <div className={`absolute top-1/3 left-1/3 w-24 h-24 blur-xl rounded-full z-0 ${isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-500/40'}`}></div>
            <div className={`absolute top-1/3 left-1/3 w-12 h-12 blur-lg rounded-full z-0 ${isDarkMode ? 'bg-red-500/40' : 'bg-red-500/50'}`}></div>
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
                <Map className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
                <span className="font-bold text-[15px]">{t.interactiveMap}</span>
              </div>
            </div>
            
            <div className="relative z-10 h-full flex items-center justify-center">
               <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm backdrop-blur-md flex items-center gap-2 group-hover:scale-105 transition-transform ${isDarkMode ? 'bg-white/10 text-white' : 'bg-white/80 text-[#001D36]'}`}>
                 <Navigation className="w-4 h-4" />
                 {t.viewRadar}
               </span>
            </div>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 gap-3 pb-8">
            {/* Precipitation */}
            <motion.div 
               whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
               onClick={() => setExpandedCard('precipitation')}
               className={`rounded-[32px] p-5 shadow-sm border aspect-square flex flex-col justify-between cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
            >
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                <Droplets className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
                <span className="text-sm font-bold">{t.precipitation}</span>
              </div>
              <div>
                <div className={`text-4xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
                  {currentPrecip !== undefined ? (isMetric ? currentPrecip.toFixed(1) : (currentPrecip * 0.0393701).toFixed(2)) : '--'}
                  <span className="text-xl font-bold ml-1">{isMetric ? 'mm' : 'in'}</span>
                </div>
                <div className={`text-sm leading-tight font-medium ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{t.totalRain}</div>
              </div>
            </motion.div>

            {/* Wind */}
            <motion.div 
               whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
               onClick={() => setExpandedCard('wind')}
               className={`rounded-[32px] p-1 shadow-sm border aspect-square relative overflow-hidden cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
            >
               <div className={`absolute inset-2 shape-wind flex flex-col justify-between p-4 ${isDarkMode ? 'bg-[#2A2B2E]' : 'bg-[#F1F3F9]'}`}>
                 <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                  <Wind className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
                  <span className="text-sm font-bold">{t.wind}</span>
                </div>
                <div className="flex flex-col items-center justify-center h-full mt-2">
                  <div className={`text-5xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{currentWind !== undefined ? currentWind.toFixed(1) : '--'}<span className="text-xl font-bold ml-1">{isMetric ? 'km/h' : 'mph'}</span></div>
                  <div className={`font-medium text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                    {t.from} {(() => {
                      const idx = Math.round((currentWindDir ?? 0) / 45) % 8;
                      const labels = [t.n, t.ne, t.e, t.se, t.s, t.sw, t.w, t.nw];
                      return labels[idx];
                    })()}
                  </div>
                </div>
               </div>
            </motion.div>

            {/* Sunrise & Sunset */}
            <motion.div 
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setExpandedCard('sunrise')}
              className={`rounded-[32px] p-5 shadow-sm border aspect-square relative overflow-hidden cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
            >
              <div className={`flex items-center gap-2 z-10 relative ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                <Sun className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
                <span className="text-sm font-bold line-clamp-1">{t.sunriseSunset}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[65%] overflow-hidden flex flex-col justify-end">
                 {/* Fake Sine Wave */}
                 <div className={`w-[120%] h-24 rounded-[100%] rounded-b-none -ml-[10%] relative border-t-2 ${isDarkMode ? 'bg-blue-900/10 border-blue-400/30' : 'bg-[#D3E4FF] border-[#0061A4]/50'}`}>
                    <div className={`absolute top-[-6px] left-[70%] w-3 h-3 bg-yellow-500 rounded-full ${isDarkMode ? 'shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'shadow-[0_0_10px_rgba(234,179,8,0.8)]'}`}></div>
                 </div>
                 <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                   <div className={`flex flex-col gap-1.5 text-[13px] font-medium leading-relaxed ${isDarkMode ? 'text-white' : 'text-[#1A1C1E]'}`}>
                      <div className="flex items-center gap-1.5 whitespace-nowrap"><Sun className="w-3.5 h-3.5"/> {sunriseTime}</div>
                      <div className="flex items-center gap-1.5 whitespace-nowrap"><Sun className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-500' : 'text-[#44474E]'}`}/> {sunsetTime}</div>
                   </div>
                 </div>
              </div>
            </motion.div>

            {/* UV Index */}
            <motion.div 
               whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
               onClick={() => setExpandedCard('uv')}
               className={`rounded-[32px] p-2 shadow-sm border aspect-square cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
            >
               <div className={`h-full w-full shape-uv flex flex-col items-center justify-center relative shadow-sm ${isDarkMode ? 'bg-[#2A2B2E]' : 'bg-[#F1F3F9]'}`}>
                  <div className={`absolute top-4 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                    <Sun className={`w-3 h-3 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
                    <span className="text-xs font-bold">{t.uvIndex}</span>
                  </div>
                  <div className={`text-5xl font-black mt-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{currentUv}</div>
                  <div className={`text-lg font-bold ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{getUvLabel(currentUv, t)}</div>
                  
                  <div className="absolute bottom-3 w-16 h-1 flex justify-between px-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-[#0061A4]'}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${currentUv >= 3 ? (isDarkMode ? 'bg-blue-400' : 'bg-[#0061A4]') : (isDarkMode ? 'bg-slate-700' : 'bg-[#DCE2F9]')}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${currentUv >= 6 ? (isDarkMode ? 'bg-blue-400' : 'bg-[#0061A4]') : (isDarkMode ? 'bg-slate-700' : 'bg-[#DCE2F9]')}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${currentUv >= 8 ? (isDarkMode ? 'bg-blue-400' : 'bg-[#0061A4]') : (isDarkMode ? 'bg-slate-700' : 'bg-[#DCE2F9]')}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${currentUv >= 11 ? (isDarkMode ? 'bg-blue-400' : 'bg-[#0061A4]') : (isDarkMode ? 'bg-slate-700' : 'bg-[#DCE2F9]')}`}></div>
                  </div>
               </div>
            </motion.div>

            {/* Visibility */}
            <motion.div 
               whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
               onClick={() => setExpandedCard('visibility')}
               className={`rounded-[32px] p-3 shadow-sm border aspect-square flex items-center justify-center cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-white border-[#DCE2F9]'}`}
            >
               <div className={`w-full h-full shape-visibility flex flex-col justify-center items-center relative border-4 border-solid border-transparent ${isDarkMode ? 'bg-[#2A2B2E]' : 'bg-[#F1F3F9]'}`}>
                 <div className={`absolute top-3 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>
                    <Eye className={`w-3 h-3 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`} />
                    <span className="text-xs font-bold">{t.visibility}</span>
                  </div>
                  <div className="mt-4"><span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{currentVisibility !== undefined ? currentVisibility : '--'}</span><span className={`text-xl font-bold ml-1 ${isDarkMode ? 'text-slate-400' : 'text-[#44474E]'}`}>{currentVisibilityUnit}</span></div>
               </div>
            </motion.div>

            {/* Humidity */}
            <motion.div 
               whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
               onClick={() => setExpandedCard('humidity')}
               className={`rounded-[32px] p-5 shadow-sm border aspect-square flex flex-col justify-between cursor-pointer ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-[#D3E4FF] border-[#DCE2F9]'}`}
            >
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>
                <span className={`w-2.5 h-3.5 rounded-full rounded-t-full ${isDarkMode ? 'bg-white' : 'bg-[#001D36]'}`}></span>
                <span className="text-sm font-bold">{t.humidity}</span>
              </div>
              <div className="flex flex-col justify-end">
                <div className={`text-5xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{currentHumidity !== undefined ? currentHumidity.toFixed(0) : '--'}%</div>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-blue-300' : 'text-[#0061A4]'}`}>{currentDewPoint !== undefined ? currentDewPoint.toFixed(0) : '--'}° {t.dewPoint}</div>
              </div>
            </motion.div>

            {/* Bortle Scale */}
            <motion.div 
               whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
               onClick={() => setExpandedCard('bortle')}
               className={`rounded-[32px] p-5 shadow-sm border aspect-square flex flex-col justify-between cursor-pointer ${isDarkMode ? 'bg-[#1E1F22] border-[#2D2E31]' : 'bg-[#E5D4FF] border-[#C2A5FF]'}`}
            >
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-[#3E1A7A]'}`}>
                <Star className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-[#F5B041]'}`} fill="currentColor" />
                <span className="text-sm font-bold truncate">{t.bortleScale || 'Bortle Scale'}</span>
              </div>
              <div className="flex flex-col justify-end">
                <div className={`text-5xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-[#3E1A7A]'}`}>{bortleScale ?? '--'}</div>
                <div className={`text-sm font-bold leading-none ${isDarkMode ? 'text-yellow-400' : 'text-[#884EA0]'}`}>{bortleScale ? getBortleDesc(bortleScale, t) : '--'}</div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </div>

      {/* --- Overlay Modals (Expressive Animations) --- */}

      <AnimatePresence>
        {/* Locations Overlay */}
        {showLocations && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute inset-0 z-50 flex flex-col p-4 ${isDarkMode ? 'bg-[#131314]' : 'bg-[#F7F9FF]'}`}
          >
            <div className="flex items-center gap-4 mb-4 mt-8">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLocations(false)}
                className={`p-3 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-[#001D36]'}`}
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
              <div className={`relative flex-1 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                <input 
                  type="text" 
                  value={newLocationInput}
                  onChange={e => setNewLocationInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder={t.searchCity} 
                  className={`w-full py-3 pl-12 pr-12 bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`} 
                />
                
                <button 
                  onClick={handleSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer hover:opacity-70 transition-opacity"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <Search className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
              {locations.map((loc, idx) => (
                <motion.div 
                   key={idx}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => { setCurrentLocIndex(idx); setShowLocations(false); }}
                   className={`p-4 rounded-[32px] flex items-center justify-between cursor-pointer ${idx === currentLocIndex ? (isDarkMode ? 'bg-blue-500/20 border-2 border-blue-500' : 'bg-[#D3E4FF] border-2 border-[#0061A4]') : (isDarkMode ? 'bg-[#1E1F22]' : 'bg-white shadow-sm')}`}
                >
                   <div className="flex items-center gap-4">
                     <Map className={`w-6 h-6 ${idx === currentLocIndex ? (isDarkMode ? 'text-blue-400' : 'text-[#0061A4]') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}/>
                     <span className={`text-xl font-bold ${idx === currentLocIndex ? (isDarkMode ? 'text-white' : 'text-[#001D36]') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>{loc.name}</span>
                   </div>
                   {idx === currentLocIndex && <Check className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-[#0061A4]'}`}/>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings Full Screen Overlay */}
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className={`absolute inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-[#131314]' : 'bg-[#F7F9FF]'}`}
          >
             <div className="flex-none flex items-center justify-between px-4 pt-12 pb-4 z-10 bg-inherit shadow-sm">
               <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#001D36]'}`}>{t.settings}</h2>
               <motion.button 
                 whileTap={{ scale: 0.8 }}
                 onClick={() => setShowSettings(false)}
                 className={`p-3 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-[#001D36]'}`}
               >
                 <X className="w-6 h-6" />
               </motion.button>
             </div>
             
             <div className="flex-1 overflow-y-auto px-4 pt-6 pb-20 space-y-8" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              {/* Language Settings */}
              <div>
                <label className={`text-sm font-bold block uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-[#0061A4]'}`}>
                  <Globe className="w-4 h-4 inline-block mr-2" />{t.language}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'fr', label: 'Français' },
                    { code: 'zh', label: '中文' },
                    { code: 'ms', label: 'Bahasa Melayu' }
                  ].map((lang) => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={lang.code}
                      onClick={() => languageState.set(lang.code as any)}
                      className={`px-4 py-4 rounded-3xl border-2 text-sm font-bold flex items-center justify-between transition-colors ${
                        languageState.current === lang.code 
                          ? (isDarkMode ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-[#0061A4] bg-[#D3E4FF] text-[#001D36]') 
                          : (isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-[#DCE2F9] bg-white text-[#1A1C1E]')
                      }`}
                    >
                      {lang.label}
                      {languageState.current === lang.code && <Check className="w-5 h-5" />}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Typography / Theme / Display */}
              <div>
                 <label className={`text-sm font-bold block uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-[#0061A4]'}`}>
                  <Type className="w-4 h-4 inline-block mr-2" />Display
                </label>
                <div className="space-y-3">
                  {/* Font Toggle */}
                  <button
                    onClick={fontToggle.toggle}
                    className={`w-full px-5 py-5 rounded-3xl border-2 text-sm flex items-center justify-between transition-colors ${
                      fontToggle.isCustom
                         ? (isDarkMode ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-[#0061A4] bg-[#D3E4FF]') 
                         : (isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-[#DCE2F9] bg-white')
                    }`}
                  >
                    <div className={`flex flex-col items-start gap-1 ${fontToggle.isCustom ? (isDarkMode ? 'text-white' : 'text-[#001D36]') : (isDarkMode ? 'text-slate-200' : 'text-[#1A1C1E]')}`}>
                      <span className="font-bold text-base">{t.useSfPro}</span>
                      <span className="text-xs font-medium opacity-70">
                        {fontToggle.isCustom ? t.fontEnabled : t.fontDisabled}
                      </span>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${fontToggle.isCustom ? (isDarkMode ? 'bg-blue-500' : 'bg-[#0061A4]') : (isDarkMode ? 'bg-slate-600' : 'bg-[#DCE2F9]')}`}>
                      <motion.div 
                        animate={{ x: fontToggle.isCustom ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>

                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-full px-5 py-5 rounded-3xl border-2 text-sm flex items-center justify-between transition-colors ${
                      isDarkMode
                         ? 'border-blue-500 bg-blue-500/20 text-white' 
                         : 'border-[#DCE2F9] bg-white text-[#1A1C1E]'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-base">{t.theme}</span>
                      <span className="text-xs font-medium opacity-70">
                        {isDarkMode ? t.dark : t.light}
                      </span>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-500' : 'bg-[#DCE2F9]'}`}>
                      <motion.div 
                        animate={{ x: isDarkMode ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>
                  
                  {/* Units Toggle */}
                  <button
                    onClick={() => setIsMetric(!isMetric)}
                    className={`w-full px-5 py-5 rounded-3xl border-2 text-sm flex items-center justify-between transition-colors ${
                      isMetric
                         ? (isDarkMode ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-[#0061A4] bg-[#D3E4FF]') 
                         : (isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-[#DCE2F9] bg-white')
                    }`}
                  >
                    <div className={`flex flex-col items-start gap-1 ${isMetric ? (isDarkMode ? 'text-white' : 'text-[#001D36]') : (isDarkMode ? 'text-slate-200' : 'text-[#1A1C1E]')}`}>
                      <span className="font-bold text-base">{t.units}</span>
                      <span className="text-xs font-medium opacity-70">
                        {isMetric ? t.metric : t.imperial}
                      </span>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isMetric ? (isDarkMode ? 'bg-blue-500' : 'bg-[#0061A4]') : (isDarkMode ? 'bg-slate-600' : 'bg-[#DCE2F9]')}`}>
                      <motion.div 
                        animate={{ x: isMetric ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>
                </div>
              </div>

               {/* Notifications & System */}
               <div>
                 <label className={`text-sm font-bold block uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-[#0061A4]'}`}>
                  <Bell className="w-4 h-4 inline-block mr-2" />{t.notifications}
                </label>
                <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-full px-5 py-5 rounded-3xl border-2 text-sm flex items-center justify-between transition-colors ${
                      notificationsEnabled
                         ? (isDarkMode ? 'border-red-500 bg-red-500/20 text-white' : 'border-red-600 bg-red-100 text-red-900') 
                         : (isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-[#DCE2F9] bg-white')
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1 text-left">
                      <span className="font-bold text-base">{t.enableAlerts}</span>
                      <span className="text-xs font-medium opacity-70">
                        {notificationsEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-red-600' : (isDarkMode ? 'bg-slate-600' : 'bg-[#DCE2F9]')}`}>
                      <motion.div 
                        animate={{ x: notificationsEnabled ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {/* Radar Map Full Screen Modal */}
        {showRadar && (
           <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`absolute inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-[#131314]' : 'bg-[#F7F9FF]'}`}
          >
            <div className="flex items-center gap-4 p-4 sticky top-0 bg-black/10 backdrop-blur-md z-10">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowRadar(false)}
                  className={`p-3 rounded-full bg-white shadow-md text-[#001D36]`}
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div className="px-4 py-2 bg-white rounded-full shadow-md font-bold text-[#001D36] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Live Radar View
                </div>
            </div>
            <div className="flex-1 w-full h-full p-2 pb-6">
               <div className="w-full h-full rounded-[40px] overflow-hidden shadow-2xl relative">
                   <RadarMap 
                      lat={locations[currentLocIndex]?.lat ?? 0} 
                      lon={locations[currentLocIndex]?.lon ?? 0} 
                      isDarkMode={isDarkMode} 
                      onClose={() => setShowRadar(false)}
                      t={t}
                   />
               </div>
            </div>
          </motion.div>
        )}

        {/* Bento Grid Item Details (Bottom Sheet) */}
        {expandedCard && (
           <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setExpandedCard(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30"
              />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
                onDragEnd={(e, info) => { if (info.offset.y > 60) setExpandedCard(null); }}
                className={`absolute bottom-0 left-0 right-0 z-40 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-y-auto ${isDarkMode ? 'bg-[#1E1F22]' : 'bg-white'}`}
              >
                  <div className="sticky top-0 pt-4 pb-2 z-10 flex justify-center bg-inherit rounded-t-[40px]">
                      <div className="w-16 h-1.5 rounded-full bg-slate-300 opacity-50" />
                  </div>
                  <div className="absolute top-4 right-4 z-20">
                     <button onClick={() => setExpandedCard(null)} className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-[#F1F3F9] text-[#1A1C1E]'}`}>
                        <X className="w-6 h-6"/>
                     </button>
                  </div>
                  
                  <div className="p-4 pb-12">
                     <DetailContent type={expandedCard} t={t} parsed={parsedData} isDarkMode={isDarkMode} isMetric={isMetric} weatherData={weatherData} safeStartIndex={safeStartIndex} />
                  </div>
              </motion.div>
           </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`absolute bottom-8 left-1/2 z-50 px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center justify-center whitespace-nowrap
              ${isDarkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-black text-white'}`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
