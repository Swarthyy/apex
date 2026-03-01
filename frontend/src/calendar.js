// ═══════════════════════════════════════════════════════════════════════════
// APEX — Historical Calendar View
// ═══════════════════════════════════════════════════════════════════════════
import { getData, scoreToColor, MONTHS, SHORT_MONTHS } from './data.js';

let currentYear = 2026;
let currentMonth = 1; // Feb (0-indexed)
let currentView = 'month';
let selectedDay = null;

export function initCalendar() {
    renderCalendar();
}

export function renderCalendar() {
    const label = currentView === 'year' ? `${currentYear}` : `${MONTHS[currentMonth]} ${currentYear}`;
    document.getElementById('cal-month-label').textContent = label;
    if (currentView === 'month') renderMonth();
    else if (currentView === 'week') renderWeek();
    else renderYear();
    renderSparklines();
}

function renderMonth() {
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 0; i < offset; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty';
        grid.appendChild(el);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const data = getData(currentYear, currentMonth, d);
        const el = document.createElement('div');
        el.className = 'cal-day';
        const isToday = currentYear === 2026 && currentMonth === 1 && d === 27;
        if (isToday) el.classList.add('today');
        if (!data) {
            el.classList.add('no-data');
            el.innerHTML = `<div class="day-num" style="color:var(--muted)">${d}</div>`;
        } else {
            const col = scoreToColor(data.vitality);
            el.innerHTML = `
        <div class="day-bg" style="background:${col}"></div>
        <div class="day-num">${d}</div>
        <div class="day-score-badge">${data.vitality}</div>
        <div class="day-dots">${data.dots.map(c => `<div class="day-dot" style="background:${c}"></div>`).join('')}</div>
      `;
            el.onclick = () => selectDay(currentYear, currentMonth, d, el);
        }
        if (selectedDay && selectedDay.year === currentYear && selectedDay.month === currentMonth && selectedDay.day === d) {
            el.classList.add('selected');
        }
        grid.appendChild(el);
    }
}

