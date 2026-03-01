// ═══════════════════════════════════════════════════════════════════════════
// APEX — Dashboard & Sector Rendering
// ═══════════════════════════════════════════════════════════════════════════
import { getToday, getRecentDays, scoreToColor, getGymSummary } from './data.js';
import { getVolumeChartData } from './hevy.js';

const SECTORS = [
    { id: 'retention', label: 'SR STREAK', color: 'var(--accent)', getValue: d => `Day ${d.srDay}`, getSub: d => `PB: Day 28`, getBar: d => (d.srDay / 30) * 100 },
    { id: 'sleep', label: 'SLEEP', color: 'var(--blue)', getValue: d => `${d.sleep}h`, getSub: d => d.sleep >= 7.5 ? 'On target' : 'Below target', getBar: d => (d.sleep / 10) * 100 },
    { id: 'energy', label: 'ENERGY', color: 'var(--gold)', getValue: d => `${d.energy}`, getSub: d => '/10 score', getBar: d => d.energy * 10 },
    { id: 'body', label: 'WEIGHT', color: 'var(--purple)', getValue: d => `${d.weight}`, getSub: d => `${d.bodyFat}% BF`, getBar: d => 70 },
    { id: 'gym', label: 'GYM', color: 'var(--orange)', getValue: d => d.hasGym ? d.gymWorkouts[0]?.title || '✓ Today' : 'Rest', getSub: d => d.hasGym ? `${d.gymVolume.toLocaleString()}kg vol` : 'Rest day', getBar: d => d.hasGym ? 80 : 20 },
];

const INSIGHTS_DATA = [
    { type: 'POSITIVE', color: 'var(--accent)', text: 'SR day 14+ correlates with +1.8 avg energy score. You\'re in a performance window.', sectors: 'Retention × Energy' },
    { type: 'WARNING', color: 'var(--amber)', text: 'No liver logged in 5 days. Last time you had liver 3x/week, libido averaged 1.4 points higher.', sectors: 'Nutrition × Libido' },
    { type: 'INFO', color: 'var(--blue)', text: 'Sleep averaging 7.8h this week — above your 30-day baseline of 7.2h. Recovery is trending up.', sectors: 'Sleep' },
    { type: 'ALERT', color: 'var(--pink)', text: 'Libido dropped 2.1 points over 3 days. Correlating with reduced oyster and liver intake.', sectors: 'Libido × Nutrition' },
];

export function renderDashboard() {
    const today = getToday();
    if (!today) return;

    // Stat tiles
    const tilesEl = document.getElementById('stat-tiles');
    tilesEl.innerHTML = SECTORS.map(s => `
    <div class="stat-tile" style="--tile-color:${s.color}" onclick="go('${s.id}')">
      <div class="tile-glow" style="background:${s.color}"></div>
      <div class="tile-label">${s.label}</div>
      <div class="tile-value" style="color:${s.color}">${s.getValue(today)}</div>
      <div class="tile-sub">${s.getSub(today)}</div>
      <div class="tile-bar" style="background:${s.color}" data-width="${s.getBar(today)}"></div>
    </div>
  `).join('');

    // Insights
    const insightsEl = document.getElementById('insights-row');
    insightsEl.innerHTML = INSIGHTS_DATA.map(ins => `
    <div class="insight-card" style="border-left-color:${ins.color}">
      <div class="insight-type" style="color:${ins.color}">${ins.type}</div>
      <div class="insight-text">${ins.text}</div>
      <div class="insight-sectors">${ins.sectors}</div>
    </div>
  `).join('');

    // Trends chart
    renderTrendsChart();

    // SR Card
    const srCard = document.getElementById('sr-card');
    srCard.innerHTML = `
    <div class="sr-label">SR / RETENTION</div>
    <div class="sr-count">${today.srDay}</div>
    <div class="sr-detail">Day streak · Personal best: 28 days · Started ${new Date(TODAY_REF.getTime() - today.srDay * 86400000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
  `;

    // Animate bars
    setTimeout(() => {
        document.querySelectorAll('.tile-bar').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
        });
    }, 100);
}

let TODAY_REF;
export function setTodayRef(ref) { TODAY_REF = ref; }

