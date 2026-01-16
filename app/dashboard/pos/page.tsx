'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Search,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  IndianRupee,
  X
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  total: number
}

export default function POSPage() {
  const { token, tenant } = useAuthStore()
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<any>(null)

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode) return

    setLoading(true)
    try {
      const response = await fetch(`/api/inventory/barcode/scan?barcode=${encodeURIComponent(barcode)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.product) {
          setScannedProduct(data.product)
          addToCart(data.product)
          setBarcodeInput('')
        } else {
          alert('Product not found')
        }
      } else {
        alert('Failed to scan barcode')
      }
    } catch (error) {
      console.error('Barcode scan error:', error)
      alert('Failed to scan barcode')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.salePrice || product.costPrice || 0,
        quantity: 1,
        total: product.salePrice || product.costPrice || 0,
      }])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + delta)
        return {
          ...item,
          quantity: newQuantity,
          total: newQuantity * item.price,
        }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty')
      return
    }

    setLoading(true)
    try {
      // Create order
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal,
        tax,
        total,
        status: 'completed',
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        alert('Order completed successfully!')
        setCart([])
        setBarcodeInput('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to complete order')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to complete order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Point of Sale</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              In-store checkout and payment processing
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Search & Barcode Scanner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barcode Scanner */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Scan className="w-5 h-5" />
                  Barcode Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Scan or enter barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleBarcodeScan(barcodeInput)
                      }
                    }}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    autoFocus
                  />
                  <Button
                    onClick={() => handleBarcodeScan(barcodeInput)}
                    disabled={loading || !barcodeInput}
                    className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
                  >
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
                {scannedProduct && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm text-green-800 dark:text-green-200">
                      ✓ Scanned: {scannedProduct.name} - ₹{scannedProduct.salePrice || scannedProduct.costPrice}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Search */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Product search functionality coming soon
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="lg:col-span-1">
            <Card className="dark:bg-gray-800 dark:border-gray-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Cart is empty</p>
                    <p className="text-sm">Scan or search for products</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ₹{item.price} × {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="ml-4 font-semibold text-gray-900 dark:text-gray-100">
                            ₹{item.total.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Tax (18%)</span>
                        <span>₹{tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span>Total</span>
                        <span className="flex items-center gap-1">
                          <IndianRupee className="w-5 h-5" />
                          {total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={loading || cart.length === 0}
                      className="w-full bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {loading ? 'Processing...' : 'Checkout'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

