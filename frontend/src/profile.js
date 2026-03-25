// ═══════════════════════════════════════════════════════════════════════════
// APEX — Profile Page
// ═══════════════════════════════════════════════════════════════════════════
import { getAuth, getUserName, getUserInitials, clearAuth } from './auth.js';

const SECTORS = [
    { id: 'retention', label: 'SR / Retention', color: 'var(--accent)', icon: '🔥' },
    { id: 'sleep', label: 'Sleep', color: 'var(--blue)', icon: '🌙' },
    { id: 'energy', label: 'Energy', color: 'var(--gold)', icon: '⚡' },
    { id: 'gym', label: 'Gym', color: 'var(--orange)', icon: '🏋' },
    { id: 'libido', label: 'Libido', color: 'var(--pink)', icon: '🔴' },
    { id: 'nutrition-sector', label: 'Nutrition', color: 'var(--teal)', icon: '🥩' },
    { id: 'body', label: 'Body Comp', color: 'var(--purple)', icon: '⚖' },
    { id: 'mood', label: 'Mood', color: 'var(--amber)', icon: '🧠' },
    { id: 'finances', label: 'Finances', color: 'var(--teal)', icon: '💰' },
    { id: 'business', label: 'Business', color: 'var(--blue)', icon: '🚀' },
];

function getProfileSettings() {
    try { return JSON.parse(localStorage.getItem('apex_profile')) || getDefaults(); } catch { return getDefaults(); }
}

function saveProfileSettings(s) {
    localStorage.setItem('apex_profile', JSON.stringify(s));
}

function getDefaults() {
    return {
        activeSectors: SECTORS.map(s => s.id),
        theme: 'dark',
        accent: '#c8f135',
        density: 'standard',
        notifications: { time: '07:00', checkin: true, weekly: true, insights: true, milestones: false },
    };
}

export function getActiveSectors() {
    const settings = getProfileSettings();
    return settings.activeSectors || SECTORS.map(s => s.id);
}

