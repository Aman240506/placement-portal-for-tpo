const express = require('express');
const router  = express.Router();
const {
  getProfile, updateProfile, uploadResume,
  getResume, getApplications, getSkills, getATSScore,
} = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, schemas }  = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect, authorize('student'));

router.get('/profile',      getProfile);
router.put('/profile',      validate(schemas.updateProfile), updateProfile);
router.post('/resume',      upload.single('resume'), uploadResume);
router.get('/resume',       getResume);
router.get('/applications', getApplications);
router.get('/skills',       getSkills);
router.get('/ats-check',    getATSScore);

module.exports = router;