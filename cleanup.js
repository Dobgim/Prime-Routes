const fs = require('fs');
const files = ['about.html', 'contact.html', 'index.html', 'reviews.html', 'services.html', 'track.html'];
for(let f of files) {
  try {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/<!-- Back to Top -->/g, '');
    content = content.replace(/<button class="back-to-top" id="backToTop"><i class="fas fa-chevron-up"><\/i><\/button>/g, '');
    fs.writeFileSync(f, content);
  } catch(e) {}
}