export function renderTrendsChart() {
    const days = getRecentDays(30);
    const chartEl = document.getElementById('trends-chart');
    if (!days.length) { chartEl.innerHTML = '<div style="color:var(--muted);padding:20px">No data</div>'; return; }

    const w = chartEl.offsetWidth - 40;
    const h = chartEl.offsetHeight - 40;
    const stepX = w / (days.length - 1);

    const energyLine = days.map((d, i) => `${20 + i * stepX},${20 + h - (d.energy / 10) * h}`).join(' ');
    const libidoLine = days.map((d, i) => `${20 + i * stepX},${20 + h - (d.libido / 10) * h}`).join(' ');
    const energyArea = `${20},${20 + h} ${energyLine} ${20 + (days.length - 1) * stepX},${20 + h}`;
    const libidoArea = `${20},${20 + h} ${libidoLine} ${20 + (days.length - 1) * stepX},${20 + h}`;

    chartEl.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${w + 40} ${h + 40}">
      <line class="chart-grid-line" x1="20" y1="${20 + h * 0.5}" x2="${w + 20}" y2="${20 + h * 0.5}"/>
      <polygon class="chart-area" points="${energyArea}" fill="var(--gold)"/>
      <polygon class="chart-area" points="${libidoArea}" fill="var(--pink)"/>
      <polyline class="chart-line" points="${energyLine}" stroke="var(--gold)"/>
      <polyline class="chart-line" points="${libidoLine}" stroke="var(--pink)"/>
      <text class="chart-label" x="${w + 24}" y="${20 + h - (days[days.length - 1].energy / 10) * h + 4}" fill="var(--gold)">Energy</text>
      <text class="chart-label" x="${w + 24}" y="${20 + h - (days[days.length - 1].libido / 10) * h + 4}" fill="var(--pink)">Libido</text>
    </svg>
  `;
}

// Render right panel
export function renderRightPanel() {
    // Notifications
    const notifs = INSIGHTS_DATA.slice(0, 4);
    document.getElementById('rp-notifications').innerHTML = notifs.map(n => `
    <div class="rp-notif" style="border-left-color:${n.color}">${n.text.substring(0, 80)}...</div>
  `).join('');

    // Quick ask
    document.getElementById('rp-chat-prev').textContent = 'Ask me about your performance data...';

    // Integration badges
    const intgs = [
        { name: 'Hevy', status: 'Connected', color: 'var(--orange)' },
        { name: 'Apple Health', status: 'Pending', color: 'var(--muted)' },
        { name: 'Withings', status: 'Connected', color: 'var(--purple)' },
        { name: 'Google Cal', status: 'Live', color: 'var(--accent)' },
    ];
    document.getElementById('rp-integrations').innerHTML = intgs.map(ig => {
        const bg = ig.status === 'Live' ? 'rgba(200,241,53,0.1)' : ig.status === 'Connected' ? 'rgba(53,116,241,0.1)' : 'var(--surface2)';
        const col = ig.status === 'Live' ? 'var(--accent)' : ig.status === 'Connected' ? 'var(--blue)' : 'var(--muted)';
        return `<div class="rp-intg"><span>${ig.name}</span><span class="rp-intg-badge" style="background:${bg};color:${col}">${ig.status}</span></div>`;
    }).join('');
}

// Render sector focus views
export function renderSectorView(sectorId) {
    const today = getToday();
    const days = getRecentDays(30);
    if (!today) return;

    const configs = {
        retention: {
            color: 'var(--accent)', stats: [
                { label: 'CURRENT', value: `Day ${today.srDay}`, sub: 'Active streak', color: 'var(--accent)' },
                { label: 'PERSONAL BEST', value: 'Day 28', sub: 'Dec 2025', color: 'var(--accent)' },
                { label: 'AVG ENERGY @14+', value: '8.2', sub: '+1.8 vs baseline', color: 'var(--gold)' },
                { label: 'STREAKS', value: '6', sub: 'Total logged', color: 'var(--muted)' },
            ]
        },
        sleep: {
            color: 'var(--blue)', stats: [
                { label: 'LAST NIGHT', value: `${today.sleep}h`, sub: today.sleep >= 7.5 ? 'On target' : 'Below target', color: 'var(--blue)' },
                { label: '7D AVG', value: `${(days.slice(-7).reduce((s, d) => s + d.sleep, 0) / 7).toFixed(1)}h`, sub: 'This week', color: 'var(--blue)' },
                { label: 'DEBT', value: today.sleep < 7.5 ? `${(7.5 - today.sleep).toFixed(1)}h` : '0h', sub: 'Sleep debt', color: today.sleep < 7.5 ? 'var(--amber)' : 'var(--accent)' },
                { label: 'QUALITY', value: today.sleep >= 8 ? 'High' : today.sleep >= 7 ? 'Good' : 'Low', sub: 'Estimated', color: 'var(--blue)' },
            ]
        },
        energy: {
            color: 'var(--gold)', stats: [
                { label: 'TODAY', value: `${today.energy}`, sub: '/10', color: 'var(--gold)' },
                { label: '7D AVG', value: (days.slice(-7).reduce((s, d) => s + d.energy, 0) / 7).toFixed(1), sub: 'This week', color: 'var(--gold)' },
                { label: '30D AVG', value: (days.reduce((s, d) => s + d.energy, 0) / days.length).toFixed(1), sub: 'This month', color: 'var(--gold)' },
                { label: 'PEAK SR DAY', value: 'Day 16', sub: 'Highest correlation', color: 'var(--accent)' },
            ]
        },
        gym: (() => {
            const gs = getGymSummary();
            const todayW = today.gymWorkouts?.[0];
            return {
                color: 'var(--orange)', stats: [
                    { label: 'TODAY', value: todayW ? todayW.title : 'Rest day', sub: todayW ? `${todayW.durationMin}min · ${todayW.totalVolume.toLocaleString()}kg` : '', color: 'var(--orange)' },
                    { label: 'THIS WEEK', value: `${gs.weeklyAvg}x`, sub: `avg / week`, color: 'var(--orange)' },
                    { label: 'STREAK', value: `${gs.streak} wk`, sub: 'Consecutive', color: 'var(--orange)' },
                    { label: 'VOLUME TREND', value: `${gs.volTrend > 0 ? '↑' : '↓'} ${Math.abs(gs.volTrend)}%`, sub: 'vs prev 30d', color: gs.volTrend > 0 ? 'var(--accent)' : 'var(--amber)' },
                ], extra: { total: gs.total, totalVolume: gs.totalVolume, totalSets: gs.totalSets, topExercises: gs.topExercises, mostRecent: gs.mostRecent }
            };
        })(),
        libido: {
            color: 'var(--pink)', stats: [
                { label: 'TODAY', value: `${today.libido}`, sub: '/10', color: 'var(--pink)' },
                { label: '7D AVG', value: (days.slice(-7).reduce((s, d) => s + d.libido, 0) / 7).toFixed(1), sub: 'This week', color: 'var(--pink)' },
                { label: 'SR CORR', value: '+0.82', sub: 'Strong positive', color: 'var(--accent)' },
                { label: 'BEST FOODS', value: 'Oysters', sub: '+ Liver', color: 'var(--teal)' },
            ]
        },
        'nutrition-sector': {
            color: 'var(--teal)', stats: [
                { label: 'CALORIES', value: `${today.totalKcal}`, sub: '/ 3200 goal', color: 'var(--teal)' },
                { label: 'PROTEIN', value: `${today.totalProtein}g`, sub: '/ 200g goal', color: 'var(--teal)' },
                { label: 'MEALS', value: `${today.meals.length}`, sub: 'Logged today', color: 'var(--teal)' },
                { label: 'SCORE', value: `${today.nutScore}`, sub: '/10', color: 'var(--accent)' },
            ]
        },
        body: {
            color: 'var(--purple)', stats: [
                { label: 'WEIGHT', value: `${today.weight}kg`, sub: 'Today', color: 'var(--purple)' },
                { label: 'BODY FAT', value: `${today.bodyFat}%`, sub: 'Estimated', color: 'var(--purple)' },
                { label: '14D DELTA', value: '-0.8kg', sub: 'Trending down', color: 'var(--accent)' },
                { label: 'RECOMP', value: 'Likely', sub: 'Vol up, weight down', color: 'var(--accent)' },
            ]
        },
        mood: {
            color: 'var(--amber)', stats: [
                { label: 'TODAY', value: `${today.mood}`, sub: '/10', color: 'var(--amber)' },
                { label: '7D AVG', value: (days.slice(-7).reduce((s, d) => s + d.mood, 0) / 7).toFixed(1), sub: 'This week', color: 'var(--amber)' },
                { label: 'BEST CORR', value: 'Sunlight', sub: '+ Social + Liver', color: 'var(--gold)' },
                { label: '30D AVG', value: (days.reduce((s, d) => s + d.mood, 0) / days.length).toFixed(1), sub: 'Baseline', color: 'var(--amber)' },
            ]
        },
        finances: {
            color: 'var(--teal)', stats: [
                { label: 'NET CASH', value: '+$3,240', sub: 'This month', color: 'var(--teal)' },
                { label: 'EXPENSES', value: '$2,180', sub: 'Feb total', color: 'var(--amber)' },
                { label: 'INCOME', value: '$5,420', sub: 'Feb total', color: 'var(--accent)' },
                { label: 'SAVINGS RATE', value: '60%', sub: 'On target', color: 'var(--accent)' },
            ]
        },
        business: {
            color: 'var(--blue)', stats: [
                { label: 'FOCUS', value: '8.2', sub: '/10 this week', color: 'var(--blue)' },
                { label: 'PROJECTS', value: '3', sub: 'Active', color: 'var(--blue)' },
                { label: 'MOMENTUM', value: 'High', sub: '↑ Trending up', color: 'var(--accent)' },
                { label: 'NEXT EVENT', value: '2:00 PM', sub: 'Team standup', color: 'var(--gold)' },
            ]
        },
    };

    const cfg = configs[sectorId];
    if (!cfg) return;

    const statsEl = document.getElementById(`${sectorId}-stats`);
    if (statsEl) {
        statsEl.innerHTML = cfg.stats.map(s => `
      <div class="sector-stat">
        <div class="ss-label">${s.label}</div>
        <div class="ss-value" style="color:${s.color}">${s.value}</div>
        <div class="ss-sub">${s.sub}</div>
      </div>
    `).join('');
    }

    // Simple chart for each sector
    const chartEl = document.getElementById(`${sectorId}-chart`);
    if (chartEl) {
        if (sectorId === 'gym') {
            renderGymVolumeChart(chartEl);
        } else {
            renderSimpleChart(chartEl, days, sectorId, cfg.color);
        }
    }

    // Extra gym content
    if (sectorId === 'gym' && cfg.extra) {
        renderGymSectorExtra(cfg.extra);
    }
}

function renderSimpleChart(el, days, sectorId, color) {
    const w = el.offsetWidth - 40;
    const h = el.offsetHeight - 40;
    if (w <= 0 || h <= 0) return;
    const stepX = w / (days.length - 1);

    const getVal = {
        retention: d => d.srDay / 30,
        sleep: d => d.sleep / 10,
        energy: d => d.energy / 10,
        gym: d => d.gymVolume > 0 ? Math.min(1, d.gymVolume / 20000) : 0,
        libido: d => d.libido / 10,
        'nutrition-sector': d => d.totalKcal / 4000,
        body: d => (d.weight - 78) / 10,
        mood: d => d.mood / 10,
        finances: d => 0.6 + Math.random() * 0.3,
        business: d => 0.5 + Math.random() * 0.4,
    };

    const fn = getVal[sectorId] || (d => 0.5);
    const points = days.map((d, i) => `${20 + i * stepX},${20 + h - fn(d) * h}`).join(' ');
    const area = `${20},${20 + h} ${points} ${20 + (days.length - 1) * stepX},${20 + h}`;

    el.innerHTML = `
    <svg class="chart-svg" viewBox="0 0 ${w + 40} ${h + 40}">
      <line class="chart-grid-line" x1="20" y1="${20 + h * 0.5}" x2="${w + 20}" y2="${20 + h * 0.5}"/>
      <polygon class="chart-area" points="${area}" fill="${color}"/>
      <polyline class="chart-line" points="${points}" stroke="${color}"/>
    </svg>
  `;
}

// Insights full list
export function renderInsightsList() {
    const allInsights = [
        ...INSIGHTS_DATA,
        { type: 'POSITIVE', color: 'var(--accent)', text: 'Gym volume has increased 12% over 4 weeks while weight decreased 0.8kg. Lean mass gain (recomp) pattern detected.', sectors: 'Gym × Body Comp', confidence: 'High' },
        { type: 'INFO', color: 'var(--blue)', text: 'Your best mood days correlate with social events in the evening + gym in the morning. This pattern appeared 8 times in 30 days.', sectors: 'Mood × Gym × Calendar', confidence: 'Medium' },
        { type: 'WARNING', color: 'var(--amber)', text: 'Sleep averaged 6.2h for 3 consecutive nights. Recovery recommendation: tomorrow is calendar-clear — ideal for a 9+ hour sleep.', sectors: 'Sleep × Calendar', confidence: 'High' },
        { type: 'POSITIVE', color: 'var(--accent)', text: 'Raw milk logged 5 out of 7 days this week. Energy average is 1.2 points above your baseline during high raw milk weeks.', sectors: 'Nutrition × Energy', confidence: 'Medium' },
    ];

    document.getElementById('insights-list').innerHTML = allInsights.map(ins => `
    <div class="insight-full" style="border-left-color:${ins.color}">
      <div class="if-header">
        <span class="if-type" style="color:${ins.color}">${ins.type}</span>
        <span class="if-confidence">${ins.confidence || 'High'}</span>
      </div>
      <div class="if-text">${ins.text}</div>
      <div class="if-meta">${ins.sectors} · Detected today</div>
    </div>
  `).join('');
}

// Integrations grid
export function renderIntegrations() {
    const intgs = [
        { icon: '🏋️', name: 'Hevy', desc: 'Gym sessions, sets, reps, PRs', status: 'Connected', sColor: 'var(--blue)', sBg: 'rgba(53,116,241,0.1)' },
        { icon: '❤️', name: 'Apple Health', desc: 'Sleep, HRV, steps via HealthKit', status: 'Pending Setup', sColor: 'var(--muted)', sBg: 'var(--surface2)' },
        { icon: '⚖️', name: 'Withings', desc: 'Weight, body fat %, muscle mass', status: 'Connected', sColor: 'var(--blue)', sBg: 'rgba(53,116,241,0.1)' },
        { icon: '📅', name: 'Google Calendar', desc: 'Events, schedule context', status: 'Live', sColor: 'var(--accent)', sBg: 'rgba(200,241,53,0.1)' },
        { icon: '💍', name: 'Oura Ring', desc: 'Sleep + HRV (Phase 3)', status: 'Coming Soon', sColor: 'var(--muted)', sBg: 'var(--surface2)' },
        { icon: '📸', name: 'Photo AI', desc: 'GPT-4o Vision macro estimation', status: 'Phase 3', sColor: 'var(--muted)', sBg: 'var(--surface2)' },
    ];

    document.getElementById('integrations-grid').innerHTML = intgs.map(ig => `
    <div class="intg-card">
      <div class="intg-icon">${ig.icon}</div>
      <div class="intg-name">${ig.name}</div>
      <div class="intg-desc">${ig.desc}</div>
      <span class="intg-status" style="background:${ig.sBg};color:${ig.sColor}">${ig.status}</span>
    </div>
  `).join('');
}

// ── Gym Volume Bar Chart (Real Hevy Data) ────────
function renderGymVolumeChart(el) {
    const data = getVolumeChartData(12);
    const maxVol = Math.max(...data.map(d => d.volume), 1);
    const w = el.offsetWidth - 40;
    const h = el.offsetHeight - 40;
    if (w <= 0 || h <= 0) return;

    const barW = Math.min(30, (w - data.length * 4) / data.length);
    const gap = 4;
    const totalW = data.length * (barW + gap);
    const startX = 20 + (w - totalW) / 2;

    let svg = `<svg class="chart-svg" viewBox="0 0 ${w + 40} ${h + 60}">`;
    svg += `<line class="chart-grid-line" x1="20" y1="${20 + h * 0.25}" x2="${w + 20}" y2="${20 + h * 0.25}"/>`;
    svg += `<line class="chart-grid-line" x1="20" y1="${20 + h * 0.5}" x2="${w + 20}" y2="${20 + h * 0.5}"/>`;
    svg += `<line class="chart-grid-line" x1="20" y1="${20 + h * 0.75}" x2="${w + 20}" y2="${20 + h * 0.75}"/>`;

    data.forEach((d, i) => {
        const barH = d.volume > 0 ? Math.max(4, (d.volume / maxVol) * h) : 0;
        const x = startX + i * (barW + gap);
        const y = 20 + h - barH;
        const col = d.sessions >= 12 ? 'var(--accent)' : d.sessions >= 8 ? 'var(--orange)' : d.sessions >= 4 ? 'var(--amber)' : 'var(--muted)';
        svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${col}" opacity="0.85">
      <animate attributeName="height" from="0" to="${barH}" dur="0.6s" fill="freeze"/>
      <animate attributeName="y" from="${20 + h}" to="${y}" dur="0.6s" fill="freeze"/>
    </rect>`;
        svg += `<text x="${x + barW / 2}" y="${20 + h + 14}" text-anchor="middle" fill="var(--muted)" font-size="9" font-family="Syne,sans-serif">${d.label}</text>`;
        if (d.sessions > 0) {
            svg += `<text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" fill="var(--text2)" font-size="8" font-family="Syne,sans-serif">${d.sessions}x</text>`;
        }
    });
    svg += `</svg>`;
    el.innerHTML = svg;
}

