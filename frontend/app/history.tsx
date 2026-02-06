import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface MonthlySummary {
  year: number;
  month: number;
  total_hours: number;
  total_minutes: number;
  unique_studies: number;
  study_names: string[];
  hours_goal: number;
  entries_count: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HistoryScreen() {
  const [history, setHistory] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getProgressPercent = (summary: MonthlySummary) => {
    const totalHours = summary.total_hours + summary.total_minutes / 60;
    return Math.min((totalHours / summary.hours_goal) * 100, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#e94560"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly History</Text>
        <Text style={styles.headerSubtitle}>
          View your ministry service records
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#a0a0a0" />
          <Text style={styles.emptyText}>No history yet</Text>
          <Text style={styles.emptySubtext}>
            Start logging your hours to see them here
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map((summary) => {
            const progress = getProgressPercent(summary);
            return (
              <View key={`${summary.year}-${summary.month}`} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthName}>
                    {MONTH_NAMES[summary.month - 1]} {summary.year}
                  </Text>
                  <Text style={styles.monthProgress}>
                    {progress.toFixed(0)}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress}%` },
                      progress >= 100 && styles.progressBarComplete,
                    ]}
                  />
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="time-outline" size={18} color="#e94560" />
                    <Text style={styles.statValue}>
                      {summary.total_hours}h {summary.total_minutes}m
                    </Text>
                    <Text style={styles.statLabel}>/ {summary.hours_goal}h goal</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={18} color="#0f3460" />
                    <Text style={styles.statValue}>{summary.unique_studies}</Text>
                    <Text style={styles.statLabel}>Studies</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="document-text-outline" size={18} color="#a0a0a0" />
                    <Text style={styles.statValue}>{summary.entries_count}</Text>
                    <Text style={styles.statLabel}>Entries</Text>
                  </View>
                </View>

                {/* Study Names */}
                {summary.study_names.length > 0 && (
                  <View style={styles.studyNamesSection}>
                    <Text style={styles.studyNamesTitle}>People Studied With:</Text>
                    <View style={styles.studyNamesTags}>
                      {summary.study_names.map((name, index) => (
                        <View key={index} style={styles.nameTag}>
                          <Text style={styles.nameTagText}>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#a0a0a0',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  historyList: {
    paddingHorizontal: 16,
  },
  monthCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthProgress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94560',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#0f3460',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: '#4caf50',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 2,
  },
  studyNamesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  studyNamesTitle: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  studyNamesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nameTag: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  nameTagText: {
    fontSize: 12,
    color: '#fff',
  },
  bottomPadding: {
    height: 32,
  },
});
