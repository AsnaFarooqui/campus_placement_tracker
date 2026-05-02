# SRS Coverage Report

Audit date: 2026-05-01

## Requirement Traceability Matrix

| SRS requirement | Status | Implementation location | Notes |
| --- | --- | --- | --- |
| Centralized placement tracker replacing spreadsheets/emails/manual forms | Implemented | `frontend/src/pages/*`, `backend/src/routes/*` | Jobs, applications, interviews, reports, and notifications are now centralized through API-backed screens. |
| Roles: Student | Implemented | `backend/src/models/User.js`, `frontend/src/lib/auth-context.tsx` | Student profile contains CGPA, branch, and backlog data for eligibility. |
| Roles: Placement Officer | Implemented | `backend/src/models/User.js`, `backend/src/controllers/dashboardController.js`, `frontend/src/components/AppSidebar.tsx` | Officer can manage jobs, applications, interviews, announcements, and reports. |
| Roles: Recruiter/Company | Implemented | `backend/src/controllers/jobController.js`, `backend/src/controllers/applicationController.js` | Recruiter-owned job/application/interview access is enforced server-side. |
| Roles: College Administration | Implemented | `backend/src/models/User.js`, `frontend/src/pages/Register.tsx`, `frontend/src/components/AppSidebar.tsx` | Added `admin` role with institutional dashboard/report access. |
| Registration/authentication | Implemented | `backend/src/controllers/authController.js`, `frontend/src/pages/Register.tsx`, `frontend/src/pages/Login.tsx` | Password hashing, role selection, login, and profile APIs are present. |
| Email verification | Partially implemented | `backend/src/controllers/authController.js`, `backend/src/routes/authRoutes.js`, `frontend/src/pages/Register.tsx` | Token verification endpoint exists. SMTP delivery is not implemented; dev token can be auto-verified. |
| Username/password login | Implemented | `backend/src/controllers/authController.js`, `frontend/src/pages/Login.tsx` | Email/password login with JWT. |
| Basic profile with academic details | Implemented | `backend/src/models/User.js`, `frontend/src/pages/Profile.tsx` | Student CGPA, branch, backlogs; recruiter/company name field exists in API. |
| Role-based access control | Implemented | `backend/src/middlewares/authMiddleware.js`, `backend/src/middlewares/roleMiddleware.js`, route/controller guards | Server checks roles for jobs, applications, interviews, reports, notifications. |
| Recruiter/officer job creation | Implemented | `backend/src/controllers/jobController.js`, `frontend/src/components/jobs/JobFormDialog.tsx` | Includes title, company, description, salary, eligibility, deadline. |
| Job eligibility criteria | Implemented | `backend/src/models/Job.js`, `backend/src/services/validationService.js` | Minimum CGPA, allowed branches, maximum backlogs. |
| Job edit/close | Implemented | `backend/src/controllers/jobController.js`, `frontend/src/pages/Jobs.tsx` | Close confirmation added; ownership enforced for recruiters. |
| Browse/search jobs | Implemented | `backend/src/controllers/jobController.js`, `frontend/src/pages/Jobs.tsx` | Server and client search are available. |
| Automatic eligibility check | Implemented | `backend/src/services/eligibilityService.js`, `backend/src/controllers/jobController.js` | Student job list returns eligibility and reasons. |
| Submit only if eligible | Implemented | `backend/src/controllers/applicationController.js` | Backend blocks ineligible submissions. |
| Clear ineligible rejection reasons | Implemented | `backend/src/services/eligibilityService.js`, `frontend/src/pages/Jobs.tsx` | Reasons are shown beside each job. |
| View applied jobs | Implemented | `backend/src/controllers/applicationController.js`, `frontend/src/pages/Applications.tsx` | Student application dashboard. |
| Prevent duplicate applications | Implemented | `backend/src/models/Application.js`, `backend/src/controllers/applicationController.js` | Unique compound index plus explicit duplicate check. |
| Withdraw before deadline | Implemented | `backend/src/controllers/applicationController.js`, `frontend/src/pages/Applications.tsx` | Confirmation popup and backend deadline enforcement. |
| Status tracking stages | Implemented | `backend/src/models/Application.js`, `backend/src/services/statusWorkflowService.js` | Applied, Shortlisted, Interview Scheduled, Selected, Rejected, plus Withdrawn. |
| Recruiters update applicant status | Implemented | `backend/src/controllers/applicationController.js`, `frontend/src/pages/Applications.tsx` | Recruiters can update only their own job applicants. |
| Students see latest status | Implemented | `frontend/src/pages/Applications.tsx`, `backend/src/controllers/applicationController.js` | Status and history loaded from API. |
| Status history log | Implemented | `backend/src/models/Application.js`, `frontend/src/pages/Applications.tsx` | History records status, actor, time, note. |
| Invalid status jump prevention | Implemented | `backend/src/services/statusWorkflowService.js` | Blocks Applied -> Selected and terminal changes. |
| Recruiters create interview slots | Implemented | `backend/src/controllers/interviewController.js`, `frontend/src/pages/Interviews.tsx` | Recruiter/officer/admin slot creation with custom/manual interview round names. |
| Students book available slots | Implemented | `backend/src/controllers/interviewController.js`, `frontend/src/pages/Interviews.tsx` | Students must have an eligible application state. |
| Prevent double booking/time conflicts | Implemented | `backend/src/controllers/interviewController.js`, `backend/src/services/schedulingService.js` | Checks slot availability and student overlapping bookings. |
| Calendar view | Implemented | `frontend/src/pages/Interviews.tsx` | List/calendar toggle. |
| Reschedule/cancel slots | Implemented | `backend/src/controllers/interviewController.js`, `frontend/src/pages/Interviews.tsx` | Recruiters can reschedule directly; students can request a new time and the slot changes only after recruiter/officer/admin approval. Confirmation popups added. |
| Status change notifications | Implemented | `backend/src/services/notificationService.js`, `backend/src/controllers/notificationController.js`, `frontend/src/pages/Dashboard.tsx` | Notification records are created and surfaced on dashboard. |
| Deadline reminders | Partially implemented | `backend/src/controllers/notificationController.js` | API hook exists; no scheduled background worker. |
| Interview alerts | Implemented | `backend/src/services/notificationService.js`, `backend/src/controllers/interviewController.js` | Booking, cancel, reschedule, student request, approval, and rejection notifications. |
| Announcement board | Implemented | `backend/src/models/Announcement.js`, `backend/src/controllers/notificationController.js`, `frontend/src/pages/Dashboard.tsx` | Officer/admin can publish via API; dashboard displays active announcements. |
| Overall stats | Implemented | `backend/src/controllers/dashboardController.js`, `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/Analytics.tsx` | Total students, placed students, placement percentage, offers. |
| Company-wise placement data | Implemented | `backend/src/controllers/dashboardController.js`, `frontend/src/pages/Analytics.tsx` | Chart-ready API and bar chart. |
| Branch-wise placement statistics | Implemented | `backend/src/controllers/dashboardController.js`, `frontend/src/pages/Analytics.tsx` | Chart-ready API and pie/progress view. |
| Charts/graphs | Implemented | `frontend/src/pages/Analytics.tsx` | Recharts line, bar, and pie charts. |
| Export reports as PDF/Excel | Partially implemented | `backend/src/controllers/dashboardController.js`, `frontend/src/pages/Analytics.tsx` | CSV export is Excel-compatible; PDF is print-ready HTML. |
| Responsive desktop/tablet/mobile UI | Implemented | `frontend/src/components/DashboardLayout.tsx`, `frontend/src/components/AppSidebar.tsx`, updated pages | Compact sidebar and responsive grids/forms. |
| Clear validation errors | Implemented | `backend/src/services/validationService.js`, `frontend/src/components/jobs/JobFormDialog.tsx`, auth/profile forms | Frontend and backend validation now return/display actionable messages. |
| User-friendly interface | Implemented | `frontend/src/pages/*` | Role-specific navigation, empty states, loading states, readable cards/tables. |
| Passwords hashed/encrypted | Implemented | `backend/src/controllers/authController.js` | `bcrypt.hash(..., 10)` and password excluded by default. |
| 30-minute inactivity/session timeout | Implemented | `backend/src/controllers/authController.js`, `frontend/src/lib/auth-context.tsx` | JWT expires in 30 minutes; frontend logs out after 30 minutes inactivity. |
| Page load/search performance targets | Partially implemented | `backend/src/models/Job.js`, `backend/src/controllers/jobController.js` | Job text index and simple filtering; no formal performance benchmark suite. |
| Data backup/durability strategy | Documented | `README.md` | MongoDB persistence documented; production backup policy remains operational. |
| CGPA constrained to 0.0-4.0 | Implemented | `backend/src/models/User.js`, `backend/src/models/Job.js`, `backend/src/services/validationService.js`, frontend forms | Enforced on profile and job criteria. |

