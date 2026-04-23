import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import { connectSocket, emitSocket, onSocket, offSocket } from '../../services/socket';
import { colors } from '../../theme/colors';

export default function ChatScreen({ route, navigation }) {
  const { chat } = route.params;
  const { messages, fetchMessages, addMessage, updateChatLastMessage, isLoading } = useChatStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  const otherMember = chat.members.find((m) => m._id !== user._id);

  useEffect(() => {
  fetchMessages(chat._id);
  connectSocket(user._id);
  emitSocket('join_chat', chat._id);

  onSocket('receive_message', (message) => {
    addMessage(message);
    updateChatLastMessage(chat._id, message);
  });

  const unsubscribe = navigation.addListener('beforeRemove', () => {
    emitSocket('leave_chat', chat._id);
    offSocket('receive_message');
  });

  return unsubscribe;
}, []);
  const sendMessage = () => {
  if (!text.trim()) return;
  const messageData = {
    chatId: chat._id,
    sender: user,
    text: text.trim(),
    type: 'text',
    createdAt: new Date().toISOString(),
  };
  addMessage(messageData);
  updateChatLastMessage(chat._id, messageData);
  setText('');
  emitSocket('send_message', { ...messageData, senderId: user._id });
};

  const renderMessage = ({ item }) => {
    const isMe = item.sender?._id === user._id || item.sender === user._id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, !isMe && styles.theirTimeText]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherMember?.name}</Text>
          <Text style={styles.headerStatus}>
            {otherMember?.isOnline ? '🟢 Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {isLoading
        ? <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        : <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
      }

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingTop: 54, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 22, color: colors.primary },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerStatus: { fontSize: 12, color: colors.subtext },
  messageList: { padding: 16, paddingBottom: 8 },
  messageBubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15 },
  myText: { color: colors.white },
  theirText: { color: colors.text },
  timeText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end', marginTop: 3 },
  theirTimeText: { color: colors.subtext },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendBtn: { marginLeft: 10, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: colors.white, fontSize: 18 },
});