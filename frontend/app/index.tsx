import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from './context/ProfileContext';

export default function Index() {
  const router = useRouter();
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading) {
      if (profile) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, profile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e94560" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
