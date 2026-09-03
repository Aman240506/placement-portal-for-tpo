const { z } = require('zod');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Zod validation middleware factory.
 * Usage: router.post('/register', validate(schemas.register), controller)
 */
const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      const message    = `${firstError.path.join('.')}: ${firstError.message}`;
      logger.warn('Validation failed', {
        path:   req.originalUrl,
        errors: result.error.issues,
        body:   req.body,
      });
      return errorResponse(res, message, 422);
    }
    // Replace req.body with parsed + coerced data
    req.body = result.data;
    next();
  } catch (err) {
    logger.error('Validation middleware error', { error: err.message });
    return errorResponse(res, 'Validation error', 500);
  }
};

// ── Schemas ────────────────────────────────────────────────────────────────
const schemas = {

  register: z.object({
    email:        z.string().email('Invalid email address'),
    password:     z.string().min(6, 'Password must be at least 6 characters'),
    role:         z.enum(['student', 'recruiter'], { errorMap: () => ({ message: 'Role must be student or recruiter' }) }),
    // Student fields
    full_name:    z.string().min(2, 'Full name must be at least 2 characters').optional(),
    branch:       z.enum(['CS','IT','ENTC','Mechanical','Civil','Electrical','Chemical']).optional(),
    year:         z.coerce.number().int().min(1).max(4).optional(),
    cgpa:         z.coerce.number().min(0).max(10).optional(),
    roll_number:  z.string().optional(),
    // Recruiter fields
    company_name: z.preprocess(
      (value) => value === '' ? undefined : value,
      z.string().min(2, 'Company name required').optional()
    ),
    designation:  z.string().optional(),
    phone:        z.string().optional(),
  }),

  login: z.object({
    email:    z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  updateProfile: z.object({
    full_name:    z.string().min(2).optional(),
    phone:        z.string().regex(/^[+\d\s-]{7,15}$/, 'Invalid phone number').optional().or(z.literal('')),
    branch:       z.enum(['CS','IT','ENTC','Mechanical','Civil','Electrical','Chemical']).optional(),
    year:         z.coerce.number().int().min(1).max(4).optional(),
    cgpa:         z.coerce.number().min(0, 'CGPA cannot be negative').max(10, 'CGPA cannot exceed 10').optional(),
    backlogs:     z.coerce.number().int().min(0).optional(),
    linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    github_url:   z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    roll_number:  z.string().optional(),
  }),

  createDrive: z.object({
    title:                z.string().min(3, 'Title must be at least 3 characters'),
    description:          z.string().optional(),
    required_skills:      z.array(z.string()).min(1, 'Add at least one required skill'),
    min_cgpa:             z.coerce.number().min(0).max(10),
    allowed_branches:     z.array(z.string()).default([]),
    max_backlogs:         z.coerce.number().int().min(0).default(0),
    ctc_lpa:              z.coerce.number().min(0).optional().nullable(),
    application_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    drive_date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  }),

  updateDriveStatus: z.object({
    status: z.enum(['open', 'closed', 'completed']),
    tpo_instructions: z.string().optional(),
  }),

  sendEmail: z.object({
    student_id:     z.coerce.number().int().positive(),
    drive_id:       z.coerce.number().int().positive(),
    custom_message: z.string().max(1000).optional(),
  }),

  interviewPrep: z.object({
    drive_id: z.coerce.number().int().positive('Invalid drive ID'),
  }),
};

module.exports = { validate, schemas };