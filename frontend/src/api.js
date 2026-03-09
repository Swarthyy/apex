// ═══════════════════════════════════════════════════════════════════════════
// APEX — API Client (centralised backend communication)
// ═══════════════════════════════════════════════════════════════════════════

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const DEFAULT_MODE = import.meta.env.VITE_DEFAULT_MODE || 'demo';

// ── Mode Management ──────────────────────────────────────────────────────────

export function getMode() {
    return localStorage.getItem('apex_mode') || DEFAULT_MODE;
}

export function setMode(mode) {
    localStorage.setItem('apex_mode', mode);
}

export function isLiveMode() {
    return getMode() === 'live';
}

// ── Token Management ─────────────────────────────────────────────────────────

export function getToken() {
    return localStorage.getItem('apex_token');
}

export function setToken(token) {
    localStorage.setItem('apex_token', token);
}

export function clearToken() {
    localStorage.removeItem('apex_token');
}

export function getUser() {
    const raw = localStorage.getItem('apex_user');
    return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
    localStorage.setItem('apex_user', JSON.stringify(user));
}

export function clearUser() {
    localStorage.removeItem('apex_user');
}

export function isAuthenticated() {
    return !!getToken();
}

// ── Core Fetch Wrapper ───────────────────────────────────────────────────────

export async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 — token expired or invalid
    if (response.status === 401) {
        clearToken();
        clearUser();
        // Dispatch custom event so the app can react
        window.dispatchEvent(new CustomEvent('apex:auth-expired'));
        throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
}

// ── Auth API ─────────────────────────────────────────────────────────────────

export async function apiLogin(email, password) {
    const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setUser(data.user);
    return data;
}

export async function apiSignup(email, password, full_name) {
    const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
    });
    return data;
}

export async function apiLogout() {
    try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        // Logout even if API call fails
    }
    clearToken();
    clearUser();
}

// ── Dashboard API ────────────────────────────────────────────────────────────

export async function apiGetDashboard() {
    return apiFetch('/api/dashboard');
}

// ── Check-ins API ────────────────────────────────────────────────────────────

export async function apiSubmitCheckin(data) {
    return apiFetch('/api/checkins', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function apiGetCheckins(startDate, endDate) {
    return apiFetch(`/api/checkins?start_date=${startDate}&end_date=${endDate}`);
}

export async function apiGetCheckinByDate(date) {
    return apiFetch(`/api/checkins/${date}`);
}

// ── Nutrition API ────────────────────────────────────────────────────────────

export async function apiSubmitMeal(data) {
    return apiFetch('/api/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function apiGetMeals(date) {
    const query = date ? `?date=${date}` : '';
    return apiFetch(`/api/nutrition/meals${query}`);
}

export async function apiGetNutritionSummary(date) {
    return apiFetch(`/api/nutrition/daily-summary/${date}`);
}

// ── Sleep API ────────────────────────────────────────────────────────────────

export async function apiGetSleep(startDate, endDate) {
    return apiFetch(`/api/sleep?start_date=${startDate}&end_date=${endDate}`);
}

export async function apiSubmitSleep(data) {
    return apiFetch('/api/sleep', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ── Gym API ──────────────────────────────────────────────────────────────────

export async function apiGetGymSessions(startDate, endDate) {
    return apiFetch(`/api/gym?start_date=${startDate}&end_date=${endDate}`);
}

// ── Body Metrics API ─────────────────────────────────────────────────────────

export async function apiGetBodyMetrics(startDate, endDate) {
    return apiFetch(`/api/body-metrics?start_date=${startDate}&end_date=${endDate}`);
}

// ── Vitality API ─────────────────────────────────────────────────────────────

export async function apiGetVitalityScore(date) {
    return apiFetch(`/api/vitality/score/${date}`);
}

export async function apiGetVitalityRange(startDate, endDate) {
    return apiFetch(`/api/vitality/range?start_date=${startDate}&end_date=${endDate}`);
}

// ── Insights API ─────────────────────────────────────────────────────────────

export async function apiGetInsights() {
    return apiFetch('/api/insights');
}

export async function apiGetUnreadInsights() {
    return apiFetch('/api/insights/unread');
}

// ── Calendar API ─────────────────────────────────────────────────────────────

export async function apiGetCalendarEvents(startDate, endDate) {
    return apiFetch(`/api/calendar?start_date=${startDate}&end_date=${endDate}`);
}

// ── Chat API ─────────────────────────────────────────────────────────────────

export async function apiSendChat(query) {
    return apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ query }),
    });
}
