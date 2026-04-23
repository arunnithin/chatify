const express = require('express');
const router = express.Router();
const { getChats, createOrOpenChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getChats);
router.post('/', protect, createOrOpenChat);

module.exports = router;