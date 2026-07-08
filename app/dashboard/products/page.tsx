'use client'

import React, { useState } from 'react'
import { useProducts } from '@/lib/hooks'
import { Plus, Trash2, Package, Sparkles, Tag, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards'

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
  const { products, createProduct, deleteProduct } = useProducts(businessId)

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

  const totalValue = products.reduce((sum, product) => sum + (product.price || 0), 0)
  const liveProducts = products.filter((product) => product.status === 'active').length

  if (!businessId) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
              <Sparkles className="h-4 w-4" /> Offer catalog
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Shape your core offers into a polished, sellable catalog.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Turn offerings into a clear product layer that supports your brand, pricing and growth engine.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Products" value={products.length.toString()} description="Offers currently in your catalog" icon={Package} accent="gold" trend="Live" />
        <MetricCard title="Live offers" value={liveProducts.toString()} description="Products ready for sale or delivery" icon={Tag} accent="emerald" trend="Ready" />
        <MetricCard title="Catalog value" value={`$${totalValue.toFixed(2)}`} description="Combined baseline pricing" icon={DollarSign} accent="slate" trend="Tracked" />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.6rem] border border-[#D4AF37]/20 bg-[#0E1116] p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Add new product</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Product name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full rounded-[1.1rem] border border-[#D4AF37]/20 bg-[#07070A] px-4 py-2.5 text-white outline-none focus:border-[#D4AF37]" />
              <textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full rounded-[1.1rem] border border-[#D4AF37]/20 bg-[#07070A] px-4 py-2.5 text-white outline-none focus:border-[#D4AF37]" />
              <select value={newProduct.type} onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value as any })} className="w-full rounded-[1.1rem] border border-[#D4AF37]/20 bg-[#07070A] px-4 py-2.5 text-white outline-none focus:border-[#D4AF37]">
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
                <option value="subscription">Subscription</option>
                <option value="course">Course</option>
              </select>
              <input type="number" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} className="w-full rounded-[1.1rem] border border-[#D4AF37]/20 bg-[#07070A] px-4 py-2.5 text-white outline-none focus:border-[#D4AF37]" />
            </div>
            <div className="mt-6 flex gap-4">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 rounded-full border border-[#D4AF37]/20 px-4 py-2 text-white transition hover:bg-[#D4AF37]/10">Cancel</button>
              <button onClick={handleCreateProduct} className="flex-1 rounded-full bg-[#D4AF37] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">Create</button>
            </div>
          </div>
        </div>
      )}

      <SectionPanel title="Product catalog" subtitle="Move from concept to commerce with a clear, premium set of offers">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-6 transition hover:border-[#D4AF37]/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{product.name}</h3>
                    <p className="text-sm text-[#F8F9FA]/60">{product.type}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{product.status}</span>
              </div>
              {product.description ? <p className="mt-4 text-sm text-[#F8F9FA]/60">{product.description}</p> : null}
              <div className="mt-5 rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] p-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[#D4AF37]/60">Price</p>
                <p className="mt-1 text-2xl font-semibold text-[#D4AF37]">${product.price.toFixed(2)}</p>
              </div>
              <div className="mt-5 flex gap-2">
                <button className="flex-1 rounded-full bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">Edit</button>
                <button onClick={() => deleteProduct(product.id)} className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#11151E] p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]/30" />
            <p className="mb-4 text-[#F8F9FA]/60">No products yet</p>
            <button onClick={() => setShowCreateModal(true)} className="rounded-full bg-[#D4AF37] px-6 py-2 font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">Add your first product</button>
          </div>
        ) : null}
      </SectionPanel>
    </div>
  )
}



