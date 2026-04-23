const express = require('express');
const router = express.Router();
const { register, login, searchUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/users', protect, searchUsers);

module.exports = router;