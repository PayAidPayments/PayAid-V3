'use client'

import { useCart } from '@/lib/stores/cart'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { items, removeFromCart, clearCart, getTotal } = useCart()
  const router = useRouter()

  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add modules or bundles to get started</p>
          <Link
            href="/app-store"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Modules
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-gray-200 pb-4"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.type === 'module' ? 'Module' : 'Bundle'}
                    {item.tier && ` • ${item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}`}
                  </p>
                  {item.modules && (
                    <p className="text-xs text-gray-400 mt-1">
                      Includes: {item.modules.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-900">
                    ₹{item.price.toLocaleString()}/month
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              <span>₹{total.toLocaleString()}/month</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (GST 18%)</span>
              <span>₹{Math.round(total * 0.18).toLocaleString()}/month</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                ₹{(total + Math.round(total * 0.18)).toLocaleString()}/month
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/app-store"
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
          >
            Continue Shopping
          </Link>
          <button
            onClick={() => router.push('/checkout/payment')}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  )
}

