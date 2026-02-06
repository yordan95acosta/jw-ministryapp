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
import { useProfile } from '../src/context/ProfileContext';
import { exportData, importData } from '../src/services/localStorage';

export default function ExportScreen() {
  const { profile } = useProfile();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    if (!profile) return;
    setExporting(true);
    try {
      const data = await exportData(profile.id);
      const jsonString = JSON.stringify(data, null, 2);
      
      const date = new Date().toISOString().split('T')[0];
      const fileName = `ministry_hours_backup_${date}.json`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Ministry Hours Data' });
        } else {
          Alert.alert('Exported', `File saved locally. Use backup to save to cloud storage.`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!profile) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });

      if (result.canceled) return;

      const file = result.assets[0];
      setImporting(true);

      let jsonString: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        jsonString = await response.text();
      } else {
        jsonString = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      }

      const data = JSON.parse(jsonString);

      if (!data.entries && !data.goals) {
        throw new Error('Invalid backup file format');
      }

      const response = await importData(profile.id, data);
      Alert.alert('Import Complete', `Imported ${response.importedEntries} entries and ${response.importedGoals} goals.\n\n(Duplicates were skipped)`);
    } catch (error) {
      Alert.alert('Error', 'Failed to import data. Make sure you selected a valid backup file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Backup & Restore</Text>
        <Text style={styles.headerSubtitle}>Export your data for backup or transfer to another device</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="cloud-upload" size={48} color="#e94560" />
        </View>
        <Text style={styles.sectionTitle}>Export Data</Text>
        <Text style={styles.sectionDescription}>
          Download all your entries and settings as a JSON file. Save this file to restore your data later.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport} disabled={exporting}>
          {exporting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Export Data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionIcon}>
          <Ionicons name="cloud-download" size={48} color="#0f3460" />
        </View>
        <Text style={styles.sectionTitle}>Import Data</Text>
        <Text style={styles.sectionDescription}>
          Restore your data from a previously exported backup file.
        </Text>
        <TouchableOpacity style={[styles.actionButton, styles.importButton]} onPress={handleImport} disabled={importing}>
          {importing ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="folder-open-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Select Backup File</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="phone-portrait-outline" size={24} color="#4caf50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Local Storage</Text>
            <Text style={styles.infoText}>
              Your data is stored only on this device. Export regularly to avoid data loss if you uninstall the app.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  header: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#a0a0a0', marginTop: 4 },
  section: { backgroundColor: '#1a1a2e', marginHorizontal: 16, borderRadius: 16, padding: 24, marginBottom: 16, alignItems: 'center' },
  sectionIcon: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  sectionDescription: { fontSize: 14, color: '#a0a0a0', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  actionButton: { flexDirection: 'row', backgroundColor: '#e94560', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' },
  importButton: { backgroundColor: '#0f3460' },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  infoSection: { paddingHorizontal: 16 },
  infoCard: { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12, gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  infoText: { fontSize: 12, color: '#a0a0a0', lineHeight: 18 },
  bottomPadding: { height: 32 },
});
