# API Specification (Draft)

Base path: `/api/v1`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`

## Events

- `GET /events`
  - Query: `search`, `category`, `department`, `club`, `from`, `to`, `page`, `limit`
- `POST /events` (organizer/admin)
- `GET /events/:eventId`
- `PATCH /events/:eventId` (organizer/admin)
- `DELETE /events/:eventId` (soft cancel)
- `POST /events/:eventId/announce`

## Recommendations

- `GET /recommendations/for-you`
  - Rule-based scoring from tags, branch/year affinity, followed clubs, and prior attendance.

## Registration & waitlist

- `POST /events/:eventId/register`
- `DELETE /events/:eventId/register`
- `GET /users/me/registrations`
- `GET /events/:eventId/registrations` (organizer/admin)

## QR & check-in

- `GET /registrations/:registrationId/qr`
- `POST /events/:eventId/checkin/scan`
  - Request: `{ qrToken: string }`
- `GET /events/:eventId/checkin/stats`

## Notifications

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

## Feedback

- `POST /events/:eventId/feedback`
- `GET /events/:eventId/feedback/summary` (organizer/admin)

## Analytics

- `GET /analytics/organizer/overview`
- `GET /analytics/admin/department-participation`
- `GET /analytics/events/:eventId`
