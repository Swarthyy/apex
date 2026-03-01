// ═══════════════════════════════════════════════════════════════════════════
// APEX — Nutrition Feed View
// ═══════════════════════════════════════════════════════════════════════════
import { getData, getRecentDays, TODAY_REF, SHORT_MONTHS } from './data.js';

let nutDayOffset = 0;

const MEAL_COLORS = {
    Breakfast: { bg: 'rgba(255,204,0,0.12)', color: 'var(--gold)', dot: 'var(--gold)' },
    Lunch: { bg: 'rgba(0,212,170,0.12)', color: 'var(--teal)', dot: 'var(--teal)' },
    Dinner: { bg: 'rgba(155,93,229,0.12)', color: 'var(--purple)', dot: 'var(--purple)' },
    Snack: { bg: 'rgba(255,122,47,0.12)', color: 'var(--orange)', dot: 'var(--orange)' },
    Supplement: { bg: 'rgba(53,116,241,0.12)', color: 'var(--blue)', dot: 'var(--blue)' },
};

export function renderNutritionFeed() {
    const d = new Date(TODAY_REF);
    d.setDate(d.getDate() - nutDayOffset);
    const data = getData(d.getFullYear(), d.getMonth(), d.getDate());

    // Header
    const title = nutDayOffset === 0 ? 'Today' : nutDayOffset === 1 ? 'Yesterday' : `${nutDayOffset} days ago`;
    document.getElementById('nut-day-title').textContent = title;
    document.getElementById('nut-day-date').textContent = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;

    if (!data) {
        document.getElementById('nut-totals').innerHTML = '<div style="color:var(--muted)">No data for this day</div>';
        document.getElementById('nut-timeline').innerHTML = '';
        return;
    }

    // Totals bar
    const calPct = Math.min(100, (data.totalKcal / 3200) * 100);
    document.getElementById('nut-totals').innerHTML = `
    <div class="nut-total-bar"><div class="nut-total-bar-fill" style="width:${calPct}%"></div></div>
    <span class="nut-pill" style="color:var(--accent)">${data.totalKcal} kcal</span>
    <span class="nut-pill" style="color:var(--teal)">${data.totalProtein}g P</span>
    <span class="nut-pill" style="color:var(--amber)">${data.totalFat}g F</span>
    <span class="nut-pill" style="color:var(--purple)">${data.totalCarbs}g C</span>
    <span class="nut-pill" style="color:var(--accent)">Score: ${data.nutScore}/10</span>
  `;

    // Timeline
    const timeline = document.getElementById('nut-timeline');
    let html = '<div class="nut-timeline-line"></div>';

    const mealTimes = ['7:30 AM', '12:30 PM', '3:30 PM', '6:30 PM'];
    const nowHour = 14; // 2:00 PM for demo
    let nowInserted = false;

    data.meals.forEach((meal, idx) => {
        const mealHour = parseTimeToHour(meal.time);
        if (!nowInserted && mealHour >= nowHour && nutDayOffset === 0) {
            html += renderNowMarker();
            html += renderRecommendation(data);
            nowInserted = true;
        }

        const mc = MEAL_COLORS[meal.type] || MEAL_COLORS.Snack;
        html += `
      <div class="nut-meal-card" style="animation-delay:${idx * 80}ms" onclick="this.querySelector('.nut-ingredients')?.classList.toggle('expanded');this.querySelector('.nut-ingredients-toggle')?.classList.toggle('expanded')">
        <div class="nut-dot" style="background:${mc.dot}"></div>
        <div class="nut-meal-type" style="background:${mc.bg};color:${mc.color}">${meal.type}</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div class="nut-meal-name">${meal.name}</div>
          <div class="nut-meal-kcal">${meal.kcal}</div>
        </div>
        <div class="nut-rpg-stats">
          ${renderRpgStat('KCAL', meal.kcal, 1200, 'var(--accent)')}
          ${renderRpgStat('PROTEIN', meal.protein, 80, 'var(--teal)')}
          ${renderRpgStat('FAT', meal.fat, 60, 'var(--amber)')}
          ${renderRpgStat('CARBS', meal.carbs, 80, 'var(--purple)')}
        </div>
        ${meal.bonuses.length ? `<div class="nut-bonus-chips">${meal.bonuses.map((b, i) => `<span class="nut-bonus-chip${b.includes('High Carb') ? ' warning' : ''}" style="animation-delay:${i * 50}ms">${b}</span>`).join('')}</div>` : ''}
        <div class="nut-ingredients-toggle">▸ Ingredients</div>
        <div class="nut-ingredients">
          ${meal.ingredients.map(ig => `<div style="font-size:10px;color:var(--text2);padding:2px 0">• ${ig}</div>`).join('')}
        </div>
      </div>
    `;
    });

    if (!nowInserted && nutDayOffset === 0) {
        html += renderNowMarker();
        html += renderRecommendation(data);
    }

    timeline.innerHTML = html;
    renderNutritionPanel(data);
}

function renderRpgStat(label, value, max, color) {
    const pct = Math.min(100, (value / max) * 100);
    return `
    <div class="nut-rpg-stat">
      <div class="rpg-label">${label}</div>
      <div class="rpg-bar"><div class="rpg-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="rpg-val">${value}${label === 'KCAL' ? '' : 'g'}</div>
    </div>
  `;
}

