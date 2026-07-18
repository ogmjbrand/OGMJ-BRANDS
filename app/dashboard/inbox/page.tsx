'use client'

import React, { useState } from 'react'
import { useConversations } from '@/lib/hooks'
import { Plus, Send, MessageCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function InboxPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [messageInput, setMessageInput] = useState('')
  const { conversations, selectedConversation, setSelectedConversation, messages, sendMessage, createConversation } = useConversations(businessId)

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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return
    await sendMessage(messageInput, 'text')
    setMessageInput('')
  }

  const handleNewConversation = async () => {
    const conv = await createConversation('New Discussion')
    if (conv) {
      setSelectedConversation(conv)
    }
  }

  if (!businessId) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <Sparkles className="h-4 w-4" /> Team communication
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Keep collaboration elegant, fast and always in context.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Move conversations from scattered threads into one calm, connected workspace.</p>
        </div>
      </div>

      <div className="grid h-[calc(100vh-260px)] gap-6 xl:grid-cols-[0.95fr_1.6fr]">
        <div className="flex flex-col rounded-[1.6rem] border border-[#D4AF37]/10 bg-[#0E1116]/90">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/10 p-4">
            <h2 className="font-semibold text-white">Conversations</h2>
            <button onClick={handleNewConversation} className="rounded-full bg-[#D4AF37]/10 p-2 text-[#D4AF37] transition hover:bg-[#D4AF37]/20">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-[#F8F9FA]/60">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-[#D4AF37]/30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id} onClick={() => setSelectedConversation(conv)} className={`cursor-pointer border-b border-[#D4AF37]/5 p-4 transition ${selectedConversation?.id === conv.id ? 'bg-[#D4AF37]/10 border-l-2 border-l-[#D4AF37]' : 'hover:bg-[#D4AF37]/5'}`}>
                  <p className="truncate font-semibold text-white">{conv.title}</p>
                  <p className="mt-1 text-xs text-[#F8F9FA]/60">{new Date(conv.updated_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-[1.6rem] border border-[#D4AF37]/10 bg-[#0E1116]/90">
          {selectedConversation ? (
            <>
              <div className="border-b border-[#D4AF37]/10 p-4">
                <h2 className="font-semibold text-white">{selectedConversation.title}</h2>
                <p className="mt-1 text-xs text-[#F8F9FA]/60">{new Date(selectedConversation.updated_at).toLocaleString()}</p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-[#F8F9FA]/60">
                    <MessageCircle className="mx-auto mb-2 h-8 w-8 text-[#D4AF37]/30" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#D4AF37]">{msg.sender?.name || 'Unknown'}</span>
                        <span className="text-xs text-[#F8F9FA]/50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="rounded-[1.1rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-white break-words">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 border-t border-[#D4AF37]/10 p-4">
                <input type="text" placeholder="Type a message..." value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 rounded-full border border-[#D4AF37]/10 bg-[#07070A] px-4 py-2 text-white outline-none placeholder:text-[#F8F9FA]/40" />
                <button onClick={handleSendMessage} className="rounded-full bg-[#D4AF37] px-4 py-2 font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-[#F8F9FA]/60">
              <div>
                <MessageCircle className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]/30" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



