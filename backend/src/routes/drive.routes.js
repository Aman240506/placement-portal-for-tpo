const express = require('express');
const router  = express.Router();
const {
  getEligibleDrives, getDrive, applyToDrive,
  getMyDrives, createDrive, getDriveApplicants, updateDrive,
} = require('../controllers/drive.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, schemas }  = require('../middleware/validate.middleware');

// Student routes
router.get('/eligible',       protect, authorize('student'),   getEligibleDrives);
router.post('/:id/apply',     protect, authorize('student'),   applyToDrive);

// Recruiter routes
router.get('/my',             protect, authorize('recruiter'), getMyDrives);
router.post('/',              protect, authorize('recruiter'), validate(schemas.createDrive), createDrive);
router.get('/:id/applicants', protect, authorize('recruiter'), getDriveApplicants);
router.put('/:id',            protect, authorize('recruiter', 'admin'), updateDrive);

// Shared
router.get('/:id',            protect, getDrive);

module.exports = router;