## Test Coverage Summary

- Backend unit tests:
  - `backend/test/eligibilityService.test.js`
  - `backend/test/statusWorkflowService.test.js`
  - `backend/test/validationService.test.js`
  - `backend/test/schedulingService.test.js`
  - `backend/test/roleMiddleware.test.js`
  - `backend/test/authMiddleware.test.js`
  - `backend/test/dashboardReport.test.js`
- Frontend component tests:
  - `frontend/src/test/confirm-dialog.test.tsx`
  - `frontend/src/test/job-form-dialog.test.tsx`
  - Existing job posting validation simulation retained in `frontend/src/test/jobPosting.test.ts`.

Covered behaviors include eligibility calculation, status workflow validation, date/deadline validation, RBAC/auth middleware, interview overlap logic, reschedule request formatting/validation, report statistics, job form validation, manual branch entry, and risky-action confirmation UI.

## UI/UX Improvements Made

- Role-aware sidebar navigation for student, recruiter, officer, and admin.
- Responsive compact sidebar and tighter dashboard padding for smaller screens.
- API-backed applications and interview pages with loading and empty states.
- Interview page now separates confirmed schedules from pending student change requests and gives recruiters approve/reject actions.
- Job posting form now supports manually added eligible branches beyond the default suggestions.
- Interview round field now supports custom/manual round names beyond aptitude, technical, and HR.
- Job cards show eligibility, rejection reasons, applied state, and close confirmation.
- Analytics now uses backend report data and has export buttons.
- Dashboard displays notifications and announcements.
- Forms now show inline validation instead of relying on alerts.

