function getEligibilityResult(student, job) {
  const reasons = [];

  if (!student) {
    reasons.push('Student profile not found');
    return { eligible: false, reasons };
  }

  if (student.role !== 'student') {
    reasons.push('Only students can apply');
  }

  if (typeof student.cgpa !== 'number') {
    reasons.push('Student CGPA is missing');
  } else if (student.cgpa < job.minCGPA) {
    reasons.push(`Minimum CGPA required is ${job.minCGPA}`);
  }

  if (typeof student.backlogs !== 'number') {
    reasons.push('Student backlog information is missing');
  } else if (student.backlogs > job.maxBacklogs) {
    reasons.push(`Maximum allowed backlogs is ${job.maxBacklogs}`);
  }

  if (Array.isArray(job.allowedBranches) && job.allowedBranches.length > 0) {
    if (!student.branch || !job.allowedBranches.includes(student.branch)) {
      reasons.push('Your branch is not eligible for this job');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

module.exports = {
  getEligibilityResult,
};
