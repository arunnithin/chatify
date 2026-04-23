const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('user_online', async (userId) => {
      socket.join(userId);
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit('user_status_change', { userId, isOnline: true });
    });

    socket.on('join_chat', (chatId) => socket.join(chatId));
    socket.on('leave_chat', (chatId) => socket.leave(chatId));

    // ⌨️ Typing indicator
    socket.on('typing_start', ({ chatId, userId, userName }) => {
      socket.to(chatId).emit('typing_start', { userId, userName });
    });

    socket.on('typing_stop', ({ chatId, userId }) => {
      socket.to(chatId).emit('typing_stop', { userId });
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, senderId, text, type } = data;
        const message = await Message.create({
          chatId, sender: senderId, text, type: type || 'text',
        });
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });
        const fullMessage = await Message.findById(message._id)
          .populate('sender', 'name profilePic');
        io.to(chatId).emit('receive_message', fullMessage);
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};