/* ========== PRELOADER ========== */
const preloader = document.getElementById('preloader');
if (preloader) {
  if (sessionStorage.getItem('hasVisited')) {
    preloader.style.display = 'none';
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('hide');
        setTimeout(() => {
          preloader.style.display = 'none';
          sessionStorage.setItem('hasVisited', 'true');
        }, 600);
      }, 500);
    });
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

/* ========== BACK TO TOP ========== */
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
});
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

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

  // Save to localStorage
  const submissions = JSON.parse(localStorage.getItem('primeRoutes_contacts') || '[]');
  submissions.push({
    name: name.value.trim(),
    email: email.value.trim(),
    message: message.value.trim(),
    date: new Date().toISOString()
  });
  localStorage.setItem('primeRoutes_contacts', JSON.stringify(submissions));

  // Show success
  contactForm.style.display = 'none';
  formSuccess.style.display = 'block';

  // Reset after 4 seconds
  setTimeout(() => {
    contactForm.style.display = 'block';
    formSuccess.style.display = 'none';
    contactForm.reset();
  }, 4000);
});

/* ========== TRACK SHIPMENT ========== */
function handleTrack() {
  const input = document.getElementById('trackInput');
  const result = document.getElementById('trackResult');
  const trackingId = input.value.trim();

  if (!trackingId) {
    result.style.display = 'block';
    result.style.color = '#dc3545';
    result.textContent = 'Please enter a tracking ID.';
    return;
  }

  // Simulate tracking
  result.style.display = 'block';
  result.style.color = 'var(--accent)';
  result.textContent = '⏳ Searching...';

  setTimeout(() => {
    // Check localStorage for any saved shipments
    const stored = JSON.parse(localStorage.getItem('primeRoutes_shipments') || '[]');
    const found = stored.find(s => s.id === trackingId);

    if (found) {
      result.style.color = '#28a745';
      result.textContent = `✅ Status: ${found.status} | ETA: ${found.eta}`;
    } else {
      // Demo response
      const statuses = [
        'In Transit — Expected delivery in 3-5 days',
        'At Customs — Clearance in progress',
        'Out for Delivery — Arriving today',
        'Package Received — Processing started'
      ];
      const random = statuses[Math.floor(Math.random() * statuses.length)];
      result.style.color = '#28a745';
      result.textContent = `📦 ${random}`;
    }
  }, 1500);
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
function handleMainTrack() {
  const input = document.getElementById('mainTrackInput');
  const receipt = document.getElementById('trackingReceipt');
  const errorMsg = document.getElementById('trackErrorMsg');
  
  if (!input || !receipt) return;
  
  const code = input.value.trim();
  if (code.length < 4) {
    errorMsg.style.display = 'block';
    receipt.style.display = 'none';
    return;
  }
  
  errorMsg.style.display = 'none';
  receipt.style.display = 'none';
  
  // Simulate loading state on the button
  const btn = input.nextElementSibling;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locating...';
  btn.disabled = true;
  
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    // Check if it's a saved shipment in localstorage
    const stored = JSON.parse(localStorage.getItem('primeRoutes_shipments') || '[]');
    const found = stored.find(s => s.id === code);
    
    const codeDisplay = document.getElementById('receiptCode');
    const dateDisplay = document.getElementById('receiptDate');
    const statusDisplay = document.getElementById('receiptStatus');
    const etaDisplay = document.getElementById('receiptEta');
    const senderDisplay = document.getElementById('receiptSender');
    const receiverDisplay = document.getElementById('receiptReceiver');
    const detailsDisplay = document.getElementById('receiptDetails');
    
    codeDisplay.textContent = code.toUpperCase();
    const today = new Date();
    dateDisplay.textContent = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    if (found) {
       statusDisplay.innerHTML = `<i class="fas fa-check-circle"></i> ${found.status}`;
       etaDisplay.textContent = found.eta;
       if(senderDisplay) senderDisplay.textContent = found.origin || found.sender || 'Prime Routes HQ, TN';
       if(receiverDisplay) receiverDisplay.textContent = found.destination || found.receiver || 'Pending Local Hub Arrival';
       if(detailsDisplay) detailsDisplay.textContent = found.details || found.type || 'Standard Freight Transport — Fully Insured';
    } else {
       // Demo response for random codes
       const statuses = ['In Transit', 'At Customs', 'Out for Delivery'];
       const random = statuses[Math.floor(Math.random() * statuses.length)];
       statusDisplay.innerHTML = `<i class="fas fa-truck-fast"></i> ${random}`;
       etaDisplay.textContent = 'Within 3-5 Business Days';
       if(senderDisplay) senderDisplay.textContent = 'Prime Routes HQ, TN';
       if(receiverDisplay) receiverDisplay.textContent = 'Pending Local Hub Arrival';
       if(detailsDisplay) detailsDisplay.textContent = 'Standard Freight Transport — Fully Insured';
    }
    
    receipt.style.display = 'block';
    setTimeout(() => receipt.classList.add('visible'), 50);
  }, 1200);
}

// Allow Enter key for main tracking input
const mainTrackInput = document.getElementById('mainTrackInput');
if(mainTrackInput) {
  mainTrackInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleMainTrack();
  });
}

console.log('🚀 Prime Routes Logistics — Site loaded successfully');
