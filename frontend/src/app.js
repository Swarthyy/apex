// ═══════════════════════════════════════════════════════════════════════════
// APEX — Main Application Entry Point
// ═══════════════════════════════════════════════════════════════════════════
import { getToday, getRecentDays, addMeal, updateCheckin, TODAY_REF, SHORT_MONTHS } from './data.js';
import { renderDashboard, renderRightPanel, renderSectorView, renderInsightsList, renderIntegrations, setTodayRef } from './dashboard.js';
import { initCalendar, renderCalendar, calNavPrev, calNavNext, setCalView, autoSelectToday } from './calendar.js';
import { renderNutritionFeed, nutNavPrev, nutNavNext } from './nutrition.js';
import { getChatResponse } from './chat.js';

// ── Router ───────────────────────────────────────────────────────────────────
let currentView = 'dashboard';

function go(viewId) {
    currentView = viewId;

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Show target
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');

    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewId);
    });

    // Update topbar tabs
    const tabMap = { dashboard: 'dashboard', insights: 'insights', chat: 'chat', history: 'history', nutrition: 'nutrition' };
    document.querySelectorAll('.top-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabMap[viewId]);
    });

    // Show/hide right panel (only on dashboard)
    const rp = document.getElementById('right-panel');
    const mc = document.querySelector('.main-content');
    if (viewId === 'dashboard') {
        rp.style.display = 'block';
        mc.style.right = 'var(--rpanel-w)';
    } else {
        rp.style.display = 'none';
        mc.style.right = '0';
    }

    // Render view content
    const sectors = ['retention', 'sleep', 'energy', 'gym', 'libido', 'nutrition-sector', 'body', 'mood', 'finances', 'business'];
    if (viewId === 'dashboard') {
        renderDashboard();
        renderRightPanel();
    } else if (sectors.includes(viewId)) {
        setTimeout(() => renderSectorView(viewId), 50);
    } else if (viewId === 'insights') {
        renderInsightsList();
    } else if (viewId === 'integrations') {
        renderIntegrations();
    } else if (viewId === 'history') {
        setTimeout(() => { renderCalendar(); autoSelectToday(); }, 50);
    } else if (viewId === 'nutrition') {
        setTimeout(() => renderNutritionFeed(), 50);
    }
}

// ── Check-in Modal ───────────────────────────────────────────────────────────
function openCheckin() {
    const modal = document.getElementById('checkin-modal');
    modal.style.display = 'flex';
    const today = getToday();
    document.getElementById('checkin-date').textContent = `${TODAY_REF.getDate()} ${SHORT_MONTHS[TODAY_REF.getMonth()]} ${TODAY_REF.getFullYear()}`;
    if (today) {
        document.getElementById('ci-energy').value = today.energy;
        document.getElementById('ci-energy-val').textContent = today.energy;
        document.getElementById('ci-mood').value = today.mood;
        document.getElementById('ci-mood-val').textContent = today.mood;
        document.getElementById('ci-libido').value = today.libido;
        document.getElementById('ci-libido-val').textContent = today.libido;
        document.getElementById('ci-sr-day').textContent = today.srDay;
    }
}

function closeCheckin() { document.getElementById('checkin-modal').style.display = 'none'; }

function submitCheckin() {
    const energy = parseInt(document.getElementById('ci-energy').value);
    const mood = parseInt(document.getElementById('ci-mood').value);
    const libido = parseInt(document.getElementById('ci-libido').value);
    const srDay = parseInt(document.getElementById('ci-sr-day').textContent);
    updateCheckin(energy, mood, libido, srDay);
    closeCheckin();
    if (currentView === 'dashboard') { renderDashboard(); renderRightPanel(); }
}

function resetSR() {
    document.getElementById('ci-sr-day').textContent = '0';
}

// ── Meal Log Modal ──────────────────────────────────────────────────────────
function openMealLog() { document.getElementById('meal-modal').style.display = 'flex'; }
function closeMealLog() { document.getElementById('meal-modal').style.display = 'none'; }

