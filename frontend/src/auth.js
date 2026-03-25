// ═══════════════════════════════════════════════════════════════════════════
// APEX — Auth System (Demo / MVP)
// ═══════════════════════════════════════════════════════════════════════════
// Thin wrapper around localStorage + real API calls.

import { apiClient } from './apiClient.js';
import { loadDashboardData } from './data.js';

const AUTH_KEY = 'apex_auth';

// ── Auth State ──────────────────────────────────────────────────────────────

export function getAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
    } catch { return null; }
}

export function isAuthenticated() {
    const auth = getAuth();
    return !!(auth && auth.token);
}

export function isOnboardingComplete() {
    const auth = getAuth();
    return !!(auth && auth.onboardingComplete);
}

export function setAuth(data) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('apex_onboarding');
}

export function completeOnboarding() {
    const auth = getAuth();
    if (auth) {
        auth.onboardingComplete = true;
        setAuth(auth);
    }
}

export function getUserName() {
    const auth = getAuth();
    return auth?.name || 'User';
}

export function getUserInitials() {
    const auth = getAuth();
    if (!auth?.name) return 'U';
    const parts = auth.name.trim().split(/\s+/);
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ── Auth Modal ──────────────────────────────────────────────────────────────

export function openAuthModal(tab = 'signup') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    switchAuthTab(tab);
    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('.auth-form.active input');
        if (firstInput) firstInput.focus();
    }, 100);
}

export function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

export function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-form').forEach(f => {
        f.classList.toggle('active', f.id === `auth-form-${tab}`);
    });
}

export async function handleSignup() {
    const name = document.getElementById('signup-name')?.value?.trim();
    const email = document.getElementById('signup-email')?.value?.trim();
    const password = document.getElementById('signup-password')?.value;
    const btn = document.querySelector('#auth-form-signup .auth-btn');

    if (!name) { shakeInput('signup-name'); return; }
    if (!email || !email.includes('@')) { shakeInput('signup-email'); return; }
    if (!password || password.length < 8) { shakeInput('signup-password'); alert('Password must be at least 8 characters'); return; }

    try {
        if (btn) { btn.textContent = 'Creating...'; btn.disabled = true; }

        // 1. Signup with API
        await apiClient('/auth/signup', {
            method: 'POST',
            body: { email, password, full_name: name }
        });

        // 2. Auto-login immediately to get token
        const loginData = await apiClient('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        setAuth({
            name: loginData.user.user_metadata?.full_name || email.split('@')[0],
            email: loginData.user.email,
            token: loginData.access_token,
            userId: loginData.user.id,
            onboardingComplete: false,
            createdAt: Date.now(),
        });

        closeAuthModal();
        window.go('onboarding');
    } catch (err) {
        alert('Signup failed: ' + err.message);
        shakeInput('signup-email');
    } finally {
        if (btn) { btn.textContent = 'Create my APEX →'; btn.disabled = false; }
    }
}

export async function handleLogin() {
    const email = document.getElementById('login-email')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    const btn = document.querySelector('#auth-form-login .auth-btn');

    if (!email || !email.includes('@')) { shakeInput('login-email'); return; }
    if (!password) { shakeInput('login-password'); return; }

    try {
        if (btn) { btn.textContent = 'Logging in...'; btn.disabled = true; }

        const loginData = await apiClient('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        setAuth({
            name: loginData.user.user_metadata?.full_name || email.split('@')[0],
            email: loginData.user.email,
            token: loginData.access_token,
            userId: loginData.user.id,
            onboardingComplete: true, // Assume existing logins are onboarded
            createdAt: Date.now(),
        });

        await loadDashboardData();

        closeAuthModal();
        window.go('dashboard');
    } catch (err) {
        alert('Login failed: ' + err.message);
        shakeInput('login-password');
    } finally {
        if (btn) { btn.textContent = 'Enter APEX →'; btn.disabled = false; }
    }
}

export function handleForgotPassword() {
    console.log('Forgot password — coming in Phase 2');
}

export function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'HIDE';
    } else {
        input.type = 'password';
        btn.textContent = 'SHOW';
    }
}

function shakeInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('input-shake');
    el.style.borderColor = 'var(--red)';
    setTimeout(() => {
        el.classList.remove('input-shake');
        el.style.borderColor = '';
    }, 500);
}