// ── Gym Sector Extra Content ─────────────────────
function renderGymSectorExtra(extra) {
    let target = document.getElementById('gym-extra');
    if (!target) {
        // Create the extra container if it doesn't exist
        const chartEl = document.getElementById('gym-chart');
        if (!chartEl) return;
        target = document.createElement('div');
        target.id = 'gym-extra';
        target.style.cssText = 'margin-top:16px';
        chartEl.parentElement.appendChild(target);
    }

    // Lifetime stats row
    const lifetimeHtml = `
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div class="sector-stat" style="flex:1;min-width:120px">
        <div class="ss-label">TOTAL SESSIONS</div>
        <div class="ss-value" style="color:var(--orange)">${extra.total}</div>
        <div class="ss-sub">All time (from Hevy)</div>
      </div>
      <div class="sector-stat" style="flex:1;min-width:120px">
        <div class="ss-label">VOLUME LIFTED</div>
        <div class="ss-value" style="color:var(--accent)">${(extra.totalVolume / 1000).toFixed(0)}t</div>
        <div class="ss-sub">${extra.totalVolume.toLocaleString()}kg total</div>
      </div>
      <div class="sector-stat" style="flex:1;min-width:120px">
        <div class="ss-label">TOTAL SETS</div>
        <div class="ss-value" style="color:var(--orange)">${extra.totalSets.toLocaleString()}</div>
        <div class="ss-sub">Logged in Hevy</div>
      </div>
    </div>
  `;

    // Top exercises
    const topHtml = `
    <div style="margin-bottom:16px">
      <div style="font-family:Syne,sans-serif;font-weight:800;font-size:11px;letter-spacing:1.5px;color:var(--muted);margin-bottom:10px">TOP EXERCISES</div>
      ${extra.topExercises.slice(0, 8).map((ex, i) => {
        const pct = Math.min(100, (ex.count / extra.topExercises[0].count) * 100);
        return `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="font-family:Syne,sans-serif;font-weight:700;font-size:10px;color:var(--muted);width:16px">${i + 1}</span>
            <div style="flex:1">
              <div style="font-family:Syne,sans-serif;font-weight:600;font-size:12px;color:var(--text)">${ex.name}</div>
              <div style="height:4px;background:var(--surface2);border-radius:2px;margin-top:3px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:var(--orange);border-radius:2px;transition:width 0.6s ease"></div>
              </div>
            </div>
            <span style="font-family:Syne,sans-serif;font-weight:800;font-size:12px;color:var(--orange)">${ex.count}×</span>
          </div>`;
    }).join('')}
    </div>
  `;

    // Most recent workout
    let recentHtml = '';
    if (extra.mostRecent) {
        const w = extra.mostRecent;
        const dateStr = w.date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
        recentHtml = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
          <div>
            <div style="font-family:Syne,sans-serif;font-weight:800;font-size:14px;color:var(--orange)">${w.title}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">${dateStr} · ${w.durationMin}min · ${w.totalSets} sets · ${w.totalVolume.toLocaleString()}kg</div>
          </div>
          <div style="font-family:Syne,sans-serif;font-weight:800;font-size:11px;letter-spacing:1px;color:var(--muted)">LATEST</div>
        </div>
        ${w.exercises.map(ex => {
            const topSet = ex.sets.reduce((best, s) => (!best || (s.weight || 0) > (best.weight || 0)) ? s : best, null);
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
              <div style="width:3px;height:24px;background:var(--orange);border-radius:2px"></div>
              <div style="flex:1">
                <div style="font-family:Syne,sans-serif;font-weight:600;font-size:12px">${ex.name}</div>
                <div style="font-size:10px;color:var(--muted)">${ex.sets.length} sets · Best: ${topSet?.weight || 0}kg × ${topSet?.reps || 0}</div>
              </div>
              <div style="font-family:Syne,sans-serif;font-weight:800;font-size:11px;color:var(--orange)">${ex.volume.toLocaleString()}kg</div>
            </div>`;
        }).join('')}
      </div>
    `;
    }

    target.innerHTML = lifetimeHtml + topHtml + recentHtml;
}
