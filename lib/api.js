const BASE = '/api';

function token() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('pmix_token') || '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function fetchSheets() {
  const res = await fetch(`${BASE}/sheets`, { headers: authHeaders() });
  if (res.status === 401) {
    localStorage.removeItem('pmix_token');
    window.location.href = '/login';
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load sheets');
  return data.sheets;
}

export async function fetchData(filename) {
  const res = await fetch(`${BASE}/data/${encodeURIComponent(filename)}`, { headers: authHeaders() });
  if (res.status === 401) {
    localStorage.removeItem('pmix_token');
    window.location.href = '/login';
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load data');
  return data;
}
