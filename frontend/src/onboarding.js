// ═══════════════════════════════════════════════════════════════════════════
// APEX — Character-Customisation Onboarding + Spotlight Tutorial
// 14-step wizard: Build your operator profile → Configure sectors →
// Spotlight tour → Optional Cold Start → Launch
// ═══════════════════════════════════════════════════════════════════════════
import { getUserName } from './auth.js';
import { seedFromOnboarding } from './data.js';
import { saveSplit, DEFAULT_SPLIT, MUSCLE_KEYWORDS } from './splitEngine.js';

const OB_KEY = 'apex_onboarding';
let currentStep = 0;
let spotlightActive = false;

function getOBData() {
  try { return JSON.parse(localStorage.getItem(OB_KEY)) || {}; } catch { return {}; }
}
function saveOBData(data) {
  localStorage.setItem(OB_KEY, JSON.stringify(data));
}

// ── All Available Muscles ────────────────────────────────────────────────
const ALL_MUSCLES = Object.keys(MUSCLE_KEYWORDS);

// ── Sector Meta ──────────────────────────────────────────────────────────
const SECTOR_META = [
  { id: 'retention', label: 'SR / Retention', color: 'var(--accent)', icon: '⚡', default: true },
  { id: 'sleep', label: 'Sleep', color: 'var(--blue)', icon: '🌙', default: true },
  { id: 'energy', label: 'Energy', color: 'var(--gold)', icon: '☀️', default: true },
  { id: 'gym', label: 'Gym', color: 'var(--orange)', icon: '🏋️', default: true },
  { id: 'nutrition', label: 'Nutrition', color: 'var(--teal)', icon: '🥩', default: true },
  { id: 'libido', label: 'Libido', color: 'var(--pink)', icon: '🔥', default: false },
  { id: 'body', label: 'Body Comp', color: 'var(--purple)', icon: '📐', default: false },
  { id: 'mood', label: 'Mood', color: 'var(--amber)', icon: '🧠', default: false },
  { id: 'finances', label: 'Finances', color: 'var(--teal)', icon: '💰', default: false },
  { id: 'business', label: 'Business', color: 'var(--blue)', icon: '📈', default: false },
];

// ── Step Definitions ────────────────────────────────────────────────────

