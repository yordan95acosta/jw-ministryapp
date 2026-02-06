import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from './context/ProfileContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const PRESET_GOALS = [15, 30, 50];

export default function SettingsScreen() {
  const { profile } = useProfile();
  const [currentGoal, setCurrentGoal] = useState<number>(30);
  const [customGoal, setCustomGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchCurrentGoal();
  }, [profile]);

  const fetchCurrentGoal = async () => {
    if (!profile) return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/goals/${profile.id}/${currentYear}/${currentMonth}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCurrentGoal(data.hours_goal);
          if (!PRESET_GOALS.includes(data.hours_goal)) {
            setCustomGoal(data.hours_goal.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = async (hours: number) => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          year: currentYear,
          month: currentMonth,
          hours_goal: hours,
        }),
      });

      if (res.ok) {
        setCurrentGoal(hours);
        Alert.alert('Success', `Monthly goal set to ${hours} hours`);
      } else {
        Alert.alert('Error', 'Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (hours: number) => {
    setCustomGoal('');
    saveGoal(hours);
  };

  const handleCustomSave = () => {
    const hours = parseInt(customGoal);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Invalid', 'Please enter a valid number of hours');
      return;
    }
    saveGoal(hours);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Hour Goal</Text>
        <Text style={styles.sectionSubtitle}>
          Set your target hours for {new Date().toLocaleString('default', { month: 'long' })} {currentYear}
        </Text>

        {/* Current Goal Display */}
        <View style={styles.currentGoalCard}>
          <Ionicons name="flag" size={32} color="#e94560" />
          <Text style={styles.currentGoalValue}>{currentGoal} hours</Text>
          <Text style={styles.currentGoalLabel}>Current Goal</Text>
        </View>

        {/* Preset Goals */}
        <Text style={styles.presetLabel}>Quick Select</Text>
        <View style={styles.presetRow}>
          {PRESET_GOALS.map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.presetButton,
                currentGoal === hours && styles.presetButtonActive,
              ]}
              onPress={() => handlePresetSelect(hours)}
              disabled={saving}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  currentGoal === hours && styles.presetButtonTextActive,
                ]}
              >
                {hours}h
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Goal */}
        <Text style={styles.customLabel}>Or set custom goal</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customGoal}
            onChangeText={setCustomGoal}
            placeholder="Enter hours"
            placeholderTextColor="#666"
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[
              styles.customButton,
              !customGoal && styles.customButtonDisabled,
            ]}
            onPress={handleCustomSave}
            disabled={!customGoal || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.customButtonText}>Set</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={24} color="#0f3460" />
          <Text style={styles.infoText}>
            The progress bar on the home screen will track your hours against this goal.
          </Text>
        </View>
      </View>
    </View>
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 24,
  },
  currentGoalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  currentGoalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  currentGoalLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  presetButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a0a0a0',
  },
  presetButtonTextActive: {
    color: '#e94560',
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
  },
  customButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonDisabled: {
    backgroundColor: '#666',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoSection: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
});
