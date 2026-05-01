const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  closeJob,
  applyToJob,
  getRecruiterDashboard,
} = require('../controllers/jobController');

router.get('/', authMiddleware, getJobs);
router.get('/dashboard/recruiter', authMiddleware, roleMiddleware('recruiter', 'officer', 'admin'), getRecruiterDashboard);
router.get('/:id', authMiddleware, getJobById);
router.post('/', authMiddleware, roleMiddleware('recruiter', 'officer', 'admin'), createJob);
router.put('/:id', authMiddleware, roleMiddleware('recruiter', 'officer', 'admin'), updateJob);
router.patch('/:id/close', authMiddleware, roleMiddleware('recruiter', 'officer', 'admin'), closeJob);
router.post('/:id/apply', authMiddleware, roleMiddleware('student'), applyToJob);

module.exports = router;