function submitMeal() {
    const type = document.getElementById('ml-type').value;
    const name = document.getElementById('ml-name').value || 'Unnamed meal';
    const kcal = parseInt(document.getElementById('ml-kcal').value) || 0;
    const protein = parseInt(document.getElementById('ml-protein').value) || 0;
    const fat = parseInt(document.getElementById('ml-fat').value) || 0;
    const carbs = parseInt(document.getElementById('ml-carbs').value) || 0;
    const bonuses = [];
    if (protein > 40) bonuses.push('+High Protein');
    if (name.toLowerCase().includes('liver')) bonuses.push('+Vitamin A', '+B12');
    if (name.toLowerCase().includes('milk')) bonuses.push('+Raw Enzymes', '+CLA');
    if (name.toLowerCase().includes('oyster')) bonuses.push('+Zinc', '+Omega-3');
    if (fat > 35) bonuses.push('+Sat. Fat');
    if (carbs > 50) bonuses.push('+High Carb');

    addMeal({ type, name, kcal, protein, fat, carbs, bonuses, time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }), ingredients: name.split('+').map(s => s.trim()).filter(Boolean) });

    // Clear form
    document.getElementById('ml-name').value = '';
    document.getElementById('ml-kcal').value = '';
    document.getElementById('ml-protein').value = '';
    document.getElementById('ml-fat').value = '';
    document.getElementById('ml-carbs').value = '';

    closeMealLog();
    if (currentView === 'nutrition') renderNutritionFeed();
}

// ── Chat ─────────────────────────────────────────────────────────────────────
function sendChat() {
    const input = document.getElementById('chat-input');
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    const messages = document.getElementById('chat-messages');
    messages.innerHTML += `<div class="chat-msg user"><div class="chat-avatar">J</div><div class="chat-bubble">${query}</div></div>`;
    messages.innerHTML += `<div class="chat-msg apex" id="chat-typing"><div class="chat-avatar">◆</div><div class="chat-bubble" style="color:var(--muted)">Analysing your data...</div></div>`;
    messages.scrollTop = messages.scrollHeight;
    setTimeout(() => {
        const typing = document.getElementById('chat-typing');
        if (typing) typing.remove();
        const response = getChatResponse(query);
        messages.innerHTML += `<div class="chat-msg apex"><div class="chat-avatar">◆</div><div class="chat-bubble">${response}</div></div>`;
        messages.scrollTop = messages.scrollHeight;
    }, 1200);
}

function sendMobileChat() {
    const input = document.getElementById('mob-chat-input');
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    const messages = document.getElementById('mob-chat-messages');
    messages.innerHTML += `<div class="chat-msg user" style="font-size:10px"><div class="chat-avatar" style="width:24px;height:24px;font-size:10px">J</div><div class="chat-bubble">${query}</div></div>`;
    setTimeout(() => {
        const response = getChatResponse(query);
        messages.innerHTML += `<div class="chat-msg apex" style="font-size:10px"><div class="chat-avatar" style="width:24px;height:24px;font-size:10px">◆</div><div class="chat-bubble">${response}</div></div>`;
        messages.scrollTop = messages.scrollHeight;
    }, 1000);
}

// ── Mobile Overlay ──────────────────────────────────────────────────────────
function toggleMobile() {
    const overlay = document.getElementById('mobile-overlay');
    overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
    if (overlay.style.display === 'flex') renderMobileHome();
}

function switchMobTab(tab, el) {
    document.querySelectorAll('.mob-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.phone-tab').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(`mob-${tab}`);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
    if (tab === 'home') renderMobileHome();
    else if (tab === 'sectors') renderMobileSectors();
    else if (tab === 'history') renderMobileHistory();
    else if (tab === 'nutrition') renderMobileNutrition();
}

