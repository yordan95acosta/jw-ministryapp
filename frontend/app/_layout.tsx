import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#16213e',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Ministry Hours',
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="day/[date]" 
          options={{ 
            title: 'Day Details',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
          }} 
        />
        <Stack.Screen 
          name="history" 
          options={{ 
            title: 'History',
          }} 
        />
        <Stack.Screen 
          name="export" 
          options={{ 
            title: 'Export / Import',
          }} 
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
});
