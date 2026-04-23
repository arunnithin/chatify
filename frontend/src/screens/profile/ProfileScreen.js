import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import { colors } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {user?.profilePic
          ? <Image source={{ uri: user.profilePic }} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
            </View>
        }
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: 80 },
  avatarContainer: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  email: { fontSize: 14, color: colors.subtext },
  logoutBtn: { backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48 },
  logoutText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});