import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../src/context/ProfileContext';
import { getProfiles, createProfile, verifyPin, Profile } from '../src/services/localStorage';

export default function LoginScreen() {
  const router = useRouter();
  const { setProfile } = useProfile();
  const [mode, setMode] = useState<'select' | 'create' | 'login'>('select');
  const [existingProfiles, setExistingProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const profiles = await getProfiles();
      setExistingProfiles(profiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      Alert.alert('Error', 'PIN must be 4-6 digits');
      return;
    }

    setSubmitting(true);
    try {
      const profile = await createProfile(name.trim(), pin);
      if (profile) {
        setProfile({ id: profile.id, name: profile.name });
        router.replace('/home');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!selectedProfile) {
      Alert.alert('Error', 'Please select a profile');
      return;
    }
    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setSubmitting(true);
    try {
      const isValid = await verifyPin(selectedProfile.id, pin);
      if (isValid) {
        setProfile({ id: selectedProfile.id, name: selectedProfile.name });
        router.replace('/home');
      } else {
        Alert.alert('Error', 'Incorrect PIN');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to login');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="book" size={64} color="#e94560" />
          <Text style={styles.title}>Ministry Hours</Text>
          <Text style={styles.subtitle}>Track your preaching and studies</Text>
          <Text style={styles.offlineTag}>Offline Mode - No Internet Needed</Text>
        </View>

        {mode === 'select' && (
          <View style={styles.selectContainer}>
            {existingProfiles.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Select Your Profile</Text>
                <View style={styles.profilesList}>
                  {existingProfiles.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.profileItem,
                        selectedProfile?.id === p.id && styles.profileItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedProfile(p);
                        setMode('login');
                      }}
                    >
                      <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>
                          {p.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.profileName}>
                        {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setMode('create')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.createButtonText}>Create New Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'create' && (
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setMode('select');
                setName('');
                setPin('');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Create Your Profile</Text>

            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Create a PIN (4-6 digits)</Text>
            <TextInput
              style={styles.textInput}
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter PIN"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateProfile}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'login' && selectedProfile && (
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setMode('select');
                setSelectedProfile(null);
                setPin('');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.loginProfile}>
              <View style={styles.loginAvatar}>
                <Text style={styles.loginAvatarText}>
                  {selectedProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.loginName}>
                {selectedProfile.name.charAt(0).toUpperCase() + selectedProfile.name.slice(1)}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Enter Your PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="****"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 8,
  },
  offlineTag: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  profilesList: {
    gap: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  profileItemSelected: {
    borderColor: '#e94560',
    borderWidth: 2,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#0f3460',
  },
  dividerText: {
    color: '#a0a0a0',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  pinInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
  },
  submitButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginProfile: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
});
