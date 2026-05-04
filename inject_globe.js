const fs = require('fs');

const globeWidget = `
  <!-- Globe / Google Translate Widget -->
  <div id="google_translate_element" style="display:none; position:fixed; bottom:90px; left:24px; z-index:99999; background:#fff; padding:10px; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.2);"></div>
  <div id="globeBtn" onclick="toggleTranslate()" style="position:fixed; bottom:24px; left:24px; z-index:99999; cursor:pointer; background:transparent; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:transform 0.3s ease;">
    <i class="fas fa-earth-africa" style="color:#e8a924; font-size:58px; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2));"></i>
  </div>
  <script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
  <script>
    function googleTranslateElementInit() {
      new google.translate.TranslateElement({pageLanguage:'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
    }
    function toggleTranslate() {
      var gt = document.getElementById('google_translate_element');
      gt.style.display = (gt.style.display === 'none' || gt.style.display === '') ? 'block' : 'none';
    }
    document.getElementById('globeBtn').addEventListener('mouseenter', function(){ this.style.transform='scale(1.1)'; });
    document.getElementById('globeBtn').addEventListener('mouseleave', function(){ this.style.transform='scale(1)'; });
  </script>`;

const files = ['about.html', 'contact.html', 'index.html', 'reviews.html', 'services.html', 'track.html'];

for(let f of files) {
  try {
    let content = fs.readFileSync(f, 'utf8');

    // Remove old dynamically-created globe if already embedded
    if (!content.includes('id="globeBtn"')) {
      content = content.replace('</body>', globeWidget + '\n</body>');
      console.log('Globe added to ' + f);
    } else {
      console.log('Globe already in ' + f);
    }

    fs.writeFileSync(f, content);
  } catch(e) {
    console.log('Failed ' + f + ': ' + e.message);
  }
}
console.log('Done!');
