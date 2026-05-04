/* ========== PRELOADER ========== */
const preloader = document.getElementById('preloader');
if (preloader) {
  const dismissPreloader = () => {
    preloader.classList.add('hide');
    setTimeout(() => {
      preloader.style.display = 'none';
      try { sessionStorage.setItem('hasVisited', 'true'); } catch(e) {}
    }, 500);
  };

  let visited = false;
  try { visited = sessionStorage.getItem('hasVisited'); } catch(e) {}

  if (visited) {
    preloader.style.display = 'none';
  } else {
    window.addEventListener('load', dismissPreloader);
    setTimeout(dismissPreloader, 2000); // 2s fallback
  }
}



/* ========== NAVBAR SCROLL ========== */
const navbar = document.getElementById('navbar');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = scrollY;
});

/* ========== ACTIVE NAV LINK ========== */
const navAnchors = document.querySelectorAll('.nav-links a:not(.nav-cta), .mobile-menu a');
function setActiveLink() {
  let currentPath = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPath === '') currentPath = 'index.html';
  
  navAnchors.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === currentPath) {
      a.classList.add('active');
    }
  });
}
window.addEventListener('DOMContentLoaded', setActiveLink);

/* ========== MOBILE MENU ========== */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');

function toggleMobile() {
  hamburger.classList.toggle('active');
  mobileMenu.classList.toggle('open');
  mobileOverlay.classList.toggle('show');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
}

hamburger.addEventListener('click', toggleMobile);
mobileOverlay.addEventListener('click', toggleMobile);

document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) toggleMobile();
  });
});

/* ========== SCROLL REVEAL ========== */
const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

/* ========== COUNTER ANIMATION ========== */
const counters = document.querySelectorAll('.counter');
let countersAnimated = new Set();

function formatNumber(num) {
  if (num >= 1000) {
    return num.toLocaleString();
  }
  return num.toString();
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 2000;
  const startTime = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuart(progress);
    const current = Math.round(easedProgress * target);
    el.textContent = formatNumber(current);
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = formatNumber(target);
    }
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !countersAnimated.has(entry.target)) {
      countersAnimated.add(entry.target);
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

/* ========== BACK TO TOP REMOVED ========== */

/* ========== CONTACT FORM ========== */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  // Validate fields
  const name = this.querySelector('[name="name"]');
  const email = this.querySelector('[name="email"]');
  const message = this.querySelector('[name="message"]');

  // Reset
  this.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));

  if (!name.value.trim()) {
    name.closest('.form-group').classList.add('invalid');
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRegex.test(email.value)) {
    email.closest('.form-group').classList.add('invalid');
    valid = false;
  }

  if (!message.value.trim()) {
    message.closest('.form-group').classList.add('invalid');
    valid = false;
  }

  if (!valid) return;

  // Save to Supabase
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  let originalBtnContent = 'Send Message';
  if (submitBtn) {
    originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
  }

  sb.from('contacts').insert([{
    name: name.value.trim(),
    email: email.value.trim(),
    message: message.value.trim(),
    date: new Date().toISOString()
  }]).then(() => {
    // Show success
    contactForm.style.display = 'none';
    formSuccess.style.display = 'block';

    // Reset after 4 seconds
    setTimeout(() => {
      contactForm.style.display = 'block';
      formSuccess.style.display = 'none';
      contactForm.reset();
      if (submitBtn) {
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;
      }
    }, 4000);
  }).catch(err => {
    console.error('Error saving contact:', err);
    if (submitBtn) {
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.disabled = false;
    }
    alert('Failed to send message. Please try again.');
  });
});

/* ========== TRACK SHIPMENT ========== */
async function handleTrack() {
  const input = document.getElementById('trackInput');
  const result = document.getElementById('trackResult');
  const trackingId = input.value.trim();

  if (!trackingId) {
    result.style.display = 'block';
    result.style.color = '#dc3545';
    result.textContent = 'Please enter a tracking ID.';
    return;
  }

  result.style.display = 'block';
  result.style.color = 'var(--accent)';
  result.textContent = '⏳ Searching...';

  try {
    const { data: found, error } = await sb.from('shipments').select('*').ilike('id', trackingId).single();
    if (found) {
      result.style.color = '#28a745';
      result.textContent = `✅ Status: ${found.status} | ETA: ${found.eta || found.expectedDate || '—'}`;
    } else {
      result.style.color = '#e74c3c';
      result.textContent = `❌ Tracking ID not found.`;
    }
  } catch (err) {
    result.style.color = '#e74c3c';
    result.textContent = `❌ Tracking ID not found or error occurred.`;
    console.error('Track err:', err);
  }
}

