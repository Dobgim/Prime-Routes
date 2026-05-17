// admin.js

const CUSTOMER_SERVICE = '+1 (405) 873-5027';

let shipments = [];
let messages = [];

// ─── State for modals ──────────────────────────────────────────────
let _qsShipmentId = null;   // tracking-string ID for quick status
let _qsCurrentStatus = null;
let _delShipmentId  = null; // tracking-string ID queued for deletion

// ─── Toast notification ───────────────────────────────────────────
function showToast(msg, type = 'success') {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.className = 'admin-toast';
    document.body.appendChild(toast);
  }
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> ${msg}`;
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  });
}

// ─── Fetch data ───────────────────────────────────────────────────
async function fetchAdminData() {
  try {
    const { data: sData } = await sb.from('shipments').select('*').order('created_at', { ascending: false });
    if (sData) shipments = sData;

    const { data: mData } = await sb.from('contacts').select('*').order('date', { ascending: false });
    if (mData) messages = mData;

    initDashboard();
  } catch (e) {
    console.error('Error fetching admin data:', e);
    showToast('Failed to load data. Check your connection.', 'error');
  }
}

// ─── Auth ─────────────────────────────────────────────────────────
function loginAdmin() {
  const pw = document.getElementById('adminPassword').value;
  if (pw === 'admin123') {
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

// Check session on load
if (sessionStorage.getItem('adminLogged') === 'true') {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  fetchAdminData();
}

// ─── Clock ────────────────────────────────────────────────────────
setInterval(() => {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}, 1000);

// ─── Tab Switching ────────────────────────────────────────────────
function showTab(tabId, el) {
  document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(nav => nav.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  if (el) el.classList.add('active');
  const titles = {
    dashboard: 'Dashboard Overview',
    shipments: 'Manage Shipments',
    messages: 'Contact Messages'
  };
  document.getElementById('pageTitle').textContent = titles[tabId];
}

// ─── Dashboard Init ───────────────────────────────────────────────
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

// ─── Status badge ─────────────────────────────────────────────────
function getStatusBadge(status, shipId) {
  const lower = (status || '').toLowerCase();
  let cls = 'status-pending';
  if (lower.includes('transit') || lower.includes('delivery')) cls = 'status-in-transit';
  if (lower.includes('delivered')) cls = 'status-delivered';
  if (lower.includes('customs')) cls = 'status-customs';
  if (lower.includes('hold')) cls = 'status-on-hold';
  const clickAttr = shipId ? `onclick="openQuickStatus('${shipId}')" title="Click to change status"` : '';
  return `<span class="status-badge ${cls}" ${clickAttr}>${status}</span>`;
}

// ─── Render Shipments Table ───────────────────────────────────────
function renderShipments() {
  const tbody = document.querySelector('#shipmentsTable tbody');
  const search = document.getElementById('searchShipment').value.toLowerCase();

  tbody.innerHTML = '';

  const filtered = shipments.filter(s => {
    const id     = (s.id || '').toLowerCase();
    const sender = (s.senderName || s.sender || '').toLowerCase();
    const recvr  = (s.receiverName || s.receiver || '').toLowerCase();
    const origin = (s.origin || '').toLowerCase();
    const dest   = (s.destination || '').toLowerCase();
    return id.includes(search) || sender.includes(search) || recvr.includes(search) || origin.includes(search) || dest.includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#999;"><i class="fas fa-box-open" style="font-size:2rem; display:block; margin-bottom:10px; opacity:0.3;"></i>No shipments found.</td></tr>';
    return;
  }

  filtered.forEach(s => {
    const actualIndex = shipments.indexOf(s);
    const eta = s.expectedDate
      ? new Date(s.expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : (s.eta || '—');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family:monospace; color:var(--accent, #e8a924);">${s.id}</strong></td>
      <td>${s.senderName || s.sender || '—'}</td>
      <td>${s.receiverName || s.receiver || '—'}</td>
      <td>${getStatusBadge(s.status, s.id)}</td>
      <td style="color:#666; font-size:0.85rem;">${eta}</td>
      <td>
        <div class="action-group">
          <button class="btn-action" onclick="editShipment(${actualIndex})" title="Edit full shipment">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn-action status" onclick="openQuickStatus('${s.id}')" title="Quick status change">
            <i class="fas fa-bolt"></i> Status
          </button>
          <button class="btn-action delete" onclick="openDeleteModal('${s.id}')" title="Delete shipment">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Render Recent Table ──────────────────────────────────────────
function renderRecent() {
  const tbody = document.querySelector('#recentTable tbody');
  tbody.innerHTML = '';

  if (shipments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#999;">No shipments added yet.</td></tr>';
    return;
  }

  shipments.slice(0, 5).forEach(s => {
    const eta = s.expectedDate
      ? new Date(s.expectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : (s.eta || '—');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family:monospace; color:var(--accent, #e8a924);">${s.id}</strong></td>
      <td>${getStatusBadge(s.status)}</td>
      <td>${s.receiverName || s.receiver || '—'}</td>
      <td>${eta}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Render Messages Table ────────────────────────────────────────
function renderMessages() {
  const tbody = document.querySelector('#messagesTable tbody');
  tbody.innerHTML = '';

  if (messages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#999;">No messages received.</td></tr>';
    return;
  }

  const sortedMsg = [...messages].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedMsg.forEach((m, index) => {
    const d = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const sortedMsg = [...messages].sort((a, b) => new Date(b.date) - new Date(a.date));
  const target = sortedMsg[index];
  if (target && target.id) {
    await sb.from('contacts').delete().eq('id', target.id);
    showToast('Message deleted.', 'info');
    fetchAdminData();
  }
}

// ─── Dynamic Lists ────────────────────────────────────────────────
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

// ─── Add / Edit Modal ─────────────────────────────────────────────
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
  document.getElementById('modalTitle').textContent = 'Edit Shipment — ' + s.id;

  document.getElementById('shipId').value           = s.id;
  document.getElementById('shipType').value          = s.type || '';
  document.getElementById('shipSenderName').value    = s.senderName || '';
  document.getElementById('shipReceiverName').value  = s.receiverName || '';
  document.getElementById('shipSenderEmail').value   = s.senderEmail || '';
  document.getElementById('shipReceiverEmail').value = s.receiverEmail || '';
  document.getElementById('shipSenderPhone').value   = s.senderPhone || '';
  document.getElementById('shipReceiverPhone').value = s.receiverPhone || '';
  document.getElementById('shipOrigin').value        = s.origin || '';
  document.getElementById('shipDestination').value   = s.destination || '';
  document.getElementById('shipWeight').value        = s.weight || '';
  document.getElementById('shipStatus').value        = s.status || '';
  document.getElementById('shipDate').value          = s.shipDate || '';
  document.getElementById('shipExpectedDate').value  = s.expectedDate || '';
  document.getElementById('shipExpectedTime').value  = s.expectedTime || '';
  document.getElementById('shipPieceType').value     = s.pieceType || '';
  document.getElementById('shipDetails').value       = s.details || '';

  document.getElementById('waypointsList').innerHTML = '';
  if (s.waypoints) s.waypoints.forEach(w => addWaypoint(w.location, w.pause));

  document.getElementById('timelineList').innerHTML = '';
  if (s.timeline) s.timeline.forEach(t => addTimelineEvent(t.date, t.time, t.desc));

  document.getElementById('shipmentModal').classList.add('active');
}

// ─── Quick Status Modal ───────────────────────────────────────────
const ALL_STATUSES = [
  { label: '🕐 Pending',          value: 'Pending' },
  { label: '✈️ In Transit',       value: 'In Transit' },
  { label: '🛃 At Customs',       value: 'At Customs' },
  { label: '🚚 Out for Delivery', value: 'Out for Delivery' },
  { label: '✅ Delivered',        value: 'Delivered' },
  { label: '⏸️ On Hold',          value: 'On Hold' }
];

function openQuickStatus(shipId) {
  const s = shipments.find(x => x.id === shipId);
  if (!s) return;
  _qsShipmentId   = shipId;
  _qsCurrentStatus = s.status;

  document.getElementById('qsTrackingId').textContent = shipId;

  const grid = document.getElementById('qsStatusGrid');
  grid.innerHTML = '';
  ALL_STATUSES.forEach(st => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qs-status-btn' + (st.value === s.status ? ' selected' : '');
    btn.textContent = st.label;
    btn.dataset.value = st.value;
    btn.onclick = () => {
      grid.querySelectorAll('.qs-status-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      _qsCurrentStatus = st.value;
    };
    grid.appendChild(btn);
  });

  document.getElementById('quickStatusModal').classList.add('active');
}

function closeQuickStatus() {
  document.getElementById('quickStatusModal').classList.remove('active');
  _qsShipmentId = null;
}

async function applyQuickStatus() {
  if (!_qsShipmentId || !_qsCurrentStatus) return;

  const btn = document.getElementById('qsSaveBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    // Get the full shipment first so we can send the email correctly
    const s = shipments.find(x => x.id === _qsShipmentId);
    await sb.from('shipments').update({ status: _qsCurrentStatus }).eq('id', _qsShipmentId);

    // Update locally for instant UI refresh
    if (s) {
      s.status = _qsCurrentStatus;
      sendShipmentEmail({ ...s, status: _qsCurrentStatus }, 'updated');
    }

    closeQuickStatus();
    showToast(`Status updated to "${_qsCurrentStatus}" ✓`, 'success');
    fetchAdminData();
  } catch (err) {
    console.error('Quick status error:', err);
    showToast('Failed to update status. Please try again.', 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-check"></i> Update Status';
    btn.disabled = false;
  }
}

// ─── Delete Modal ─────────────────────────────────────────────────
function openDeleteModal(shipId) {
  _delShipmentId = shipId;
  document.getElementById('delTrackingId').textContent = shipId;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
  _delShipmentId = null;
}

async function confirmDelete() {
  if (!_delShipmentId) return;

  const btn = document.getElementById('delConfirmBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  btn.disabled = true;

  try {
    await sb.from('shipments').delete().eq('id', _delShipmentId);
    closeDeleteModal();
    showToast('Shipment deleted successfully.', 'info');
    fetchAdminData();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Failed to delete shipment.', 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-trash"></i> Yes, Delete';
    btn.disabled = false;
  }
}

// ─── Form Submit (Add / Edit) ─────────────────────────────────────
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
    id:            document.getElementById('shipId').value,
    type:          document.getElementById('shipType').value,
    senderName:    document.getElementById('shipSenderName').value,
    receiverName:  document.getElementById('shipReceiverName').value,
    senderEmail:   document.getElementById('shipSenderEmail').value,
    receiverEmail: document.getElementById('shipReceiverEmail').value,
    senderPhone:   document.getElementById('shipSenderPhone').value,
    receiverPhone: document.getElementById('shipReceiverPhone').value,
    origin:        document.getElementById('shipOrigin').value,
    destination:   document.getElementById('shipDestination').value,
    weight:        document.getElementById('shipWeight').value,
    status:        document.getElementById('shipStatus').value,
    shipDate:      document.getElementById('shipDate').value,
    expectedDate:  document.getElementById('shipExpectedDate').value,
    expectedTime:  document.getElementById('shipExpectedTime').value,
    pieceType:     document.getElementById('shipPieceType').value,
    details:       document.getElementById('shipDetails').value,
    waypoints,
    timeline,
    sender:   document.getElementById('shipSenderName').value,
    receiver: document.getElementById('shipReceiverName').value,
    eta:      document.getElementById('shipExpectedDate').value
  };

  const idx = document.getElementById('shipmentIndex').value;

  try {
    if (idx === '') {
      const { data: existing } = await sb.from('shipments').select('id').eq('id', sData.id).single();
      if (existing) {
        showToast('Tracking ID already exists! Use a unique ID.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
      await sb.from('shipments').insert([sData]);
      sendShipmentEmail(sData, 'created');
      showToast('Shipment created successfully! 🎉', 'success');
    } else {
      await sb.from('shipments').update(sData).eq('id', sData.id);
      sendShipmentEmail(sData, 'updated');
      showToast('Shipment updated successfully! ✓', 'success');
    }
  } catch (err) {
    console.error('Error saving shipment:', err);
    showToast('Failed to save shipment. Please try again.', 'error');
  }

  submitBtn.innerHTML = originalText;
  submitBtn.disabled = false;
  closeModal();
  fetchAdminData();
});

// ─── Email Notifications ──────────────────────────────────────────
function sendShipmentEmail(shipmentData, type) {
  const serviceID  = 'service_wz4szqe';
  const templateID = type === 'created' ? 'template_0pxhlex' : 'template_6r5tfk1';

  const templateParams = {
    tracking_id:  shipmentData.id,
    status:       shipmentData.status,
    sender_name:  shipmentData.senderName,
    receiver_name:shipmentData.receiverName,
    origin:       shipmentData.origin,
    destination:  shipmentData.destination,
    update_type:  type === 'created' ? 'Shipment Created' : 'Status Update',
    customer_service: CUSTOMER_SERVICE,
    message: type === 'created'
      ? `Your shipment ${shipmentData.id} has been successfully created and is currently ${shipmentData.status}. Track it on our website. For assistance call ${CUSTOMER_SERVICE}.`
      : `The status of your shipment ${shipmentData.id} has been officially updated to: ${shipmentData.status}. For assistance call ${CUSTOMER_SERVICE}.`
  };

  if (shipmentData.senderEmail && shipmentData.senderEmail.trim()) {
    emailjs.send(serviceID, templateID, {
      ...templateParams,
      to_email: shipmentData.senderEmail,
      to_name:  shipmentData.senderName
    }).catch(err => console.error('Sender email failed:', err));
  }

  if (shipmentData.receiverEmail && shipmentData.receiverEmail.trim()) {
    emailjs.send(serviceID, templateID, {
      ...templateParams,
      to_email: shipmentData.receiverEmail,
      to_name:  shipmentData.receiverName
    }).catch(err => console.error('Receiver email failed:', err));
  }
}
