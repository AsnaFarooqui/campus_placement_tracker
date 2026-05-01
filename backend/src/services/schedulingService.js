function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function rangesOverlap(startA, endA, startB, endB) {
  const aStart = toDate(startA);
  const aEnd = toDate(endA);
  const bStart = toDate(startB);
  const bEnd = toDate(endB);

  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
}

function buildInterviewWindow(startAt, durationMinutes = 60) {
  const start = toDate(startAt);
  if (!start) {
    return { startAt: null, endAt: null };
  }

  return {
    startAt: start,
    endAt: addMinutes(start, durationMinutes),
  };
}

function hasTimeConflict(slots, startAt, endAt, excludeId = null) {
  return slots.some((slot) => {
    if (excludeId && String(slot._id || slot.id) === String(excludeId)) return false;
    if (slot.status === "cancelled") return false;
    return rangesOverlap(startAt, endAt, slot.startAt, slot.endAt);
  });
}

function formatInterviewForClient(slot) {
  const job = slot.jobId || {};
  const startAt = new Date(slot.startAt);
  const bookedBy = slot.bookedBy || {};

  return {
    id: String(slot._id),
    jobId: String(job._id || slot.jobId || ""),
    jobTitle: job.title || "Unknown Job",
    company: job.company || "Unknown Company",
    date: startAt.toISOString().slice(0, 10),
    time: startAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    startAt: startAt.toISOString(),
    endAt: new Date(slot.endAt).toISOString(),
    type: slot.type,
    status: slot.status,
    candidate: bookedBy.name || undefined,
    bookedBy: bookedBy._id ? String(bookedBy._id) : null,
    interviewer: slot.interviewer,
    location: slot.location,
  };
}

module.exports = {
  addMinutes,
  buildInterviewWindow,
  formatInterviewForClient,
  hasTimeConflict,
  rangesOverlap,
};
