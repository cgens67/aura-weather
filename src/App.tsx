/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import WeatherDashboard from './components/WeatherDashboard';

export default function App() {
  const [useCustomFont, setUseCustomFont] = useState(true);
  const [language, setLanguage] = useState<'en' | 'fr' | 'zh' | 'ms'>('en');

  // We explicitly apply the font via className to the root element.
  const fontClass = useCustomFont ? 'font-sf-pro' : 'font-system';

  return (
    <div className={`min-h-screen w-full select-none ${fontClass}`}>
      <WeatherDashboard 
        fontToggle={{ isCustom: useCustomFont, toggle: () => setUseCustomFont(!useCustomFont) }}
        languageState={{ current: language, set: setLanguage }}
      />
    </div>
  );
}
