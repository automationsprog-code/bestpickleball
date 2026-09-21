const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 512x512 high quality SVG icon for BEST Pickleball Balamban
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Dark slate gradient background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Neon Lime Pickleball gradient -->
    <radialGradient id="ballGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="40%" stop-color="#a3e635"/>
      <stop offset="85%" stop-color="#65a30d"/>
      <stop offset="100%" stop-color="#3f6212"/>
    </radialGradient>

    <!-- Hole shadow gradient -->
    <radialGradient id="holeGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#14532d"/>
      <stop offset="100%" stop-color="#052e16"/>
    </radialGradient>

    <!-- Subtle glow filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Outer container with rounded squircle / circle -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />

  <!-- Outer neon rim accent -->
  <rect x="8" y="8" width="496" height="496" rx="120" fill="none" stroke="#84cc16" stroke-width="6" stroke-opacity="0.4" />

  <!-- Main Pickleball Group -->
  <g filter="url(#shadow)">
    <!-- Pickleball sphere -->
    <circle cx="256" cy="236" r="160" fill="url(#ballGrad)" filter="url(#glow)" />

    <!-- Pickleball holes pattern (Realistic 26-hole layout relative view) -->
    <!-- Center hole -->
    <ellipse cx="256" cy="236" rx="22" ry="22" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="2" stroke-opacity="0.6"/>

    <!-- Inner ring holes -->
    <ellipse cx="256" cy="156" rx="18" ry="16" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.5"/>
    <ellipse cx="326" cy="196" rx="17" ry="19" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.5"/>
    <ellipse cx="326" cy="276" rx="19" ry="17" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.5"/>
    <ellipse cx="256" cy="316" rx="18" ry="16" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.5"/>
    <ellipse cx="186" cy="276" rx="17" ry="19" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.5"/>
    <ellipse cx="186" cy="196" rx="19" ry="17" fill="url(#holeGrad)" stroke="#84cc16" stroke-width="1.5" stroke-opacity="0.5"/>

    <!-- Outer edge foreshortened holes -->
    <ellipse cx="256" cy="98" rx="14" ry="8" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="374" cy="146" rx="10" ry="14" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="394" cy="236" rx="9" ry="16" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="374" cy="326" rx="12" ry="12" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="256" cy="374" rx="14" ry="8" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="138" cy="326" rx="10" ry="14" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="118" cy="236" rx="9" ry="16" fill="url(#holeGrad)" opacity="0.8"/>
    <ellipse cx="138" cy="146" rx="12" ry="12" fill="url(#holeGrad)" opacity="0.8"/>
  </g>

  <!-- BEST Pickleball Badge Text at Bottom -->
  <g transform="translate(0, 400)">
    <rect x="96" y="0" width="320" height="64" rx="20" fill="#84cc16" />
    <text x="256" y="44" font-family="system-ui, -apple-system, Arial, sans-serif" font-size="34" font-weight="900" fill="#020617" text-anchor="middle" letter-spacing="3">BEST</text>
  </g>
</svg>`;

async function generate() {
  const appDir = path.join(__dirname, '..', 'app');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG to app/icon.svg
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgIcon);
  console.log('Saved app/icon.svg');

  const svgBuffer = Buffer.from(svgIcon);

  // 1. app/icon.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(appDir, 'icon.png'));
  console.log('Saved app/icon.png (512x512)');

  // 2. app/apple-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Saved app/apple-icon.png (180x180)');

  // 3. public/icon.png (512x512)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));
  console.log('Saved public/icon.png');

  // 4. public/favicon.ico & app/favicon.ico
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(appDir, 'favicon.ico'));
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Saved app/favicon.ico & public/favicon.ico');
}

generate().catch(console.error);
