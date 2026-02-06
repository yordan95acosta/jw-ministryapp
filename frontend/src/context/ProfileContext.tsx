import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  name: string;
}

interface ProfileContextType {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  logout: () => void;
  isLoading: boolean;
  requirePinVerification: boolean;
  setRequirePinVerification: (value: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = '@ministry_current_profile';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requirePinVerification, setRequirePinVerification] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (savedProfile) {
        // Profile exists but we still require PIN verification on app restart
        // Don't auto-login, just note that a profile exists
        setProfileState(null); // Force login screen
        setRequirePinVerification(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setProfile = async (newProfile: Profile | null) => {
    try {
      if (newProfile) {
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
        setRequirePinVerification(false);
      } else {
        await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      }
      setProfileState(newProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfileState(null);
      setRequirePinVerification(true);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, logout, isLoading, requirePinVerification, setRequirePinVerification }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
