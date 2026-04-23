const Message = require('../models/Message');
const Chat = require('../models/Chat');

// GET /api/messages/:chatId
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate('sender', 'name profilePic')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;

    const message = await Message.create({
      chatId,
      sender: req.user._id,
      text,
      type: 'text',
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    const fullMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePic');

    res.status(201).json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};