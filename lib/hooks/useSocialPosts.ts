'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export interface SocialPost {
  id: string
  business_id: string
  account_id: string | null
  title: string | null
  content: string
  media_urls: string[]
  platforms: string[]
  status: SocialPostStatus
  scheduled_at: string | null
  published_at: string | null
  engagement: { likes: number; reach: number; shares: number; comments: number }
  created_by: string | null
  created_at: string
  updated_at: string
}

export function useSocialPosts(businessId: string) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    if (!businessId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('social_posts')
        .select('*')
        .eq('business_id', businessId)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setPosts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch social posts'
      setError(message)
      console.error('Error fetching social posts:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Schedules the post in our own records only — there is no OAuth
  // connection to Instagram/LinkedIn/etc. wired up, so nothing is actually
  // published to those platforms yet.
  const createPost = useCallback(
    async (input: { content: string; platforms: string[]; scheduledAt?: string }) => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error: createError } = await supabase.from('social_posts').insert([
          {
            business_id: businessId,
            created_by: user.id,
            content: input.content,
            platforms: input.platforms,
            scheduled_at: input.scheduledAt || null,
            status: input.scheduledAt ? 'scheduled' : 'draft',
          },
        ])

        if (createError) throw createError
        await fetchPosts()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to schedule post'
        setError(message)
        console.error('Error creating social post:', err)
        return message
      }
    },
    [businessId, fetchPosts]
  )

  const deletePost = useCallback(
    async (postId: string) => {
      try {
        const supabase = createClient()
        const { error: deleteError } = await supabase.from('social_posts').delete().eq('id', postId)

        if (deleteError) throw deleteError
        await fetchPosts()
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete post'
        setError(message)
        console.error('Error deleting social post:', err)
        return message
      }
    },
    [fetchPosts]
  )

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
    createPost,
    deletePost,
  }
}