const STEPS = [
  // ────── PHASE 1: CHARACTER CREATION ──────
  // 0: Welcome Cinematic
  {
    id: 'welcome', phase: 'create',
    render: () => `
      <div class="ob-cinematic">
        <div class="ob-logo-reveal">
          <div class="ob-logo-diamond">◆</div>
          <div class="ob-logo-text">APEX</div>
        </div>
        <div class="ob-cinematic-tagline">Build Your Operator Profile</div>
        <div class="ob-cinematic-sub">Configure your personal intelligence dashboard. Every choice shapes your experience.</div>
      </div>
    `,
    cta: 'Begin Setup →',
    collect: () => ({})
  },

  // 1: Identity
  {
    id: 'identity', phase: 'create', title: 'Identity', icon: '👤',
    render: (data) => {
      const avatars = ['⚡', '🔥', '🧠', '🎯', '🦾', '💎', '🐺', '🏔️', '⚔️', '🌊', '🔱', '👁️'];
      return `
        <div class="ob-section-label">WHO ARE YOU</div>
        <div class="ob-field-group">
          <label class="ob-label">Display Name</label>
          <input type="text" class="ob-input" id="ob-name" value="${data.displayName || getUserName() || ''}" placeholder="Your name">
        </div>
        <div class="ob-field-group">
          <label class="ob-label">Choose Your Emblem</label>
          <div class="ob-avatar-grid">
            ${avatars.map(a => `
              <div class="ob-avatar-option ${data.avatar === a ? 'selected' : ''}" onclick="selectAvatar(this, '${a}')">${a}</div>
            `).join('')}
          </div>
        </div>
      `;
    },
    collect: () => ({
      displayName: document.getElementById('ob-name')?.value || '',
      avatar: document.querySelector('.ob-avatar-option.selected')?.textContent || '⚡'
    })
  },

  // 2: Active Sectors
  {
    id: 'sectors', phase: 'create', title: 'Active Sectors', icon: '📊',
    render: (data) => {
      const active = data.activeSectors || SECTOR_META.filter(s => s.default).map(s => s.id);
      return `
        <div class="ob-section-label">CHOOSE YOUR SECTORS</div>
        <div class="ob-sector-sub">Toggle the areas of life you want APEX to track. You can change these later.</div>
        <div class="ob-sector-grid">
          ${SECTOR_META.map(s => `
            <div class="ob-sector-card ${active.includes(s.id) ? 'active' : ''}" onclick="toggleSector(this, '${s.id}')" style="--sc: ${s.color}">
              <div class="ob-sc-icon">${s.icon}</div>
              <div class="ob-sc-label">${s.label}</div>
              <div class="ob-sc-check">${active.includes(s.id) ? '✓' : ''}</div>
            </div>
          `).join('')}
        </div>
      `;
    },
    collect: () => ({
      activeSectors: Array.from(document.querySelectorAll('.ob-sector-card.active')).map(el => {
        const onclick = el.getAttribute('onclick');
        return onclick.match(/'([^']+)'/)?.[1];
      }).filter(Boolean)
    })
  },

  // 3: Sleep Config
  {
    id: 'sleep', phase: 'create', title: 'Sleep', icon: '🌙', color: 'var(--blue)',
    render: (data) => `
      <div class="ob-section-label" style="color:var(--blue)">SLEEP CONFIGURATION</div>
      <div class="ob-field-group">
        <label class="ob-label">Target Sleep (hours)</label>
        <div class="ob-slider-wrap">
          <input type="range" class="ob-slider" id="ob-sleep-target" min="5" max="10" step="0.5" value="${data.sleepTarget || 8}"
            oninput="document.getElementById('ob-sleep-val').textContent = this.value + 'h'">
          <div class="ob-slider-val" id="ob-sleep-val">${data.sleepTarget || 8}h</div>
        </div>
      </div>
      <div class="ob-field-group">
        <label class="ob-label">Ideal Bedtime Window</label>
        <div class="ob-time-row">
          <input type="time" class="ob-input ob-time" id="ob-bed-start" value="${data.bedStart || '22:00'}">
          <span class="ob-time-sep">→</span>
          <input type="time" class="ob-input ob-time" id="ob-bed-end" value="${data.bedEnd || '23:00'}">
        </div>
      </div>
    `,
    collect: () => ({
      sleepTarget: parseFloat(document.getElementById('ob-sleep-target')?.value) || 8,
      bedStart: document.getElementById('ob-bed-start')?.value || '22:00',
      bedEnd: document.getElementById('ob-bed-end')?.value || '23:00',
    })
  },

  // 4: Gym + Split Builder
  {
    id: 'gym', phase: 'create', title: 'Gym & Split', icon: '🏋️', color: 'var(--orange)',
    render: (data) => {
      const hasSplit = data.hasSplit !== undefined ? data.hasSplit : true;
      const rotation = data.splitRotation || DEFAULT_SPLIT.rotation;
      const partners = data.splitPartners || [];

      return `
        <div class="ob-section-label" style="color:var(--orange)">GYM CONFIGURATION</div>
        <div class="ob-field-group">
          <label class="ob-label">Do you follow a set training split?</label>
          <div class="ob-toggle-row">
            <button class="ob-toggle-btn ${hasSplit ? 'active' : ''}" onclick="toggleSplitMode(true)">Yes</button>
            <button class="ob-toggle-btn ${!hasSplit ? 'active' : ''}" onclick="toggleSplitMode(false)">No</button>
          </div>
        </div>

        <div id="ob-split-builder" style="display:${hasSplit ? 'block' : 'none'}">
          <div class="ob-field-group">
            <label class="ob-label">Split Name</label>
            <input type="text" class="ob-input" id="ob-split-name" value="${data.splitName || 'Push Pull Legs'}" placeholder="e.g. Push Pull Legs">
          </div>

          <div class="ob-field-group">
            <label class="ob-label">Rotation</label>
            <div id="ob-rotation-list">
              ${rotation.map((slot, i) => renderRotationSlot(slot, i)).join('')}
            </div>
            <button class="ob-add-slot-btn" onclick="addRotationSlot()">+ Add Session</button>
          </div>

          <div class="ob-field-group">
            <label class="ob-label">Training Partners</label>
            <div class="ob-partner-row">
              <input type="text" class="ob-input" id="ob-partner-input" placeholder="Add a name...">
              <button class="ob-add-partner-btn" onclick="addPartner()">+</button>
            </div>
            <div id="ob-partner-chips" class="ob-chip-wrap">
              ${partners.map(p => `<span class="ob-chip">${p} <span onclick="removePartner('${p}')">×</span></span>`).join('')}
            </div>
          </div>
        </div>
      `;
    },
    collect: () => {
      const hasSplit = document.querySelector('.ob-toggle-btn.active')?.textContent === 'Yes';
      if (!hasSplit) return { hasSplit: false };

      const slots = [];
      document.querySelectorAll('.ob-rot-row').forEach(row => {
        const label = row.querySelector('.ob-rot-label')?.value || '';
        const isRest = row.querySelector('.ob-rot-rest')?.checked || false;
        const muscleEls = row.querySelectorAll('.ob-muscle-chip.active');
        const muscles = Array.from(muscleEls).map(el => el.dataset.muscle);
        slots.push({
          id: label.toLowerCase().replace(/\s+/g, '-') || `slot-${slots.length}`,
          label: label || `Session ${slots.length + 1}`,
          muscles,
          partner: null,
          isRest,
        });
      });

      const partners = Array.from(document.querySelectorAll('#ob-partner-chips .ob-chip'))
        .map(el => el.textContent.replace('×', '').trim());

      return {
        hasSplit: true,
        splitName: document.getElementById('ob-split-name')?.value || 'Custom',
        splitRotation: slots.length > 0 ? slots : DEFAULT_SPLIT.rotation,
        splitPartners: partners,
      };
    }
  },

  // 5: Nutrition
  {
    id: 'nutrition', phase: 'create', title: 'Nutrition', icon: '🥩', color: 'var(--teal)',
    render: (data) => {
      const diets = ['Carnivore', 'Keto', 'Paleo', 'Balanced', 'Vegetarian', 'Vegan', 'Custom'];
      return `
        <div class="ob-section-label" style="color:var(--teal)">NUTRITION CONFIGURATION</div>
        <div class="ob-field-group">
          <label class="ob-label">Diet Style</label>
          <div class="ob-diet-grid">
            ${diets.map(d => `
              <div class="ob-diet-card ${data.diet === d ? 'active' : ''}" onclick="selectDiet(this, '${d}')">${d}</div>
            `).join('')}
          </div>
        </div>
        <div class="ob-field-group">
          <label class="ob-label">Key Foods You Track</label>
          <div class="ob-food-toggles">
            <label class="ob-food-toggle"><input type="checkbox" id="ob-liver" ${data.tracksLiver ? 'checked' : ''}> Liver</label>
            <label class="ob-food-toggle"><input type="checkbox" id="ob-oysters" ${data.tracksOysters ? 'checked' : ''}> Oysters</label>
            <label class="ob-food-toggle"><input type="checkbox" id="ob-rawmilk" ${data.tracksRawMilk ? 'checked' : ''}> Raw Milk</label>
            <label class="ob-food-toggle"><input type="checkbox" id="ob-eggs" ${data.tracksEggs ? 'checked' : ''}> Eggs</label>
          </div>
        </div>
      `;
    },
    collect: () => ({
      diet: document.querySelector('.ob-diet-card.active')?.textContent || 'Balanced',
      tracksLiver: document.getElementById('ob-liver')?.checked || false,
      tracksOysters: document.getElementById('ob-oysters')?.checked || false,
      tracksRawMilk: document.getElementById('ob-rawmilk')?.checked || false,
      tracksEggs: document.getElementById('ob-eggs')?.checked || false,
    })
  },

  // 6: SR / Retention
  {
    id: 'sr', phase: 'create', title: 'SR Streak', icon: '⚡', color: 'var(--accent)',
    render: (data) => `
      <div class="ob-section-label" style="color:var(--accent)">SEMEN RETENTION</div>
      <div class="ob-field-group">
        <label class="ob-label">Current Streak (days)</label>
        <div class="ob-number-row">
          <button class="ob-num-btn" onclick="adjustNumber('ob-sr-current', -1)">−</button>
          <input type="number" class="ob-input ob-number" id="ob-sr-current" value="${data.srCurrent || 0}" min="0">
          <button class="ob-num-btn" onclick="adjustNumber('ob-sr-current', 1)">+</button>
        </div>
      </div>
      <div class="ob-field-group">
        <label class="ob-label">Goal Streak</label>
        <div class="ob-goal-chips">
          ${[30, 60, 90, 180, 365].map(g => `
            <div class="ob-goal-chip ${data.srGoal === g ? 'active' : ''}" onclick="selectGoal(this, ${g})">${g} days</div>
          `).join('')}
        </div>
      </div>
    `,
    collect: () => ({
      srCurrent: parseInt(document.getElementById('ob-sr-current')?.value) || 0,
      srGoal: parseInt(document.querySelector('.ob-goal-chip.active')?.textContent) || 90,
    })
  },

  // 7: Body Comp
  {
    id: 'body', phase: 'create', title: 'Body Comp', icon: '📐', color: 'var(--purple)',
    render: (data) => `
      <div class="ob-section-label" style="color:var(--purple)">BODY COMPOSITION</div>
      <div class="ob-field-row">
        <div class="ob-field-group ob-half">
          <label class="ob-label">Current Weight (kg)</label>
          <input type="number" class="ob-input" id="ob-weight" value="${data.weight || ''}" placeholder="e.g. 85">
        </div>
        <div class="ob-field-group ob-half">
          <label class="ob-label">Target Weight (kg)</label>
          <input type="number" class="ob-input" id="ob-weight-target" value="${data.weightTarget || ''}" placeholder="e.g. 80">
        </div>
      </div>
      <div class="ob-field-group">
        <label class="ob-label">Estimated Body Fat %</label>
        <div class="ob-slider-wrap">
          <input type="range" class="ob-slider" id="ob-bf" min="5" max="40" step="1" value="${data.bodyFat || 15}"
            oninput="document.getElementById('ob-bf-val').textContent = this.value + '%'">
          <div class="ob-slider-val" id="ob-bf-val">${data.bodyFat || 15}%</div>
        </div>
      </div>
    `,
    collect: () => ({
      weight: parseFloat(document.getElementById('ob-weight')?.value) || null,
      weightTarget: parseFloat(document.getElementById('ob-weight-target')?.value) || null,
      bodyFat: parseInt(document.getElementById('ob-bf')?.value) || 15,
    })
  },

  // 8: Goals
  {
    id: 'goals', phase: 'create', title: 'Mission', icon: '🎯',
    render: (data) => `
      <div class="ob-section-label">DEFINE YOUR MISSION</div>
      <div class="ob-field-group">
        <label class="ob-label">What does peak performance mean to you?</label>
        <textarea class="ob-textarea" id="ob-goals" placeholder="e.g. I want to maintain a 90+ day SR streak, hit 100kg bench, and run my business from a position of total physical and mental dominance...">${data.goals || ''}</textarea>
        <div class="ob-textarea-hint">This is fed to the APEX AI for personalised insights.</div>
      </div>
    `,
    collect: () => ({
      goals: document.getElementById('ob-goals')?.value || ''
    })
  },

  // ────── PHASE 2: SPOTLIGHT TUTORIAL ──────
  // 9: Spotlight — Dashboard
  {
    id: 'spotlight-dashboard', phase: 'tutorial', title: 'Dashboard Tour', icon: '📊',
    render: () => `
      <div class="ob-spotlight-intro">
        <div class="ob-spotlight-icon">📊</div>
        <div class="ob-spotlight-title">Your Command Centre</div>
        <div class="ob-spotlight-desc">Let's walk through the key features of your APEX dashboard. We'll highlight each one so you know exactly where everything lives.</div>
      </div>
    `,
    cta: 'Start Tour →',
    spotlight: [
      { target: '#stat-tiles', title: 'Sector Tiles', desc: 'Your live vital signs. Each tile maps to one sector of your life — tap any tile to dive deeper.', position: 'bottom' },
      { target: '#sr-card', title: 'SR Streak Card', desc: 'Your retention counter. APEX tracks your streak automatically from your daily check-ins.', position: 'top' },
      { target: '#trends-chart', title: 'Trends Graph', desc: 'Energy and libido plotted over time. Toggle between 7D, 30D, and 90D windows to spot patterns.', position: 'top' },
    ],
    collect: () => ({})
  },

  // 10: Spotlight — Check-in
  {
    id: 'spotlight-checkin', phase: 'tutorial', title: 'Daily Check-in', icon: '☀️',
    render: () => `
      <div class="ob-spotlight-intro">
        <div class="ob-spotlight-icon">☀️</div>
        <div class="ob-spotlight-title">Morning Check-in</div>
        <div class="ob-spotlight-desc">Every morning, you'll rate your energy, mood, libido, and log your sleep. This is how APEX builds your Vitality Score.</div>
      </div>
    `,
    cta: 'Show Me →',
    spotlight: [
      { target: '#btn-checkin', title: 'Check-in Button', desc: 'Tap this every morning. It takes 15 seconds and feeds every insight in APEX.', position: 'bottom' },
    ],
    collect: () => ({})
  },

  // 11: Spotlight — Sidebar Navigation
  {
    id: 'spotlight-sectors', phase: 'tutorial', title: 'Navigation', icon: '🗂️',
    render: () => `
      <div class="ob-spotlight-intro">
        <div class="ob-spotlight-icon">🗂️</div>
        <div class="ob-spotlight-title">Sector Navigation</div>
        <div class="ob-spotlight-desc">The sidebar gives you direct access to every sector you've activated. Each one has its own dedicated deep-dive page.</div>
      </div>
    `,
    cta: 'Show Me →',
    spotlight: [
      { target: '.sidebar', title: 'Sector Sidebar', desc: 'Your active sectors live here. Click any to view detailed stats, trends, and AI-generated insights for that area.', position: 'right' },
    ],
    collect: () => ({})
  },

  // ────── PHASE 3: COLD START (OPTIONAL) ──────
  // 12: File Upload + Calendar
  {
    id: 'cold-start', phase: 'data', title: 'Data Backfill', icon: '📝', optional: true,
    render: (data) => `
      <div class="ob-section-label">OPTIONAL: COLD START DATA</div>
      <div class="ob-cold-start-desc">Upload a chat history export and/or paste your Google Calendar .ics URL. APEX will use AI to retroactively estimate your last 90 days of Vitality data.</div>

      <div class="ob-field-group">
        <label class="ob-label">Chat History (.txt or .json)</label>
        <div class="ob-upload-zone" onclick="document.getElementById('ob-file-input').click()">
          <input type="file" id="ob-file-input" accept=".txt,.json" style="display:none" onchange="document.getElementById('ob-file-name').textContent = this.files[0]?.name || 'No file selected'">
          <div class="ob-upload-icon">📄</div>
          <div id="ob-file-name" class="ob-upload-name">${data.fileName || 'Click to select file'}</div>
        </div>
      </div>

      <div class="ob-field-group">
        <label class="ob-label">Google Calendar .ics URL</label>
        <input type="text" class="ob-input" id="ob-cal-url" placeholder="Paste your private .ics URL..." value="${data.calendarUrl || ''}">
        <div class="ob-hint">Google Calendar → Settings → Integrate → Secret address in iCal format</div>
      </div>
    `,
    cta: 'Continue →',
    skipText: 'Skip — I\'ll start fresh',
    collect: () => ({
      calendarUrl: document.getElementById('ob-cal-url')?.value || '',
      fileName: document.getElementById('ob-file-name')?.textContent || '',
      hasFile: !!(document.getElementById('ob-file-input')?.files?.[0]),
    })
  },

  // ────── PHASE 4: LAUNCH ──────
  // 13: Launch Cinematic
  {
    id: 'launch', phase: 'launch',
    render: () => `
      <div class="ob-cinematic">
        <div class="ob-launch-pulse"></div>
        <div class="ob-launch-title">Your APEX is ready.</div>
        <div class="ob-launch-sub" id="ob-launch-status">Compiling operator profile...</div>
      </div>
    `,
    cta: 'Launching...',
    collect: () => ({})
  },
];

