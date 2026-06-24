const express = require('express');
const router = express.Router();
const { getEligibleDrives, getDrive, applyToDrive, getMyDrives, createDrive, getDriveApplicants } = require('../controllers/drive.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Student routes
router.get('/eligible', protect, authorize('student'), getEligibleDrives);
router.post('/:id/apply', protect, authorize('student'), applyToDrive);

// Recruiter routes
router.get('/my', protect, authorize('recruiter'), getMyDrives);
router.post('/', protect, authorize('recruiter'), createDrive);
router.get('/:id/applicants', protect, authorize('recruiter'), getDriveApplicants);

// Shared
router.get('/:id', protect, getDrive);

module.exports = router;