function renderWeek() {
    const grid = document.getElementById('week-grid');
    grid.innerHTML = '';
    const refDate = selectedDay ? new Date(selectedDay.year, selectedDay.month, selectedDay.day) : new Date(2026, 1, 27);
    const day = refDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(refDate);
    monday.setDate(monday.getDate() + mondayOffset);
    for (let w = -1; w < 3; w++) {
        const row = document.createElement('div');
        row.className = 'week-row';
        const weekStart = new Date(monday);
        weekStart.setDate(weekStart.getDate() + w * 7);
        const wLabel = document.createElement('div');
        wLabel.className = 'week-label';
        wLabel.textContent = `${SHORT_MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`;
        row.appendChild(wLabel);
        for (let d = 0; d < 7; d++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + d);
            const y = date.getFullYear(), m = date.getMonth(), dd = date.getDate();
            const data = getData(y, m, dd);
            const cell = document.createElement('div');
            cell.className = 'week-day-cell';
            if (!data) { cell.classList.add('no-data'); }
            else {
                cell.style.background = scoreToColor(data.vitality);
                cell.style.opacity = '0.85';
                cell.innerHTML = `
          <div style="position:absolute;top:4px;left:6px;font-size:10px;font-weight:700;font-family:'Syne',sans-serif;color:rgba(255,255,255,0.9);text-shadow:0 1px 3px rgba(0,0,0,0.7)">${dd}</div>
          <div style="position:absolute;bottom:4px;right:5px;font-size:10px;font-family:'Syne',sans-serif;font-weight:700;color:rgba(255,255,255,0.85);text-shadow:0 1px 3px rgba(0,0,0,0.8)">${data.vitality}</div>
        `;
                cell.onclick = () => { selectedDay = { year: y, month: m, day: dd }; selectDay(y, m, dd, cell); };
            }
            if (selectedDay && selectedDay.year === y && selectedDay.month === m && selectedDay.day === dd) cell.classList.add('selected');
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}

function renderYear() {
    const grid = document.getElementById('year-grid');
    grid.innerHTML = '';
    for (let m = 0; m < 12; m++) {
        const row = document.createElement('div');
        row.className = 'year-month-row';
        const label = document.createElement('div');
        label.className = 'year-month-label';
        label.textContent = SHORT_MONTHS[m];
        row.appendChild(label);
        const monthGrid = document.createElement('div');
        monthGrid.className = 'year-month-grid';
        const days = new Date(currentYear, m + 1, 0).getDate();
        for (let d = 1; d <= 31; d++) {
            const cell = document.createElement('div');
            cell.className = 'year-day-cell';
            if (d > days) { cell.style.background = 'transparent'; cell.style.cursor = 'default'; }
            else {
                const data = getData(currentYear, m, d);
                if (!data) { cell.classList.add('no-data'); }
                else {
                    cell.style.background = scoreToColor(data.vitality);
                    cell.title = `${SHORT_MONTHS[m]} ${d}: Vitality ${data.vitality}`;
                    cell.onclick = () => { currentMonth = m; selectedDay = { year: currentYear, month: m, day: d }; renderCalendar(); selectDay(currentYear, m, d, cell); };
                }
            }
            monthGrid.appendChild(cell);
        }
        row.appendChild(monthGrid);
        grid.appendChild(row);
    }
}

function renderSparklines() {
    const rows = document.getElementById('sparkline-rows');
    rows.innerHTML = '';
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let totals = { energy: 0, mood: 0, libido: 0, sleep: 0, vitality: 0, gym: 0 };
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const data = getData(currentYear, currentMonth, d);
        if (data) { totals.energy += data.energy; totals.mood += data.mood; totals.libido += data.libido; totals.sleep += data.sleep; totals.vitality += data.vitality; if (data.hasGym) totals.gym++; count++; }
    }
    if (count === 0) return;
    const avgs = {
        'Vitality': { val: (totals.vitality / count).toFixed(1), max: 10, color: scoreToColor(totals.vitality / count) },
        'Energy': { val: (totals.energy / count).toFixed(1), max: 10, color: 'var(--gold)' },
        'Mood': { val: (totals.mood / count).toFixed(1), max: 10, color: '#ff9f1c' },
        'Libido': { val: (totals.libido / count).toFixed(1), max: 10, color: 'var(--pink)' },
        'Sleep avg': { val: (totals.sleep / count).toFixed(1) + 'h', max: 10, color: 'var(--blue)', rawVal: totals.sleep / count },
        'Gym days': { val: totals.gym + 'x', max: daysInMonth, color: 'var(--orange)', rawVal: totals.gym },
    };
    for (const [name, info] of Object.entries(avgs)) {
        const rawVal = info.rawVal !== undefined ? info.rawVal : parseFloat(info.val);
        const pct = Math.min(100, (rawVal / info.max) * 100);
        const row = document.createElement('div');
        row.className = 'sparkline-row';
        row.innerHTML = `
      <div class="sparkline-name" style="color:${info.color}">${name}</div>
      <div class="sparkline-bar-track"><div class="sparkline-bar-fill" style="width:${pct}%;background:${info.color}"></div></div>
      <div class="sparkline-val" style="color:${info.color}">${info.val}</div>
    `;
        rows.appendChild(row);
    }
    document.getElementById('sparkline-section').style.display = currentView === 'year' ? 'none' : 'block';
}

