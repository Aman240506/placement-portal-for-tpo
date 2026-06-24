const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadResume, getResume, getApplications } = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(protect, authorize('student'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume', upload.single('resume'), uploadResume);
router.get('/resume', getResume);
router.get('/applications', getApplications);

module.exports = router;