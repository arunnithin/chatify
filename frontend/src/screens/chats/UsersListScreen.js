import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Image
} from 'react-native';
import api from '../../services/api';
import useChatStore from '../../store/useChatStore';
import { colors } from '../../theme/colors';

export default function UsersListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveChat } = useChatStore();

  const searchUsers = async (text) => {
  setSearch(text);
  if (!text.trim()) return setUsers([]);
  setIsLoading(true);
  try {
    const { data } = await api.get(`/auth/users?search=${text}`);
    console.log('Search results:', JSON.stringify(data));
    setUsers(data);
  } catch (error) {
    console.log('Search error:', error.response?.data || error.message);
  }
  setIsLoading(false);
};

  const openChat = async (userId) => {
    try {
      const { data } = await api.post('/chats', { userId });
      setActiveChat(data);
      navigation.navigate('Chat', { chat: data });
    } catch (error) {
      console.log('Open chat error:', error);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => openChat(item._id)}>
      <View style={styles.avatar}>
        {item.profilePic
          ? <Image source={{ uri: item.profilePic }} style={styles.avatarImg} />
          : <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
        }
      </View>
      <View>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Chat</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or email..."
        placeholderTextColor={colors.subtext}
        value={search}
        onChangeText={searchUsers}
        autoFocus
      />

      {isLoading
        ? <ActivityIndicator style={{ marginTop: 30 }} color={colors.primary} />
        : <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            ListEmptyComponent={
              search.length > 0
                ? <Text style={styles.empty}>No users found</Text>
                : <Text style={styles.empty}>Search for someone to chat with</Text>
            }
          />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 22, color: colors.primary, marginRight: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  searchInput: { margin: 16, backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.white, marginBottom: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarImg: { width: 46, height: 46, borderRadius: 23 },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  userEmail: { fontSize: 13, color: colors.subtext },
  empty: { textAlign: 'center', color: colors.subtext, marginTop: 40, fontSize: 15 },
});