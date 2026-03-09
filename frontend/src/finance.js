// ═══════════════════════════════════════════════════════════════════════════
// APEX — Finance Sector Module
// Cash Flow Sandbox, Liquidity HUD, Burn Graph, Transactions
// ═══════════════════════════════════════════════════════════════════════════

// ── Demo Account Data ────────────────────────────────────────────────────────
const ACCOUNTS = [
  { id: 'spending',  name: 'Spending',       balance: 47.82,   type: 'TRANSACTIONAL', icon: '◆' },
  { id: 'bills',     name: 'Bills',          balance: 312.00,  type: 'SAVER',         icon: '⬡' },
  { id: 'emergency', name: 'Emergency Fund', balance: 1840.00, type: 'SAVER',         icon: '◈' },
  { id: 'travel',    name: 'Travel',         balance: 85.50,   type: 'SAVER',         icon: '△' },
];

// ── Sandbox Events ───────────────────────────────────────────────────────────
let nextEventId = 100;
let sandboxEvents = [
  { id: 1, label: 'Salary',              amount: 4500,  date: '2026-03-15', recurring: null,         active: true,  type: 'income' },
  { id: 2, label: 'Noah — Sydney Trip',  amount: -700,  date: '2026-03-16', recurring: null,         active: true,  type: 'obligation' },
  { id: 3, label: 'Afterpay',            amount: -100,  date: '2026-03-14', recurring: 'fortnightly', active: true,  type: 'obligation' },
  { id: 4, label: 'Borrow from Joono',   amount: 150,   date: '2026-03-10', recurring: null,         active: true,  type: 'income' },
  { id: 5, label: 'Pay back Joono',      amount: -150,  date: '2026-03-16', recurring: null,         active: true,  type: 'obligation' },
];

// ── Demo Transactions ────────────────────────────────────────────────────────
const TRANSACTIONS = [
  { merchant: 'Woolworths',      amount: -67.42, date: '2026-03-08', category: 'Groceries',      time: '2:14 PM' },
  { merchant: 'Uber Eats',       amount: -34.90, date: '2026-03-08', category: 'Eating Out',     time: '8:45 PM' },
  { merchant: 'Netflix',         amount: -16.99, date: '2026-03-07', category: 'Entertainment',  time: '12:00 AM' },
  { merchant: 'Shell Coles',     amount: -72.15, date: '2026-03-07', category: 'Transport',      time: '9:22 AM' },
  { merchant: 'Apple.com',       amount: -1.99,  date: '2026-03-06', category: 'Tech',           time: '3:00 AM' },
  { merchant: 'Chemist Warehouse', amount: -22.50, date: '2026-03-06', category: 'Health',       time: '11:30 AM' },
  { merchant: 'BWS',             amount: -48.00, date: '2026-03-05', category: 'Lifestyle',      time: '5:45 PM' },
  { merchant: 'Guzman y Gomez',  amount: -19.80, date: '2026-03-05', category: 'Eating Out',     time: '12:55 PM' },
  { merchant: 'Spotify',         amount: -12.99, date: '2026-03-04', category: 'Entertainment',  time: '12:00 AM' },
  { merchant: 'Coles',           amount: -43.17, date: '2026-03-04', category: 'Groceries',      time: '10:12 AM' },
  { merchant: 'Afterpay',        amount: -100.00,date: '2026-03-01', category: 'Debt',           time: '12:00 AM' },
  { merchant: 'Transfer In',     amount: 250.00, date: '2026-02-28', category: 'Transfer',       time: '4:30 PM' },
];

const CATEGORY_COLORS = {
  Groceries:     'var(--teal)',
  'Eating Out':  'var(--orange)',
  Entertainment: 'var(--purple)',
  Transport:     'var(--blue)',
  Tech:          'var(--muted)',
  Health:        'var(--accent)',
  Lifestyle:     'var(--pink)',
  Debt:          'var(--red)',
  Transfer:      'var(--gold)',
};

// ── Sandbox Projection Engine ────────────────────────────────────────────────
function projectCashFlow() {
  const totalBalance = ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const today = new Date(2026, 2, 9); // Mar 9, 2026
  const days = 60;
  const projection = [];
  let runningBalance = totalBalance;

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let dayDelta = 0;
    sandboxEvents.filter(e => e.active).forEach(ev => {
      if (!ev.recurring) {
        // One-time event
        if (ev.date === dateStr) dayDelta += ev.amount;
      } else if (ev.recurring === 'fortnightly') {
        // Every 14 days from the start date
        const start = new Date(ev.date);
        const diff = Math.floor((d - start) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff % 14 === 0) dayDelta += ev.amount;
      } else if (ev.recurring === 'weekly') {
        const start = new Date(ev.date);
        const diff = Math.floor((d - start) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff % 7 === 0) dayDelta += ev.amount;
      } else if (ev.recurring === 'monthly') {
        const start = new Date(ev.date);
        if (d.getDate() === start.getDate() && d >= start) dayDelta += ev.amount;
      }
    });

    runningBalance += dayDelta;
    projection.push({
      date: new Date(d),
      dateStr,
      balance: runningBalance,
      delta: dayDelta,
      dayLabel: `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`,
    });
  }
  return projection;
}

