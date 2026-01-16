/**
 * Route Optimization Service
 * Optimizes visit routes for field agents
 */

import GPSTracking, { Location } from './gps-tracking'

export interface Visit {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  priority: 'high' | 'medium' | 'low'
  estimatedDuration: number // in minutes
  timeWindow?: {
    start: string // HH:mm
    end: string // HH:mm
  }
}

export interface OptimizedRoute {
  visits: Visit[]
  totalDistance: number // in km
  estimatedTime: number // in minutes
  startLocation: Location
  endLocation: Location
}

class RouteOptimization {
  /**
   * Optimize route using nearest neighbor algorithm
   */
  optimizeRoute(
    visits: Visit[],
    startLocation: Location
  ): OptimizedRoute {
    if (visits.length === 0) {
      return {
        visits: [],
        totalDistance: 0,
        estimatedTime: 0,
        startLocation,
        endLocation: startLocation,
      }
    }

    const optimized: Visit[] = []
    const unvisited = [...visits]
    let currentLocation = startLocation

    // Sort by priority first (high priority first)
    unvisited.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    // Nearest neighbor algorithm
    while (unvisited.length > 0) {
      let nearestIndex = 0
      let nearestDistance = Infinity

      for (let i = 0; i < unvisited.length; i++) {
        const visit = unvisited[i]
        const distance = GPSTracking.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          visit.latitude,
          visit.longitude
        )

        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0]
      optimized.push(nearest)
      currentLocation = {
        latitude: nearest.latitude,
        longitude: nearest.longitude,
        timestamp: Date.now(),
      }
    }

    // Calculate total distance and time
    let totalDistance = 0
    let totalTime = 0
    currentLocation = startLocation

    for (const visit of optimized) {
      const distance = GPSTracking.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        visit.latitude,
        visit.longitude
      )
      totalDistance += distance
      totalTime += Math.ceil(distance * 2) // Assume 30 km/h average speed
      totalTime += visit.estimatedDuration
      currentLocation = {
        latitude: visit.latitude,
        longitude: visit.longitude,
        timestamp: Date.now(),
      }
    }

    return {
      visits: optimized,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedTime: totalTime,
      startLocation,
      endLocation: currentLocation,
    }
  }

  /**
   * Get directions between two points (Google Maps API)
   */
  async getDirections(
    origin: Location,
    destination: Location
  ): Promise<any> {
    // TODO: Integrate with Google Maps Directions API
    // For now, return basic route info
    const distance = GPSTracking.calculateDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    )

    return {
      distance,
      duration: Math.ceil(distance * 2), // minutes
      polyline: null, // Would contain encoded polyline
    }
  }
}

export default new RouteOptimization()

