const fs = require('fs');
const files = ['about.html', 'contact.html', 'index.html', 'reviews.html', 'services.html', 'track.html'];
files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<!-- Preloader -->\s*<div id="preloader">\s*<div class="loader-ring"><\/div>\s*<\/div>/g, '');
    fs.writeFileSync(f, content);
    console.log('Removed from ' + f);
  } catch(e) {}
});