function renderMobileHome() {
    const today = getToday();
    if (!today) return;
    // Hero card
    document.getElementById('mob-hero').innerHTML = `
    <div class="mob-hero-label">SR / RETENTION</div>
    <div class="mob-hero-value">Day ${today.srDay}</div>
    <div class="mob-hero-sub">Vitality: ${today.vitality}/10</div>
    <div class="mob-hero-chips">
      <span class="mob-chip" style="color:var(--gold)">⚡${today.energy}</span>
      <span class="mob-chip" style="color:var(--blue)">🌙${today.sleep}h</span>
      <span class="mob-chip" style="color:var(--amber)">😊${today.mood}</span>
    </div>
  `;
    // Sector scroll
    const sectors = [
        { label: 'Sleep', value: `${today.sleep}h`, color: 'var(--blue)' },
        { label: 'Energy', value: today.energy, color: 'var(--gold)' },
        { label: 'Weight', value: `${today.weight}kg`, color: 'var(--purple)' },
        { label: 'Gym', value: today.hasGym ? '✓' : 'Rest', color: 'var(--orange)' },
        { label: 'Libido', value: today.libido, color: 'var(--pink)' },
        { label: 'Mood', value: today.mood, color: 'var(--amber)' },
        { label: 'Nutrition', value: `${today.totalKcal}`, color: 'var(--teal)' },
        { label: 'Body Fat', value: `${today.bodyFat}%`, color: 'var(--purple)' },
    ];
    document.getElementById('mob-sector-scroll').innerHTML = sectors.map(s => `
    <div class="mob-sector-card">
      <div class="msc-label">${s.label}</div>
      <div class="msc-value" style="color:${s.color}">${s.value}</div>
    </div>
  `).join('');
    // Insights
    document.getElementById('mob-insights').innerHTML = `
    <div class="mob-insight-card" style="border-left-color:var(--accent)">SR day ${today.srDay} — performance window ${today.srDay >= 14 ? 'active' : 'building'}.</div>
    <div class="mob-insight-card" style="border-left-color:var(--amber)">${today.hadLiver ? 'Liver logged ✓' : 'No liver this week — consider organ meat.'}</div>
  `;
    // Mini graph
    const days = getRecentDays(14);
    if (days.length > 1) {
        const w = 310, h = 60;
        const step = w / (days.length - 1);
        const pts = days.map((d, i) => `${i * step},${h - (d.energy / 10) * h}`).join(' ');
        document.getElementById('mob-mini-graph').innerHTML = `
      <div style="font-size:9px;color:var(--muted);margin-bottom:4px;font-family:Syne,sans-serif;font-weight:600">14-DAY ENERGY</div>
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:${h}px">
        <polyline fill="none" stroke="var(--gold)" stroke-width="2" points="${pts}"/>
      </svg>
    `;
    }
    // Nutrition card
    document.getElementById('mob-nutrition-card').innerHTML = `
    <div style="font-size:9px;color:var(--muted);margin-bottom:6px;font-family:Syne,sans-serif;font-weight:600">NUTRITION</div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
      <div style="flex:1;height:6px;background:var(--muted2);border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.min(100, (today.totalKcal / 3200) * 100)}%;background:linear-gradient(90deg,var(--teal),var(--accent));border-radius:3px"></div></div>
      <span style="font-size:10px;font-family:Syne,sans-serif;font-weight:700;color:var(--accent)">${today.totalKcal} kcal</span>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">
      ${today.hadLiver ? '<span class="nut-bonus-chip">+B12</span>' : ''}
      ${today.hadRawMilk ? '<span class="nut-bonus-chip">+CLA</span>' : ''}
      ${today.hadOysters ? '<span class="nut-bonus-chip">+Zinc</span>' : ''}
    </div>
  `;
}