// Allow Enter key for tracking
document.getElementById('trackInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') handleTrack();
});

/* ========== SMOOTH SCROLL FOR ANCHORS ========== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ========== PARALLAX SHAPES ========== */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.shape').forEach((shape, i) => {
    const speed = (i + 1) * 0.03;
    shape.style.transform = `translateY(${scrollY * speed}px)`;
  });
});

/* ========== TRACKING FEATURES HOVER STAGGER ========== */
document.querySelectorAll('.track-feat').forEach((feat, i) => {
  feat.style.transitionDelay = `${i * 0.05}s`;
});

/* ========== SERVICE CARD TILT EFFECT ========== */
document.querySelectorAll('.srv-card, .so-card, .test-card').forEach(card => {
  card.addEventListener('mousemove', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', function() {
    this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  });
});

/* ========== LIGHTBOX ========== */
function openLightbox(src) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if(lightbox && lightboxImg) {
    lightboxImg.src = src;
    lightbox.style.display = 'block';
    setTimeout(() => lightbox.classList.add('show'), 10);
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if(lightbox) {
    lightbox.classList.remove('show');
    setTimeout(() => {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }
}

/* ========== MAIN TRACKING PAGE LOGIC ========== */
async function handleMainTrack() {
  const input = document.getElementById('mainTrackInput');
  const receipt = document.getElementById('trackingReceipt');
  const errorMsg = document.getElementById('trackErrorMsg');
  if (!input || !receipt) return;
  const code = input.value.trim();
  if (code.length < 4) {
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'Please enter a valid tracking code.';
    receipt.style.display = 'none';
    return;
  }
  errorMsg.style.display = 'none';
  receipt.style.display = 'none';
  const btn = document.querySelector('button[onclick="handleMainTrack()"]') || input.nextElementSibling;
  const originalText = btn ? btn.innerHTML : '';
  if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...'; btn.disabled = true; }

  try {
    // Query directly via REST API to bypass any client library issues
    const SUPABASE_URL = 'https://urkuukjazppankjsiyjx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVya3V1a2phenBwYW5ranNpeWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTQwOTcsImV4cCI6MjA5MzQ3MDA5N30.hHo-urTvu3qo1Qod4DitNp6IFbPR_y-vpC5GlD2EyGs';
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/shipments?id=ilike.${encodeURIComponent(code)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if(btn) { btn.innerHTML = originalText; btn.disabled = false; }
    const results = await response.json();
    const found = (Array.isArray(results) && results.length > 0) ? results[0] : null;

    const codeDisplay        = document.getElementById('receiptCode');
    const dateDisplay        = document.getElementById('receiptDate');
    const statusDisplay      = document.getElementById('receiptStatus');
    const statusDot          = document.getElementById('statusDot');
    const etaDisplay         = document.getElementById('receiptEta');
    const senderDisplay      = document.getElementById('receiptSender');
    const receiverDisplay    = document.getElementById('receiptReceiver');
    const detailsDisplay     = document.getElementById('receiptDetails');
    const senderNameDisplay    = document.getElementById('receiptSenderName');
    const senderEmailDisplay   = document.getElementById('receiptSenderEmail');
    const senderPhoneDisplay   = document.getElementById('receiptSenderPhone');
    const receiverNameDisplay  = document.getElementById('receiptReceiverName');
    const receiverEmailDisplay = document.getElementById('receiptReceiverEmail');
    const receiverPhoneDisplay = document.getElementById('receiptReceiverPhone');
    const typeDisplay        = document.getElementById('receiptType');
    const weightDisplay      = document.getElementById('receiptWeight');
    const shipDateDisplay    = document.getElementById('receiptShipDate');
    const mapLabel           = document.getElementById('mapLocationLabel');
    if(codeDisplay) codeDisplay.textContent = code.toUpperCase();
    const today = new Date();
    if(dateDisplay) dateDisplay.textContent = today.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    if (found) {
      const statusLower = (found.status || '').toLowerCase();
      let statusIcon = 'fa-truck-fast', statusColor = '#1a73e8', dotColor = '#1a73e8';
      if(statusLower.includes('delivered'))  { statusIcon='fa-check-circle';    statusColor='#2ecc71'; dotColor='#2ecc71'; }
      else if(statusLower.includes('customs'))   { statusIcon='fa-shield-halved';  statusColor='#e67e22'; dotColor='#e67e22'; }
      else if(statusLower.includes('out for'))   { statusIcon='fa-motorcycle';     statusColor='#9b59b6'; dotColor='#9b59b6'; }
      else if(statusLower.includes('hold'))      { statusIcon='fa-pause-circle';   statusColor='#e74c3c'; dotColor='#e74c3c'; }
      else if(statusLower.includes('pending'))   { statusIcon='fa-hourglass-half'; statusColor='#f39c12'; dotColor='#f39c12'; }
      if(statusDisplay){ statusDisplay.innerHTML = `<i class="fas ${statusIcon}"></i> ${found.status}`; statusDisplay.style.color = statusColor; }
      if(statusDot){ statusDot.style.background=dotColor; statusDot.style.boxShadow=`0 0 0 3px ${dotColor}33`; }
      let etaText = found.eta || found.expectedDate || '—';
      if(found.expectedDate){
        const etaDate = new Date(found.expectedDate+'T00:00:00');
        etaText = !isNaN(etaDate) ? etaDate.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : found.expectedDate;
        if(found.expectedTime) etaText += ' at '+found.expectedTime;
      }
      if(etaDisplay) etaDisplay.textContent = etaText;
      if(senderNameDisplay)    senderNameDisplay.textContent    = found.senderName   || found.sender   || '—';
      if(senderEmailDisplay)   senderEmailDisplay.textContent   = found.senderEmail  || '';
      if(senderPhoneDisplay)   senderPhoneDisplay.textContent   = found.senderPhone  || '';
      if(senderDisplay)        senderDisplay.textContent        = found.origin       || '—';
      if(receiverNameDisplay)  receiverNameDisplay.textContent  = found.receiverName || found.receiver || '—';
      if(receiverEmailDisplay) receiverEmailDisplay.textContent = found.receiverEmail|| '';
      if(receiverPhoneDisplay) receiverPhoneDisplay.textContent = found.receiverPhone|| '';
      if(receiverDisplay)      receiverDisplay.textContent      = found.destination  || '—';
      if(typeDisplay)    typeDisplay.textContent    = found.type || '—';
      const wt = found.weight ? found.weight+' kg' : '—';
      const pc = found.pieceType ? ' / '+found.pieceType : '';
      if(weightDisplay) weightDisplay.textContent = wt+pc;
      if(shipDateDisplay){
        if(found.shipDate){
          const sd=new Date(found.shipDate+'T00:00:00');
          shipDateDisplay.textContent=!isNaN(sd)?sd.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}):found.shipDate;
        } else { shipDateDisplay.textContent='—'; }
      }
      if(detailsDisplay) detailsDisplay.textContent = found.details || '—';
      const waypointsSection=document.getElementById('receiptWaypointsSection');
      const waypointsList=document.getElementById('receiptWaypointsList');
      if(waypointsSection&&waypointsList&&found.waypoints&&found.waypoints.length>0){
        waypointsList.innerHTML='';
        found.waypoints.forEach((w,i)=>{
          const isPaused=w.pause;
          const dot=document.createElement('div');
          dot.style.cssText=`display:flex;align-items:center;gap:6px;background:${isPaused?'#fef3c7':'#f0f9ff'};border:1px solid ${isPaused?'#f59e0b':'#bae6fd'};padding:6px 12px;border-radius:20px;font-size:0.82rem;font-weight:600;color:${isPaused?'#92400e':'#0369a1'};`;
          dot.innerHTML=`<i class="fas fa-${isPaused?'pause-circle':'map-pin'}" style="font-size:0.75rem;"></i> ${w.location}${isPaused?' <span style="font-size:0.7rem;opacity:0.7;">(On Hold)</span>':''}`;
          waypointsList.appendChild(dot);
          if(i<found.waypoints.length-1){const arrow=document.createElement('span');arrow.innerHTML='<i class="fas fa-chevron-right" style="color:#cbd5e1;font-size:0.7rem;"></i>';waypointsList.appendChild(arrow);}
        });
        waypointsSection.style.display='block';
      } else if(waypointsSection){waypointsSection.style.display='none';}
      const timelineSection=document.getElementById('receiptTimelineSection');
      const timelineList=document.getElementById('receiptTimelineList');
      if(timelineSection&&timelineList&&found.timeline&&found.timeline.length>0){
        timelineList.innerHTML='';
        const sorted=[...found.timeline].sort((a,b)=>new Date(b.date+'T'+(b.time||'00:00'))-new Date(a.date+'T'+(a.time||'00:00')));
        sorted.forEach((t,i)=>{
          const d=t.date?new Date(t.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
          const row=document.createElement('div');
          row.style.cssText='display:flex;gap:16px;align-items:flex-start;padding:12px 0;'+(i>0?'border-top:1px solid #f1f5f9;':'');
          row.innerHTML=`<div style="min-width:36px;height:36px;border-radius:50%;background:${i===0?'#0a1628':'#f1f5f9'};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-${i===0?'truck-fast':'circle-check'}" style="font-size:0.75rem;color:${i===0?'var(--accent)':'#94a3b8'};"></i></div><div><div style="font-weight:700;color:#0a1628;font-size:0.9rem;">${t.desc||'—'}</div><div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">${d}${t.time?' &middot; '+t.time:''}</div></div>`;
          timelineList.appendChild(row);
        });
        timelineSection.style.display='block';
      } else if(timelineSection){timelineSection.style.display='none';}
      const mapLabel2=document.getElementById('mapLocationLabel');
      if(mapLabel2) mapLabel2.textContent=found.destination||found.receiver||'';
      initLiveMap(found, code.toUpperCase());
    } else {
      if(statusDisplay){ statusDisplay.innerHTML=`<i class="fas fa-times-circle"></i> Not Found`; statusDisplay.style.color='#e74c3c'; }
      if(statusDot){statusDot.style.background='#e74c3c';statusDot.style.boxShadow='0 0 0 3px rgba(231,76,60,0.2)';}
      if(etaDisplay) etaDisplay.textContent='—';
      [senderNameDisplay,senderEmailDisplay,senderPhoneDisplay,senderDisplay,receiverNameDisplay,receiverEmailDisplay,receiverPhoneDisplay,receiverDisplay,typeDisplay,weightDisplay,shipDateDisplay].forEach(el=>{if(el)el.textContent='—';});
      if(detailsDisplay) detailsDisplay.textContent='This tracking code was not found. Please check and try again.';
      const ws=document.getElementById('receiptWaypointsSection'); if(ws)ws.style.display='none';
      const ts=document.getElementById('receiptTimelineSection');  if(ts)ts.style.display='none';
      if(typeof stopBusAnimation === 'function') stopBusAnimation();
    }
    receipt.style.display='block';
    setTimeout(()=>receipt.scrollIntoView({behavior:'smooth',block:'start'}),100);
  } catch (err) {
    if(btn) { btn.innerHTML = originalText; btn.disabled = false; }
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'Error: ' + (err.message || String(err));
    console.error('Track error:', err);
  }
}

const mainTrackInput = document.getElementById('mainTrackInput');

if(mainTrackInput){
  mainTrackInput.addEventListener('keypress', function(e){
    if(e.key==='Enter') handleMainTrack();
  });
}

function toggleMap() {}

console.log('🚀 Prime Logistics Cargo — Site loaded successfully');

/* ========== ANIMATED CARGO BUS MAP ENGINE ========== */
const CARGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="42" viewBox="0 0 72 42">
  <rect x="2" y="9" width="42" height="25" rx="4" fill="#0a1628" stroke="#e8a924" stroke-width="1.5"/>
  <rect x="44" y="13" width="22" height="21" rx="4" fill="#132744" stroke="#e8a924" stroke-width="1.5"/>
  <rect x="55" y="15" width="9" height="11" rx="2" fill="#87ceeb" opacity="0.85"/>
  <rect x="2" y="9" width="42" height="5" rx="3" fill="#e8a924" opacity="0.7"/>
  <text x="7" y="26" fill="#e8a924" font-size="7" font-family="Arial" font-weight="bold">PRIME LOGISTICS CARGO</text>
  <circle cx="14" cy="36" r="5" fill="#1a1a1a" stroke="#888" stroke-width="1"/>
  <circle cx="14" cy="36" r="2" fill="#aaa"/>
  <circle cx="32" cy="36" r="5" fill="#1a1a1a" stroke="#888" stroke-width="1"/>
  <circle cx="32" cy="36" r="2" fill="#aaa"/>
  <circle cx="58" cy="36" r="5" fill="#1a1a1a" stroke="#888" stroke-width="1"/>
  <circle cx="58" cy="36" r="2" fill="#aaa"/>
  <rect x="64" y="11" width="5" height="3" rx="1" fill="#555"/>
</svg>`;

let liveMap        = null;
let busMarker      = null;
let routePath      = [];
let animInterval   = null;
let currentStep    = 0;
let isAnimating    = false;
let activeTrackCode= '';

function saveMapProgress(code, step) {
  const data = JSON.parse(localStorage.getItem('primeRoutes_mapProgress') || '{}');
  data[code] = step;
  localStorage.setItem('primeRoutes_mapProgress', JSON.stringify(data));
}

function getMapProgress(code) {
  const data = JSON.parse(localStorage.getItem('primeRoutes_mapProgress') || '{}');
  return data[code] || 0;
}

function stopBusAnimation() {
  isAnimating = false;
  if (animInterval) { clearInterval(animInterval); animInterval = null; }
}

function startBusAnimation() {
  if (isAnimating || routePath.length === 0) return;
  isAnimating = true;
  animInterval = setInterval(() => {
    if (!isAnimating) { clearInterval(animInterval); animInterval = null; return; }
    if (currentStep < routePath.length - 1) {
      currentStep++;
      const pos = routePath[currentStep];
      if (busMarker) {
        busMarker.setPosition(pos);
        // Rotate SVG based on heading
        if (currentStep > 0 && typeof google !== 'undefined') {
          const prev = routePath[currentStep - 1];
          const heading = google.maps.geometry.spherical.computeHeading(prev, pos);
          const rotatedSVG = CARGO_SVG.replace('<svg ', `<svg style="transform:rotate(${heading}deg);transform-origin:center;" `);
          busMarker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(rotatedSVG),
            scaledSize: new google.maps.Size(72, 42),
            anchor: new google.maps.Point(36, 36)
          });
        }
      }
      if (liveMap) liveMap.panTo(pos);
      saveMapProgress(activeTrackCode, currentStep);
    } else {
      stopBusAnimation();
    }
  }, 280);
}

function initLiveMap(found, code) {
  stopBusAnimation();
  activeTrackCode = code;
  currentStep = getMapProgress(code);
  routePath = [];

  const mapDiv = document.getElementById('liveMapDiv');
  if (!mapDiv || typeof google === 'undefined') return;

  const origin = found.origin || 'Nashville, TN';
  const destination = found.destination || 'New York, NY';

  liveMap = new google.maps.Map(mapDiv, {
    zoom: 5,
    center: { lat: 30, lng: 0 },
    mapTypeId: 'roadmap',
    streetViewControl: false,
    mapTypeControl: false,
    styles: [
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8f5' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f5e9b8' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] }
    ]
  });

  const waypts = (found.waypoints || []).map(w => ({ location: w.location, stopover: false }));

  new google.maps.DirectionsService().route({
    origin,
    destination,
    waypoints: waypts,
    travelMode: google.maps.TravelMode.DRIVING
  }, (result, status) => {
    if (status !== 'OK') {
      // Fallback geocode
      new google.maps.Geocoder().geocode({ address: destination }, (res, st) => {
        if (st === 'OK' && liveMap) liveMap.setCenter(res[0].geometry.location);
      });
      return;
    }

    // Draw route line
    new google.maps.DirectionsRenderer({
      map: liveMap,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#e8a924', strokeWeight: 5, strokeOpacity: 0.85 }
    }).setDirections(result);

    routePath = result.routes[0].overview_path;
    if (currentStep >= routePath.length) currentStep = Math.max(0, routePath.length - 2);

    // Origin pin
    new google.maps.Marker({
      position: routePath[0], map: liveMap, title: 'Origin: ' + origin,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 11,
        fillColor: '#2ecc71', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2.5 },
      label: { text: 'A', color: '#fff', fontWeight: 'bold', fontSize: '11px' }
    });

    // Destination pin
    new google.maps.Marker({
      position: routePath[routePath.length - 1], map: liveMap, title: 'Destination: ' + destination,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 11,
        fillColor: '#e74c3c', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2.5 },
      label: { text: 'B', color: '#fff', fontWeight: 'bold', fontSize: '11px' }
    });

    // Cargo bus marker at saved position
    const startPos = routePath[Math.max(0, currentStep)];
    busMarker = new google.maps.Marker({
      position: startPos, map: liveMap, title: '🚛 Your Package',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(CARGO_SVG),
        scaledSize: new google.maps.Size(72, 42),
        anchor: new google.maps.Point(36, 36)
      },
      zIndex: 999
    });

    liveMap.panTo(startPos);
    liveMap.setZoom(6);

    // Start or pause based on shipment status
    const statusLower = (found.status || '').toLowerCase();
    const isMoving = statusLower.includes('transit') || statusLower.includes('out for') || statusLower.includes('delivery');
    if (isMoving) {
      startBusAnimation();
    }
    // On Hold / Pending / Delivered: bus stays frozen at current position
  });
}

/* ========== WIDGETS NOW HARDCODED IN HTML PAGES ========== */
/* Globe translate widget and Smartsupp live chat are loaded directly in each HTML page's head/body */
