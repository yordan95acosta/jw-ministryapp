import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from 'date-fns';
import { useProfile } from './context/ProfileContext';

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

interface Entry {
  id: string;
  profile_id: string;
  date: string;
  hours: number;
  minutes: number;
  study_person_name?: string;
  notes?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!profile) return;
    
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Fetch monthly summary
      const summaryRes = await fetch(`${BACKEND_URL}/api/summary/${profile.id}/${year}/${month}`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      // Fetch entries for the month
      const entriesRes = await fetch(`${BACKEND_URL}/api/entries?profile_id=${profile.id}&year=${year}&month=${month}`);
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [currentDate, profile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const goToPrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getEntriesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.filter((e) => e.date === dateStr);
  };

  const hasEntriesForDate = (date: Date) => {
    return getEntriesForDate(date).length > 0;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before month starts
    const emptyCells = Array(startDayOfWeek).fill(null);

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.weekDaysRow}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {emptyCells.map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {days.map((day) => {
            const hasEntries = hasEntriesForDate(day);
            const isCurrentDay = isToday(day);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  isCurrentDay && styles.todayCell,
                  hasEntries && styles.hasEntriesCell,
                ]}
                onPress={() => router.push(`/day/${format(day, 'yyyy-MM-dd')}`)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isCurrentDay && styles.todayText,
                    hasEntries && styles.hasEntriesText,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {hasEntries && <View style={styles.entryDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const progressPercentage = summary
    ? Math.min(
        ((summary.total_hours + summary.total_minutes / 60) / summary.hours_goal) * 100,
        100
      )
    : 0;

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />
      }
    >
      {/* Profile Header */}
      <TouchableOpacity 
        style={styles.profileHeader}
        onPress={() => router.push('/profile')}
      >
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {profile?.name.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.profileName}>
          {profile?.name ? profile.name.charAt(0).toUpperCase() + profile.name.slice(1) : 'Unknown'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#a0a0a0" />
      </TouchableOpacity>

      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Monthly Progress</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>
            {summary?.total_hours || 0}h {summary?.total_minutes || 0}m / {summary?.hours_goal || 30}h
          </Text>
          <Text style={styles.progressPercent}>{progressPercentage.toFixed(0)}%</Text>
        </View>
      </View>

      {/* Studies Summary */}
      <View style={styles.studiesSection}>
        <View style={styles.studyCard}>
          <Ionicons name="people" size={32} color="#e94560" />
          <Text style={styles.studyNumber}>{summary?.unique_studies || 0}</Text>
          <Text style={styles.studyLabel}>Unique Studies</Text>
        </View>
        <View style={styles.studyCard}>
          <Ionicons name="calendar" size={32} color="#0f3460" />
          <Text style={styles.studyNumber}>{summary?.entries_count || 0}</Text>
          <Text style={styles.studyLabel}>Entries</Text>
        </View>
      </View>

      {/* Calendar */}
      {renderCalendar()}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="flag-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/history')}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/export')}
        >
          <Ionicons name="download-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Backup</Text>
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressSection: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#0f3460',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e94560',
  },
  studiesSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  studyCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  studyNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  studyLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
  },
  hasEntriesCell: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    borderRadius: 8,
  },
  dayText: {
    color: '#fff',
    fontSize: 14,
  },
  todayText: {
    fontWeight: 'bold',
    color: '#e94560',
  },
  hasEntriesText: {
    fontWeight: '600',
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e94560',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 32,
  },
});
