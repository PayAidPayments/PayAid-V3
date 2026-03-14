'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { 
  Search, 
  Plus, 
  Bell, 
  HelpCircle, 
  Settings, 
  ChevronDown,
  Download,
  Upload,
  Trash2,
  Edit,
  Package,
  Tag,
  FileText,
  Filter,
  MoreVertical,
  X,
  AlertTriangle,
  LogOut,
  ChevronDown as ChevronDownIcon,
  Settings as SettingsIcon
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
// ModuleTopBar is now in layout.tsx
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  sku: string
  salePrice: number
  quantity: number
  categories: string[]
  images: string[]
  createdAt: string
}

export default function InventoryProductsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, logout } = useAuthStore()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(100)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [filterByOpen, setFilterByOpen] = useState(true)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Fetch products
  useEffect(() => {
    fetchProducts()
  }, [tenantId, page, limit, search, categoryFilter, lowStockFilter])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = useAuthStore.getState().token
      if (!token) return

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(lowStockFilter && { lowStock: 'true' }),
      })

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalRecords(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false)
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  // Get unique categories
  const categories = Array.from(new Set(products.flatMap(p => p.categories || [])))

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}
            
            {/* Create Product Dropdown */}
            <div className="relative" ref={createMenuRef}>
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                Create Product
                <ChevronDown className="w-4 h-4" />
              </button>
              {createMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href={`/inventory/${tenantId}/Products/new`}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      New Product
                    </Link>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Upload className="w-4 h-4 mr-3" />
                      Import Products
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Dropdown */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Actions
                <ChevronDown className="w-4 h-4" />
              </button>
              {actionsMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Download className="w-4 h-4 mr-3" />
                      Export Products
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Tag className="w-4 h-4 mr-3" />
                      Manage Categories
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Trash2 className="w-4 h-4 mr-3" />
                      Mass Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => router.push('/settings')}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <SettingsIcon className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700">Total Records: {totalRecords.toLocaleString()}</p>
          </div>

          {/* Filter Products by */}
          <div>
            <button
              onClick={() => setFilterByOpen(!filterByOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2"
            >
              <span>Filter Products by</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filterByOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterByOpen && (
              <div className="space-y-3">
                <Input
                  placeholder="Q search..."
                  className="h-8 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                    <Checkbox 
                      checked={lowStockFilter}
                      onCheckedChange={(checked) => setLowStockFilter(checked === true)}
                    />
                    <span>Low Stock</span>
                  </label>
                  {categories.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Categories</p>
                      {categories.map((cat) => (
                        <label key={cat} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                          <Checkbox 
                            checked={categoryFilter === cat}
                            onCheckedChange={(checked) => setCategoryFilter(checked === true ? cat : '')}
                          />
                          <span>{cat}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Top Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value={25}>25 Records Per Page</option>
                <option value={50}>50 Records Per Page</option>
                <option value={100}>100 Records Per Page</option>
                <option value={200}>200 Records Per Page</option>
              </select>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                <span>
                  {((page - 1) * limit) + 1} - {Math.min(page * limit, totalRecords)} of {totalRecords}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / limit), p + 1))}
                  disabled={page >= Math.ceil(totalRecords / limit)}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No products found</p>
                  <Link href={`/inventory/${tenantId}/Products/new`}>
                    <Button>Create Your First Product</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProducts.length === products.length && products.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Product Image</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const isSelected = selectedProducts.includes(product.id)
                        const isLowStock = product.quantity <= 10 // Assuming reorderLevel is 10

                        return (
                          <TableRow key={product.id} className={isSelected ? 'bg-green-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                              />
                            </TableCell>
                            <TableCell>
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/inventory/${tenantId}/Products/${product.id}`}
                                className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                              >
                                {product.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{product.sku}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {product.categories && product.categories.length > 0
                                ? product.categories.join(', ')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                                  {product.quantity}
                                </span>
                                {isLowStock && (
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-gray-900">
                              ₹{product.salePrice.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {format(new Date(product.createdAt), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

