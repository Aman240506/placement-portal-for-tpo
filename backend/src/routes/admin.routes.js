const express = require('express');
const router = express.Router();
const { getStats, getStudents, getCompanies, approveCompany, getAllDrives } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/students', getStudents);
router.get('/companies', getCompanies);
router.put('/companies/:id/approve', approveCompany);
router.get('/drives', getAllDrives);

module.exports = router;