// ── Rotation Slot Renderer (for Gym step) ────────────────────────────────

function renderRotationSlot(slot, index) {
  return `
    <div class="ob-rot-row" data-index="${index}">
      <span class="ob-rot-handle">⠿</span>
      <input type="text" class="ob-rot-label ob-input" value="${slot.label || ''}" placeholder="Session name">
      <div class="ob-rot-muscles">
        ${ALL_MUSCLES.map(m => `
          <span class="ob-muscle-chip ${(slot.muscles || []).includes(m) ? 'active' : ''}" data-muscle="${m}" onclick="this.classList.toggle('active')">${m}</span>
        `).join('')}
      </div>
      <label class="ob-rot-rest-label"><input type="checkbox" class="ob-rot-rest" ${slot.isRest ? 'checked' : ''} onchange="toggleRestRow(this)"> Rest</label>
      ${index > 0 ? `<button class="ob-rot-delete" onclick="removeRotationSlot(${index})">✕</button>` : ''}
    </div>
  `;
}

// ── Render Engine ────────────────────────────────────────────────────────

export function renderStep() {
  const container = document.getElementById('ob-content');
  if (!container) return;
  const step = STEPS[currentStep];
  const obData = getOBData();

  // Phase indicator
  const phases = [
    { label: 'CREATE', steps: [0, 1, 2, 3, 4, 5, 6, 7, 8], color: 'var(--accent)' },
    { label: 'TOUR', steps: [9, 10, 11], color: 'var(--blue)' },
    { label: 'DATA', steps: [12], color: 'var(--teal)' },
    { label: 'LAUNCH', steps: [13], color: 'var(--orange)' },
  ];

  const currentPhase = phases.find(p => p.steps.includes(currentStep));

  // Progress bar
  const pct = ((currentStep) / (STEPS.length - 1)) * 100;

  const progressHtml = `
    <div class="ob-progress">
      <div class="ob-progress-phases">
        ${phases.map(p => `
          <div class="ob-phase-label ${p === currentPhase ? 'active' : ''}" style="color:${p === currentPhase ? p.color : 'var(--muted)'}">${p.label}</div>
        `).join('')}
      </div>
      <div class="ob-progress-track">
        <div class="ob-progress-fill" style="width:${pct}%;background:${currentPhase?.color || 'var(--accent)'}"></div>
      </div>
      <div class="ob-progress-step">${currentStep + 1} / ${STEPS.length}</div>
    </div>
  `;

  const btnText = step.cta || 'Continue →';
  const isLast = currentStep === STEPS.length - 1;

  let html = `
    ${currentStep > 0 ? progressHtml : ''}
    <div class="ob-card ${currentStep === 0 ? 'ob-card-cinematic' : ''} fadeIn">
      ${step.title && step.phase === 'create' ? `
        <div class="ob-step-header">
          <span class="ob-step-icon" style="color:${step.color || 'var(--accent)'}">${step.icon || ''}</span>
          <span class="ob-step-title">${step.title}</span>
        </div>
      ` : ''}
      <div class="ob-step-body">
        ${step.render(obData)}
      </div>
      <div class="ob-footer">
        ${currentStep > 0 && !isLast ? `<button class="ob-btn-back" onclick="obBack()">← Back</button>` : '<div></div>'}
        <div class="ob-footer-right">
          ${step.optional ? `<button class="ob-btn-skip" onclick="obSkip()">${step.skipText || 'Skip'}</button>` : ''}
          <button class="ob-btn-next" onclick="obNext()" id="ob-btn-next" ${isLast ? 'disabled' : ''}>${btnText}</button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Auto-trigger launch step
  if (step.id === 'launch') {
    runLaunchSequence();
  }
}

// ── Spotlight System ─────────────────────────────────────────────────────

function enterSpotlightMode(step) {
  spotlightActive = true;

  // Show the app shell behind the onboarding
  const appShell = document.getElementById('app-shell');
  const obView = document.getElementById('view-onboarding');
  if (appShell) appShell.style.display = '';
  if (obView) obView.style.display = 'none';

  // Create overlay
  let overlay = document.getElementById('spotlight-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'spotlight-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'block';

  showSpotlightTarget(step.spotlight, 0, step);
}

function showSpotlightTarget(targets, idx, step) {
  if (idx >= targets.length) {
    exitSpotlightMode();
    return;
  }

  const t = targets[idx];
  const el = document.querySelector(t.target);
  const overlay = document.getElementById('spotlight-overlay');

  if (!el || !overlay) {
    // Skip if target not found
    showSpotlightTarget(targets, idx + 1, step);
    return;
  }

  const rect = el.getBoundingClientRect();
  const pad = 12;

  // Create cutout via box-shadow
  overlay.innerHTML = `
    <div class="spotlight-cutout" style="
      top: ${rect.top - pad}px;
      left: ${rect.left - pad}px;
      width: ${rect.width + pad * 2}px;
      height: ${rect.height + pad * 2}px;
    "></div>
    <div class="spotlight-tooltip ${t.position || 'bottom'}" style="
      ${t.position === 'top' ? `bottom: ${window.innerHeight - rect.top + pad + 16}px;` : ''}
      ${t.position === 'bottom' ? `top: ${rect.bottom + pad + 16}px;` : ''}
      ${t.position === 'right' ? `left: ${rect.right + pad + 16}px; top: ${rect.top}px;` : ''}
      ${t.position !== 'right' ? `left: ${Math.max(20, rect.left)}px;` : ''}
    ">
      <div class="spotlight-tt-title">${t.title}</div>
      <div class="spotlight-tt-desc">${t.desc}</div>
      <div class="spotlight-tt-actions">
        <button class="spotlight-tt-btn" onclick="nextSpotlight()">
          ${idx < targets.length - 1 ? 'Next →' : 'Got it ✓'}
        </button>
        <span class="spotlight-tt-counter">${idx + 1}/${targets.length}</span>
      </div>
    </div>
  `;

  // Store state for nextSpotlight
  window._spotlightState = { targets, idx, step };
}

window.nextSpotlight = function () {
  const s = window._spotlightState;
  if (!s) return;
  showSpotlightTarget(s.targets, s.idx + 1, s.step);
};

function exitSpotlightMode() {
  spotlightActive = false;
  const overlay = document.getElementById('spotlight-overlay');
  if (overlay) overlay.style.display = 'none';

  // Hide app shell, show onboarding again
  const appShell = document.getElementById('app-shell');
  const obView = document.getElementById('view-onboarding');
  if (appShell) appShell.style.display = 'none';
  if (obView) obView.style.display = 'block';

  // Advance to next step
  currentStep++;
  updateSidebarNav();
  renderStep();
}

// ── Launch Sequence ──────────────────────────────────────────────────────

async function runLaunchSequence() {
  const data = getOBData();
  const statusEl = document.getElementById('ob-launch-status');

  const messages = [
    'Compiling operator profile...',
    'Configuring active sectors...',
    'Initialising split engine...',
    'Calibrating Vitality algorithm...',
  ];

  // Save profile to localStorage
  const profile = JSON.parse(localStorage.getItem('apex_profile') || '{}');
  profile.displayName = data.displayName;
  profile.avatar = data.avatar;
  profile.activeSectors = data.activeSectors;
  profile.sleepTarget = data.sleepTarget;
  profile.diet = data.diet;
  profile.goals = data.goals;
  profile.weight = data.weight;
  profile.weightTarget = data.weightTarget;
  profile.bodyFat = data.bodyFat;
  profile.srCurrent = data.srCurrent;
  profile.srGoal = data.srGoal;
  localStorage.setItem('apex_profile', JSON.stringify(profile));

  // Save split if configured
  if (data.hasSplit && data.splitRotation) {
    const splitData = {
      name: data.splitName || 'Custom',
      rotation: data.splitRotation,
      currentIndex: 0,
      lastLoggedDate: null,
      exerciseMap: {},
      partners: data.splitPartners || [],
    };
    saveSplit(splitData);
  }

  // Animate status messages
  for (let i = 0; i < messages.length; i++) {
    await new Promise(r => setTimeout(r, 600));
    if (statusEl) statusEl.textContent = messages[i];
  }

  // If Cold Start file was attached, attempt to upload
  if (data.hasFile) {
    if (statusEl) statusEl.textContent = 'Uploading history to LLM Core...';
    // The actual upload logic is in the existing backend endpoint
    // For now we just simulate it
    await new Promise(r => setTimeout(r, 1200));
  }

  await new Promise(r => setTimeout(r, 800));
  if (statusEl) statusEl.textContent = 'Ready.';

  await new Promise(r => setTimeout(r, 600));

  // Complete onboarding
  import('./auth.js').then(auth => {
    auth.completeOnboarding();
    seedFromOnboarding();
    const el = document.getElementById('view-onboarding');
    if (el?._keyHandler) document.removeEventListener('keydown', el._keyHandler);
    window.location.reload();
  });
}

// ── Navigation ───────────────────────────────────────────────────────────

function obNext() {
  const step = STEPS[currentStep];
  const data = getOBData();
  const collected = step.collect();
  Object.assign(data, collected);
  saveOBData(data);

  // If this step has spotlights, enter spotlight mode instead of advancing
  if (step.spotlight && step.spotlight.length > 0) {
    enterSpotlightMode(step);
    return;
  }

  if (currentStep < STEPS.length - 1) {
    currentStep++;
    updateSidebarNav();
    renderStep();
  }
}

function obBack() {
  if (currentStep > 0 && currentStep < STEPS.length - 1) {
    const step = STEPS[currentStep];
    try {
      const data = getOBData();
      Object.assign(data, step.collect());
      saveOBData(data);
    } catch (e) { }
    currentStep--;
    updateSidebarNav();
    renderStep();
  }
}

function obSkip() {
  if (currentStep < STEPS.length - 1) {
    currentStep++;
    updateSidebarNav();
    renderStep();
  }
}

function updateSidebarNav() {
  document.querySelectorAll('.ob-nav-item').forEach((item, i) => {
    item.classList.toggle('active', i === currentStep);
    item.classList.toggle('done', i < currentStep);
  });
}

// ── Global Helpers (exposed to onclick handlers) ─────────────────────────

window.selectAvatar = function (el, emoji) {
  document.querySelectorAll('.ob-avatar-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
};

window.toggleSector = function (el, id) {
  el.classList.toggle('active');
  el.querySelector('.ob-sc-check').textContent = el.classList.contains('active') ? '✓' : '';
};

window.selectDiet = function (el, diet) {
  document.querySelectorAll('.ob-diet-card').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
};

window.selectGoal = function (el, val) {
  document.querySelectorAll('.ob-goal-chip').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
};

window.adjustNumber = function (id, delta) {
  const input = document.getElementById(id);
  if (input) input.value = Math.max(0, parseInt(input.value || 0) + delta);
};

window.toggleSplitMode = function (hasSplit) {
  document.querySelectorAll('.ob-toggle-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const builder = document.getElementById('ob-split-builder');
  if (builder) builder.style.display = hasSplit ? 'block' : 'none';
};

window.addRotationSlot = function () {
  const list = document.getElementById('ob-rotation-list');
  if (!list) return;
  const count = list.querySelectorAll('.ob-rot-row').length;
  const slot = { id: `slot-${count}`, label: '', muscles: [], isRest: false };
  list.insertAdjacentHTML('beforeend', renderRotationSlot(slot, count));
};

window.removeRotationSlot = function (index) {
  const rows = document.querySelectorAll('.ob-rot-row');
  if (rows.length > 1 && rows[index]) rows[index].remove();
};

window.toggleRestRow = function (checkbox) {
  const row = checkbox.closest('.ob-rot-row');
  if (row) {
    row.querySelector('.ob-rot-muscles').style.display = checkbox.checked ? 'none' : 'flex';
  }
};

window.addPartner = function () {
  const input = document.getElementById('ob-partner-input');
  if (!input || !input.value.trim()) return;
  const chips = document.getElementById('ob-partner-chips');
  const name = input.value.trim();
  chips.insertAdjacentHTML('beforeend', `<span class="ob-chip">${name} <span onclick="removePartner('${name}')">×</span></span>`);
  input.value = '';
};

window.removePartner = function (name) {
  document.querySelectorAll('#ob-partner-chips .ob-chip').forEach(c => {
    if (c.textContent.replace('×', '').trim() === name) c.remove();
  });
};

// ── Init ─────────────────────────────────────────────────────────────────

export function initOnboarding() {
  currentStep = 0;

  const navItems = STEPS.map((s, i) => {
    const label = s.title || (s.id === 'welcome' ? 'Welcome' : s.id === 'launch' ? 'Launch' : s.id);
    return `<div class="ob-nav-item ${i === 0 ? 'active' : ''}">${s.icon || '◆'} ${label}</div>`;
  }).join('');

  const html = `
    <div class="view-fullscreen active" id="view-onboarding">
      <div class="ob-layout">
        <div class="ob-sidebar">
          <div class="ob-logo">◆ APEX</div>
          <div class="ob-sidebar-tagline">Operator Onboarding</div>
          <div class="ob-nav">${navItems}</div>
        </div>
        <div class="ob-main">
          <div id="ob-content" class="ob-content-wrap"></div>
        </div>
      </div>
    </div>
  `;

  let existing = document.getElementById('view-onboarding');
  if (existing) {
    existing.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Keyboard handler
  const handler = (e) => {
    if (spotlightActive) {
      if (e.key === 'Enter' || e.key === ' ') window.nextSpotlight?.();
      if (e.key === 'Escape') exitSpotlightMode();
      return;
    }
    if (e.key === 'Enter' && !e.target.closest('textarea') && !e.target.closest('input[type="number"]')) obNext();
    if (e.key === 'Escape') obBack();
  };

  const el = document.getElementById('view-onboarding');
  if (el) {
    el._keyHandler && document.removeEventListener('keydown', el._keyHandler);
    document.addEventListener('keydown', handler);
    el._keyHandler = handler;
  }

  renderStep();
}

// Expose nav globally
window.obNext = obNext;
window.obBack = obBack;
window.obSkip = obSkip;