function renderNowMarker() {
    return `
    <div class="nut-now-marker">
      <div class="nut-now-dot"></div>
      <span class="nut-now-label">NOW</span>
      <div class="nut-now-line"></div>
    </div>
  `;
}

function renderRecommendation(data) {
    const remaining = Math.max(0, 3200 - data.totalKcal);
    const proteinGap = Math.max(0, 200 - data.totalProtein);
    return `
    <div class="nut-recommendation">
      <div class="nut-dot" style="background:var(--teal);left:-21px;top:20px;position:absolute;width:10px;height:10px;border-radius:50%;border:2px solid var(--bg)"></div>
      <div class="nut-rec-title">⚡ APEX Recommendation</div>
      <div class="nut-rec-text">
        SR day ${data.srDay}${data.srDay >= 10 ? ' — elevated hormonal baseline' : ''}.
        You need ~${remaining} more kcal and ${proteinGap}g protein to hit today's goals.
        ${data.hadLiver ? '' : 'No liver logged this week — consider organ meat for B12 and Vitamin A.'}
        ${!data.hadOysters ? 'Oysters would cover your zinc gap.' : ''}
        <div class="nut-bonus-chips" style="margin-top:8px">
          <span class="nut-bonus-chip">Target: ${remaining} kcal</span>
          <span class="nut-bonus-chip">+${proteinGap}g protein</span>
          ${!data.hadLiver ? '<span class="nut-bonus-chip warning">Liver needed</span>' : ''}
        </div>
      </div>
    </div>
  `;
}

function renderNutritionPanel(data) {
    // Score ring animation
    const arc = document.getElementById('nut-score-arc');
    const pct = data.nutScore / 10;
    const offset = 327 - (327 * pct);
    setTimeout(() => { arc.style.strokeDashoffset = offset; arc.style.transition = 'stroke-dashoffset 1s ease'; }, 100);
    document.getElementById('nut-score-value').textContent = data.nutScore;

    // Nutrient bars
    const nutrients = [
        { label: 'Calories', val: data.totalKcal, goal: 3200, color: 'var(--accent)' },
        { label: 'Protein', val: data.totalProtein, goal: 200, unit: 'g', color: 'var(--teal)' },
        { label: 'Fat', val: data.totalFat, goal: 120, unit: 'g', color: 'var(--amber)' },
        { label: 'Carbs', val: data.totalCarbs, goal: 350, unit: 'g', color: 'var(--purple)' },
        { label: 'Vit A', val: data.hadLiver ? 890 : 320, goal: 900, unit: 'mcg', color: 'var(--orange)' },
        { label: 'B12', val: data.hadLiver ? 48 : 8, goal: 50, unit: 'mcg', color: 'var(--pink)' },
        { label: 'Zinc', val: data.hadOysters ? 42 : 12, goal: 40, unit: 'mg', color: 'var(--blue)' },
        { label: 'Iron', val: data.hadLiver ? 18 : 9, goal: 18, unit: 'mg', color: 'var(--red)' },
    ];

    document.getElementById('nut-nutrient-bars').innerHTML = nutrients.map(n => {
        const pct = Math.min(100, (n.val / n.goal) * 100);
        const complete = pct >= 95;
        return `
      <div class="nut-nb-row">
        <div class="nut-nb-label">${n.label}</div>
        <div class="nut-nb-track"><div class="nut-nb-fill${complete ? ' complete' : ''}" style="width:${pct}%;background:${n.color}"></div></div>
        <div class="nut-nb-val">${n.val}${n.unit || ''} / ${n.goal}${n.unit || ''}</div>
        ${complete ? '<span class="nut-nb-check">✓</span>' : ''}
      </div>
    `;
    }).join('');

    // Weekly chart
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const recent7 = getRecentDays(7);
    document.getElementById('nut-weekly-bars').innerHTML = recent7.map((d, i) => {
        const h = Math.min(70, (d.totalKcal / 3500) * 70);
        const col = d.totalKcal >= 3000 ? 'var(--accent)' : d.totalKcal >= 2200 ? 'var(--amber)' : 'var(--red)';
        return `
      <div class="nut-weekly-bar-wrap">
        <div class="nut-weekly-bar" style="height:${h}px;background:${col}"></div>
        <div class="nut-weekly-bar-label">${weekDays[i] || ''}</div>
      </div>
    `;
    }).join('');

    // Today's wins
    const wins = [];
    if (data.hadLiver) wins.push('Liver logged — B12 maxed');
    if (data.hadOysters) wins.push('Oysters logged — Zinc 127% RDA');
    if (data.hadRawMilk) wins.push('Raw milk ~2L — CLA + Enzymes');
    if (data.totalProtein >= 150) wins.push(`Protein on track — ${data.totalProtein}g / 200g`);
    if (data.totalKcal >= 2800) wins.push(`Calorie goal close — ${data.totalKcal} / 3200`);
    if (wins.length === 0) wins.push('Keep logging to unlock wins!');

    document.getElementById('nut-wins-list').innerHTML = wins.map(w => `<div class="nut-win-item">${w}</div>`).join('');
}

function parseTimeToHour(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [h] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
}

export function nutNavPrev() { nutDayOffset++; renderNutritionFeed(); }
export function nutNavNext() { if (nutDayOffset > 0) { nutDayOffset--; renderNutritionFeed(); } }
