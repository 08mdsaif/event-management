# College Event Management System (Minor Project Blueprint)

A production-style blueprint for a college-specific Event Management System with role-based workflows, smart discovery, QR attendance, and post-event analytics.

## Selected unique features (college-specific)

This plan intentionally picks **6 non-generic features**:

1. **Smart event discovery**
   - "For You" feed based on branch, year, interests, clubs followed, and participation history.
2. **Role-based dashboards**
   - Separate student, organizer, and admin dashboards.
3. **Real-time announcements**
   - Last-minute updates (room/time changes) via in-app notifications and optional email.
4. **QR-based check-in**
   - Per-registration QR and organizer scan flow for attendance.
5. **Smart scheduling clash detection**
   - Warn students when registering for overlapping events.
6. **Feedback + analytics**
   - Post-event feedback with organizer-level reports.

## Core modules and end-to-end flows

### 1) Auth & profiles
- Signup/login via college email or roll number + password.
- Profile fields: name, branch, year, interests (tags), clubs followed.

### 2) Event management
- Organizers create/edit/cancel events with:
  - title, description, image, category, venue, start/end, deadline, capacity, tags, department visibility.
- Cancellation/update triggers notifications to all registrants.

### 3) Registration & attendance
- One-click register.
- States: `Registered`, `Waitlisted`, `Checked-in`, `Cancelled`.
- Unique QR token generated for each approved registration.
- Organizer check-in screen marks attendance by scanning QR.

### 4) Communication
- Notification center:
  - registration confirmation,
  - event update/cancellation,
  - reminder before event start.

### 5) Feedback & reports
- Feedback form opens after event end.
- Organizer analytics:
  - registrations vs checked-in,
  - average rating / NPS,
  - branch-wise participation.

## React architecture (feature-first)

```txt
src/
  app/
    App.tsx
    providers.tsx
  routes/
    AppRouter.tsx
    ProtectedRoute.tsx
  features/
    auth/
      pages/
      components/
      hooks/
      api/
      store/
    events/
      pages/
      components/
      hooks/
      api/
      store/
    registrations/
    checkin/
    notifications/
    dashboard/
    feedback/
  components/
    ui/
    layout/
    charts/
  services/
    apiClient.ts
  hooks/
  utils/
  theme/
```

## Recommended stack

- **Frontend:** React + TypeScript + Vite + React Router + TanStack Query + Tailwind/MUI.
- **Backend:** Node.js + Express + MongoDB (Mongoose).
- **Realtime:** Socket.IO for announcement stream.
- **Auth:** JWT (access + refresh), role claims.
- **QR:** Signed token per registration (short-lived for check-in).

## Demo script for viva

1. Login as student → browse "For You" feed → register for event → show QR.
2. Login as organizer → create event → publish announcement → scan check-in.
3. Open organizer dashboard → turnout chart + feedback summary.
4. Show clash warning by attempting overlap registration.

## Next build milestones

- Milestone 1: Auth + profile + role-based routing.
- Milestone 2: Event CRUD + discovery/filtering.
- Milestone 3: Registration + waitlist + clash detection.
- Milestone 4: QR check-in + announcements.
- Milestone 5: Feedback + analytics dashboards.
