const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canTransitionStatus,
  validateStatusTransition,
} = require("../src/services/statusWorkflowService");

test("workflow allows valid adjacent status transitions", () => {
  assert.equal(canTransitionStatus("Applied", "Shortlisted"), true);
  assert.equal(canTransitionStatus("Shortlisted", "Interview Scheduled"), true);
  assert.equal(canTransitionStatus("Interview Scheduled", "Selected"), true);
});

test("workflow blocks invalid jumps such as Applied directly to Selected", () => {
  const result = validateStatusTransition("Applied", "Selected");
  assert.equal(result.valid, false);
  assert.match(result.message, /Cannot move from Applied to Selected/);
});

test("terminal statuses cannot be changed", () => {
  const result = validateStatusTransition("Rejected", "Selected");
  assert.equal(result.valid, false);
  assert.match(result.message, /terminal status/);
});
