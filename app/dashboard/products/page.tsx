'use client'

import React, { useState } from 'react'
import { useProducts } from '@/lib/hooks'
import { Plus, Trash2, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProductsPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    type: 'physical' as const,
    status: 'draft' as const,
    price: 0,
  })
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts(businessId)

  React.useEffect(() => {
    const fetchBusinessId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: business } = await supabase
          .from('business_users')
          .select('business_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()
        if (business) setBusinessId((business as any).business_id)
      }
    }
    fetchBusinessId()
  }, [])

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) return
    await createProduct({
      business_id: businessId,
      name: newProduct.name,
      description: newProduct.description || undefined,
      type: newProduct.type,
      status: newProduct.status,
      price: newProduct.price,
      currency: 'USD',
    })
    setNewProduct({ name: '', description: '', type: 'physical', status: 'draft', price: 0 })
    setShowCreateModal(false)
  }

  if (!businessId) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Product Catalog</h1>
            <p className="text-[#D4AF37]/70">Manage your products and inventory</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#0E1116] border border-[#D4AF37]/20 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Add New Product</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white"
                />
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white"
                />
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white"
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                  <option value="subscription">Subscription</option>
                  <option value="course">Course</option>
                </select>
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-[#D4AF37]/20 rounded text-white hover:bg-[#D4AF37]/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded font-semibold hover:bg-[#D4AF37]/90"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div
              key={product.id}
              className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg p-6 hover:border-[#D4AF37]/30 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4AF37]/20 rounded">
                    <Package className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{product.name}</h3>
                    <p className="text-sm text-[#D4AF37]/50">{product.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-[#D4AF37]/10 rounded-full text-xs font-semibold text-[#D4AF37]">
                  {product.status}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-[#D4AF37]/70 mb-4 line-clamp-2">{product.description}</p>
              )}

              {/* Price */}
              <div className="mb-4 p-3 bg-[#D4AF37]/5 rounded">
                <p className="text-[#D4AF37]/50 text-xs">Price</p>
                <p className="text-2xl font-bold text-[#D4AF37]">${product.price.toFixed(2)}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 bg-[#D4AF37]/5 rounded">
                  <p className="text-xs text-[#D4AF37]/50">Variants</p>
                  <p className="text-lg font-bold text-white">{product.variants?.length || 0}</p>
                </div>
                <div className="p-2 bg-[#D4AF37]/5 rounded">
                  <p className="text-xs text-[#D4AF37]/50">Images</p>
                  <p className="text-lg font-bold text-white">{product.images?.length || 0}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded font-semibold text-sm transition">
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
            <p className="text-[#D4AF37]/50 mb-4">No products yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-[#D4AF37] text-black rounded font-semibold hover:bg-[#D4AF37]/90"
            >
              Add Your First Product
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


