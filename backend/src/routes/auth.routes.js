const express = require('express');
const router  = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect }                = require('../middleware/auth.middleware');
const { validate, schemas }      = require('../middleware/validate.middleware');

router.post('/register', validate(schemas.register), register);
router.post('/login',    validate(schemas.login),    login);
router.get('/me',        protect,                    getMe);

module.exports = router;