const express = require('express');
const router  = express.Router();
const {
  getProfile, updateProfile, uploadResume,
  getResume, getApplications, getSkills, getATSScore,
} = require('../controllers/student.controller');
const { protect, authorize, requireApproved } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect, authorize('student'));

// These work even if not approved (student needs to see their status)
router.get('/profile',  getProfile);
router.put('/profile',  validate(schemas.updateProfile), updateProfile);

// These require TPO approval
router.post('/resume',      requireApproved, upload.single('resume'), uploadResume);
router.get('/resume',       requireApproved, getResume);
router.get('/applications', requireApproved, getApplications);
router.get('/skills',       requireApproved, getSkills);
router.get('/ats-check',    requireApproved, getATSScore);

module.exports = router;