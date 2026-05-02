import fs from 'fs';
import { execSync } from 'child_process';

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#0061A4"/>
  <path d="M512 200 C512 200 350 450 350 600 C350 700 420 800 512 800 C604 800 674 700 674 600 C674 450 512 200 512 200 Z" fill="#FFFFFF"/>
</svg>
`;

fs.writeFileSync('assets/icon.svg', svg);
fs.writeFileSync('assets/splash.svg', svg);

console.log('Icons created. Please make sure @capacitor/assets is installed.');
