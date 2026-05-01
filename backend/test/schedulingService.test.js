const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildInterviewWindow,
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