export function renderProfile() {
    const el = document.getElementById('view-profile');
    if (!el) return;
    const auth = getAuth();
    const settings = getProfileSettings();
    const obData = JSON.parse(localStorage.getItem('apex_onboarding') || '{}');
    const activeSectors = settings.activeSectors || SECTORS.map(s => s.id);

    const createdDate = auth?.createdAt ? new Date(auth.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
    const srDay = obData.sr?.currentDay || 0;

    el.innerHTML = `
    <div class="profile-page">
      <!-- Header -->
      <div class="profile-header">
        <div class="profile-avatar-large">${getUserInitials()}</div>
        <div class="profile-info">
          <div class="profile-name">${getUserName()}</div>
          <div class="profile-email">${auth?.email || ''}</div>
          <div class="profile-meta">
            ${srDay > 0 ? `<span class="profile-badge">🔥 Day ${srDay}</span>` : ''}
            <span class="profile-since">Member since ${createdDate}</span>
          </div>
        </div>
      </div>

      <!-- My Sectors -->
      <div class="profile-section">
        <div class="profile-section-title">My Sectors</div>
        <div class="profile-section-desc">Toggle sectors on or off. At least 3 must remain active.</div>
        <div class="profile-sectors" id="profile-sectors">
          ${SECTORS.map(s => {
        const active = activeSectors.includes(s.id);
        return `
              <div class="profile-sector-row" data-sector="${s.id}">
                <div class="profile-sector-left">
                  <span class="profile-sector-icon" style="color:${s.color}">${s.icon}</span>
                  <span class="profile-sector-label">${s.label}</span>
                </div>
                <label class="profile-toggle">
                  <input type="checkbox" ${active ? 'checked' : ''} onchange="toggleSector('${s.id}',this.checked)">
                  <span class="profile-toggle-slider"></span>
                </label>
              </div>
            `;
    }).join('')}
        </div>
      </div>

      <!-- Goals & Targets -->
      <div class="profile-section">
        <div class="profile-section-title">Goals & Targets</div>
        <div class="profile-goals-table">
          <div class="profile-goal-row profile-goal-header">
            <span>Sector</span><span>Goal</span><span>Target</span><span></span>
          </div>
          ${renderGoalRows(obData)}
        </div>
      </div>

      <!-- Notifications -->
      <div class="profile-section">
        <div class="profile-section-title">Notifications</div>
        <div class="profile-notif-row">
          <label>Daily nudge time</label>
          <input type="time" class="ob-input" id="prof-notif-time" value="${settings.notifications?.time || '07:00'}">
        </div>
        ${[
            { id: 'checkin', label: 'Morning check-in reminder' },
            { id: 'weekly', label: 'Weekly review summary' },
            { id: 'insights', label: 'Insight alerts' },
            { id: 'milestones', label: 'Goal milestone hits' },
        ].map(n => `
          <div class="profile-notif-row">
            <label>${n.label}</label>
            <label class="profile-toggle">
              <input type="checkbox" id="prof-notif-${n.id}" ${settings.notifications?.[n.id] ? 'checked' : ''}>
              <span class="profile-toggle-slider"></span>
            </label>
          </div>
        `).join('')}
        <button class="profile-save-btn" onclick="saveNotifPrefs()">Save notification preferences</button>
      </div>

      <!-- Display -->
      <div class="profile-section">
        <div class="profile-section-title">Display</div>

        <div class="profile-subsection">
          <div class="profile-sub-label">Theme</div>
          <div class="profile-swatches">
            <div class="profile-swatch ${settings.theme === 'dark' ? 'active' : ''}" style="background:#080810" onclick="setTheme('dark',this)" title="Dark"><span>Dark</span></div>
            <div class="profile-swatch ${settings.theme === 'darker' ? 'active' : ''}" style="background:#040408" onclick="setTheme('darker',this)" title="Darker"><span>Darker</span></div>
            <div class="profile-swatch ${settings.theme === 'amoled' ? 'active' : ''}" style="background:#000000" onclick="setTheme('amoled',this)" title="AMOLED"><span>AMOLED</span></div>
          </div>
        </div>

        <div class="profile-subsection">
          <div class="profile-sub-label">Accent Colour</div>
          <div class="profile-swatches">
            ${[
            { color: '#c8f135', name: 'Lime' },
            { color: '#00d4aa', name: 'Teal' },
            { color: '#ff7a2f', name: 'Orange' },
            { color: '#3574f1', name: 'Blue' },
            { color: '#ff3580', name: 'Pink' },
        ].map(a => `
              <div class="profile-swatch profile-accent-swatch ${settings.accent === a.color ? 'active' : ''}" style="background:${a.color}" onclick="setAccent('${a.color}',this)" title="${a.name}"></div>
            `).join('')}
          </div>
        </div>

        <div class="profile-subsection">
          <div class="profile-sub-label">Dashboard Density</div>
          <div class="profile-density-row">
            ${['Compact', 'Standard', 'Spacious'].map(d => `
              <button class="profile-density-btn ${(settings.density || 'standard') === d.toLowerCase() ? 'active' : ''}" onclick="setDensity('${d.toLowerCase()}',this)">${d}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Data -->
      <div class="profile-section">
        <div class="profile-section-title">Data</div>
        <div class="profile-data-actions">
          <button class="profile-action-btn" onclick="window.go('onboarding')">Re-run onboarding</button>
          <button class="profile-action-btn" onclick="showToast('Data export coming in Phase 2')">Export my data</button>
          <button class="profile-action-btn profile-action-danger" onclick="resetAPEX()">Reset APEX</button>
        </div>
      </div>
    </div>
  `;
}

function renderGoalRows(obData) {
    const goals = [
        { sector: 'Sleep', field: 'sleep', key: 'goal', label: 'Target hours', suffix: 'h' },
        { sector: 'Gym', field: 'gym', key: 'sessionsPerWeek', label: 'Sessions / week', suffix: 'x' },
        { sector: 'Nutrition', field: 'nutrition', key: 'proteinTarget', label: 'Protein target', suffix: 'g' },
        { sector: 'Nutrition', field: 'nutrition', key: 'calorieTarget', label: 'Calorie target', suffix: ' kcal' },
        { sector: 'Body', field: 'body', key: 'goalWeight', label: 'Goal weight', suffix: 'kg' },
        { sector: 'SR', field: 'sr', key: 'goal', label: 'Streak goal', suffix: '' },
    ];

    return goals.map(g => {
        const val = obData[g.field]?.[g.key] || '—';
        return `
      <div class="profile-goal-row">
        <span>${g.sector}</span>
        <span>${g.label}</span>
        <span class="profile-goal-val">${val}${val !== '—' ? g.suffix : ''}</span>
        <button class="profile-edit-btn" onclick="editGoal(this, '${g.field}', '${g.key}')">Edit</button>
      </div>
    `;
    }).join('');
}

// ── Actions ─────────────────────────────────────────────────────────────────

function toggleSector(sectorId, enabled) {
    const settings = getProfileSettings();
    let active = settings.activeSectors || SECTORS.map(s => s.id);

    if (enabled) {
        if (!active.includes(sectorId)) active.push(sectorId);
    } else {
        if (active.filter(s => s !== sectorId).length < 3) {
            showToast('At least 3 sectors must remain active');
            // Re-check the toggle
            const checkbox = document.querySelector(`.profile-sector-row[data-sector="${sectorId}"] input`);
            if (checkbox) checkbox.checked = true;
            return;
        }
        active = active.filter(s => s !== sectorId);
    }

    settings.activeSectors = active;
    saveProfileSettings(settings);
    updateSidebar(active);
}

function setTheme(theme, el) {
    const settings = getProfileSettings();
    settings.theme = theme;
    saveProfileSettings(settings);

    const themes = { dark: '#080810', darker: '#040408', amoled: '#000000' };
    document.documentElement.style.setProperty('--bg', themes[theme]);
    document.body.style.background = themes[theme];

    document.querySelectorAll('.profile-swatches .profile-swatch:not(.profile-accent-swatch)')
        .forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function setAccent(color, el) {
    const settings = getProfileSettings();
    settings.accent = color;
    saveProfileSettings(settings);

    document.documentElement.style.setProperty('--accent', color);

    document.querySelectorAll('.profile-accent-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function setDensity(density, el) {
    const settings = getProfileSettings();
    settings.density = density;
    saveProfileSettings(settings);

    document.body.classList.remove('density-compact', 'density-standard', 'density-spacious');
    document.body.classList.add(`density-${density}`);

    document.querySelectorAll('.profile-density-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
}

function saveNotifPrefs() {
    const settings = getProfileSettings();
    settings.notifications = {
        time: document.getElementById('prof-notif-time')?.value || '07:00',
        checkin: document.getElementById('prof-notif-checkin')?.checked ?? true,
        weekly: document.getElementById('prof-notif-weekly')?.checked ?? true,
        insights: document.getElementById('prof-notif-insights')?.checked ?? true,
        milestones: document.getElementById('prof-notif-milestones')?.checked ?? false,
    };
    saveProfileSettings(settings);
    showToast('Notification preferences saved');
}

function editGoal(btn, field, key) {
    const row = btn.closest('.profile-goal-row');
    const valEl = row.querySelector('.profile-goal-val');
    const current = valEl.textContent.replace(/[^0-9.]/g, '') || '';

    if (btn.textContent === 'Edit') {
        valEl.innerHTML = `<input type="text" class="ob-input" style="width:80px;display:inline" value="${current}">`;
        btn.textContent = 'Save';
    } else {
        const newVal = valEl.querySelector('input')?.value || current;
        const obData = JSON.parse(localStorage.getItem('apex_onboarding') || '{}');
        if (!obData[field]) obData[field] = {};
        obData[field][key] = isNaN(newVal) ? newVal : parseFloat(newVal);
        localStorage.setItem('apex_onboarding', JSON.stringify(obData));
        btn.textContent = 'Edit';
        renderProfile();
    }
}

function resetAPEX() {
    const confirmed = confirm('This will clear ALL your APEX data and return to the landing page. Are you sure?');
    if (!confirmed) return;
    clearAuth();
    localStorage.removeItem('apex_profile');
    localStorage.removeItem('apex_onboarding');
    window.go('landing');
}

function showToast(msg) {
    let toast = document.getElementById('apex-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'apex-toast';
        toast.className = 'apex-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function updateSidebar(activeSectors) {
    document.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
        const view = item.dataset.view;
        // Don't hide dashboard, integrations, settings
        if (['dashboard', 'integrations', 'settings'].includes(view)) return;
        item.style.display = activeSectors.includes(view) ? '' : 'none';
    });
}

// Expose globally
window.toggleSector = toggleSector;
window.setTheme = setTheme;
window.setAccent = setAccent;
window.setDensity = setDensity;
window.saveNotifPrefs = saveNotifPrefs;
window.editGoal = editGoal;
window.resetAPEX = resetAPEX;
window.showToast = showToast;

export { updateSidebar };
