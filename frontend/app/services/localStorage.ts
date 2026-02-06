import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  PROFILES: '@ministry_profiles',
  CURRENT_PROFILE: '@ministry_current_profile',
  ENTRIES: '@ministry_entries',
  GOALS: '@ministry_goals',
};

// Types
export interface Profile {
  id: string;
  name: string;
  pinHash: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  profileId: string;
  date: string;
  hours: number;
  minutes: number;
  studyPersonName?: string;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  profileId: string;
  year: number;
  month: number;
  hoursGoal: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  totalHours: number;
  totalMinutes: number;
  uniqueStudies: number;
  studyNames: string[];
  hoursGoal: number;
  entriesCount: number;
}

// Helper: Generate UUID
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper: Simple hash for PIN (client-side only)
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// ============ PROFILE FUNCTIONS ============

export const getProfiles = async (): Promise<Profile[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting profiles:', error);
    return [];
  }
};

export const createProfile = async (name: string, pin: string): Promise<Profile | null> => {
  try {
    const profiles = await getProfiles();
    
    // Check if name exists
    const normalizedName = name.trim().toLowerCase();
    if (profiles.some(p => p.name === normalizedName)) {
      throw new Error('Profile name already exists');
    }
    
    const newProfile: Profile = {
      id: generateId(),
      name: normalizedName,
      pinHash: hashPin(pin),
      createdAt: new Date().toISOString(),
    };
    
    profiles.push(newProfile);
    await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    
    return newProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

export const verifyPin = async (profileId: string, pin: string): Promise<boolean> => {
  try {
    const profiles = await getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) return false;
    return profile.pinHash === hashPin(pin);
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

export const deleteProfile = async (profileId: string): Promise<void> => {
  try {
    // Delete profile
    const profiles = await getProfiles();
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify(updatedProfiles));
    
    // Delete associated entries
    const entries = await getAllEntries();
    const updatedEntries = entries.filter(e => e.profileId !== profileId);
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(updatedEntries));
    
    // Delete associated goals
    const goals = await getAllGoals();
    const updatedGoals = goals.filter(g => g.profileId !== profileId);
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(updatedGoals));
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};

// ============ ENTRY FUNCTIONS ============

const getAllEntries = async (): Promise<Entry[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

export const getEntries = async (profileId: string, year?: number, month?: number): Promise<Entry[]> => {
  try {
    const entries = await getAllEntries();
    let filtered = entries.filter(e => e.profileId === profileId);
    
    if (year && month) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      filtered = filtered.filter(e => e.date.startsWith(monthStr));
    }
    
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
};

export const getEntriesByDate = async (profileId: string, date: string): Promise<Entry[]> => {
  try {
    const entries = await getAllEntries();
    return entries.filter(e => e.profileId === profileId && e.date === date);
  } catch (error) {
    console.error('Error getting entries by date:', error);
    return [];
  }
};

export const createEntry = async (entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> => {
  try {
    const entries = await getAllEntries();
    
    const newEntry: Entry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    entries.push(newEntry);
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
    
    return newEntry;
  } catch (error) {
    console.error('Error creating entry:', error);
    throw error;
  }
};

export const updateEntry = async (entryId: string, updates: Partial<Entry>): Promise<Entry | null> => {
  try {
    const entries = await getAllEntries();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index === -1) return null;
    
    entries[index] = { ...entries[index], ...updates };
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
    
    return entries[index];
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (entryId: string): Promise<void> => {
  try {
    const entries = await getAllEntries();
    const updatedEntries = entries.filter(e => e.id !== entryId);
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

// ============ GOAL FUNCTIONS ============

const getAllGoals = async (): Promise<Goal[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
};

export const getGoal = async (profileId: string, year: number, month: number): Promise<Goal | null> => {
  try {
    const goals = await getAllGoals();
    return goals.find(g => g.profileId === profileId && g.year === year && g.month === month) || null;
  } catch (error) {
    console.error('Error getting goal:', error);
    return null;
  }
};

export const setGoal = async (profileId: string, year: number, month: number, hoursGoal: number): Promise<Goal> => {
  try {
    const goals = await getAllGoals();
    const existingIndex = goals.findIndex(
      g => g.profileId === profileId && g.year === year && g.month === month
    );
    
    if (existingIndex >= 0) {
      goals[existingIndex].hoursGoal = hoursGoal;
      await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
      return goals[existingIndex];
    } else {
      const newGoal: Goal = {
        id: generateId(),
        profileId,
        year,
        month,
        hoursGoal,
      };
      goals.push(newGoal);
      await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
      return newGoal;
    }
  } catch (error) {
    console.error('Error setting goal:', error);
    throw error;
  }
};

// ============ SUMMARY FUNCTIONS ============

export const getMonthlySummary = async (profileId: string, year: number, month: number): Promise<MonthlySummary> => {
  try {
    const entries = await getEntries(profileId, year, month);
    const goal = await getGoal(profileId, year, month);
    
    let totalMinutes = 0;
    const studyNames = new Set<string>();
    
    entries.forEach(entry => {
      totalMinutes += entry.hours * 60 + entry.minutes;
      if (entry.studyPersonName) {
        studyNames.add(entry.studyPersonName.trim().toLowerCase());
      }
    });
    
    return {
      year,
      month,
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes: totalMinutes % 60,
      uniqueStudies: studyNames.size,
      studyNames: Array.from(studyNames),
      hoursGoal: goal?.hoursGoal || 30,
      entriesCount: entries.length,
    };
  } catch (error) {
    console.error('Error getting monthly summary:', error);
    return {
      year,
      month,
      totalHours: 0,
      totalMinutes: 0,
      uniqueStudies: 0,
      studyNames: [],
      hoursGoal: 30,
      entriesCount: 0,
    };
  }
};

export const getHistory = async (profileId: string): Promise<MonthlySummary[]> => {
  try {
    const entries = await getEntries(profileId);
    
    // Get unique year-month combinations
    const monthsSet = new Set<string>();
    entries.forEach(entry => {
      if (entry.date.length >= 7) {
        monthsSet.add(entry.date.substring(0, 7));
      }
    });
    
    // Convert to array and sort descending
    const months = Array.from(monthsSet).sort().reverse();
    
    // Get summary for each month
    const history: MonthlySummary[] = [];
    for (const monthStr of months) {
      const [yearStr, monthNumStr] = monthStr.split('-');
      const summary = await getMonthlySummary(profileId, parseInt(yearStr), parseInt(monthNumStr));
      history.push(summary);
    }
    
    return history;
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

// ============ EXPORT/IMPORT FUNCTIONS ============

export const exportData = async (profileId: string): Promise<object> => {
  try {
    const entries = await getEntries(profileId);
    const goals = (await getAllGoals()).filter(g => g.profileId === profileId);
    
    return {
      entries,
      goals,
      exportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

export const importData = async (
  profileId: string,
  data: { entries?: Entry[]; goals?: Goal[] }
): Promise<{ importedEntries: number; importedGoals: number }> => {
  try {
    let importedEntries = 0;
    let importedGoals = 0;
    
    // Import entries
    if (data.entries && Array.isArray(data.entries)) {
      const existingEntries = await getAllEntries();
      const existingIds = new Set(existingEntries.map(e => e.id));
      
      for (const entry of data.entries) {
        if (!existingIds.has(entry.id)) {
          existingEntries.push({
            ...entry,
            profileId, // Override with current profile
            id: entry.id || generateId(),
          });
          importedEntries++;
        }
      }
      
      await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(existingEntries));
    }
    
    // Import goals
    if (data.goals && Array.isArray(data.goals)) {
      const existingGoals = await getAllGoals();
      
      for (const goal of data.goals) {
        const exists = existingGoals.some(
          g => g.profileId === profileId && g.year === goal.year && g.month === goal.month
        );
        
        if (!exists) {
          existingGoals.push({
            ...goal,
            profileId,
            id: goal.id || generateId(),
          });
          importedGoals++;
        }
      }
      
      await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(existingGoals));
    }
    
    return { importedEntries, importedGoals };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};
