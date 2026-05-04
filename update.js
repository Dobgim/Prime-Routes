const fs = require('fs');
const files = ['about.html', 'admin.html', 'contact.html', 'index.html', 'reviews.html', 'services.html', 'track.html', 'admin.js', 'script.js'];
for (const f of files) {
  try {
    if (!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');
    content = content.replaceAll('Prime Routes Logistics', 'Prime Logistics Cargo');
    content = content.replaceAll('Prime Route Logistics', 'Prime Logistics Cargo');
    content = content.replaceAll('PrimeRoutes', 'Prime Logistics Cargo');
    content = content.replaceAll('Prime Routes', 'Prime Logistics Cargo');
    content = content.replaceAll('info@primerouteslogistic.com', 'info@primelogisticscargo.com');
    content = content.replaceAll('<div class="nav-logo-icon">PR</div>', '<div class="nav-logo-icon" style="background:transparent; padding:0;"><img src="logo.svg" style="width:100%;height:100%;object-fit:contain;border-radius:12px;"></div>');
    content = content.replaceAll('Prime<span>Routes</span>', 'Prime<span>Logistics Cargo</span>');
    content = content.replaceAll("document.getElementById('shipId').value = 'PR-'", "document.getElementById('shipId').value = 'PLC-'");
    content = content.replaceAll('>PR<', '>PLC<');
    content = content.replaceAll('PRIME ROUTES', 'PRIME LOGISTICS CARGO');
    if (f.endsWith('.html') && !content.includes('favicon.svg')) {
      content = content.replace('</head>', '  <link rel="icon" type="image/svg+xml" href="favicon.svg">\n</head>');
    }
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  } catch (err) {
    console.log('Failed ' + f + ': ' + err.message);
  }
}
