import { useState, useEffect } from 'react';
import api from '../services/api';

const globalState = {
  chats: [],
  activeChat: null,
  messages: [],
  isLoading: false,
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
    setGlobalState({ activeChat: chat, messages: [] });
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
  };
}