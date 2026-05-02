const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildInterviewWindow,
  formatInterviewForClient,
  hasTimeConflict,
  rangesOverlap,
} = require("../src/services/schedulingService");

test("rangesOverlap detects overlapping interview windows", () => {
  assert.equal(
    rangesOverlap(
      "2026-06-01T10:00:00.000Z",
      "2026-06-01T11:00:00.000Z",
      "2026-06-01T10:30:00.000Z",
      "2026-06-01T11:30:00.000Z"
    ),
    true
  );
  assert.equal(
    rangesOverlap(
      "2026-06-01T10:00:00.000Z",
      "2026-06-01T11:00:00.000Z",
      "2026-06-01T11:00:00.000Z",
      "2026-06-01T12:00:00.000Z"
    ),
    false
  );
});

test("hasTimeConflict ignores cancelled slots and excluded slots", () => {
  const slots = [
    { id: "a", startAt: "2026-06-01T10:00:00.000Z", endAt: "2026-06-01T11:00:00.000Z", status: "scheduled" },
    { id: "b", startAt: "2026-06-01T10:30:00.000Z", endAt: "2026-06-01T11:30:00.000Z", status: "cancelled" },
  ];

  assert.equal(hasTimeConflict(slots, "2026-06-01T10:15:00.000Z", "2026-06-01T10:45:00.000Z"), true);
  assert.equal(hasTimeConflict(slots, "2026-06-01T10:15:00.000Z", "2026-06-01T10:45:00.000Z", "a"), false);
});

test("buildInterviewWindow calculates end time from duration", () => {
  const window = buildInterviewWindow("2026-06-01T10:00:00.000Z", 45);
  assert.equal(window.startAt.toISOString(), "2026-06-01T10:00:00.000Z");
  assert.equal(window.endAt.toISOString(), "2026-06-01T10:45:00.000Z");
});

test("formatInterviewForClient exposes pending student reschedule requests", () => {
  const formatted = formatInterviewForClient({
    _id: "slot-1",
    jobId: { _id: "job-1", title: "Frontend Engineer", company: "Systems Limited" },
    bookedBy: { _id: "student-1", name: "Ayesha Khan" },
    startAt: "2026-06-01T10:00:00.000Z",
    endAt: "2026-06-01T11:00:00.000Z",
    type: "Group Discussion",
    status: "scheduled",
    location: "Karachi office",
    rescheduleRequest: {
      requestedBy: { _id: "student-1", name: "Ayesha Khan" },
      startAt: "2026-06-02T10:00:00.000Z",
      endAt: "2026-06-02T11:00:00.000Z",
      durationMinutes: 60,
      reason: "University exam",
      status: "pending",
      requestedAt: "2026-05-20T09:00:00.000Z",
    },
  });

  assert.equal(formatted.rescheduleRequest.status, "pending");
  assert.equal(formatted.rescheduleRequest.requestedBy, "student-1");
  assert.equal(formatted.rescheduleRequest.reason, "University exam");
  assert.equal(formatted.type, "Group Discussion");
});
