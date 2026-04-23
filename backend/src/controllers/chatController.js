const Chat = require('../models/Chat');
const User = require('../models/User');

// GET /api/chats — get all chats for logged in user
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', '-password')
      .populate('lastMessage')
      .populate('admin', '-password')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/chats — create or open a one-to-one chat
exports.createOrOpenChat = async (req, res) => {
  try {
    const { userId } = req.body;

    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId] },
    })
      .populate('members', '-password')
      .populate('lastMessage');

    if (chat) return res.json(chat);

    chat = await Chat.create({
      isGroup: false,
      members: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(chat._id).populate('members', '-password');
    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};