const APPLICATION_STATUSES = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
  "Withdrawn",
];

const STATUS_TRANSITIONS = {
  Applied: ["Shortlisted", "Rejected", "Withdrawn"],
  Shortlisted: ["Interview Scheduled", "Rejected", "Withdrawn"],
  "Interview Scheduled": ["Selected", "Rejected", "Withdrawn"],
  Selected: [],
  Rejected: [],
  Withdrawn: [],
};

function isKnownStatus(status) {
  return APPLICATION_STATUSES.includes(status);
}

function getAllowedNextStatuses(status) {
  return STATUS_TRANSITIONS[status] || [];
}

function canTransitionStatus(currentStatus, nextStatus) {
  if (!isKnownStatus(currentStatus) || !isKnownStatus(nextStatus)) return false;
  if (currentStatus === nextStatus) return true;
  return getAllowedNextStatuses(currentStatus).includes(nextStatus);
}

function validateStatusTransition(currentStatus, nextStatus) {
  if (!isKnownStatus(nextStatus)) {
    return {
      valid: false,
      message: "Invalid status value",
    };
  }

  if (canTransitionStatus(currentStatus, nextStatus)) {
    return { valid: true, message: null };
  }

  const allowed = getAllowedNextStatuses(currentStatus);
  return {
    valid: false,
    message: allowed.length
      ? `Cannot move from ${currentStatus} to ${nextStatus}. Allowed next statuses: ${allowed.join(", ")}`
      : `${currentStatus} is a terminal status and cannot be changed`,
  };
}

module.exports = {
  APPLICATION_STATUSES,
  STATUS_TRANSITIONS,
  canTransitionStatus,
  getAllowedNextStatuses,
  validateStatusTransition,
};
