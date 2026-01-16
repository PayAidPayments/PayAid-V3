/**
 * Sync Manager Service
 * Handles data synchronization between offline storage and server
 */

import offlineStorage, { SyncItem } from './offline-storage'
import api from './api'

class SyncManager {
  private isSyncing = false

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    // TODO: Use NetInfo for better network detection
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Sync all pending changes
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress')
      return
    }

    const isOnline = await this.isOnline()
    if (!isOnline) {
      console.log('Device is offline, skipping sync')
      return
    }

    this.isSyncing = true

    try {
      const queue = await offlineStorage.getSyncQueue()

      for (const item of queue) {
        try {
          await this.syncItem(item)
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          // Keep item in queue for retry
        }
      }

      // Clear sync queue after successful sync
      await offlineStorage.clearSyncQueue()
      await offlineStorage.updateLastSync()

      console.log('Sync completed successfully')
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    switch (item.type) {
      case 'create':
        await api.post(`/api/${item.entity}`, item.data)
        break
      case 'update':
        await api.patch(`/api/${item.entity}/${item.data.id}`, item.data)
        break
      case 'delete':
        await api.delete(`/api/${item.entity}/${item.data.id}`)
        break
    }
  }

  /**
   * Sync contacts
   */
  async syncContacts(): Promise<void> {
    const isOnline = await this.isOnline()
    if (!isOnline) {
      return
    }

    try {
      const contacts = await api.get('/api/contacts')
      await offlineStorage.saveContacts(contacts.data)
      await offlineStorage.updateLastSync()
    } catch (error) {
      console.error('Failed to sync contacts:', error)
    }
  }

  /**
   * Sync products catalog
   */
  async syncProducts(): Promise<void> {
    const isOnline = await this.isOnline()
    if (!isOnline) {
      return
    }

    try {
      const products = await api.get('/api/products')
      await offlineStorage.saveProducts(products.data)
      await offlineStorage.updateLastSync()
    } catch (error) {
      console.error('Failed to sync products:', error)
    }
  }
}

export default new SyncManager()

