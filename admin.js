// admin.js

let shipments = [];
let messages = [];

async function fetchAdminData() {
  try {
    const { data: sData } = await sb.from('shipments').select('*').order('created_at', { ascending: false });
    if (sData) shipments = sData;

    const { data: mData } = await sb.from('contacts').select('*').order('date', { ascending: false });
    if (mData) messages = mData;

    initDashboard();
  } catch (e) {
    console.error('Error fetching admin data:', e);
  }
}

function loginAdmin() {
  const pw = document.getElementById('adminPassword').value;
  if(pw === 'admin123') {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';
    sessionStorage.setItem('adminLogged', 'true');
    fetchAdminData();
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
  fetchAdminData();
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
  
  const filtered = shipments.filter(s => {
    const id = (s.id || '').toLowerCase();
    const sender = (s.senderName || s.sender || '').toLowerCase();
    const receiver = (s.receiverName || s.receiver || '').toLowerCase();
    const origin = (s.origin || '').toLowerCase();
    const dest = (s.destination || '').toLowerCase();
    return id.includes(search) || sender.includes(search) || receiver.includes(search) || origin.includes(search) || dest.includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#999;">No shipments found.</td></tr>';
    return;
  }

  filtered.forEach((s, index) => {
    const actualIndex = shipments.indexOf(s);
    const origin = s.origin || s.sender || '—';
    const dest = s.destination || s.receiver || '—';
    const eta = s.expectedDate ? new Date(s.expectedDate).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : (s.eta || '—');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family:monospace; color:var(--accent);">${s.id}</strong></td>
      <td>${s.senderName || s.sender || '—'}</td>
      <td>${s.receiverName || s.receiver || '—'}</td>
      <td>${getStatusBadge(s.status)}</td>
      <td style="color:#666; font-size:0.85rem;">${eta}</td>
      <td>
        <button class="btn-action" onclick="editShipment(${actualIndex})" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action delete" onclick="deleteShipment(${actualIndex})" title="Delete"><i class="fas fa-trash"></i></button>
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
    const eta = s.expectedDate ? new Date(s.expectedDate).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : (s.eta || '—');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family:monospace; color:var(--accent);">${s.id}</strong></td>
      <td>${getStatusBadge(s.status)}</td>
      <td>${s.receiverName || s.receiver || '—'}</td>
      <td>${eta}</td>
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

async function deleteMessage(index) {
  if(confirm('Are you sure you want to delete this message?')) {
    const sortedMsg = [...messages].sort((a,b) => new Date(b.date) - new Date(a.date));
    const target = sortedMsg[index];
    
    if (target && target.id) {
      await sb.from('contacts').delete().eq('id', target.id);
    }
    fetchAdminData();
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
  document.getElementById('shipId').value = 'PLC-' + Math.floor(100000 + Math.random() * 900000);
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

async function deleteShipment(index) {
  if(confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
    const s = shipments[index];
    await sb.from('shipments').delete().eq('id', s.id);
    fetchAdminData();
  }
}

document.getElementById('shipmentForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  submitBtn.disabled = true;

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
    sender: document.getElementById('shipSenderName').value,
    receiver: document.getElementById('shipReceiverName').value,
    eta: document.getElementById('shipExpectedDate').value
  };

  const idx = document.getElementById('shipmentIndex').value;
  try {
    if(idx === '') {
      // Check if ID already exists
      const { data: existing } = await sb.from('shipments').select('id').eq('id', sData.id).single();
      if(existing) {
        alert('Tracking ID already exists! Please use a unique ID.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
      await sb.from('shipments').insert([sData]);
      sendShipmentEmail(sData, 'created');
    } else {
      await sb.from('shipments').update(sData).eq('id', sData.id);
      sendShipmentEmail(sData, 'updated');
    }
  } catch (err) {
    console.error('Error saving shipment:', err);
    alert('Failed to save shipment.');
  }
  
  submitBtn.innerHTML = originalText;
  submitBtn.disabled = false;
  closeModal();
  fetchAdminData();
});

// --- Email Notification Logic ---
function sendShipmentEmail(shipmentData, type) {
  // Configured with your EmailJS credentials
  const serviceID = "service_wz4szqe";
  // Using the first template for creation, and the second for updates
  const templateID = type === 'created' ? "template_0pxhlex" : "template_6r5tfk1";
  
  const templateParams = {
    tracking_id: shipmentData.id,
    status: shipmentData.status,
    sender_name: shipmentData.senderName,
    receiver_name: shipmentData.receiverName,
    origin: shipmentData.origin,
    destination: shipmentData.destination,
    update_type: type === 'created' ? 'Shipment Created' : 'Status Update',
    message: type === 'created' ? 
      `Your shipment ${shipmentData.id} has been successfully created and is currently ${shipmentData.status}. Track it on our website.` : 
      `The status of your shipment ${shipmentData.id} has been officially updated to: ${shipmentData.status}.`
  };

  // 1. Send to Sender
  if(shipmentData.senderEmail && shipmentData.senderEmail.trim() !== '') {
    emailjs.send(serviceID, templateID, {
      ...templateParams,
      to_email: shipmentData.senderEmail,
      to_name: shipmentData.senderName
    }).then(res => console.log('Email successfully sent to Sender!', res.status))
      .catch(err => console.error('Failed to send Sender email:', err));
  }

  // 2. Send to Receiver
  if(shipmentData.receiverEmail && shipmentData.receiverEmail.trim() !== '') {
    emailjs.send(serviceID, templateID, {
      ...templateParams,
      to_email: shipmentData.receiverEmail,
      to_name: shipmentData.receiverName
    }).then(res => console.log('Email successfully sent to Receiver!', res.status))
      .catch(err => console.error('Failed to send Receiver email:', err));
  }
}

