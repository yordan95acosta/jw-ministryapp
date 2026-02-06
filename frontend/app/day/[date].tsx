import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useProfile } from '../context/ProfileContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Entry {
  id: string;
  profile_id: string;
  date: string;
  hours: number;
  minutes: number;
  study_person_name?: string;
  notes?: string;
}

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Form states
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [studyPersonName, setStudyPersonName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEntries = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/entries/date/${date}?profile_id=${profile.id}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [date, profile])
  );

  const resetForm = () => {
    setHours('0');
    setMinutes('0');
    setStudyPersonName('');
    setNotes('');
    setEditingEntry(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (entry: Entry) => {
    setEditingEntry(entry);
    setHours(entry.hours.toString());
    setMinutes(entry.minutes.toString());
    setStudyPersonName(entry.study_person_name || '');
    setNotes(entry.notes || '');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const entryData = {
        profile_id: profile.id,
        date,
        hours: parseInt(hours) || 0,
        minutes: parseInt(minutes) || 0,
        study_person_name: studyPersonName.trim() || null,
        notes: notes.trim() || null,
      };

      let res;
      if (editingEntry) {
        res = await fetch(`${BACKEND_URL}/api/entries/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData),
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData),
        });
      }

      if (res.ok) {
        setShowAddModal(false);
        resetForm();
        fetchEntries();
      } else {
        Alert.alert('Error', 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (entry: Entry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BACKEND_URL}/api/entries/${entry.id}`, {
                method: 'DELETE',
              });
              if (res.ok) {
                fetchEntries();
              } else {
                Alert.alert('Error', 'Failed to delete entry');
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const formattedDate = date ? format(parseISO(date), 'EEEE, MMMM d, yyyy') : '';

  const totalMinutes = entries.reduce((acc, e) => acc + e.hours * 60 + e.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Day Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="time" size={24} color="#e94560" />
            <Text style={styles.summaryValue}>
              {totalHours}h {remainingMinutes}m
            </Text>
            <Text style={styles.summaryLabel}>Total Time</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="document-text" size={24} color="#0f3460" />
            <Text style={styles.summaryValue}>{entries.length}</Text>
            <Text style={styles.summaryLabel}>Entries</Text>
          </View>
        </View>

        {/* Entries List */}
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Entries</Text>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#a0a0a0" />
              <Text style={styles.emptyText}>No entries for this day</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryTime}>
                    <Ionicons name="time-outline" size={20} color="#e94560" />
                    <Text style={styles.entryTimeText}>
                      {entry.hours}h {entry.minutes}m
                    </Text>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(entry)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="pencil" size={18} color="#a0a0a0" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(entry)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="trash" size={18} color="#e94560" />
                    </TouchableOpacity>
                  </View>
                </View>
                {entry.study_person_name && (
                  <View style={styles.entryStudy}>
                    <Ionicons name="person" size={16} color="#0f3460" />
                    <Text style={styles.entryStudyText}>
                      Study with: {entry.study_person_name}
                    </Text>
                  </View>
                )}
                {entry.notes && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEntry ? 'Edit Entry' : 'Add Entry'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Time Input */}
              <Text style={styles.inputLabel}>Time</Text>
              <View style={styles.timeInputRow}>
                <View style={styles.timeInput}>
                  <TextInput
                    style={styles.textInput}
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#666"
                  />
                  <Text style={styles.timeLabel}>Hours</Text>
                </View>
                <View style={styles.timeInput}>
                  <TextInput
                    style={styles.textInput}
                    value={minutes}
                    onChangeText={setMinutes}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#666"
                  />
                  <Text style={styles.timeLabel}>Minutes</Text>
                </View>
              </View>

              {/* Study Person */}
              <Text style={styles.inputLabel}>Study Person (Optional)</Text>
              <TextInput
                style={styles.textInputFull}
                value={studyPersonName}
                onChangeText={setStudyPersonName}
                placeholder="Enter person's name"
                placeholderTextColor="#666"
              />

              {/* Notes */}
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInputFull, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingEntry ? 'Update Entry' : 'Save Entry'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  dateHeader: {
    padding: 20,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#0f3460',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginTop: 4,
  },
  entriesSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a0a0',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  entryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTimeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  entryStudy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  entryStudyText: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  entryNotes: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 12,
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  textInputFull: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  notesInput: {
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
