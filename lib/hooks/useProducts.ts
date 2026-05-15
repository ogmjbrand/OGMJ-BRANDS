'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductStatus, ProductType } from '@/lib/types/database'

interface ProductWithVariants extends Product {
  variants?: any[]
  images?: any[]
}

export function useProducts(businessId: string) {
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_images(*)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setProducts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products'
      setError(message)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createProduct = useCallback(
    async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const supabase = createClient()
        const { error: createError } = await supabase
          .from('products')
          .insert([{ ...product, business_id: businessId }])

        if (createError) throw createError
        await fetchProducts()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create product'
        setError(message)
        console.error('Error creating product:', err)
        return message
      }
    },
    [businessId, fetchProducts]
  )

  const updateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      try {
        const supabase = createClient()
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)

        if (updateError) throw updateError
        await fetchProducts()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update product'
        setError(message)
        console.error('Error updating product:', err)
        return message
      }
    },
    [fetchProducts]
  )

  const updateStatus = useCallback(
    async (productId: string, status: ProductStatus) => {
      return updateProduct(productId, { status })
    },
    [updateProduct]
  )

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        const supabase = createClient()
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)

        if (deleteError) throw deleteError
        await fetchProducts()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete product'
        setError(message)
        console.error('Error deleting product:', err)
        return message
      }
    },
    [fetchProducts]
  )

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    updateStatus,
    deleteProduct,
  }
}
