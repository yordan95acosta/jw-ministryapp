import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from './context/ProfileContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, logout } = useProfile();

  const handleLogout = () => {
    Alert.alert(
      'Switch Profile',
      'Are you sure you want to switch to a different profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.profileName}>
          {profile?.name ? profile.name.charAt(0).toUpperCase() + profile.name.slice(1) : 'Unknown'}
        </Text>
        <Text style={styles.profileSubtext}>Your personal ministry tracker</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/settings')}>
          <View style={styles.actionIcon}>
            <Ionicons name="flag" size={24} color="#e94560" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Monthly Goals</Text>
            <Text style={styles.actionSubtitle}>Set your hour targets</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/history')}>
          <View style={styles.actionIcon}>
            <Ionicons name="time" size={24} color="#0f3460" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionSubtitle}>View past months</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/export')}>
          <View style={styles.actionIcon}>
            <Ionicons name="cloud-upload" size={24} color="#4caf50" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Backup & Restore</Text>
            <Text style={styles.actionSubtitle}>Export or import data</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="swap-horizontal" size={24} color="#e94560" />
        <Text style={styles.logoutText}>Switch Profile</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Each profile has separate data.{'\n'}
        Your hours and studies are private.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e94560',
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
});