function renderMobileSectors() {
    const today = getToday();
    if (!today) return;
    const sectors = [
        { name: 'SR / Retention', color: 'var(--accent)', val: `Day ${today.srDay}` },
        { name: 'Sleep', color: 'var(--blue)', val: `${today.sleep}h` },
        { name: 'Energy', color: 'var(--gold)', val: `${today.energy}/10` },
        { name: 'Gym', color: 'var(--orange)', val: today.hasGym ? 'Session ✓' : 'Rest' },
        { name: 'Libido', color: 'var(--pink)', val: `${today.libido}/10` },
        { name: 'Nutrition', color: 'var(--teal)', val: `${today.totalKcal} kcal` },
        { name: 'Body Comp', color: 'var(--purple)', val: `${today.weight}kg` },
        { name: 'Mood', color: 'var(--amber)', val: `${today.mood}/10` },
        { name: 'Finances', color: 'var(--teal)', val: '+$3,240' },
        { name: 'Business', color: 'var(--blue)', val: 'Focus: 8.2' },
    ];
    document.getElementById('mob-sector-list').innerHTML = sectors.map(s => `
    <div class="mob-sector-list-item">
      <div class="msli-dot" style="background:${s.color}"></div>
      <div class="msli-name">${s.name}</div>
      <div class="msli-val" style="color:${s.color}">${s.val}</div>
    </div>
  `).join('');
}

function renderMobileHistory() {
    document.getElementById('mob-history-content').innerHTML = `
    <div style="text-align:center;padding:20px;color:var(--muted)">
      <div style="font-size:24px;margin-bottom:8px">📅</div>
      <div>Historical calendar is optimised for desktop view.</div>
      <div style="margin-top:8px;font-size:10px">Open APEX on your desktop for the full calendar experience with month, week, and year views.</div>
    </div>
  `;
}

function renderMobileNutrition() {
    const today = getToday();
    if (!today) return;
    let html = `
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <span class="nut-pill" style="color:var(--accent)">${today.totalKcal} kcal</span>
      <span class="nut-pill" style="color:var(--teal)">${today.totalProtein}g P</span>
      <span class="nut-pill" style="color:var(--amber)">${today.totalFat}g F</span>
    </div>
  `;
    today.meals.forEach(meal => {
        html += `
      <div style="padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:8px">
        <div style="font-family:Syne,sans-serif;font-weight:700;font-size:11px;color:var(--muted)">${meal.type} · ${meal.time}</div>
        <div style="font-family:Syne,sans-serif;font-weight:700;font-size:13px;margin-top:2px">${meal.name}</div>
        <div style="font-family:Syne,sans-serif;font-weight:800;font-size:16px;color:var(--accent)">${meal.kcal} kcal</div>
      </div>
    `;
    });
    document.getElementById('mob-nut-content').innerHTML = html;
}

// ── Graph Toggle ─────────────────────────────────────────────────────────────
function setGraphRange(range, btn) {
    document.querySelectorAll('.graph-toggle').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ── Slider Sync ──────────────────────────────────────────────────────────────
function setupSliders() {
    ['energy', 'mood', 'libido'].forEach(field => {
        const slider = document.getElementById(`ci-${field}`);
        const valEl = document.getElementById(`ci-${field}-val`);
        if (slider && valEl) {
            slider.addEventListener('input', () => { valEl.textContent = slider.value; });
        }
    });
}

// ── Date Chip ────────────────────────────────────────────────────────────────
function updateDateChip() {
    const now = TODAY_REF;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    document.getElementById('date-chip').textContent = `${days[now.getDay()]} ${now.getDate()} ${SHORT_MONTHS[now.getMonth()]} · ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
setTodayRef(TODAY_REF);
updateDateChip();
setupSliders();
go('dashboard');

// Expose functions globally for onclick handlers
window.go = go;
window.openCheckin = openCheckin;
window.closeCheckin = closeCheckin;
window.submitCheckin = submitCheckin;
window.resetSR = resetSR;
window.openMealLog = openMealLog;
window.closeMealLog = closeMealLog;
window.submitMeal = submitMeal;
window.sendChat = sendChat;
window.sendMobileChat = sendMobileChat;
window.toggleMobile = toggleMobile;
window.switchMobTab = switchMobTab;
window.setGraphRange = setGraphRange;
window.calNavPrev = calNavPrev;
window.calNavNext = calNavNext;
window.setCalView = setCalView;
window.nutNavPrev = nutNavPrev;
window.nutNavNext = nutNavNext;
