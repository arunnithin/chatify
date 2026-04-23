const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    chatName: { type: String, trim: true },
    chatImage: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);