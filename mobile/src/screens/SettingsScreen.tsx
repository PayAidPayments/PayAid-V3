/**
 * Settings Screen
 * App settings and preferences
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Settings management coming soon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#53328A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
})

