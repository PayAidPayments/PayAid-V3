'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MenuItem {
  id: string
  name: string
  description?: string
  category: string
  price: string
  imageUrl?: string
  isAvailable: boolean
  isVegetarian: boolean
  isVegan: boolean
  isSpicy: boolean
  preparationTime?: number
  calories?: number
}

export default function RestaurantMenuPage() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Main Course',
    price: '',
    isVegetarian: false,
    isVegan: false,
    isSpicy: false,
    preparationTime: '',
    calories: '',
  })

  const { data, isLoading } = useQuery<{ items: MenuItem[]; categories: string[] }>({
    queryKey: ['restaurant-menu'],
    queryFn: async () => {
      const response = await apiRequest('/api/industries/restaurant/menu')
      if (!response.ok) throw new Error('Failed to fetch menu')
      const data = await response.json()
      return {
        items: data.items || [],
        categories: data.categories || [],
      }
    },
  })

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('/api/industries/restaurant/menu', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          category: data.category,
          price: parseFloat(data.price),
          isVegetarian: data.isVegetarian,
          isVegan: data.isVegan,
          isSpicy: data.isSpicy,
          preparationTime: data.preparationTime ? parseInt(data.preparationTime) : undefined,
          calories: data.calories ? parseInt(data.calories) : undefined,
        }),
      })
      if (!response.ok) throw new Error('Failed to create menu item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-menu'] })
      setShowAddForm(false)
      setFormData({
        name: '',
        description: '',
        category: 'Main Course',
        price: '',
        isVegetarian: false,
        isVegan: false,
        isSpicy: false,
        preparationTime: '',
        calories: '',
      })
    },
  })

  const menuItems = data?.items || []
  const categories = data?.categories || []

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory)

  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Menu</h1>
          <p className="mt-2 text-gray-600">
            Manage your menu items and categories
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Menu Item'}
        </Button>
      </div>

      {/* Add Menu Item Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Menu Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createMenuItemMutation.mutate(formData)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option>Appetizers</option>
                    <option>Main Course</option>
                    <option>Desserts</option>
                    <option>Beverages</option>
                    <option>Salads</option>
                    <option>Soups</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preparation Time (min)</label>
                  <Input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                  />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVegan}
                    onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                  />
                  <span className="text-sm">Vegan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isSpicy}
                    onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                  />
                  <span className="text-sm">Spicy</span>
                </label>
              </div>
              <Button type="submit" disabled={createMenuItemMutation.isPending}>
                {createMenuItemMutation.isPending ? 'Adding...' : 'Add Menu Item'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items by Category */}
      {isLoading ? (
        <div className="text-center py-12">Loading menu...</div>
      ) : Object.keys(itemsByCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No menu items found</p>
            <p className="text-sm mt-2">Add your first menu item to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>{items.length} items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="ml-2">
                          <span className="text-lg font-bold">₹{item.price}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {item.isVegetarian && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            🥬 Veg
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            🌱 Vegan
                          </span>
                        )}
                        {item.isSpicy && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            🌶️ Spicy
                          </span>
                        )}
                        {item.preparationTime && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            ⏱️ {item.preparationTime} min
                          </span>
                        )}
                        {!item.isAvailable && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
