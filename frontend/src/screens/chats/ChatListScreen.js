import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image
} from 'react-native';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';
import { colors } from '../../theme/colors';

export default function ChatListScreen({ navigation }) {
  const { chats, fetchChats, isLoading, setActiveChat } = useChatStore();
  const { user } = useAuthStore();

useEffect(() => {
  fetchChats();
  const unsubscribe = navigation.addListener('focus', () => {
    fetchChats();
  });
  return unsubscribe;
}, [navigation]);
  const getOtherMember = (chat) =>
    chat.members.find((m) => m._id !== user._id);

  const openChat = (chat) => {
    setActiveChat(chat);
    navigation.navigate('Chat', { chat });
  };

  const renderItem = ({ item }) => {
    const other = getOtherMember(item);
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
        <View style={styles.avatar}>
          {other?.profilePic
            ? <Image source={{ uri: other.profilePic }} style={styles.avatarImg} />
            : <Text style={styles.avatarText}>{other?.name?.[0]?.toUpperCase()}</Text>
          }
          {other?.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{other?.name || 'Unknown'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.text || 'Start a conversation'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Chats</Text>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => navigation.navigate('UsersList')}
        >
          <Text style={styles.newChatText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        : <FlatList
            data={chats}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.empty}>No chats yet. Start a conversation!</Text>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  header: { fontSize: 26, fontWeight: '700', color: colors.text },
  newChatBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  newChatText: { fontSize: 16 },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, marginBottom: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14, position: 'relative' },
  avatarImg: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: colors.white },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  lastMessage: { fontSize: 13, color: colors.subtext },
  empty: { textAlign: 'center', color: colors.subtext, marginTop: 60, fontSize: 15 },
});