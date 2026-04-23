import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  const otherMember = chat.members.find((m) => m._id !== user._id);

  // Animate typing dots
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotAnim.stopAnimation();
      dotAnim.setValue(0);
    }
  }, [isTyping]);

  useEffect(() => {
    fetchMessages(chat._id);
    connectSocket(user._id);
    emitSocket('join_chat', chat._id);

    onSocket('receive_message', (message) => {
      addMessage(message);
      updateChatLastMessage(chat._id, message);
    });

    onSocket('typing_start', ({ userId, userName }) => {
      if (userId !== user._id) {
        setIsTyping(true);
        setTypingUser(userName);
      }
    });

    onSocket('typing_stop', ({ userId }) => {
      if (userId !== user._id) {
        setIsTyping(false);
        setTypingUser('');
      }
    });

    onSocket('user_status_change', ({ userId, isOnline }) => {
      // status updates handled globally
    });

    const unsubscribe = navigation.addListener('beforeRemove', () => {
      emitSocket('leave_chat', chat._id);
      emitSocket('typing_stop', { chatId: chat._id, userId: user._id });
      offSocket('receive_message');
      offSocket('typing_start');
      offSocket('typing_stop');
    });

    return unsubscribe;
  }, []);

  const handleTextChange = (value) => {
    setText(value);

    // Emit typing start
    emitSocket('typing_start', {
      chatId: chat._id,
      userId: user._id,
      userName: user.name,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitSocket('typing_stop', { chatId: chat._id, userId: user._id });
    }, 2000);
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    // Stop typing indicator
    emitSocket('typing_stop', { chatId: chat._id, userId: user._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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
            {isTyping ? `${typingUser} is typing...` : otherMember?.isOnline ? '🟢 Online' : 'Offline'}
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
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>
                    {typingUser} is typing
                  </Text>
                  <Animated.Text style={[styles.typingDots, { opacity: dotAnim }]}>
                    {' '}...
                  </Animated.Text>
                </View>
              ) : null
            }
          />
      }

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.subtext}
          value={text}
          onChangeText={handleTextChange}
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
  typingBubble: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.white, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  typingText: { fontSize: 13, color: colors.subtext, fontStyle: 'italic' },
  typingDots: { fontSize: 13, color: colors.subtext, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendBtn: { marginLeft: 10, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: colors.white, fontSize: 18 },
});