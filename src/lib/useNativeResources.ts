import { registerPlugin, Capacitor } from '@capacitor/core';
import { translations } from './translations';

interface ResourcePlugin {
  getString(options: { name: string }): Promise<{ value: string }>;
}

const Resource = registerPlugin<ResourcePlugin>('Resource');

export async function getNativeString(name: string, fallback: string): Promise<string> {
  if (!Capacitor.isNativePlatform()) return fallback;
  try {
    const { value } = await Resource.getString({ name });
    return value;
  } catch (e) {
    return fallback;
  }
}

// Map of JS keys to Android resource names
const stringMap: Record<string, string> = {
  appName: 'app_name',
  uvIndex: 'uv_index',
  visibility: 'visibility',
  humidity: 'humidity',
  dewPoint: 'dew_point',
  bortleScale: 'bortle_scale',
  windSpeed: 'wind_speed',
  precipitation: 'precipitation',
  sunrise: 'sunrise',
  sunset: 'sunset',
  feelsLike: 'feels_like',
  low: 'low',
  high: 'high',
  searchPlaceholder: 'search_placeholder',
  noResults: 'no_results',
  bortleExcellent: 'bortle_excellent',
  bortleRural: 'bortle_rural',
  bortleSuburban: 'bortle_suburban',
  bortleCity: 'bortle_city',
  bortleInnerCity: 'bortle_inner_city',
  bortleDesc: 'bortle_desc'
};

export async function loadNativeTranslations(lang: 'en' | 'fr' | 'zh' | 'ms' = 'en') {
  const base = translations[lang];
  const native: any = { ...base };

  if (Capacitor.isNativePlatform()) {
    for (const [jsKey, resName] of Object.entries(stringMap)) {
      native[jsKey] = await getNativeString(resName, base[jsKey as keyof typeof base] as string);
    }
  }

  return native;
}
