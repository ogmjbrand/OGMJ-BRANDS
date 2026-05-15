'use client'

import React, { useState } from 'react'
import { useConversations } from '@/lib/hooks'
import { Plus, Send, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function InboxPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [messageInput, setMessageInput] = useState('')
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    sendMessage,
    createConversation,
  } = useConversations(businessId)

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
        if (business) setBusinessId(business.business_id)
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
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white">Team Inbox</h1>
          <p className="text-[#D4AF37]/70">Collaborate with your team</p>
        </div>

        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg flex flex-col">
            <div className="p-4 border-b border-[#D4AF37]/10 flex items-center justify-between">
              <h2 className="font-bold text-white">Conversations</h2>
              <button
                onClick={handleNewConversation}
                className="p-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 rounded"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="w-8 h-8 text-[#D4AF37]/30 mx-auto mb-2" />
                  <p className="text-[#D4AF37]/50 text-sm">No conversations</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-[#D4AF37]/5 cursor-pointer transition ${
                      selectedConversation?.id === conv.id
                        ? 'bg-[#D4AF37]/10 border-l-2 border-l-[#D4AF37]'
                        : 'hover:bg-[#D4AF37]/5'
                    }`}
                  >
                    <p className="font-semibold text-white truncate">{conv.subject}</p>
                    <p className="text-xs text-[#D4AF37]/50 mt-1">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-3 backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-[#D4AF37]/10">
                  <h2 className="font-bold text-white">{selectedConversation.subject}</h2>
                  <p className="text-xs text-[#D4AF37]/50">
                    {new Date(selectedConversation.updated_at).toLocaleString()}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-8 h-8 text-[#D4AF37]/30 mx-auto mb-2" />
                      <p className="text-[#D4AF37]/50">No messages yet</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#D4AF37]">
                            {msg.sender?.first_name} {msg.sender?.last_name}
                          </span>
                          <span className="text-xs text-[#D4AF37]/50">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded p-3 text-white break-words">
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#D4AF37]/10 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white placeholder-[#D4AF37]/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded font-semibold flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
                  <p className="text-[#D4AF37]/50">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