function selectDay(year, month, day, el) {
    document.querySelectorAll('.cal-day.selected, .week-day-cell.selected, .year-day-cell.selected').forEach(e => e.classList.remove('selected'));
    if (el) el.classList.add('selected');
    selectedDay = { year, month, day };
    const data = getData(year, month, day);
    if (!data) return;
    document.getElementById('detail-placeholder').style.display = 'none';
    const content = document.getElementById('detail-content');
    content.style.display = 'flex';
    const dateObj = new Date(year, month, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    document.getElementById('d-date').textContent = `${dayNames[dateObj.getDay()]} · ${day} ${SHORT_MONTHS[month]} ${year}`;
    const scoreEl = document.getElementById('d-score');
    scoreEl.textContent = data.vitality;
    scoreEl.style.color = scoreToColor(data.vitality);
    const metrics = [
        { label: 'Energy', val: `${data.energy}/10`, color: 'var(--gold)' },
        { label: 'Mood', val: `${data.mood}/10`, color: '#ff9f1c' },
        { label: 'Libido', val: `${data.libido}/10`, color: 'var(--pink)' },
        { label: 'Sleep', val: `${data.sleep}h`, color: 'var(--blue)' },
        { label: 'Weight', val: `${data.weight}kg`, color: 'var(--purple)' },
        { label: 'SR Day', val: `Day ${data.srDay}`, color: 'var(--accent)' },
        { label: 'Gym', val: data.hasGym ? 'Yes ✓' : 'Rest day', color: data.hasGym ? 'var(--orange)' : 'var(--muted)' },
        { label: 'Liver', val: data.hadLiver ? 'Logged ✓' : 'Not logged', color: data.hadLiver ? 'var(--teal)' : 'var(--red)' },
        { label: 'Raw milk', val: data.hadRawMilk ? '~2L ✓' : 'Low', color: data.hadRawMilk ? 'var(--teal)' : 'var(--muted)' },
        { label: 'Oysters', val: data.hadOysters ? 'Yes ✓' : '—', color: data.hadOysters ? 'var(--teal)' : 'var(--muted)' },
    ];
    document.getElementById('d-metrics').innerHTML = metrics.map(m => `<div class="metric-row"><span class="metric-label">${m.label}</span><span class="metric-value" style="color:${m.color}">${m.val}</span></div>`).join('');
    const eventsEl = document.getElementById('d-events');
    eventsEl.innerHTML = data.events.length === 0
        ? `<div style="font-size:11px;color:var(--muted);padding:8px 0">No calendar events logged</div>`
        : data.events.map(e => `<div class="event-item"><div class="event-dot" style="background:${e.color}"></div><div><div>${e.label}</div><div class="event-time">${e.time}</div></div></div>`).join('');
    document.getElementById('d-analysis').innerHTML = generateAnalysis(data, day, month, year);
}

function generateAnalysis(data) {
    const positive = [], warnings = [];
    if (data.srDay >= 10) positive.push(`SR day ${data.srDay}`);
    if (data.hadLiver) positive.push('Liver consumed');
    if (data.hadOysters) positive.push('Oysters consumed');
    if (data.hadRawMilk) positive.push('Raw milk ~2L');
    if (data.sleep >= 8) positive.push(`${data.sleep}h sleep`);
    if (data.hasGym) positive.push('Gym session');
    if (!data.hadLiver) warnings.push('No liver');
    if (data.sleep < 6.5) warnings.push(`Low sleep (${data.sleep}h)`);
    if (data.srDay < 5) warnings.push(`Low SR (day ${data.srDay})`);
    let text = '';
    if (data.vitality >= 8) {
        text = `A high-performing day. `;
        if (data.srDay >= 10) text += `SR streak at day ${data.srDay} is the primary driver. `;
        if (data.hadLiver && data.hadRawMilk) text += `Nutrition was dialled in with liver and raw milk. `;
        if (data.sleep >= 7.5) text += `Sleep over 7.5h supported recovery. `;
    } else if (data.vitality >= 6) {
        text = `A solid but not peak day. `;
        if (!data.hadLiver) text += `Liver wasn't logged — on your best days it nearly always is. `;
        if (data.sleep < 7) text += `Sleep under 7h likely weighing on energy. `;
    } else {
        text = `A lower-rated day. `;
        if (data.sleep < 6.5) text += `Sleep was significantly below baseline at ${data.sleep}h. `;
        if (data.srDay < 4) text += `Early SR days tend to produce lower scores. `;
    }
    const chips = [
        ...positive.map(p => `<span class="why-chip chip-positive">${p}</span>`),
        ...warnings.map(w => `<span class="why-chip chip-warning">${w}</span>`),
    ].join('');
    return `<div class="ai-label">APEX Analysis</div>${text}<br><br><div style="margin-top:4px">${chips}</div>`;
}

export function calNavPrev() {
    if (currentView === 'year') currentYear--; else { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } }
    renderCalendar();
}

export function calNavNext() {
    if (currentView === 'year') currentYear++; else { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
    renderCalendar();
}

export function setCalView(view, btn) {
    currentView = view;
    document.querySelectorAll('.vt-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('month-view').style.display = view === 'month' ? 'flex' : 'none';
    document.getElementById('week-view').className = view === 'week' ? 'week-view visible' : 'week-view';
    document.getElementById('year-view').className = view === 'year' ? 'year-view visible' : 'year-view';
    renderCalendar();
}

export function autoSelectToday() {
    setTimeout(() => {
        const todayCells = document.querySelectorAll('.cal-day.today');
        if (todayCells.length > 0) {
            selectDay(2026, 1, 27, todayCells[0]);
            todayCells[0].classList.add('selected');
        }
    }, 200);
}
