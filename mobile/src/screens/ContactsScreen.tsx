/**
 * Contacts Screen
 * List and manage contacts
 */

import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/api'

export default function ContactsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await apiClient.get('/api/contacts')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  const contacts = data?.contacts || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
      </View>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactEmail}>{item.email}</Text>
            <Text style={styles.contactPhone}>{item.phone}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No contacts found</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#53328A',
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
})

