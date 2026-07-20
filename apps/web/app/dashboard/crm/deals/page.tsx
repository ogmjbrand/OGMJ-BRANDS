'use client';

import React, { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { listDeals, deleteDeal, listPipelineStages } from '@/lib/services/crm';
import { CreateDealModal } from '@/components/CreateDealModal';
import type { Deal, PipelineStage } from '@/lib/types';

export default function DealsPage() {
  const { currentBusiness } = useBusinessContext();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [createStageId, setCreateStageId] = useState<string | undefined>(undefined);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function loadDeals() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [dealsResult, stagesResult] = await Promise.all([
        listDeals(currentBusiness.id, {
          page: 1,
          pageSize: 50, // More deals for pipeline view
        }),
        listPipelineStages(currentBusiness.id),
      ]);

      if (dealsResult.success && dealsResult.data) {
        setDeals(dealsResult.data.items || []);
      } else {
        setError(dealsResult.error?.message || 'Failed to load deals');
      }

      if (stagesResult.success && stagesResult.data) {
        setStages(stagesResult.data.stages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, [currentBusiness]);

  const handleCreateSuccess = () => {
    loadDeals(); // Reload deals after creating a new one
  };

  async function handleDeleteDeal(dealId: string) {
    if (!currentBusiness) return;
    if (!confirm('Delete this deal? This cannot be undone.')) return;

    setOpenMenuId(null);
    const result = await deleteDeal(currentBusiness.id, dealId);
    if (result.success) {
      setDeals((prev) => prev.filter((d) => d.id !== dealId));
    } else {
      alert(result.error?.message || 'Failed to delete deal');
    }
  }

  function openCreateModalForStage(stageId: string) {
    setEditingDeal(null);
    setCreateStageId(stageId);
    setShowCreateModal(true);
  }

  // Group deals by their real stage_id
  const dealsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.id] = deals.filter((d) => d.stage_id === stage.id);
      return acc;
    },
    {} as Record<string, Deal[]>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Deals Pipeline</h1>
          <p className="text-[#C8FF00]/70 mt-2">Track your sales pipeline</p>
        </div>
        <button
          onClick={() => {
            setEditingDeal(null);
            setCreateStageId(undefined);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#C8FF00] text-[#07070A] rounded-lg font-semibold hover:bg-[#C8FF00]/90 transition">
          <Plus className="w-5 h-5" />
          New Deal
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
          <p className="text-[#FF6B6B] text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-[#C8FF00]/20 border-t-[#C8FF00] rounded-full animate-spin"></div>
            <p className="text-[#C8FF00]/70">Loading deals...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="min-w-[300px] bg-[#0E1116] border border-[#C8FF00]/10 rounded-xl p-4 space-y-4"
            >
              {/* Stage Header */}
              <div>
                <h3 className="font-semibold text-white">{stage.name}</h3>
                <p className="text-xs text-[#C8FF00]/50 mt-1">
                  {(dealsByStage[stage.id] || []).length} deals
                </p>
              </div>

              {/* Deals List */}
              <div className="space-y-3">
                {(dealsByStage[stage.id] || []).length === 0 ? (
                  <div className="p-8 text-center text-[#C8FF00]/50 text-sm">
                    No deals
                  </div>
                ) : (
                  dealsByStage[stage.id].map((deal) => (
                    <div
                      key={deal.id}
                      className="relative p-3 bg-[#07070A] rounded-lg border border-[#C8FF00]/10 hover:border-[#C8FF00]/30 transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm group-hover:text-[#C8FF00] transition">
                          {deal.title}
                        </h4>
                        <button
                          title="More options"
                          onClick={() => setOpenMenuId(openMenuId === deal.id ? null : deal.id)}
                          className="p-1 text-[#C8FF00]/50 hover:text-[#C8FF00] transition"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenuId === deal.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 z-20 w-32 rounded-lg border border-[#C8FF00]/20 bg-[#0E1116] py-1 shadow-xl text-left">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setEditingDeal(deal);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#C8FF00]/10 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDeal(deal.id)}
                                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-[#C8FF00] font-semibold">
                        {deal.value} {deal.currency}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#C8FF00]/50">
                          {deal.probability}% prob
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            deal.status === 'won'
                              ? 'bg-green-500/20 text-green-400'
                              : deal.status === 'lost'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-[#C8FF00]/20 text-[#C8FF00]'
                          }`}
                        >
                          {deal.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Deal Button */}
              <button
                onClick={() => openCreateModalForStage(stage.id)}
                className="w-full p-3 border-2 border-dashed border-[#C8FF00]/20 rounded-lg text-[#C8FF00]/50 hover:text-[#C8FF00] hover:border-[#C8FF00]/50 transition text-sm"
              >
                + Add Deal
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        isOpen={showCreateModal}
        initialStageId={createStageId}
        onClose={() => {
          setShowCreateModal(false);
          setCreateStageId(undefined);
        }}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Deal Modal */}
      <CreateDealModal
        isOpen={Boolean(editingDeal)}
        deal={editingDeal}
        onClose={() => setEditingDeal(null)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}


