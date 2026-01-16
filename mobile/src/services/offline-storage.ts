/**
 * Offline Storage Service
 * Handles local data storage and sync for offline mode
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEYS = {
  CONTACTS: '@payaid:contacts',
  DEALS: '@payaid:deals',
  TASKS: '@payaid:tasks',
  PRODUCTS: '@payaid:products',
  ORDERS: '@payaid:orders',
  SYNC_QUEUE: '@payaid:sync_queue',
  LAST_SYNC: '@payaid:last_sync',
}

export interface SyncItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  data: any
  timestamp: number
}

class OfflineStorage {
  /**
   * Save data locally
   */
  async save<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save ${key}:`, error)
      throw error
    }
  }

  /**
   * Load data from local storage
   */
  async load<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Failed to load ${key}:`, error)
      return null
    }
  }

  /**
   * Remove data from local storage
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
    }
  }

  /**
   * Save contacts offline
   */
  async saveContacts(contacts: any[]): Promise<void> {
    await this.save(STORAGE_KEYS.CONTACTS, contacts)
  }

  /**
   * Load contacts from offline storage
   */
  async loadContacts(): Promise<any[]> {
    return (await this.load<any[]>(STORAGE_KEYS.CONTACTS)) || []
  }

  /**
   * Save deals offline
   */
  async saveDeals(deals: any[]): Promise<void> {
    await this.save(STORAGE_KEYS.DEALS, deals)
  }

  /**
   * Load deals from offline storage
   */
  async loadDeals(): Promise<any[]> {
    return (await this.load<any[]>(STORAGE_KEYS.DEALS)) || []
  }

  /**
   * Save products catalog offline
   */
  async saveProducts(products: any[]): Promise<void> {
    await this.save(STORAGE_KEYS.PRODUCTS, products)
  }

  /**
   * Load products from offline storage
   */
  async loadProducts(): Promise<any[]> {
    return (await this.load<any[]>(STORAGE_KEYS.PRODUCTS)) || []
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncItem): Promise<void> {
    const queue = await this.getSyncQueue()
    queue.push(item)
    await this.save(STORAGE_KEYS.SYNC_QUEUE, queue)
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<SyncItem[]> {
    return (await this.load<SyncItem[]>(STORAGE_KEYS.SYNC_QUEUE)) || []
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    await this.remove(STORAGE_KEYS.SYNC_QUEUE)
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(): Promise<void> {
    await this.save(STORAGE_KEYS.LAST_SYNC, Date.now())
  }

  /**
   * Get last sync timestamp
   */
  async getLastSync(): Promise<number | null> {
    return await this.load<number>(STORAGE_KEYS.LAST_SYNC)
  }
}

export default new OfflineStorage()

