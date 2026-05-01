/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import WeatherDashboard from './components/WeatherDashboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { NavigationBar } from '@capacitor/app';

export default function App() {
  const [useCustomFont, setUseCustomFont] = useState(true);
  const [language, setLanguage] = useState<'en' | 'fr' | 'zh' | 'ms'>('en');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const configureUI = async () => {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          // Style.Dark means light text (useful for dark themes, but maybe need to toggle based on theme)
          // We can leave it for now or adjust it in WeatherDashboard.
        } catch (e) {}
      };
      configureUI();
    }
  }, []);

  // We explicitly apply the font via className to the root element.
  const fontClass = useCustomFont ? 'font-sf-pro' : 'font-system';

  return (
    <div className={`min-h-[100vh] min-h-[-webkit-fill-available] w-full select-none ${fontClass}`}>
      <WeatherDashboard 
        fontToggle={{ isCustom: useCustomFont, toggle: () => setUseCustomFont(!useCustomFont) }}
        languageState={{ current: language, set: setLanguage }}
      />
    </div>
  );
}
