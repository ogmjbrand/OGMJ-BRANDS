'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Store, Clock, RotateCcw, ShoppingBag, X } from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listMarketplaceListings,
  listMarketplaceOrders,
  placeMarketplaceOrder,
  type MarketplaceListing,
  type MarketplaceOrder,
} from '@/lib/services/marketplace.service';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function ListingCard({ listing, onOrder }: { listing: MarketplaceListing; onOrder: (listing: MarketplaceListing) => void }) {
  const price = listing.sale_price ?? listing.price;
  return (
    <div className="flex flex-col rounded-[1.5rem] border border-white/10 bg-[#0E1116]/90 p-5">
      {listing.is_featured ? (
        <span className="mb-3 inline-flex w-fit items-center rounded-full border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C8FF00]">
          Featured
        </span>
      ) : null}
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/40">{listing.category}</p>
      <h3 className="mt-1.5 text-lg font-semibold text-white">{listing.title}</h3>
      <p className="mt-2 flex-1 text-sm text-[#F8F9FA]/60">{listing.short_desc}</p>
      <div className="mt-4 flex items-center gap-4 text-xs text-[#F8F9FA]/50">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {listing.delivery_days} day delivery
        </span>
        {listing.revisions > 0 ? (
          <span className="flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            {listing.revisions} revisions
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <div>
          <span className="text-lg font-semibold text-white">{formatMoney(price, listing.currency)}</span>
          {listing.price_type === 'starting_from' ? <span className="ml-1 text-xs text-[#F8F9FA]/40">starting</span> : null}
        </div>
        <button
          type="button"
          onClick={() => onOrder(listing)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00]"
        >
          <ShoppingBag className="h-4 w-4" />
          Order
        </button>
      </div>
    </div>
  );
}

function OrderModal({
  listing,
  businessId,
  onClose,
  onOrdered,
}: {
  listing: MarketplaceListing;
  businessId: string;
  onClose: () => void;
  onOrdered: () => void;
}) {
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await placeMarketplaceOrder({ businessId, listingId: listing.id, requirements });
    if (result.success) {
      onOrdered();
      onClose();
    } else {
      setError(result.error?.message || 'Failed to place order');
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[1.75rem] border border-[#C8FF00]/10 bg-[#0E1116] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{listing.title}</h3>
            <p className="mt-1 text-sm text-[#F8F9FA]/60">{formatMoney(listing.sale_price ?? listing.price, listing.currency)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#F8F9FA]/50 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
            Requirements (optional)
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={4}
            placeholder="Tell OGMJ anything relevant before we start…"
            className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#C8FF00] py-2.5 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            {submitting ? 'Placing order…' : 'Confirm order'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { currentBusiness } = useBusinessContext();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const [listingsResult, ordersResult] = await Promise.all([
      listMarketplaceListings(),
      listMarketplaceOrders(currentBusiness.id),
    ]);
    if (listingsResult.success && listingsResult.data) setListings(listingsResult.data);
    if (ordersResult.success && ordersResult.data) setOrders(ordersResult.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  if (!currentBusiness) {
    return <div className="text-sm text-[#F8F9FA]/60">Loading your business…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Marketplace</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Order real OGMJ services directly into your workspace — no separate contracts, just an order and a delivery date.
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#10B981]">{message}</div>
      ) : null}

      {loading ? (
        <div className="text-sm text-[#F8F9FA]/60">Loading marketplace…</div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onOrder={setSelectedListing} />
            ))}
          </div>

          <SectionPanel title="Your orders" subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'}`}>
            {orders.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-[#F8F9FA]/50">
                <Store className="h-4 w-4" />
                No orders yet — order a service above to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl bg-[#11151E] px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-white">{order.listing?.title || 'Service'}</p>
                      <p className="text-xs text-[#F8F9FA]/40">{order.order_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{formatMoney(order.total_price, order.currency)}</p>
                      <p className="text-xs capitalize text-[#F8F9FA]/50">{order.status.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </>
      )}

      {selectedListing ? (
        <OrderModal
          listing={selectedListing}
          businessId={currentBusiness.id}
          onClose={() => setSelectedListing(null)}
          onOrdered={() => {
            setMessage(`Order placed for ${selectedListing.title}.`);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
