const fs = require('fs');

const smartsuppScript = `\n  <!-- Smartsupp Live Chat -->\n  <script type="text/javascript">\n    var _smartsupp = _smartsupp || {};\n    _smartsupp.key = 'd55df2b734af3c4f59930ea36992e229092a4607';\n    window.smartsupp||(function(d) {\n      var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];\n      s=d.getElementsByTagName('script')[0];c=d.createElement('script');\n      c.type='text/javascript';c.charset='utf-8';c.async=true;\n      c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);\n    })(document);\n  </script>`;

const files = ['about.html', 'contact.html', 'index.html', 'reviews.html', 'services.html', 'track.html'];
for(let f of files) {
  try {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('smartsuppchat.com')) {
      content = content.replace('</head>', smartsuppScript + '\n</head>');
      fs.writeFileSync(f, content);
      console.log('Smartsupp added to ' + f);
    } else {
      console.log('Already has Smartsupp: ' + f);
    }
  } catch(e) {
    console.log('Failed ' + f + ': ' + e.message);
  }
}
