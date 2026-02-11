import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'server', 'db.json');
const publicDir = path.join(rootDir, 'public');

const defaultDb = { users: [], sessions: [], events: [], registrations: [], announcements: [], feedback: [], notifications: [] };

function ensureDb() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
}
function loadDb() { ensureDb(); return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); }
function saveDb(db) { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }
function id(prefix) { return `${prefix}_${crypto.randomBytes(6).toString('hex')}`; }
function hashPassword(password) { return crypto.createHash('sha256').update(password).digest('hex'); }
function createToken() { return crypto.randomBytes(24).toString('hex'); }

function send(res, status, data, contentType = 'application/json') {
  const body = contentType === 'application/json' ? JSON.stringify(data) : data;
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

function auth(req, db) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

function notify(db, userIds, title, body, kind, meta = {}) {
  userIds.forEach((userId) => db.notifications.push({ id: id('notif'), userId, title, body, kind, meta, isRead: false, createdAt: new Date().toISOString() }));
}
function eventIsClashing(a, b) {
  const aStart = +new Date(a.startAt), aEnd = +new Date(a.endAt), bStart = +new Date(b.startAt), bEnd = +new Date(b.endAt);
  return aStart < bEnd && bStart < aEnd;
}

function routeMatch(pattern, pathname) {
  const p = pattern.split('/').filter(Boolean);
  const a = pathname.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = a[i];
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const fallback = path.join(publicDir, 'index.html');
    return send(res, 200, fs.readFileSync(fallback), 'text/html');
  }
  const ext = path.extname(filePath);
  const map = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
  return send(res, 200, fs.readFileSync(filePath), map[ext] || 'text/plain');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (!pathname.startsWith('/api')) return serveStatic(req, res, pathname);

  const db = loadDb();
  const user = auth(req, db);

  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok: true });

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await parseBody(req);
    const { name, email, rollNo, password, role = 'student', branch = 'General', year = 1, interests = [], clubsFollowed = [] } = body;
    if (!name || !password || !(email || rollNo)) return send(res, 400, { error: 'name, password and email/rollNo are required' });
    const exists = db.users.find((u) => (email && u.email === email) || (rollNo && u.rollNo === rollNo));
    if (exists) return send(res, 409, { error: 'User already exists' });
    db.users.push({ id: id('usr'), name, email: email || null, rollNo: rollNo || null, passwordHash: hashPassword(password), role, branch, year, interests, clubsFollowed, createdAt: new Date().toISOString() });
    saveDb(db);
    return send(res, 201, { message: 'Registered successfully' });
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseBody(req);
    const userRow = db.users.find((u) => u.email === body.identifier || u.rollNo === body.identifier);
    if (!userRow || userRow.passwordHash !== hashPassword(body.password || '')) return send(res, 401, { error: 'Invalid credentials' });
    const token = createToken();
    db.sessions.push({ token, userId: userRow.id, createdAt: new Date().toISOString() });
    saveDb(db);
    const { passwordHash, ...safeUser } = userRow;
    return send(res, 200, { token, user: safeUser });
  }

  if (req.method === 'POST' && pathname === '/api/dev/seed') {
    if (db.users.length === 0) {
      const admin = { id: id('usr'), name: 'Admin', email: 'admin@clg.edu', rollNo: null, passwordHash: hashPassword('admin123'), role: 'admin', branch: 'All', year: 0, interests: ['management'], clubsFollowed: [], createdAt: new Date().toISOString() };
      const organizer = { id: id('usr'), name: 'CSE Club', email: 'organizer@clg.edu', rollNo: null, passwordHash: hashPassword('organizer123'), role: 'organizer', branch: 'CSE', year: 0, interests: ['tech'], clubsFollowed: ['Coding Club'], createdAt: new Date().toISOString() };
      const student = { id: id('usr'), name: 'Aarav', email: 'student@clg.edu', rollNo: 'CSE23-001', passwordHash: hashPassword('student123'), role: 'student', branch: 'CSE', year: 2, interests: ['ai', 'coding', 'hackathon'], clubsFollowed: ['Coding Club'], createdAt: new Date().toISOString() };
      db.users.push(admin, organizer, student);
      db.events.push({ id: id('evt'), title: 'AI Workshop', description: 'Hands-on workshop on AI tools for students.', venue: 'Seminar Hall 2', startAt: new Date(Date.now()+86400000).toISOString(), endAt: new Date(Date.now()+90000000).toISOString(), registrationDeadline: new Date(Date.now()+80000000).toISOString(), capacity: 100, category: 'workshop', tags: ['ai','coding'], departmentVisibility: ['All'], club: 'Coding Club', status: 'published', createdBy: organizer.id, createdAt: new Date().toISOString() });
      saveDb(db);
    }
    return send(res, 200, { message: 'Seed complete' });
  }

  if (!user) return send(res, 401, { error: 'Unauthorized' });

  if (req.method === 'GET' && pathname === '/api/me') {
    const { passwordHash, ...safeUser } = user;
    return send(res, 200, safeUser);
  }

  if (req.method === 'GET' && pathname === '/api/events') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const department = url.searchParams.get('department') || '';
    const category = url.searchParams.get('category') || '';
    const events = db.events.filter((e) => {
      const s = !search || e.title.toLowerCase().includes(search) || e.description.toLowerCase().includes(search);
      const d = !department || e.departmentVisibility.includes(department) || e.departmentVisibility.includes('All');
      const c = !category || e.category === category;
      return s && d && c && e.status !== 'cancelled';
    });
    return send(res, 200, events);
  }

  if (req.method === 'GET' && pathname === '/api/recommendations/for-you') {
    const rec = db.events.filter((e) => e.status === 'published').map((e) => {
      let score = 0;
      if (e.departmentVisibility.includes(user.branch) || e.departmentVisibility.includes('All')) score += 3;
      if (e.tags.some((t) => user.interests.includes(t))) score += 4;
      if (user.clubsFollowed.includes(e.club)) score += 2;
      return { ...e, score };
    }).sort((a,b)=>b.score-a.score).slice(0,10);
    return send(res, 200, rec);
  }

  if (req.method === 'POST' && pathname === '/api/events') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const body = await parseBody(req);
    const { title, description, venue, startAt, endAt, registrationDeadline, capacity, category='other', tags=[], departmentVisibility=['All'], club='General Club' } = body;
    if (!title || !description || !venue || !startAt || !endAt || !capacity) return send(res, 400, { error: 'Missing required fields' });
    const evt = { id: id('evt'), title, description, venue, startAt, endAt, registrationDeadline: registrationDeadline || endAt, capacity: Number(capacity), category, tags, departmentVisibility, club, status: 'published', createdBy: user.id, createdAt: new Date().toISOString() };
    db.events.push(evt); saveDb(db); return send(res, 201, evt);
  }

  let params;
  params = routeMatch('/api/events/:id', pathname);
  if (params && req.method === 'PATCH') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const event = db.events.find((e) => e.id === params.id);
    if (!event) return send(res, 404, { error: 'Event not found' });
    if (user.role === 'organizer' && event.createdBy !== user.id) return send(res, 403, { error: 'Can edit only your event' });
    const body = await parseBody(req);
    Object.assign(event, body, { updatedAt: new Date().toISOString() });
    const registrants = db.registrations.filter((r)=>r.eventId===event.id && r.status!=='cancelled').map((r)=>r.userId);
    notify(db, registrants, 'Event updated', `${event.title} details were changed.`, 'announcement', { eventId: event.id });
    saveDb(db); return send(res, 200, event);
  }
  if (params && req.method === 'DELETE') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const event = db.events.find((e) => e.id === params.id);
    if (!event) return send(res, 404, { error: 'Event not found' });
    if (user.role === 'organizer' && event.createdBy !== user.id) return send(res, 403, { error: 'Can cancel only your event' });
    event.status = 'cancelled';
    const registrants = db.registrations.filter((r)=>r.eventId===event.id && r.status!=='cancelled').map((r)=>r.userId);
    notify(db, registrants, 'Event cancelled', `${event.title} was cancelled.`, 'announcement', { eventId: event.id });
    saveDb(db); return send(res, 200, { message: 'Event cancelled' });
  }

  params = routeMatch('/api/events/:id/register', pathname);
  if (params && req.method === 'POST') {
    if (user.role !== 'student') return send(res, 403, { error: 'Only students can register' });
    const event = db.events.find((e) => e.id === params.id && e.status === 'published');
    if (!event) return send(res, 404, { error: 'Event not found' });
    const existing = db.registrations.find((r)=>r.eventId===event.id && r.userId===user.id && r.status!=='cancelled');
    if (existing) return send(res, 409, { error: 'Already registered/waitlisted' });
    const userRegs = db.registrations.filter((r)=>r.userId===user.id && ['registered','checked_in'].includes(r.status));
    const userEvents = userRegs.map((r)=>db.events.find((e)=>e.id===r.eventId)).filter(Boolean);
    const clashes = userEvents.filter((e)=>eventIsClashing(e, event));
    if (clashes.length) return send(res, 409, { error: 'Schedule clash detected', clashes: clashes.map((c)=>({id:c.id,title:c.title})) });
    const active = db.registrations.filter((r)=>r.eventId===event.id && ['registered','checked_in'].includes(r.status)).length;
    const status = active < event.capacity ? 'registered' : 'waitlisted';
    const reg = { id: id('reg'), eventId: event.id, userId: user.id, status, qrToken: `${id('qr')}.${event.id}.${user.id}`, createdAt: new Date().toISOString() };
    db.registrations.push(reg);
    notify(db, [user.id], 'Registration status', `You are ${status} for ${event.title}.`, 'registration', { eventId: event.id });
    saveDb(db); return send(res, 201, reg);
  }

  if (req.method === 'GET' && pathname === '/api/my/registrations') {
    const regs = db.registrations.filter((r)=>r.userId===user.id && r.status!=='cancelled').map((r)=>({ ...r, event: db.events.find((e)=>e.id===r.eventId) || null }));
    return send(res, 200, regs);
  }

  params = routeMatch('/api/events/:id/announce', pathname);
  if (params && req.method === 'POST') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const event = db.events.find((e)=>e.id===params.id);
    if (!event) return send(res, 404, { error: 'Event not found' });
    if (user.role === 'organizer' && event.createdBy !== user.id) return send(res, 403, { error: 'Can announce only your event' });
    const body = await parseBody(req);
    if (!body.message) return send(res, 400, { error: 'Announcement message required' });
    const ann = { id: id('ann'), eventId: event.id, message: body.message, type: body.type || 'info', createdBy: user.id, createdAt: new Date().toISOString() };
    db.announcements.push(ann);
    const registrants = db.registrations.filter((r)=>r.eventId===event.id && r.status!=='cancelled').map((r)=>r.userId);
    notify(db, registrants, `Announcement: ${event.title}`, body.message, 'announcement', { eventId: event.id });
    saveDb(db); return send(res, 201, ann);
  }

  params = routeMatch('/api/events/:id/checkin/scan', pathname);
  if (params && req.method === 'POST') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const event = db.events.find((e)=>e.id===params.id);
    if (!event) return send(res, 404, { error: 'Event not found' });
    const body = await parseBody(req);
    const reg = db.registrations.find((r)=>r.eventId===event.id && r.qrToken===body.qrToken);
    if (!reg) return send(res, 404, { error: 'Invalid QR token' });
    reg.status = 'checked_in'; reg.checkedInAt = new Date().toISOString(); saveDb(db);
    return send(res, 200, { message: 'Attendance marked', registrationId: reg.id });
  }

  params = routeMatch('/api/events/:id/feedback', pathname);
  if (params && req.method === 'POST') {
    if (user.role !== 'student') return send(res, 403, { error: 'Only students can submit feedback' });
    const event = db.events.find((e)=>e.id===params.id);
    if (!event) return send(res, 404, { error: 'Event not found' });
    const reg = db.registrations.find((r)=>r.eventId===event.id && r.userId===user.id);
    if (!reg) return send(res, 403, { error: 'Only participants can submit feedback' });
    const body = await parseBody(req);
    if (body.rating == null || body.nps == null) return send(res, 400, { error: 'rating and nps are required' });
    if (db.feedback.find((f)=>f.eventId===event.id && f.userId===user.id)) return send(res, 409, { error: 'Feedback already submitted' });
    const item = { id: id('fb'), eventId: event.id, userId: user.id, rating: Number(body.rating), nps: Number(body.nps), comment: body.comment || '', createdAt: new Date().toISOString() };
    db.feedback.push(item); saveDb(db); return send(res, 201, item);
  }

  params = routeMatch('/api/events/:id/feedback/summary', pathname);
  if (params && req.method === 'GET') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const items = db.feedback.filter((f)=>f.eventId===params.id);
    const avgRating = items.length ? items.reduce((a,b)=>a+b.rating,0)/items.length : 0;
    const avgNps = items.length ? items.reduce((a,b)=>a+b.nps,0)/items.length : 0;
    return send(res, 200, { count: items.length, avgRating, avgNps, comments: items.map((i)=>i.comment).filter(Boolean) });
  }

  if (req.method === 'GET' && pathname === '/api/dashboard/student') {
    if (user.role !== 'student') return send(res, 403, { error: 'Forbidden' });
    const registrations = db.registrations.filter((r)=>r.userId===user.id && r.status!=='cancelled');
    const points = registrations.reduce((sum, r) => sum + (r.status === 'checked_in' ? 10 : 3), 0);
    const notifications = db.notifications.filter((n)=>n.userId===user.id).slice(-10).reverse();
    return send(res, 200, { registrationsCount: registrations.length, points, notifications });
  }

  if (req.method === 'GET' && pathname === '/api/dashboard/organizer') {
    if (!['organizer','admin'].includes(user.role)) return send(res, 403, { error: 'Forbidden' });
    const events = db.events.filter((e)=>user.role === 'admin' || e.createdBy === user.id);
    const stats = events.map((event) => {
      const regs = db.registrations.filter((r)=>r.eventId===event.id && r.status!=='cancelled');
      const checkedIn = regs.filter((r)=>r.status==='checked_in').length;
      const fb = db.feedback.filter((f)=>f.eventId===event.id);
      const avgRating = fb.length ? fb.reduce((a,b)=>a+b.rating,0)/fb.length : 0;
      return { eventId: event.id, title: event.title, registrations: regs.length, checkedIn, avgRating };
    });
    return send(res, 200, { events: stats });
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    const notifications = db.notifications.filter((n)=>n.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    return send(res, 200, notifications);
  }

  params = routeMatch('/api/notifications/:id/read', pathname);
  if (params && req.method === 'PATCH') {
    const notif = db.notifications.find((n)=>n.id===params.id && n.userId===user.id);
    if (!notif) return send(res, 404, { error: 'Notification not found' });
    notif.isRead = true; saveDb(db); return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Not found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
