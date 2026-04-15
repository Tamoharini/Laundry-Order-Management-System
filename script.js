const PRICE_LIST = {
  'Shirt':       50,
  'T-Shirt':     40,
  'Pants':       60,
  'Jeans':       70,
  'Saree':      150,
  'Kurta':       80,
  'Suit':       200,
  'Jacket':     120,
  'Blazer':     180,
  'Salwar':     110,
  'Lehenga':    250,
  'Bedsheet':   100,
  'Blanket':    150,
  'Curtain':    120,
};

const STATUSES = ['RECEIVED','PROCESSING','READY','DELIVERED'];

function getOrders() {
  return JSON.parse(localStorage.getItem('lms_orders') || '[]');
}
function saveOrders(orders) {
  localStorage.setItem('lms_orders', JSON.stringify(orders));
}
function generateId() {
  const prefix = 'CP';
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2,5);
  return `${prefix}-${ts}${rand}`;
}
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'orders')    renderOrders();
  if (name === 'create')    initCreatePage();
}
function initCreatePage() {
  // Build price table
  const pt = document.getElementById('price-table');
  pt.innerHTML = Object.entries(PRICE_LIST).map(([g,p]) =>
    `<tr><td>${g}</td><td style="font-weight:600;color:var(--primary)">₹${p}</td></tr>`
  ).join('');

  // Set default delivery date (+3 days)
  const d = new Date(); d.setDate(d.getDate()+3);
  document.getElementById('delivery-date').value = d.toISOString().split('T')[0];

  // Add initial garment row if empty
  if (!document.querySelector('.garment-row')) addGarmentRow();
  updateBill();
}

let rowCount = 0;
function addGarmentRow() {
  rowCount++;
  const id = rowCount;
  const div = document.createElement('div');
  div.className = 'garment-row';
  div.id = 'grow-' + id;
  div.innerHTML = `
    <select onchange="onGarmentChange(${id})" id="gtype-${id}">
      <option value="">— Select Garment —</option>
      ${Object.keys(PRICE_LIST).map(g=>`<option value="${g}">${g}</option>`).join('')}
    </select>
    <input type="number" id="gqty-${id}" placeholder="Qty" min="1" value="1" onchange="updateBill()" oninput="updateBill()" />
    <input type="number" id="gprice-${id}" placeholder="Price" min="0" step="0.01" onchange="updateBill()" oninput="updateBill()" />
    <button class="btn-remove" onclick="removeGarmentRow(${id})">✕</button>
  `;
  document.getElementById('garment-list').appendChild(div);
}

function onGarmentChange(id) {
  const type = document.getElementById('gtype-'+id).value;
  const price = PRICE_LIST[type] || 0;
  document.getElementById('gprice-'+id).value = price;
  updateBill();
}

function removeGarmentRow(id) {
  document.getElementById('grow-'+id)?.remove();
  updateBill();
}

function getGarments() {
  const rows = document.querySelectorAll('.garment-row');
  const items = [];
  rows.forEach(row => {
    const rid = row.id.replace('grow-','');
    const type  = document.getElementById('gtype-'+rid)?.value;
    const qty   = parseInt(document.getElementById('gqty-'+rid)?.value) || 0;
    const price = parseFloat(document.getElementById('gprice-'+rid)?.value) || 0;
    if (type) items.push({ type, qty, price, total: qty * price });
  });
  return items;
}

function updateBill() {
  const garments = getGarments();
  const total = garments.reduce((s,g) => s + g.total, 0);
  const items  = garments.reduce((s,g) => s + g.qty, 0);
  const bs = document.getElementById('bill-summary');
  if (garments.length > 0) {
    bs.style.display = 'flex';
    document.getElementById('bill-amount').textContent = '₹' + total.toFixed(2);
    document.getElementById('bill-items').textContent  = items;
    const dd = document.getElementById('delivery-date').value;
    document.getElementById('bill-delivery-label').textContent = dd ? 'Est. Delivery: ' + formatDate(dd) : '';
  } else {
    bs.style.display = 'none';
  }
}

function submitOrder() {
  const name  = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const garments = getGarments();
  const delivery = document.getElementById('delivery-date').value;
  const notes    = document.getElementById('special-notes').value.trim();

  if (!name)  { toast('⚠️ Customer name is required', 'error'); return; }
  if (!phone || !/^\d{10}$/.test(phone)) { toast('⚠️ Enter a valid 10-digit phone number', 'error'); return; }
  if (garments.length === 0) { toast('⚠️ Add at least one garment', 'error'); return; }
  if (garments.some(g => g.qty < 1)) { toast('⚠️ Quantity must be ≥ 1', 'error'); return; }

  const total = garments.reduce((s,g) => s + g.total, 0);
  const order = {
    id: generateId(),
    customerName: name,
    phone,
    garments,
    total,
    status: 'RECEIVED',
    deliveryDate: delivery,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);

  toast(`✅ Order ${order.id} created! Bill: ₹${total.toFixed(2)}`, 'success');
  resetForm();
  showPage('orders');
}

