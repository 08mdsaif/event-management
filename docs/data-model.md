# Data Model (MongoDB Collections)

## users

- `_id`
- `name`
- `email`
- `rollNo`
- `passwordHash`
- `role` (`student | organizer | admin`)
- `branch` (e.g., CSE, ECE, MBA)
- `year`
- `interests: string[]`
- `clubsFollowed: ObjectId[]`
- `createdAt`, `updatedAt`

## events

- `_id`
- `title`
- `description`
- `bannerUrl`
- `category` (`technical | cultural | sports | workshop | placement | other`)
- `departmentVisibility: string[]`
- `clubId`
- `venue`
- `startAt`
- `endAt`
- `registrationDeadline`
- `capacity`
- `tags: string[]`
- `status` (`draft | published | cancelled | completed`)
- `createdBy` (organizer user id)
- `createdAt`, `updatedAt`

## registrations

- `_id`
- `eventId`
- `userId`
- `status` (`registered | waitlisted | checked_in | cancelled`)
- `qrTokenHash`
- `checkedInAt`
- `createdAt`, `updatedAt`

## announcements

- `_id`
- `eventId`
- `message`
- `type` (`info | delay | room_change | cancellation`)
- `createdBy`
- `createdAt`

## feedback

- `_id`
- `eventId`
- `userId`
- `rating` (1-5)
- `nps` (0-10)
- `comment`
- `createdAt`

## notifications

- `_id`
- `userId`
- `title`
- `body`
- `kind` (`registration | reminder | announcement | feedback`)
- `isRead`
- `meta` (eventId etc.)
- `createdAt`
