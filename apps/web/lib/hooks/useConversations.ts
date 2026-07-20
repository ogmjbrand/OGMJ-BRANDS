'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation, Message, MessageType } from '@/lib/types/database'

interface MessageWithSender extends Message {
  sender?: {
    id: string
    name: string | null
    email: string | null
  }
}

export function useConversations(businessId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<any>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('business_id', businessId)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setConversations(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations'
      setError(message)
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setError(null)
      const supabase = createClient()

      // messages.sender_id FKs to auth.users, which PostgREST can't embed
      // directly and has no relationship to public.profiles — fetch senders
      // separately and merge instead of embedding.
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const rows = data || []
      const senderIds = Array.from(new Set(rows.map((m: any) => m.sender_id).filter(Boolean)))

      let sendersById = new Map<string, { id: string; name: string | null; email: string | null }>()
      if (senderIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', senderIds)

        if (profilesError) throw profilesError
        sendersById = new Map((profiles || []).map((p: any) => [p.id, p]))
      }

      setMessages(rows.map((m: any) => ({ ...m, sender: sendersById.get(m.sender_id) })))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages'
      setError(message)
      console.error('Error fetching messages:', err)
    }
  }, [])

  const subscribeToMessages = useCallback((conversationId: string) => {
    const supabase = createClient()

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    subscriptionRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as MessageWithSender])
        }
      )
      .subscribe()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      const unsubscribe = subscribeToMessages(selectedConversation.id)
      return unsubscribe
    }
  }, [selectedConversation, fetchMessages, subscribeToMessages])

  const sendMessage = useCallback(
    async (content: string, type: MessageType = 'text') => {
      if (!selectedConversation) {
        setError('No conversation selected')
        return
      }

      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error('Not authenticated')

        const { error: sendError } = await supabase.from('messages').insert([
          {
            conversation_id: selectedConversation.id,
            business_id: businessId,
            sender_id: user.id,
            content,
            type,
          },
        ])

        if (sendError) throw sendError
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message'
        setError(message)
        console.error('Error sending message:', err)
      }
    },
    [selectedConversation, businessId]
  )

  const createConversation = useCallback(
    async (title: string) => {
      try {
        const supabase = createClient()
        const { data, error: createError } = await supabase
          .from('conversations')
          .insert([
            {
              business_id: businessId,
              title,
            },
          ])
          .select()
          .single()

        if (createError) throw createError

        await fetchConversations()
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create conversation'
        setError(message)
        console.error('Error creating conversation:', err)
        return null
      }
    },
    [businessId, fetchConversations]
  )

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    loading,
    error,
    sendMessage,
    createConversation,
    refetchConversations: fetchConversations,
  }
}


