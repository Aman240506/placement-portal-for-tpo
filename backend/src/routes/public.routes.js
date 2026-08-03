const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ── PUBLIC PLACEMENT STATS PAGE ────────────────────────────────────────────
// No authentication required — this is a public-facing page
// GET /api/public/stats — overall placement statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalStudents,
      totalPlaced,
      totalCompanies,
      totalDrives,
      avgCtc,
      topCompanies,
      branchStats,
      recentPlacements,
      monthlyTrend,
    ] = await Promise.all([

      pool.query(`SELECT COUNT(*) FROM students`),

      pool.query(`
        SELECT COUNT(DISTINCT student_id) FROM applications WHERE status = 'selected'
      `),

      pool.query(`SELECT COUNT(*) FROM companies WHERE is_approved = true`),

      pool.query(`SELECT COUNT(*) FROM job_drives`),

      pool.query(`
        SELECT ROUND(AVG(jd.ctc_lpa)::numeric, 2) as avg_ctc,
               MAX(jd.ctc_lpa) as max_ctc
        FROM applications a
        JOIN job_drives jd ON a.drive_id = jd.id
        WHERE a.status = 'selected' AND jd.ctc_lpa IS NOT NULL
      `),

      // Top hiring companies
      pool.query(`
        SELECT c.name, COUNT(a.student_id) as hired_count, MAX(jd.ctc_lpa) as max_ctc
        FROM applications a
        JOIN job_drives jd ON a.drive_id = jd.id
        JOIN companies c ON jd.company_id = c.id
        WHERE a.status = 'selected'
        GROUP BY c.name
        ORDER BY hired_count DESC
        LIMIT 8
      `),

      // Branch-wise placement stats
      pool.query(`
        SELECT s.branch,
               COUNT(DISTINCT s.id) as total_students,
               COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN s.id END) as placed_students,
               ROUND(AVG(CASE WHEN a.status = 'selected' THEN jd.ctc_lpa END)::numeric, 2) as avg_ctc
        FROM students s
        LEFT JOIN applications a ON a.student_id = s.id
        LEFT JOIN job_drives jd ON a.drive_id = jd.id
        WHERE s.branch IS NOT NULL
        GROUP BY s.branch
        ORDER BY placed_students DESC
      `),

      // Recent placements (public info only)
      pool.query(`
        SELECT s.full_name, s.branch, c.name as company_name,
               jd.title as role, jd.ctc_lpa
        FROM applications a
        JOIN students s ON a.student_id = s.id
        JOIN job_drives jd ON a.drive_id = jd.id
        JOIN companies c ON jd.company_id = c.id
        WHERE a.status = 'selected'
        ORDER BY a.applied_at DESC
        LIMIT 10
      `),

      // Monthly placement trend
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', a.applied_at), 'Mon YY') as month,
               COUNT(*) as placements
        FROM applications a
        WHERE a.status = 'selected'
        GROUP BY DATE_TRUNC('month', a.applied_at)
        ORDER BY DATE_TRUNC('month', a.applied_at)
        LIMIT 12
      `),
    ]);

    const placed      = parseInt(totalPlaced.rows[0].count);
    const students    = parseInt(totalStudents.rows[0].count);
    const placementRate = students > 0 ? Math.round((placed / students) * 100) : 0;

    return successResponse(res, {
      summary: {
        total_students:   students,
        total_placed:     placed,
        placement_rate:   placementRate,
        total_companies:  parseInt(totalCompanies.rows[0].count),
        total_drives:     parseInt(totalDrives.rows[0].count),
        avg_ctc:          parseFloat(avgCtc.rows[0]?.avg_ctc) || 0,
        highest_ctc:      parseFloat(avgCtc.rows[0]?.max_ctc) || 0,
      },
      top_companies:      topCompanies.rows,
      branch_stats:       branchStats.rows,
      recent_placements:  recentPlacements.rows,
      monthly_trend:      monthlyTrend.rows,
    });
  } catch (err) {
    console.error('Public stats error:', err.message);
    return errorResponse(res, 'Failed to get stats', 500);
  }
});

// GET /api/public/drives — open drives (public listing, no auth)
router.get('/drives', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT jd.id, jd.title, jd.description, jd.required_skills,
             jd.min_cgpa, jd.ctc_lpa, jd.application_deadline,
             jd.allowed_branches, jd.status,
             c.name as company_name, c.domain,
             COUNT(a.id) as applicant_count
      FROM job_drives jd
      JOIN companies c ON jd.company_id = c.id
      LEFT JOIN applications a ON a.drive_id = jd.id
      WHERE jd.status = 'open'
        AND jd.application_deadline >= CURRENT_DATE
        AND c.is_approved = true
      GROUP BY jd.id, c.name, c.domain
      ORDER BY jd.created_at DESC
      LIMIT 20
    `);
    return successResponse(res, result.rows);
  } catch (err) {
    return errorResponse(res, 'Failed to get drives', 500);
  }
});

module.exports = router;