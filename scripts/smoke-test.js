import { spawn } from 'child_process';

const base = 'http://127.0.0.1:3000/api';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function req(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

const server = spawn('node', ['server/index.js'], { stdio: 'ignore' });

try {
  await wait(1000);

  await req('/dev/seed', { method: 'POST' });
  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: 'student@clg.edu', password: 'student123' })
  });
  const token = login.token;

  const events = await req('/events', { headers: { Authorization: `Bearer ${token}` } });
  if (!Array.isArray(events)) throw new Error('events not array');

  const rec = await req('/recommendations/for-you', { headers: { Authorization: `Bearer ${token}` } });
  if (!Array.isArray(rec)) throw new Error('recommendations not array');

  if (events[0]) {
    await req(`/events/${events[0].id}/register`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  }

  const regs = await req('/my/registrations', { headers: { Authorization: `Bearer ${token}` } });
  if (!Array.isArray(regs)) throw new Error('registrations not array');

  console.log('Smoke test passed');
} catch (err) {
  console.error('Smoke test failed:', err.message);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