function calcWeeklySafeToSpend(projection) {
  // Find balance 4 weeks from now
  const weeksAhead = 4;
  const endIdx = Math.min(weeksAhead * 7, projection.length - 1);
  const endBalance = projection[endIdx].balance;
  // Reserve $200 as minimum buffer
  const buffer = 200;
  const spendable = Math.max(0, endBalance - buffer);
  return Math.round(spendable / weeksAhead);
}

// ── SVG Burn Graph ───────────────────────────────────────────────────────────
function renderBurnGraph(projection) {
  const container = document.getElementById('fin-graph-canvas');
  if (!container) return;

  const W = 520, H = 240, PAD_T = 20, PAD_B = 30, PAD_L = 50, PAD_R = 10;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const balances = projection.map(p => p.balance);
  const maxB = Math.max(...balances) * 1.1;
  const minB = Math.min(0, Math.min(...balances) - 200);
  const range = maxB - minB;

  const x = (i) => PAD_L + (i / (projection.length - 1)) * plotW;
  const y = (v) => PAD_T + plotH - ((v - minB) / range) * plotH;

  // Build path
  const linePts = projection.map((p, i) => `${x(i)},${y(p.balance)}`).join(' ');
  const areaPts = `${x(0)},${y(minB)} ${linePts} ${x(projection.length - 1)},${y(minB)}`;

  // Y-axis labels
  const ySteps = 5;
  let yLabels = '';
  for (let i = 0; i <= ySteps; i++) {
    const val = minB + (range / ySteps) * i;
    const yPos = y(val);
    yLabels += `<text x="${PAD_L - 8}" y="${yPos + 3}" text-anchor="end" fill="var(--muted)" font-size="9" font-family="'DM Mono',monospace">$${Math.round(val).toLocaleString()}</text>`;
    yLabels += `<line x1="${PAD_L}" y1="${yPos}" x2="${W - PAD_R}" y2="${yPos}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
  }

  // X-axis labels (every 10 days)
  let xLabels = '';
  for (let i = 0; i < projection.length; i += 10) {
    xLabels += `<text x="${x(i)}" y="${H - 5}" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="'DM Mono',monospace">${projection[i].dayLabel}</text>`;
  }

  // Zero line
  const zeroY = y(0);
  const zeroLine = minB < 0 ? `<line x1="${PAD_L}" y1="${zeroY}" x2="${W - PAD_R}" y2="${zeroY}" stroke="var(--red)" stroke-width="1" stroke-dasharray="6,4" opacity="0.5"/>` : '';

  // Event markers
  let markers = '';
  projection.forEach((p, i) => {
    if (p.delta !== 0) {
      const color = p.delta > 0 ? 'var(--teal)' : 'var(--red)';
      markers += `<circle cx="${x(i)}" cy="${y(p.balance)}" r="3" fill="${color}" stroke="var(--bg)" stroke-width="1.5"/>`;
    }
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" class="fin-svg">
      <defs>
        <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--teal)" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="var(--teal)" stop-opacity="0.02"/>
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--teal)"/>
          <stop offset="50%" stop-color="#00ffcc"/>
          <stop offset="100%" stop-color="var(--teal)"/>
        </linearGradient>
      </defs>
      ${yLabels}
      ${xLabels}
      ${zeroLine}
      <polygon points="${areaPts}" fill="url(#burnGrad)"/>
      <polyline points="${linePts}" fill="none" stroke="url(#lineGrad)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${markers}
      <rect class="fin-scanline" x="${PAD_L}" y="${PAD_T}" width="2" height="${plotH}" fill="var(--teal)" opacity="0.15"/>
    </svg>
  `;
}

// ── Render Functions ─────────────────────────────────────────────────────────
export function renderFinanceView() {
  const projection = projectCashFlow();
  const weeklySafe = calcWeeklySafeToSpend(projection);
  const totalBalance = ACCOUNTS.reduce((s, a) => s + a.balance, 0);

  // ── Liquidity HUD ──
  const hud = document.getElementById('fin-hud');
  if (hud) {
    hud.innerHTML = ACCOUNTS.map((a, i) => `
      <div class="fin-account-card" style="animation-delay: ${i * 0.08}s">
        <div class="fin-acc-icon">${a.icon}</div>
        <div class="fin-acc-info">
          <div class="fin-acc-name">${a.name}</div>
          <div class="fin-acc-type">${a.type === 'SAVER' ? 'Saver' : 'Everyday'}</div>
        </div>
        <div class="fin-acc-balance ${a.balance < 100 ? 'low' : ''}">$${a.balance.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
      </div>
    `).join('') + `
      <div class="fin-account-card fin-acc-total" style="animation-delay: ${ACCOUNTS.length * 0.08}s">
        <div class="fin-acc-icon">Σ</div>
        <div class="fin-acc-info">
          <div class="fin-acc-name">Total Liquidity</div>
          <div class="fin-acc-type">All Accounts</div>
        </div>
        <div class="fin-acc-balance">$${totalBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</div>
      </div>
    `;
  }

  // ── Safe-to-Spend Hero ──
  const safeEl = document.getElementById('fin-safe-spend');
  if (safeEl) {
    const projEnd = projection[projection.length - 1];
    safeEl.innerHTML = `
      <div class="fin-safe-label">WEEKLY SAFE-TO-SPEND</div>
      <div class="fin-safe-value" id="fin-safe-number">$${weeklySafe}</div>
      <div class="fin-safe-sub">per week after obligations · projected balance in 60d: <span class="fin-safe-projected">$${Math.round(projEnd.balance).toLocaleString()}</span></div>
    `;
  }

  // ── Sandbox Ledger ──
  renderLedger();

  // ── Burn Graph ──
  renderBurnGraph(projection);

  // ── Recent Transactions ──
  const txEl = document.getElementById('fin-transactions');
  if (txEl) {
    txEl.innerHTML = `
      <div class="fin-tx-header">
        <div class="fin-tx-title">Recent Transactions</div>
        <div class="fin-tx-count">${TRANSACTIONS.length} transactions</div>
      </div>
      <div class="fin-tx-list">
        ${TRANSACTIONS.map((tx, i) => `
          <div class="fin-tx-row" style="animation-delay: ${i * 0.04}s">
            <div class="fin-tx-dot" style="background: ${CATEGORY_COLORS[tx.category] || 'var(--muted)'}"></div>
            <div class="fin-tx-merchant">${tx.merchant}</div>
            <div class="fin-tx-cat" style="color: ${CATEGORY_COLORS[tx.category] || 'var(--muted)'}">${tx.category}</div>
            <div class="fin-tx-date">${tx.date.slice(5)} · ${tx.time}</div>
            <div class="fin-tx-amount ${tx.amount > 0 ? 'positive' : ''}">${tx.amount > 0 ? '+' : ''}$${Math.abs(tx.amount).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function renderLedger() {
  const ledger = document.getElementById('fin-ledger');
  if (!ledger) return;

  ledger.innerHTML = `
    <div class="fin-ledger-header">
      <div class="fin-ledger-title">Cash Flow Sandbox</div>
      <button class="fin-add-event-btn" onclick="openAddEventModal()">+ Add Event</button>
    </div>
    <div class="fin-ledger-list">
      ${sandboxEvents.map(ev => `
        <div class="fin-event-row ${ev.active ? '' : 'disabled'}" data-id="${ev.id}">
          <label class="fin-toggle">
            <input type="checkbox" ${ev.active ? 'checked' : ''} onchange="toggleSandboxEvent(${ev.id})">
            <span class="fin-toggle-slider"></span>
          </label>
          <div class="fin-event-info">
            <div class="fin-event-label">${ev.label}</div>
            <div class="fin-event-meta">${ev.date.slice(5).replace('-', '/')}${ev.recurring ? ' · ' + ev.recurring : ''}</div>
          </div>
          <div class="fin-event-amount ${ev.amount > 0 ? 'positive' : 'negative'}">
            ${ev.amount > 0 ? '+' : ''}$${Math.abs(ev.amount).toLocaleString()}
          </div>
          <button class="fin-event-delete" onclick="removeSandboxEvent(${ev.id})">×</button>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Sandbox Event Actions ────────────────────────────────────────────────────
export function toggleSandboxEvent(id) {
  const ev = sandboxEvents.find(e => e.id === id);
  if (ev) {
    ev.active = !ev.active;
    renderFinanceView();
  }
}

export function removeSandboxEvent(id) {
  sandboxEvents = sandboxEvents.filter(e => e.id !== id);
  renderFinanceView();
}

export function addSandboxEvent(event) {
  sandboxEvents.push({ ...event, id: nextEventId++, active: true });
  renderFinanceView();
}

// ── Add Event Modal ──────────────────────────────────────────────────────────
export function openAddEventModal() {
  document.getElementById('fin-event-modal').style.display = 'flex';
}

export function closeAddEventModal() {
  document.getElementById('fin-event-modal').style.display = 'none';
}

export function submitNewEvent() {
  const label = document.getElementById('fin-ev-label').value.trim();
  const amount = parseFloat(document.getElementById('fin-ev-amount').value);
  const date = document.getElementById('fin-ev-date').value;
  const typeEl = document.getElementById('fin-ev-type');
  const type = typeEl.value;
  const recurringEl = document.getElementById('fin-ev-recurring');
  const recurring = recurringEl.value || null;

  if (!label || isNaN(amount) || !date) return;

  const finalAmount = type === 'obligation' ? -Math.abs(amount) : Math.abs(amount);
  addSandboxEvent({ label, amount: finalAmount, date, recurring, type });

  // Clear form
  document.getElementById('fin-ev-label').value = '';
  document.getElementById('fin-ev-amount').value = '';
  document.getElementById('fin-ev-date').value = '';
  closeAddEventModal();
}
