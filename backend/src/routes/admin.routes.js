const express = require('express');
const router  = express.Router();
const {
  getStats, getStudents, approveStudent, rejectStudent, bulkApproveStudents,
  getCompanies, approveCompany, rejectCompany,
  getAllDrives, adminUpdateDrive, setDriveInstructions,
  getPlacedStudents, sendSelectionEmail, getAnalytics,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

// Stats & analytics
router.get('/stats',      getStats);
router.get('/analytics',  getAnalytics);

// Students — approval management
router.get('/students',                  getStudents);
router.put('/students/:id/approve',      approveStudent);
router.put('/students/:id/reject',       rejectStudent);
router.post('/students/bulk-approve',    bulkApproveStudents);

// Companies
router.get('/companies',               getCompanies);
router.put('/companies/:id/approve',   approveCompany);
router.put('/companies/:id/reject',    rejectCompany);

// Drives
router.get('/drives',                  getAllDrives);
router.put('/drives/:id',              adminUpdateDrive);
router.put('/drives/:id/instructions', setDriveInstructions);

// Placements & emails
router.get('/placed-students',         getPlacedStudents);
router.post('/send-selection-email',   sendSelectionEmail);

module.exports = router;