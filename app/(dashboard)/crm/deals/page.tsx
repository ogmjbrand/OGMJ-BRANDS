'use client';

import React, { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { listDeals } from '@/lib/services/crm';
import { CreateDealModal } from '@/components/CreateDealModal';
import type { Deal } from '@/lib/types';

export default function DealsPage() {
  const { currentBusiness } = useBusinessContext();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadDeals() {
    if (!currentBusiness) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await listDeals(currentBusiness.id, {
        page: 1,
        pageSize: 50, // More deals for pipeline view
      });

      if (result.success && result.data) {
        setDeals(result.data.items || []);
      } else {
        setError(result.error?.message || 'Failed to load deals');
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

  const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'decision'];

  // Group deals by stage
  const dealsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage);
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
          <p className="text-[#D4AF37]/70 mt-2">Track your sales pipeline</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#07070A] rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition">
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
            <div className="inline-block w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
            <p className="text-[#D4AF37]/70">Loading deals...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage}
              className="min-w-[300px] bg-[#0E1116] border border-[#D4AF37]/10 rounded-xl p-4 space-y-4"
            >
              {/* Stage Header */}
              <div>
                <h3 className="font-semibold text-white capitalize">{stage}</h3>
                <p className="text-xs text-[#D4AF37]/50 mt-1">
                  {dealsByStage[stage].length} deals
                </p>
              </div>

              {/* Deals List */}
              <div className="space-y-3">
                {dealsByStage[stage].length === 0 ? (
                  <div className="p-8 text-center text-[#D4AF37]/50 text-sm">
                    No deals
                  </div>
                ) : (
                  dealsByStage[stage].map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 bg-[#07070A] rounded-lg border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 cursor-move transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white text-sm group-hover:text-[#D4AF37] transition">
                          {deal.title}
                        </h4>
                        <button className="p-1 text-[#D4AF37]/50 hover:text-[#D4AF37] opacity-0 group-hover:opacity-100 transition">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-[#D4AF37] font-semibold">
                        {deal.value} {deal.currency}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#D4AF37]/50">
                          {deal.probability}% prob
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            deal.status === 'won'
                              ? 'bg-green-500/20 text-green-400'
                              : deal.status === 'lost'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-[#D4AF37]/20 text-[#D4AF37]'
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
              <button className="w-full p-3 border-2 border-dashed border-[#D4AF37]/20 rounded-lg text-[#D4AF37]/50 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition text-sm">
                + Add Deal
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