## Security/RBAC Validation Notes

- JWT auth middleware protects application, job, interview, dashboard, and notification endpoints.
- Recruiters can manage only jobs, applications, and interview slots that they created.
- Officer/admin roles can access institutional reports and broader management views.
- Backend rejects invalid job deadlines, CGPA values, duplicate applications, invalid status transitions, and interview conflicts.
- Student interview reschedule requests are stored as pending data first; server-side approval is required before the confirmed interview time changes.
- Passwords are hashed and excluded from normal user queries.

## Risky-Action Popup Coverage

- Close job posting: `frontend/src/pages/Jobs.tsx`
- Withdraw application: `frontend/src/pages/Applications.tsx`
- Reject/change applicant status: `frontend/src/pages/Applications.tsx`
- Cancel interview: `frontend/src/pages/Interviews.tsx`
- Reschedule interview: `frontend/src/pages/Interviews.tsx`
- Student reschedule request: `frontend/src/pages/Interviews.tsx`
- Approve/reject student reschedule request: `frontend/src/pages/Interviews.tsx`
- Book interview slot: `frontend/src/pages/Interviews.tsx`
- Logout with unsaved profile changes: `frontend/src/components/AppSidebar.tsx` with `frontend/src/lib/auth-context.tsx`

## Remaining Gaps and Limitations

- SMTP email delivery is not wired; verification token support is implemented and documented.
- Deadline reminders are exposed as an API action but are not run by a scheduled worker.
- Excel export is CSV-compatible rather than native XLSX.
- PDF export is print-ready HTML rather than binary PDF generation.
- Formal accessibility and performance benchmarking are not automated beyond component tests and responsive layout changes.