function resetForm() {
  document.getElementById('cust-name').value = '';
  document.getElementById('cust-phone').value = '';
  document.getElementById('special-notes').value = '';
  document.getElementById('garment-list').innerHTML = '';
  rowCount = 0;
  const d = new Date(); d.setDate(d.getDate()+3);
  document.getElementById('delivery-date').value = d.toISOString().split('T')[0];
  document.getElementById('bill-summary').style.display = 'none';
  addGarmentRow();
}
function renderOrders() {
  let orders = getOrders();
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const status = document.getElementById('filter-status')?.value || '';

  if (search) {
    orders = orders.filter(o =>
      o.customerName.toLowerCase().includes(search) ||
      o.phone.includes(search) ||
      o.id.toLowerCase().includes(search) ||
      o.garments.some(g => g.type.toLowerCase().includes(search))
    );
  }
  if (status) orders = orders.filter(o => o.status === status);

  const tbody = document.getElementById('orders-tbody');
  const empty = document.getElementById('orders-empty');
  document.getElementById('filter-count').textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

  if (orders.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = orders.map(o => {
    const garmentSummary = o.garments.map(g => `${g.type}×${g.qty}`).join(', ');
    const overdue = o.deliveryDate && new Date(o.deliveryDate) < new Date() && o.status !== 'DELIVERED';
    return `
      <tr>
        <td><code style="background:var(--primary-light);color:var(--primary);padding:3px 7px;border-radius:5px;font-size:.82rem;">${o.id}</code></td>
        <td><strong>${o.customerName}</strong></td>
        <td>${o.phone}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${garmentSummary}">${garmentSummary}</td>
        <td><strong style="color:var(--primary)">₹${o.total.toFixed(2)}</strong></td>
        <td><span class="badge badge-${o.status}">${o.status}</span></td>
        <td style="color:${overdue?'var(--danger)':'inherit'};font-weight:${overdue?'600':'400'}">
          ${o.deliveryDate ? formatDate(o.deliveryDate) + (overdue?' ⚠️':'') : '—'}
        </td>
        <td>
          <button class="btn btn-sm" style="background:var(--primary-light);color:var(--primary);margin-right:4px;" onclick="viewOrder('${o.id}')">👁 View</button>
          ${nextStatusBtn(o)}
        </td>
      </tr>
    `;
  }).join('');
}

function nextStatusBtn(order) {
  const idx = STATUSES.indexOf(order.status);
  if (idx === STATUSES.length - 1) return `<span style="font-size:.78rem;color:var(--muted)">✓ Done</span>`;
  const next = STATUSES[idx + 1];
  const colors = { PROCESSING:'#fef3c7;color:#b45309', READY:'#d1fae5;color:#065f46', DELIVERED:'#f3f4f6;color:#374151' };
  return `<button class="btn btn-sm" style="background:${colors[next]||'#f1f5f9;color:#374151'}" onclick="advanceStatus('${order.id}')">→ ${next}</button>`;
}

function advanceStatus(id) {
  const orders = getOrders();
  const o = orders.find(x => x.id === id);
  if (!o) return;
  const idx = STATUSES.indexOf(o.status);
  if (idx < STATUSES.length - 1) {
    o.status = STATUSES[idx + 1];
    o.updatedAt = new Date().toISOString();
    saveOrders(orders);
    toast(`📦 Order ${id} → ${o.status}`, 'success');
    renderOrders();
    renderDashboard();
  }
}
function viewOrder(id) {
  const order = getOrders().find(o => o.id === id);
  if (!order) return;

  const currentIdx = STATUSES.indexOf(order.status);
  const pipelineHTML = `
    <div class="pipeline">
      ${STATUSES.map((s,i) => `
        <div class="pipeline-step ${i < currentIdx ? 'done' : ''} ${i === currentIdx ? 'current' : ''}"
             onclick="setStatus('${id}', '${s}')">
          ${['📥','⚙️','✅','🚚'][i]} ${s}
        </div>
      `).join('')}
    </div>
  `;

  const garmentRows = order.garments.map(g =>
    `<tr><td>${g.type}</td><td>${g.qty}</td><td>₹${g.price}</td><td style="font-weight:600">₹${g.total.toFixed(2)}</td></tr>`
  ).join('');

  document.getElementById('modal-title').textContent = `Order ${order.id}`;
  document.getElementById('modal-body').innerHTML = `
    <div style="margin-bottom:12px;">
      <span class="badge badge-${order.status}" style="font-size:.85rem;padding:6px 14px;">${order.status}</span>
    </div>
    <h4 style="font-size:.85rem;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">Update Status</h4>
    ${pipelineHTML}
    <div class="detail-row"><span class="key">Customer</span><span class="val">${order.customerName}</span></div>
    <div class="detail-row"><span class="key">Phone</span><span class="val">${order.phone}</span></div>
    <div class="detail-row"><span class="key">Created</span><span class="val">${formatDateTime(order.createdAt)}</span></div>
    <div class="detail-row"><span class="key">Est. Delivery</span><span class="val">${order.deliveryDate ? formatDate(order.deliveryDate) : '—'}</span></div>
    ${order.notes ? `<div class="detail-row"><span class="key">Notes</span><span class="val">${order.notes}</span></div>` : ''}
    <div style="margin-top:16px;">
      <h4 style="font-size:.85rem;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">Garments</h4>
      <table style="width:100%">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr></thead>
        <tbody>${garmentRows}</tbody>
        <tfoot>
          <tr style="background:var(--primary-light);">
            <td colspan="3" style="padding:10px 14px;font-weight:700;color:var(--primary)">TOTAL</td>
            <td style="padding:10px 14px;font-weight:700;font-size:1.1rem;color:var(--primary)">₹${order.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div style="margin-top:16px;display:flex;gap:8px;">
      <button class="btn btn-success btn-sm" onclick="printOrder('${id}')">🖨 Print / Invoice</button>
      <button class="btn btn-sm" style="background:#fee2e2;color:var(--danger);" onclick="deleteOrder('${id}')">🗑 Delete</button>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

function setStatus(id, status) {
  const orders = getOrders();
  const o = orders.find(x => x.id === id);
  if (!o) return;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  saveOrders(orders);
  toast(`✅ Status updated to ${status}`, 'success');
  viewOrder(id);       // re-render modal
  renderOrders();
  renderDashboard();
}

function deleteOrder(id) {
  if (!confirm('Delete this order permanently?')) return;
  saveOrders(getOrders().filter(o => o.id !== id));
  closeModal();
  renderOrders();
  renderDashboard();
  toast('🗑 Order deleted', 'error');
}

function printOrder(id) {
  const o = getOrders().find(x => x.id === id);
  if (!o) return;
  const rows = o.garments.map(g =>
    `<tr><td>${g.type}</td><td>${g.qty}</td><td>₹${g.price}</td><td>₹${g.total.toFixed(2)}</td></tr>`
  ).join('');
  const w = window.open('','_blank');
  w.document.write(`
    <html><head><title>Invoice ${o.id}</title>
    <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:auto}
    h2{color:#4f46e5}table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{border:1px solid #ddd;padding:8px 12px;text-align:left}
    th{background:#f3f4f6}.total{font-size:1.2em;font-weight:bold;color:#4f46e5}
    .meta{display:flex;justify-content:space-between;margin-bottom:8px}
    </style></head><body>
    <h2>🧺 CleanPress — Invoice</h2>
    <div class="meta"><span><strong>Order ID:</strong> ${o.id}</span><span><strong>Date:</strong> ${formatDateTime(o.createdAt)}</span></div>
    <div class="meta"><span><strong>Customer:</strong> ${o.customerName}</span><span><strong>Phone:</strong> ${o.phone}</span></div>
    ${o.deliveryDate ? `<div><strong>Est. Delivery:</strong> ${formatDate(o.deliveryDate)}</div>` : ''}
    <table><thead><tr><th>Garment</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3" class="total">TOTAL</td><td class="total">₹${o.total.toFixed(2)}</td></tr></tfoot>
    </table>
    <p>Status: <strong>${o.status}</strong></p>
    ${o.notes ? `<p>Notes: ${o.notes}</p>` : ''}
    <script>window.print()<\/script>
    </body></html>
  `);
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
}

function renderDashboard() {
  const orders = getOrders();
  const total   = orders.length;
  const revenue = orders.reduce((s,o) => s + o.total, 0);
  const pending = orders.filter(o => o.status !== 'DELIVERED').length;
  const today   = new Date().toDateString();
  const todayRev = orders
    .filter(o => new Date(o.createdAt).toDateString() === today)
    .reduce((s,o) => s + o.total, 0);

  const statusCounts = {};
  STATUSES.forEach(s => { statusCounts[s] = orders.filter(o => o.status === s).length; });

  document.getElementById('stat-grid').innerHTML = `
    <div class="stat-card accent-blue">
      <div class="stat-icon">📦</div>
      <div class="stat-value">${total}</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-card accent-green">
      <div class="stat-icon">💰</div>
      <div class="stat-value">₹${revenue.toFixed(0)}</div>
      <div class="stat-label">Total Revenue</div>
    </div>
    <div class="stat-card accent-yellow">
      <div class="stat-icon">⏳</div>
      <div class="stat-value">${pending}</div>
      <div class="stat-label">Pending Orders</div>
    </div>
    <div class="stat-card accent-purple">
      <div class="stat-icon">📅</div>
      <div class="stat-value">₹${todayRev.toFixed(0)}</div>
      <div class="stat-label">Today's Revenue</div>
    </div>
  `;

  const barColors = { RECEIVED:'#3b82f6', PROCESSING:'#f59e0b', READY:'#10b981', DELIVERED:'#9ca3af' };
  const maxCount  = Math.max(...Object.values(statusCounts), 1);
  document.getElementById('bar-chart').innerHTML = STATUSES.map(s => `
    <div class="bar-row">
      <div class="bar-label">${s}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(statusCounts[s]/maxCount*100).toFixed(0)}%;background:${barColors[s]}">
          ${statusCounts[s]>0 ? statusCounts[s] : ''}
        </div>
      </div>
      <div class="bar-count">${statusCounts[s]}</div>
    </div>
  `).join('');

  const garmentRev = {};
  orders.forEach(o => o.garments.forEach(g => {
    garmentRev[g.type] = (garmentRev[g.type] || 0) + g.total;
  }));
  const sorted = Object.entries(garmentRev).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxRev  = Math.max(...sorted.map(x=>x[1]), 1);
  document.getElementById('revenue-breakdown').innerHTML = sorted.length === 0
    ? '<div class="empty"><div class="empty-icon">📊</div><p>No data yet</p></div>'
    : `<div class="bar-chart">${sorted.map(([g,r]) => `
        <div class="bar-row">
          <div class="bar-label" style="width:80px;font-size:.78rem;">${g}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(r/maxRev*100).toFixed(0)}%;background:var(--primary)"></div>
          </div>
          <div class="bar-count" style="width:60px;font-size:.78rem;">₹${r.toFixed(0)}</div>
        </div>`).join('')}</div>`;

  const recent = orders.slice(0, 5);
  document.getElementById('recent-orders-table').innerHTML = recent.length === 0
    ? '<div class="empty"><div class="empty-icon">🧺</div><p>No orders yet. <a href="#" onclick="showPage(\'create\');return false;" style="color:var(--primary)">Create one!</a></p></div>'
    : `<div class="table-wrap"><table>
        <thead><tr><th>Order ID</th><th>Customer</th><th>Bill</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>${recent.map(o => `
          <tr onclick="showPage('orders')" style="cursor:pointer">
            <td><code style="background:var(--primary-light);color:var(--primary);padding:3px 7px;border-radius:5px;font-size:.82rem;">${o.id}</code></td>
            <td>${o.customerName}</td>
            <td><strong>₹${o.total.toFixed(2)}</strong></td>
            <td><span class="badge badge-${o.status}">${o.status}</span></td>
            <td style="color:var(--muted);font-size:.82rem;">${formatDateTime(o.createdAt)}</td>
          </tr>`).join('')}
        </tbody></table></div>`;
}
function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
}
function formatDateTime(s) {
  return new Date(s).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}

function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3000);
}

function seedIfEmpty() {
  if (getOrders().length > 0) return;
  const seed = [
    { id: generateId(), customerName: 'Priya Patel', phone: '9876543210', garments:[{type:'Saree',qty:2,price:150,total:300},{type:'Blouse',qty:2,price:80,total:160}], total:460, status:'DELIVERED', deliveryDate:'2026-04-10', notes:'', createdAt: new Date(Date.now()-5*86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), customerName: 'Rahul Sharma', phone: '9123456789', garments:[{type:'Suit',qty:1,price:200,total:200},{type:'Shirt',qty:3,price:50,total:150}], total:350, status:'READY', deliveryDate:'2026-04-16', notes:'Starch shirts lightly', createdAt: new Date(Date.now()-2*86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), customerName: 'Anita Rao', phone: '9988776655', garments:[{type:'Kurta',qty:4,price:80,total:320},{type:'Pants',qty:2,price:60,total:120}], total:440, status:'PROCESSING', deliveryDate:'2026-04-17', notes:'', createdAt: new Date(Date.now()-1*86400000).toISOString(), updatedAt: new Date().toISOString() },
    { id: generateId(), customerName: 'Mohammed Ali', phone: '9001234567', garments:[{type:'Jacket',qty:1,price:120,total:120},{type:'Jeans',qty:2,price:70,total:140}], total:260, status:'RECEIVED', deliveryDate:'2026-04-18', notes:'Handle jacket with care', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  saveOrders(seed);
}
seedIfEmpty();
showPage('dashboard');
initCreatePage();