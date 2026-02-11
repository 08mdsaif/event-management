const apiBase = '/api';
const state = { token: localStorage.getItem('token') || null, user: null };

const logEl = document.getElementById('log');
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const welcomeText = document.getElementById('welcomeText');
const organizerTabBtn = document.getElementById('organizerTabBtn');

function log(msg) {
  logEl.textContent = `${new Date().toLocaleTimeString()} - ${msg}\n${logEl.textContent}`;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toIso(localDateTime) {
  return new Date(localDateTime).toISOString();
}

function eventCard(event) {
  return `<div class="item">
    <h4>${event.title}</h4>
    <div>${event.description}</div>
    <div><b>Venue:</b> ${event.venue} | <b>Category:</b> ${event.category}</div>
    <div><b>Time:</b> ${new Date(event.startAt).toLocaleString()} - ${new Date(event.endAt).toLocaleString()}</div>
    <div><b>Tags:</b> ${(event.tags || []).join(', ') || '-'}</div>
    <button data-register="${event.id}">Register</button>
  </div>`;
}

async function loadEvents() {
  const search = document.getElementById('searchInput').value.trim();
  const events = await api(`/events?search=${encodeURIComponent(search)}`);
  const list = document.getElementById('eventsList');
  list.innerHTML = events.map(eventCard).join('') || '<p>No events.</p>';

  list.querySelectorAll('button[data-register]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const reg = await api(`/events/${btn.dataset.register}/register`, { method: 'POST' });
        log(`Registered: ${reg.status}`);
        await loadMyRegistrations();
        await loadNotifications();
      } catch (e) {
        log(`Register failed: ${e.message}`);
      }
    });
  });
}

async function loadRecommendations() {
  const items = await api('/recommendations/for-you');
  document.getElementById('recommendList').innerHTML = items
    .map((i) => `<div class="item"><h4>${i.title}</h4><div>Score: ${i.score}</div><div>${i.description}</div></div>`)
    .join('') || '<p>No recommendations yet.</p>';
}

async function loadMyRegistrations() {
  const regs = await api('/my/registrations');
  document.getElementById('myRegistrations').innerHTML = regs.map((r) => `
    <div class="item">
      <h4>${r.event?.title || r.eventId}</h4>
      <div>Status: <b>${r.status}</b></div>
      <div>QR token: <code>${r.qrToken}</code></div>
    </div>
  `).join('') || '<p>No registrations.</p>';
}

async function loadNotifications() {
  const notes = await api('/notifications');
  document.getElementById('notifications').innerHTML = notes.map((n) => `
    <div class="item">
      <div><b>${n.title}</b> ${n.isRead ? '' : '• unread'}</div>
      <div>${n.body}</div>
      <small>${new Date(n.createdAt).toLocaleString()}</small>
    </div>`).join('') || '<p>No notifications.</p>';
}

async function loadDashboard() {
  if (!state.user) return;
  if (state.user.role === 'student') {
    const data = await api('/dashboard/student');
    document.getElementById('dashboardData').textContent = JSON.stringify(data, null, 2);
  } else {
    const data = await api('/dashboard/organizer');
    document.getElementById('dashboardData').textContent = JSON.stringify(data, null, 2);
    document.getElementById('organizerData').textContent = JSON.stringify(data, null, 2);
  }
}

function setupTabs() {
  document.querySelectorAll('.tabBtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabBtn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tabPanel').forEach((panel) => panel.classList.add('hidden'));
      document.getElementById(tabId).classList.remove('hidden');
    });
  });
}

async function loadAuthedApp() {
  const me = await api('/me');
  state.user = me;
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  welcomeText.textContent = `${me.name} (${me.role})`;

  organizerTabBtn.classList.toggle('hidden', !['organizer', 'admin'].includes(me.role));

  await Promise.all([loadEvents(), loadRecommendations(), loadMyRegistrations(), loadNotifications(), loadDashboard()]);
}

document.getElementById('seedBtn').addEventListener('click', async () => {
  const data = await api('/dev/seed', { method: 'POST' });
  log(JSON.stringify(data));
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value.trim();
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
    state.token = data.token;
    localStorage.setItem('token', data.token);
    await loadAuthedApp();
    log('Logged in successfully');
  } catch (err) {
    log(`Login failed: ${err.message}`);
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: document.getElementById('regName').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      rollNo: document.getElementById('regRoll').value.trim() || null,
      role: document.getElementById('regRole').value,
      branch: document.getElementById('regBranch').value.trim() || 'General',
      year: Number(document.getElementById('regYear').value || 1),
      interests: document.getElementById('regInterests').value.split(',').map((s) => s.trim()).filter(Boolean),
      password: document.getElementById('regPassword').value
    };
    await api('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    log('Registered successfully, now login.');
  } catch (err) {
    log(`Registration failed: ${err.message}`);
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  state.token = null;
  state.user = null;
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
  log('Logged out');
});

document.getElementById('loadEventsBtn').addEventListener('click', async () => {
  await loadEvents();
  log('Events refreshed');
});

document.getElementById('createEventForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const payload = {
      title: document.getElementById('evtTitle').value.trim(),
      description: document.getElementById('evtDesc').value.trim(),
      venue: document.getElementById('evtVenue').value.trim(),
      startAt: toIso(document.getElementById('evtStart').value),
      endAt: toIso(document.getElementById('evtEnd').value),
      capacity: Number(document.getElementById('evtCapacity').value),
      category: document.getElementById('evtCategory').value.trim(),
      tags: document.getElementById('evtTags').value.split(',').map((s) => s.trim()).filter(Boolean),
      departmentVisibility: document.getElementById('evtDepartments').value.split(',').map((s) => s.trim()).filter(Boolean),
      club: document.getElementById('evtClub').value.trim()
    };
    const created = await api('/events', { method: 'POST', body: JSON.stringify(payload) });
    log(`Event created: ${created.title}`);
    await loadEvents();
    await loadDashboard();
  } catch (err) {
    log(`Create event failed: ${err.message}`);
  }
});

setupTabs();

if (state.token) {
  loadAuthedApp().catch((err) => {
    log(`Session restore failed: ${err.message}`);
    localStorage.removeItem('token');
    state.token = null;
  });
}
