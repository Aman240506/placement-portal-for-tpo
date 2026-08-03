const express = require('express');
const router  = express.Router();
const {
  getStats, getStudents, approveStudent, rejectStudent,
  getCompanies, approveCompany, rejectCompany,
  getAllDrives, adminUpdateDrive, setDriveInstructions,
  getPlacedStudents, sendSelectionEmail, getAnalytics,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

// Stats & analytics
router.get('/stats',      getStats);
router.get('/analytics',  getAnalytics);

// Students
router.get('/students',                getStudents);
router.put('/students/:id/approve',    approveStudent);
router.put('/students/:id/reject',     rejectStudent);

// Companies
router.get('/companies',               getCompanies);
router.put('/companies/:id/approve',   approveCompany);
router.put('/companies/:id/reject',    rejectCompany);

// Drives — admin can close/update any drive
router.get('/drives',                  getAllDrives);
router.put('/drives/:id',              adminUpdateDrive);
router.put('/drives/:id/instructions', setDriveInstructions);

// Placements
router.get('/placed-students',         getPlacedStudents);
router.post('/send-selection-email',   sendSelectionEmail);

module.exports = router;