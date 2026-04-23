import { useState, useEffect } from 'react';
import api from '../services/api';

const globalState = {
  chats: [],
  activeChat: null,
  messages: [],
  isLoading: false,
  unreadCounts: {}, // { chatId: count }
};

const listeners = new Set();

function setGlobalState(updates) {
  Object.assign(globalState, updates);
  listeners.forEach(fn => fn({ ...globalState }));
}

export default function useChatStore() {
  const [state, setState] = useState({ ...globalState });

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  const fetchChats = async () => {
    setGlobalState({ isLoading: true });
    try {
      const { data } = await api.get('/chats');
      setGlobalState({ chats: data, isLoading: false });
    } catch (e) {
      console.log('fetchChats error:', e);
      setGlobalState({ isLoading: false });
    }
  };

  const setActiveChat = (chat) => {
    // Clear unread count when opening chat
    const newCounts = { ...globalState.unreadCounts };
    delete newCounts[chat._id];
    setGlobalState({ activeChat: chat, messages: [], unreadCounts: newCounts });
  };

  const fetchMessages = async (chatId) => {
    setGlobalState({ isLoading: true });
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      setGlobalState({ messages: data, isLoading: false });
    } catch (e) {
      console.log('fetchMessages error:', e);
      setGlobalState({ isLoading: false });
    }
  };

  const addMessage = (message) => {
    setGlobalState({ messages: [...globalState.messages, message] });
  };

  const incrementUnread = (chatId) => {
    const newCounts = { ...globalState.unreadCounts };
    newCounts[chatId] = (newCounts[chatId] || 0) + 1;
    setGlobalState({ unreadCounts: newCounts });
  };

  const updateChatLastMessage = (chatId, message) => {
    setGlobalState({
      chats: globalState.chats.map(c =>
        c._id === chatId ? { ...c, lastMessage: message } : c
      ),
    });
  };

  return {
    ...state,
    fetchChats,
    setActiveChat,
    fetchMessages,
    addMessage,
    updateChatLastMessage,
    incrementUnread,
  };
}