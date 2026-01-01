/**
 * Tasks Screen
 * List and manage tasks
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Task management coming soon</Text>
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

