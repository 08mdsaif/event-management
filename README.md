# College Event Management System

A complete, runnable college event management system with:

- Role-based authentication (`student`, `organizer`, `admin`)
- Event creation and management
- Smart recommendations (`For You`)
- Registration with waitlist + schedule clash detection
- QR-token based attendance check-in
- Real-time-style announcements via notification center
- Feedback and organizer analytics dashboards

## Tech stack

- **Backend:** Node.js HTTP server (no external runtime dependencies)
- **Frontend:** Vanilla JS SPA (served by the same Node server)
- **Storage:** JSON file (`server/db.json`) for zero-setup local development

## Project structure

```txt
server/
  index.js          # API + static server
  db.json           # Local data storage
public/
  index.html        # UI
  styles.css        # Styling
  app.js            # Frontend logic
scripts/
  smoke-test.js     # API smoke test
```

## Run locally

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Demo credentials (after seeding)

Click **Seed Demo Data** in UI or call `POST /api/dev/seed`.

- Admin: `admin@clg.edu / admin123`
- Organizer: `organizer@clg.edu / organizer123`
- Student: `student@clg.edu / student123`

## Key API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/events`
- `POST /api/events` (organizer/admin)
- `POST /api/events/:id/register` (student)
- `POST /api/events/:id/checkin/scan` (organizer/admin)
- `POST /api/events/:id/announce` (organizer/admin)
- `POST /api/events/:id/feedback` (student)
- `GET /api/dashboard/student`
- `GET /api/dashboard/organizer`
- `GET /api/notifications`

## Validation commands

```bash
npm run check
npm run smoke
```

## Notes

- This implementation is intentionally lightweight for minor-project submission and demo.
- You can replace JSON storage with MongoDB later while preserving route contracts.
