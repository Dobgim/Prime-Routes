// admin.js

let shipments = JSON.parse(localStorage.getItem('primeRoutes_shipments')) || [];
let messages = JSON.parse(localStorage.getItem('primeRoutes_contacts')) || [];

function loginAdmin() {
  const pw = document.getElementById('adminPassword').value;
  if(pw === 'admin123') {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';
    sessionStorage.setItem('adminLogged', 'true');
    initDashboard();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function logoutAdmin() {
  sessionStorage.removeItem('adminLogged');
  window.location.reload();
}

// Check session
if(sessionStorage.getItem('adminLogged') === 'true') {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  initDashboard();
}

// Clock
setInterval(() => {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}, 1000);

function showTab(tabId, el) {
  document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(nav => nav.classList.remove('active'));
  
  document.getElementById('tab-' + tabId).classList.add('active');
  if(el) el.classList.add('active');
  
  const titles = {
    'dashboard': 'Dashboard Overview',
    'shipments': 'Manage Shipments',
    'messages': 'Contact Messages'
  };
  document.getElementById('pageTitle').textContent = titles[tabId];
}

function initDashboard() {
  updateStats();
  renderShipments();
  renderMessages();
  renderRecent();
}

function updateStats() {
  document.getElementById('statTotal').textContent = shipments.length;
  document.getElementById('statActive').textContent = shipments.filter(s => s.status !== 'Delivered').length;
  document.getElementById('statMessages').textContent = messages.length;
}

function getStatusBadge(status) {
  const lower = status.toLowerCase();
  let cls = 'status-pending';
  if(lower.includes('transit') || lower.includes('delivery')) cls = 'status-in-transit';
  if(lower.includes('delivered')) cls = 'status-delivered';
  if(lower.includes('customs')) cls = 'status-customs';
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function renderShipments() {
  const tbody = document.querySelector('#shipmentsTable tbody');
  const search = document.getElementById('searchShipment').value.toLowerCase();
  
  tbody.innerHTML = '';
  
  shipments.filter(s => s.id.toLowerCase().includes(search) || s.sender.toLowerCase().includes(search) || s.receiver.toLowerCase().includes(search)).forEach((s, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.id}</strong></td>
      <td>${s.sender}</td>
      <td>${s.receiver}</td>
      <td>${getStatusBadge(s.status)}</td>
      <td>
        <button class="btn-action" onclick="editShipment(${index})" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" onclick="deleteShipment(${index})" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRecent() {
  const tbody = document.querySelector('#recentTable tbody');
  tbody.innerHTML = '';
  
  if(shipments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#999;">No shipments added yet.</td></tr>';
    return;
  }

  // Show last 5
  shipments.slice(-5).reverse().forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.id}</strong></td>
      <td>${getStatusBadge(s.status)}</td>
      <td>${s.receiver}</td>
      <td>${s.eta}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMessages() {
  const tbody = document.querySelector('#messagesTable tbody');
  tbody.innerHTML = '';
  
  if(messages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#999;">No messages received.</td></tr>';
    return;
  }

  // Sort by date (newest first)
  const sortedMsg = [...messages].sort((a,b) => new Date(b.date) - new Date(a.date));

  sortedMsg.forEach((m, index) => {
    const d = new Date(m.date).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="white-space:nowrap;">${d}</td>
      <td><strong>${m.name}</strong></td>
      <td><a href="mailto:${m.email}" style="color:#1a73e8; text-decoration:none;">${m.email}</a></td>
      <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${m.message}">${m.message}</td>
      <td><button class="btn-action delete" onclick="deleteMessage(${index})"><i class="fas fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteMessage(index) {
  if(confirm('Are you sure you want to delete this message?')) {
    // We sorted the array, so we need to find the actual index in the main array.
    // Actually, simplest is just re-filter or operate on the original using a unique ID, 
    // but since we just reversed/sorted it, let's rebuild the array.
    const sortedMsg = [...messages].sort((a,b) => new Date(b.date) - new Date(a.date));
    const target = sortedMsg[index];
    const originalIndex = messages.findIndex(m => m.date === target.date);
    
    if(originalIndex > -1) {
      messages.splice(originalIndex, 1);
      localStorage.setItem('primeRoutes_contacts', JSON.stringify(messages)); 
      initDashboard();
    }
  }
}

/* Dynamic Lists Logic */
function addWaypoint(location = '', pause = false) {
  const div = document.createElement('div');
  div.className = 'waypoint-item';
  div.innerHTML = `
    <input type="text" placeholder="City, Country" value="${location}" class="wp-input" required>
    <label><input type="checkbox" class="wp-pause" ${pause ? 'checked' : ''}> Pause Here</label>
    <button type="button" onclick="this.parentElement.remove()" class="btn-remove-item"><i class="fas fa-times"></i></button>
  `;
  document.getElementById('waypointsList').appendChild(div);
}

function addTimelineEvent(date = '', time = '', desc = '') {
  const div = document.createElement('div');
  div.className = 'timeline-item';
  div.innerHTML = `
    <input type="date" value="${date}" class="tl-date" required>
    <input type="time" value="${time}" class="tl-time" required>
    <input type="text" placeholder="Event description" value="${desc}" class="tl-desc" style="flex:1;" required>
    <button type="button" onclick="this.parentElement.remove()" class="btn-remove-item"><i class="fas fa-times"></i></button>
  `;
  document.getElementById('timelineList').appendChild(div);
}

/* Modal Logic */
function openModal() {
  document.getElementById('shipmentForm').reset();
  document.getElementById('shipmentIndex').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Shipment';
  document.getElementById('shipId').value = 'PR-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('waypointsList').innerHTML = '';
  document.getElementById('timelineList').innerHTML = '';
  document.getElementById('shipmentModal').classList.add('active');
}

function closeModal() {
  document.getElementById('shipmentModal').classList.remove('active');
}

function editShipment(index) {
  const s = shipments[index];
  document.getElementById('shipmentIndex').value = index;
  document.getElementById('modalTitle').textContent = 'Edit Shipment';
  
  document.getElementById('shipId').value = s.id;
  document.getElementById('shipType').value = s.type || '';
  document.getElementById('shipSenderName').value = s.senderName || '';
  document.getElementById('shipReceiverName').value = s.receiverName || '';
  document.getElementById('shipSenderEmail').value = s.senderEmail || '';
  document.getElementById('shipReceiverEmail').value = s.receiverEmail || '';
  document.getElementById('shipSenderPhone').value = s.senderPhone || '';
  document.getElementById('shipReceiverPhone').value = s.receiverPhone || '';
  document.getElementById('shipOrigin').value = s.origin || '';
  document.getElementById('shipDestination').value = s.destination || '';
  document.getElementById('shipWeight').value = s.weight || '';
  document.getElementById('shipStatus').value = s.status || '';
  document.getElementById('shipDate').value = s.shipDate || '';
  document.getElementById('shipExpectedDate').value = s.expectedDate || '';
  document.getElementById('shipExpectedTime').value = s.expectedTime || '';
  document.getElementById('shipPieceType').value = s.pieceType || '';
  document.getElementById('shipDetails').value = s.details || '';
  
  document.getElementById('waypointsList').innerHTML = '';
  if(s.waypoints) s.waypoints.forEach(w => addWaypoint(w.location, w.pause));
  
  document.getElementById('timelineList').innerHTML = '';
  if(s.timeline) s.timeline.forEach(t => addTimelineEvent(t.date, t.time, t.desc));

  document.getElementById('shipmentModal').classList.add('active');
}

function deleteShipment(index) {
  if(confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
    shipments.splice(index, 1);
    saveShipments();
  }
}

document.getElementById('shipmentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const waypoints = Array.from(document.querySelectorAll('.waypoint-item')).map(item => ({
    location: item.querySelector('.wp-input').value,
    pause: item.querySelector('.wp-pause').checked
  }));
  
  const timeline = Array.from(document.querySelectorAll('.timeline-item')).map(item => ({
    date: item.querySelector('.tl-date').value,
    time: item.querySelector('.tl-time').value,
    desc: item.querySelector('.tl-desc').value
  }));

  const sData = {
    id: document.getElementById('shipId').value,
    type: document.getElementById('shipType').value,
    senderName: document.getElementById('shipSenderName').value,
    receiverName: document.getElementById('shipReceiverName').value,
    senderEmail: document.getElementById('shipSenderEmail').value,
    receiverEmail: document.getElementById('shipReceiverEmail').value,
    senderPhone: document.getElementById('shipSenderPhone').value,
    receiverPhone: document.getElementById('shipReceiverPhone').value,
    origin: document.getElementById('shipOrigin').value,
    destination: document.getElementById('shipDestination').value,
    weight: document.getElementById('shipWeight').value,
    status: document.getElementById('shipStatus').value,
    shipDate: document.getElementById('shipDate').value,
    expectedDate: document.getElementById('shipExpectedDate').value,
    expectedTime: document.getElementById('shipExpectedTime').value,
    pieceType: document.getElementById('shipPieceType').value,
    details: document.getElementById('shipDetails').value,
    waypoints: waypoints,
    timeline: timeline,
    sender: document.getElementById('shipSenderName').value, // fallback for legacy
    receiver: document.getElementById('shipReceiverName').value, // fallback for legacy
    eta: document.getElementById('shipExpectedDate').value // fallback for legacy
  };

  const idx = document.getElementById('shipmentIndex').value;
  if(idx === '') {
    // Check if ID already exists
    if(shipments.find(s => s.id === sData.id)) {
      alert('Tracking ID already exists! Please use a unique ID.');
      return;
    }
    shipments.push(sData);
  } else {
    shipments[idx] = sData;
  }
  
  saveShipments();
  closeModal();
});

function saveShipments() {
  localStorage.setItem('primeRoutes_shipments', JSON.stringify(shipments));
  initDashboard();
}
