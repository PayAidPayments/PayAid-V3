/**
 * Deals Screen
 * List and manage deals
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function DealsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deals</Text>
      <Text style={styles.subtitle}>Deal management coming soon</Text>
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

