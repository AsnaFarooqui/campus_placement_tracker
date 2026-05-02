# Campus Placement Tracker System

Centralized placement management app for students, recruiters, placement officers, and college administration. It replaces spreadsheet/email/manual tracking with authenticated role-based workflows for jobs, eligibility, applications, interviews, notifications, and reports.

## Project Structure

- `backend/` - Express, MongoDB/Mongoose API
- `frontend/` - React, Vite, Tailwind, shadcn-style UI
- `backend/test/` - Node test suite for backend rules and middleware
- `frontend/src/test/` - Vitest component and UI validation tests
- `SRS_COVERAGE_REPORT.md` - SRS traceability and remaining limitations

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB running locally or a MongoDB Atlas URI

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/campus_placement_tracker
JWT_SECRET=replace-with-a-long-random-secret
REQUIRE_EMAIL_VERIFICATION=false
```

Notes:

- JWT sessions expire after 30 minutes.
- Set `REQUIRE_EMAIL_VERIFICATION=true` to block login until `/api/auth/verify-email` is completed.
- The app currently creates verification tokens; SMTP email delivery is documented as a remaining integration gap.

## Install

```bash
npm --prefix backend install
npm --prefix frontend install
```

## Run

Start the API:

```bash
npm --prefix backend run dev
```

Start the frontend:

```bash
npm --prefix frontend run dev
```

Default URLs:

- API: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## Seed Data

```bash
node backend/scripts/seedData.js
```

Seed login:

- Email: `recruiter@test.com`
- Password: `123456`

## Tests, Lint, Build

Backend tests:

```bash
npm --prefix backend test
```

Frontend tests:

```bash
npm --prefix frontend test
```

Lint:

```bash
npm --prefix backend run lint
npm --prefix frontend run lint
```

Build:

```bash
npm --prefix frontend run build
```

Root convenience commands are also available:

```bash
npm test
npm run lint
npm run build
```

## Implemented SRS Coverage Summary

Implemented or strengthened:

- Registration/login with hashed passwords, JWT auth, email verification token support, and server-side RBAC.
- Student, recruiter, placement officer, and college administration roles.
- Job posting CRUD with salary, branch, CGPA, backlog, deadline, close/edit validation.
- Student job browsing with eligibility reasons, duplicate prevention, deadline checks, and withdrawal before deadline.
- Application status workflow with history and invalid transition prevention.
- Interview slot creation, booking, cancellation, recruiter rescheduling, student reschedule requests with recruiter approval, double-booking prevention, and student conflict checks.
- Custom/manual options for eligible branches and interview round names, so users are not limited to the default suggestions.
- Notifications for status/interview changes plus announcements and deadline reminder API hooks.
- Officer/admin dashboards with overall, company-wise, branch-wise, chart-ready data, and CSV/PDF-ready export endpoints.
- Responsive navigation, clearer forms, loading/empty states, and risky-action confirmations.
- Backend unit tests and frontend component tests for SRS-critical validation/confirmation behavior.

## Known Limitations

- Email verification currently exposes a development token and does not send SMTP mail.
- PDF export is browser-print HTML; CSV is Excel-compatible but not native `.xlsx` generation.
- Deadline reminders are API-supported but not scheduled by a background worker.
- SRS validation is based on the requirements text supplied with the project request.
