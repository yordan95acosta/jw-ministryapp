import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ExportScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/export`);
      if (!res.ok) {
        throw new Error('Failed to export data');
      }

      const data = await res.json();
      const jsonString = JSON.stringify(data, null, 2);
      
      // Create file name with date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `ministry_hours_backup_${date}.json`;
      
      if (Platform.OS === 'web') {
        // Web: Create downloadable blob
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        // Mobile: Save to file system and share
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        // Check if sharing is available
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Ministry Hours Data',
          });
        } else {
          Alert.alert(
            'Exported',
            `File saved to: ${fileUri}\n\nTotal entries: ${data.entries?.length || 0}\nTotal goals: ${data.goals?.length || 0}`
          );
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setImporting(true);

      let jsonString: string;
      
      if (Platform.OS === 'web') {
        // Web: Read file using FileReader
        const response = await fetch(file.uri);
        jsonString = await response.text();
      } else {
        // Mobile: Read from file system
        jsonString = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      const data = JSON.parse(jsonString);

      // Validate data structure
      if (!data.entries && !data.goals) {
        throw new Error('Invalid backup file format');
      }

      // Send to backend
      const res = await fetch(`${BACKEND_URL}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: data.entries || [],
          goals: data.goals || [],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to import data');
      }

      const response = await res.json();
      Alert.alert(
        'Import Complete',
        `Imported ${response.imported_entries} entries and ${response.imported_goals} goals.\n\n(Duplicates were skipped)`
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Error',
        'Failed to import data. Make sure you selected a valid backup file.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Backup & Restore</Text>
        <Text style={styles.headerSubtitle}>
          Export your data for backup or transfer to another device
        </Text>
      </View>

      {/* Export Section */}
      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="cloud-upload" size={48} color="#e94560" />
        </View>
        <Text style={styles.sectionTitle}>Export Data</Text>
        <Text style={styles.sectionDescription}>
          Download all your entries and settings as a JSON file. You can use
          this file to restore your data later or transfer to another device.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Export Data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Import Section */}
      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="cloud-download" size={48} color="#0f3460" />
        </View>
        <Text style={styles.sectionTitle}>Import Data</Text>
        <Text style={styles.sectionDescription}>
          Restore your data from a previously exported backup file. Duplicate
          entries will be skipped automatically.
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, styles.importButton]}
          onPress={handleImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Select Backup File</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#0f3460" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What gets exported?</Text>
            <Text style={styles.infoText}>
              • All your time entries (hours, minutes, notes){"\n"}
              • Study session records{"\n"}
              • Monthly goals{"\n"}
              • Entry dates and timestamps
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#4caf50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your data is safe</Text>
            <Text style={styles.infoText}>
              Importing will not overwrite existing entries. Only new entries
              will be added to your records.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionIcon: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  importButton: {
    backgroundColor: '#0f3460',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoSection: {
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 32,
  },
});
