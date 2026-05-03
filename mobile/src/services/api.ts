/**
 * API Service
 * Handles all API calls to PayAid backend
 */

import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.payaid.com'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          await AsyncStorage.removeItem('auth_token')
          // Navigate to login (would need navigation ref)
        }
        return Promise.reject(error)
      }
    )
  }

  async get(endpoint: string, params?: any) {
    return this.client.get(endpoint, { params })
  }

  async post(endpoint: string, data?: any) {
    return this.client.post(endpoint, data)
  }

  async patch(endpoint: string, data?: any) {
    return this.client.patch(endpoint, data)
  }

  async delete(endpoint: string) {
    return this.client.delete(endpoint)
  }
}

export const apiClient = new ApiClient()

