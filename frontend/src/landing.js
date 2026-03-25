// ═══════════════════════════════════════════════════════════════════════════
// APEX — Landing Page
// ═══════════════════════════════════════════════════════════════════════════

export function renderLanding() {
    const el = document.getElementById('view-landing');
    if (!el) return;
    el.innerHTML = `
    <div class="landing-page">

      <!-- Animated dot grid background -->
      <div class="landing-bg-dots"></div>

      <!-- Hero Section -->
      <div class="landing-hero">
        <div class="landing-topbar">
          <div class="landing-logo">
            <span class="logo-icon">◆</span>
            <span class="logo-text">APEX</span>
          </div>
          <button class="landing-login-link" onclick="openAuthModal('login')">Log in</button>
        </div>

        <div class="landing-hero-content">
          <h1 class="landing-headline">Know yourself.<br>Precisely.</h1>
          <p class="landing-sub">Track the metrics that actually move the needle — energy, sleep, retention, nutrition, body, and more.</p>
          <button class="landing-cta" onclick="openAuthModal('signup')">Start for free →</button>
        </div>

        <!-- Blurred dashboard preview -->
        <div class="landing-preview-wrap">
          <div class="landing-preview" id="landing-preview"></div>
        </div>
      </div>

      <!-- Features Strip -->
      <div class="landing-features">
        <div class="landing-feature-tile">
          <div class="lf-icon">◎</div>
          <div class="lf-title">10 Life Sectors</div>
          <div class="lf-desc">Sleep, energy, gym, nutrition, body, mood, libido, retention, finances, business</div>
        </div>
        <div class="landing-feature-tile">
          <div class="lf-icon">◆</div>
          <div class="lf-title">Vitality Score</div>
          <div class="lf-desc">One number. Weighted across everything that matters.</div>
        </div>
        <div class="landing-feature-tile">
          <div class="lf-icon">⧫</div>
          <div class="lf-title">Patterns, Not Noise</div>
          <div class="lf-desc">APEX speaks only when it has something worth saying.</div>
        </div>
        <div class="landing-feature-tile">
          <div class="lf-icon">◈</div>
          <div class="lf-title">Your Data Stays Yours</div>
          <div class="lf-desc">No ads, no selling, no sharing.</div>
        </div>
        <div class="landing-feature-tile">
          <div class="lf-icon">▣</div>
          <div class="lf-title">Built for Consistency</div>
          <div class="lf-desc">Morning check-in takes 90 seconds.</div>
        </div>
        <div class="landing-feature-tile">
          <div class="lf-icon">🔥</div>
          <div class="lf-title">SR Intelligence</div>
          <div class="lf-desc">Track your retention streak and its effect on everything else.</div>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="landing-bottom-cta">
        <h2 class="landing-bottom-headline">Ready to stop guessing?</h2>
        <button class="landing-cta" onclick="openAuthModal('signup')">Start for free →</button>
        <div class="landing-footer-links">
          <a href="#" onclick="event.preventDefault();openAuthModal('login')">Log in</a>
          <span>·</span>
          <a href="#">Privacy</a>
          <span>·</span>
          <span class="landing-footer-muted">Built in Melbourne</span>
        </div>
      </div>

    </div>
  `;

    // Render a mini dashboard preview (actual DOM, blurred)
    renderDashboardPreview();
}

function renderDashboardPreview() {
    const previewEl = document.getElementById('landing-preview');
    if (!previewEl) return;
    // Render a simplified version of the dashboard for the blurred preview
    previewEl.innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <div class="stat-tile" style="--tile-color:var(--accent);flex:1"><div class="tile-label">SR STREAK</div><div class="tile-value" style="color:var(--accent)">Day 17</div><div class="tile-sub">PB: Day 28</div></div>
      <div class="stat-tile" style="--tile-color:var(--blue);flex:1"><div class="tile-label">SLEEP</div><div class="tile-value" style="color:var(--blue)">6.5h</div><div class="tile-sub">Below target</div></div>
      <div class="stat-tile" style="--tile-color:var(--gold);flex:1"><div class="tile-label">ENERGY</div><div class="tile-value" style="color:var(--gold)">9</div><div class="tile-sub">/10 score</div></div>
      <div class="stat-tile" style="--tile-color:var(--purple);flex:1"><div class="tile-label">WEIGHT</div><div class="tile-value" style="color:var(--purple)">85.7</div><div class="tile-sub">15.2% BF</div></div>
      <div class="stat-tile" style="--tile-color:var(--orange);flex:1"><div class="tile-label">GYM</div><div class="tile-value" style="color:var(--orange)">✓ Today</div><div class="tile-sub">4x this week</div></div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <div class="insight-card" style="flex:1;border-left-color:var(--accent)"><div class="insight-type" style="color:var(--accent)">POSITIVE</div><div class="insight-text">SR day 14+ correlates with +1.8 avg energy.</div></div>
      <div class="insight-card" style="flex:1;border-left-color:var(--amber)"><div class="insight-type" style="color:var(--amber)">WARNING</div><div class="insight-text">No liver in 5 days. Libido averaged 1.4 higher.</div></div>
    </div>
    <div style="height:120px;background:var(--surface);border:1px solid var(--border);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-family:Syne,sans-serif">
      <svg viewBox="0 0 400 80" style="width:90%;height:60px">
        <polyline fill="none" stroke="var(--gold)" stroke-width="2" points="0,40 30,25 60,35 90,20 120,30 150,15 180,30 210,22 240,18 270,30 300,25 330,15 360,20 390,10"/>
        <polyline fill="none" stroke="var(--pink)" stroke-width="2" points="0,50 30,45 60,55 90,35 120,50 150,40 180,55 210,45 240,40 270,50 300,35 330,45 360,38 390,30"/>
      </svg>
    </div>
  `;
}
