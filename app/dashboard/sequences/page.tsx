'use client'

import React, { useState } from 'react'
import { useEmailSequences } from '@/lib/hooks'
import { Plus, Play, Pause, Trash2, Mail, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SequencesPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [newSequenceName, setNewSequenceName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { sequences, loading, error, createSequence, updateStatus, deleteSequence } = useEmailSequences(businessId)

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

  const handleCreateSequence = async () => {
    if (!newSequenceName.trim()) return
    await createSequence({
      name: newSequenceName,
      description: '',
      business_id: businessId,
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    setNewSequenceName('')
    setShowCreateModal(false)
  }

  if (!businessId) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Email Sequences</h1>
            <p className="text-[#D4AF37]/70">Automate your email campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Sequence
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#0E1116] border border-[#D4AF37]/20 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Create New Sequence</h2>
              <input
                type="text"
                placeholder="Sequence name"
                value={newSequenceName}
                onChange={(e) => setNewSequenceName(e.target.value)}
                className="w-full px-4 py-2 bg-[#0E1116] border border-[#D4AF37]/20 rounded text-white mb-4"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-[#D4AF37]/20 rounded text-white hover:bg-[#D4AF37]/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSequence}
                  className="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded font-semibold hover:bg-[#D4AF37]/90"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sequences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sequences.map(sequence => (
            <div
              key={sequence.id}
              className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg p-6 hover:border-[#D4AF37]/30 transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4AF37]/20 rounded">
                    <Mail className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{sequence.name}</h3>
                    <p className="text-sm text-[#D4AF37]/50">{sequence.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-[#D4AF37]/10 rounded-full text-xs font-semibold text-[#D4AF37]">
                  {sequence.status === 'active' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  {sequence.status}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-[#D4AF37]/5 rounded">
                <div>
                  <p className="text-[#D4AF37]/50 text-xs">Enrolled</p>
                  <p className="text-xl font-bold text-white">0</p>
                </div>
                <div>
                  <p className="text-[#D4AF37]/50 text-xs">Completed</p>
                  <p className="text-xl font-bold text-white">0</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(sequence.id, sequence.status === 'active' ? 'paused' : 'active')}
                  className="flex-1 px-3 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded text-[#D4AF37] font-semibold text-sm transition"
                >
                  {sequence.status === 'active' ? 'Pause' : 'Launch'}
                </button>
                <button className="flex-1 px-3 py-2 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded font-semibold text-sm transition">
                  Edit
                </button>
                <button
                  onClick={() => deleteSequence(sequence.id)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {sequences.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-4" />
            <p className="text-[#D4AF37]/50 mb-4">No sequences yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-[#D4AF37] text-black rounded font-semibold hover:bg-[#D4AF37]/90"
            >
              Create Your First Sequence
            </button>
          </div>
        )}
      </div>
    </div>
  )
}




