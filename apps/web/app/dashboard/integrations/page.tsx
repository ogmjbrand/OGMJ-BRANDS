'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Unplug,
  Clock,
  ArrowUpDown,
  Slack,
  Mail,
  Calendar,
  Workflow,
  Webhook,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listIntegrations,
  getHubSpotConnectUrl,
  disconnectHubSpot,
  syncHubSpotNow,
  updateHubSpotSettings,
  getHubSpotInsights,
  HUBSPOT_DEFAULT_FIELD_MAPPINGS,
  OGMJ_FIELD_LABELS,
  type IntegrationRecord,
  type IntegrationSyncLog,
} from '@/lib/services/integrations.service';

const COMING_SOON = [
  { name: 'Slack', description: 'Post deal + support alerts into a channel.', icon: Slack },
  { name: 'Mailchimp', description: 'Sync contacts into marketing audiences.', icon: Mail },
  { name: 'Google Calendar', description: 'Two-way meeting + appointment sync.', icon: Calendar },
  { name: 'Zapier', description: 'Connect OGMJ to 5,000+ apps.', icon: Workflow },
];

function StatusBanner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get('connected');
  const hubspotError = searchParams.get('hubspot_error');

  if (connected === 'hubspot') {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#10B981]">
        <CheckCircle2 className="h-4 w-4" />
        HubSpot connected successfully.
      </div>
    );
  }

  if (hubspotError) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="h-4 w-4" />
        HubSpot connection failed ({hubspotError.replace(/_/g, ' ')}). Please try again.
      </div>
    );
  }

  return null;
}

function HubSpotCard({
  businessId,
  integration,
  syncLogs,
  onChanged,
}: {
  businessId: string;
  integration: IntegrationRecord | null;
  syncLogs: IntegrationSyncLog[];
  onChanged: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [frequency, setFrequency] = useState(integration?.config?.syncFrequency || 'manual');
  const [conflictResolution, setConflictResolution] = useState(integration?.config?.conflictResolution || 'newest_wins');
  const [contactMapping, setContactMapping] = useState<Record<string, string>>({
    ...HUBSPOT_DEFAULT_FIELD_MAPPINGS.contact,
    ...(integration?.config?.fieldMappings?.contact || {}),
  });
  const [dealMapping, setDealMapping] = useState<Record<string, string>>({
    ...HUBSPOT_DEFAULT_FIELD_MAPPINGS.deal,
    ...(integration?.config?.fieldMappings?.deal || {}),
  });
  const [savingMapping, setSavingMapping] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    setFrequency(integration?.config?.syncFrequency || 'manual');
    setConflictResolution(integration?.config?.conflictResolution || 'newest_wins');
    setContactMapping({
      ...HUBSPOT_DEFAULT_FIELD_MAPPINGS.contact,
      ...(integration?.config?.fieldMappings?.contact || {}),
    });
    setDealMapping({
      ...HUBSPOT_DEFAULT_FIELD_MAPPINGS.deal,
      ...(integration?.config?.fieldMappings?.deal || {}),
    });
  }, [integration]);

  const isConnected = !!integration?.isActive;
  const hubDomain = integration?.config?.hubDomain;
  const relevantLogs = syncLogs.filter((l) => l.integration_id === integration?.id).slice(0, 8);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    const result = await syncHubSpotNow(businessId);
    if (result.success) {
      const totalPulled = result.data?.reduce((sum, r) => sum + r.pulled, 0) || 0;
      const totalPushed = result.data?.reduce((sum, r) => sum + r.pushed, 0) || 0;
      setMessage(`Sync complete — ${totalPulled} pulled from HubSpot, ${totalPushed} pushed to HubSpot.`);
      onChanged();
    } else {
      setMessage(result.error?.message || 'Sync failed');
    }
    setSyncing(false);
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect HubSpot? OGMJ CRM data will not be affected, but sync history for this connection will be cleared.')) {
      return;
    }
    setDisconnecting(true);
    const result = await disconnectHubSpot(businessId);
    if (result.success) {
      onChanged();
    } else {
      setMessage(result.error?.message || 'Failed to disconnect');
    }
    setDisconnecting(false);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    const result = await updateHubSpotSettings(businessId, { syncFrequency: frequency, conflictResolution });
    if (result.success) {
      setMessage('Sync settings saved.');
      onChanged();
    } else {
      setMessage(result.error?.message || 'Failed to save settings');
    }
    setSavingSettings(false);
  }

  async function handleSaveMapping() {
    setSavingMapping(true);
    const result = await updateHubSpotSettings(businessId, {
      fieldMappings: { contact: contactMapping, deal: dealMapping },
    });
    if (result.success) {
      setMessage('Field mapping saved.');
      onChanged();
    } else {
      setMessage(result.error?.message || 'Failed to save field mapping');
    }
    setSavingMapping(false);
  }

  async function handleCopyWebhookUrl() {
    const url = `${window.location.origin}/api/integrations/hubspot/webhook`;
    await navigator.clipboard.writeText(url);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  }

  async function handleGenerateInsights() {
    setGeneratingInsights(true);
    setInsightsError(null);
    const result = await getHubSpotInsights(businessId);
    if (result.success && result.data) {
      setInsights(result.data.text);
    } else {
      setInsightsError(result.error?.message || 'Failed to generate insights');
    }
    setGeneratingInsights(false);
  }

  return (
    <SectionPanel
      title="HubSpot"
      subtitle={
        isConnected
          ? `Connected${hubDomain ? ` to ${hubDomain}` : ''} · OGMJ CRM remains the source of truth`
          : 'Two-way sync for Contacts and Deals. OAuth-based, optional, disconnect anytime.'
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        {isConnected ? (
          <>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              <Unplug className="h-4 w-4" />
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
            {integration?.lastSyncedAt ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#F8F9FA]/50">
                <Clock className="h-3.5 w-3.5" />
                Last synced {new Date(integration.lastSyncedAt).toLocaleString()}
              </span>
            ) : (
              <span className="text-xs text-[#F8F9FA]/50">Not synced yet</span>
            )}
          </>
        ) : (
          <a
            href={getHubSpotConnectUrl(businessId)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00]"
          >
            <Plug className="h-4 w-4" />
            Connect HubSpot
          </a>
        )}
      </div>

      {integration?.errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {integration.errorMessage}
        </div>
      ) : null}

      {message ? <p className="text-xs text-[#C8FF00]/80">{message}</p> : null}

      {isConnected && (
        <div className="grid gap-4 border-t border-white/5 pt-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              Sync frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              <option value="manual">Manual only</option>
              <option value="hourly">Every hour</option>
              <option value="daily">Once a day</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              Conflict resolution
            </label>
            <select
              value={conflictResolution}
              onChange={(e) => setConflictResolution(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none"
            >
              <option value="newest_wins">Newest record wins</option>
              <option value="hubspot_wins">HubSpot always wins</option>
              <option value="ogmj_wins">OGMJ always wins</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-2 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
          >
            {savingSettings ? 'Saving…' : 'Save sync settings'}
          </button>
        </div>
      )}

      {isConnected && (
        <div className="border-t border-white/5 pt-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">Field mapping</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#C8FF00]/80">Contacts</p>
              {Object.keys(contactMapping).map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-28 flex-shrink-0 truncate text-xs text-[#F8F9FA]/60">
                    {OGMJ_FIELD_LABELS[field] || field}
                  </span>
                  <input
                    type="text"
                    value={contactMapping[field]}
                    onChange={(e) => setContactMapping((m) => ({ ...m, [field]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#11151E] px-2.5 py-1.5 text-xs text-white focus:border-[#C8FF00]/40 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#C8FF00]/80">Deals</p>
              {Object.keys(dealMapping).map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-28 flex-shrink-0 truncate text-xs text-[#F8F9FA]/60">
                    {OGMJ_FIELD_LABELS[field] || field}
                  </span>
                  <input
                    type="text"
                    value={dealMapping[field]}
                    onChange={(e) => setDealMapping((m) => ({ ...m, [field]: e.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-[#11151E] px-2.5 py-1.5 text-xs text-white focus:border-[#C8FF00]/40 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[#F8F9FA]/40">
            Right-hand values are HubSpot internal property names — change them to sync against custom properties.
          </p>
          <button
            type="button"
            onClick={handleSaveMapping}
            disabled={savingMapping}
            className="mt-3 inline-flex w-fit items-center gap-2 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-2 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
          >
            {savingMapping ? 'Saving…' : 'Save field mapping'}
          </button>
        </div>
      )}

      {isConnected && (
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              <Sparkles className="h-3.5 w-3.5" />
              AI insights
            </p>
            <button
              type="button"
              onClick={handleGenerateInsights}
              disabled={generatingInsights}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-1.5 text-xs font-medium text-[#C8FF00] transition hover:bg-[#C8FF00]/20 disabled:opacity-60"
            >
              <Sparkles className={`h-3.5 w-3.5 ${generatingInsights ? 'animate-pulse' : ''}`} />
              {generatingInsights ? 'Analyzing…' : insights ? 'Regenerate' : 'Generate insights'}
            </button>
          </div>
          {insightsError ? <p className="mt-2 text-xs text-red-400">{insightsError}</p> : null}
          {insights ? (
            <div className="mt-3 whitespace-pre-wrap rounded-xl bg-[#11151E] px-4 py-3 text-sm leading-relaxed text-[#F8F9FA]/80">
              {insights}
            </div>
          ) : !insightsError ? (
            <p className="mt-2 text-xs text-[#F8F9FA]/50">
              Summarize your synced HubSpot contacts and deals — relationship health, at-risk deals, and recommended next actions.
            </p>
          ) : null}
        </div>
      )}

      {isConnected && (
        <div className="border-t border-white/5 pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
            <Webhook className="h-3.5 w-3.5" />
            Real-time webhooks
          </p>
          <p className="text-xs text-[#F8F9FA]/60">
            To sync instantly instead of waiting for the sync schedule, register this URL as the webhook target in
            your HubSpot app's developer settings, subscribed to Contact and Deal creation / property change /
            deletion events.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-white/10 bg-[#11151E] px-2.5 py-1.5 text-xs text-[#C8FF00]">
              /api/integrations/hubspot/webhook
            </code>
            <button
              type="button"
              onClick={handleCopyWebhookUrl}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#F8F9FA]/60 transition hover:border-[#C8FF00]/40 hover:text-[#C8FF00]"
            >
              {webhookCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {isConnected && relevantLogs.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Recent activity
          </p>
          <div className="space-y-1.5">
            {relevantLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl bg-[#11151E] px-3 py-2 text-xs text-[#F8F9FA]/70"
              >
                <span className="capitalize">
                  {log.direction === 'inbound' ? 'Pulled' : 'Pushed'} {log.object_type}s
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      log.status === 'success'
                        ? 'text-[#10B981]'
                        : log.status === 'failed'
                          ? 'text-red-400'
                          : 'text-amber-400'
                    }
                  >
                    {log.records_synced} synced{log.records_failed > 0 ? `, ${log.records_failed} failed` : ''}
                  </span>
                  <span className="text-[#F8F9FA]/40">{new Date(log.started_at).toLocaleTimeString()}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionPanel>
  );
}

function IntegrationsPageContent() {
  const { currentBusiness } = useBusinessContext();
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [syncLogs, setSyncLogs] = useState<IntegrationSyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const result = await listIntegrations(currentBusiness.id);
    if (result.success && result.data) {
      setIntegrations(result.data.integrations);
      setSyncLogs(result.data.syncLogs);
    }
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  const hubspot = integrations.find((i) => i.provider === 'hubspot') || null;

  if (!currentBusiness) {
    return <div className="text-sm text-[#F8F9FA]/60">Loading your business…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Integration Marketplace</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Connect external tools without ever making them your primary system — OGMJ's own CRM stays the source of
          truth, and you can disconnect any integration at any time.
        </p>
      </div>

      <StatusBanner />

      {loading ? (
        <div className="text-sm text-[#F8F9FA]/60">Loading integrations…</div>
      ) : (
        <>
          <HubSpotCard businessId={currentBusiness.id} integration={hubspot} syncLogs={syncLogs} onChanged={load} />

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#F8F9FA]/50">Coming soon</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COMING_SOON.map((item) => (
                <div
                  key={item.name}
                  className="rounded-[1.35rem] border border-white/5 bg-[#0E1116]/60 p-4 opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-white/5 p-3 text-[#F8F9FA]/60">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F8F9FA]/50">
                      Soon
                    </span>
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-white/80">{item.name}</h4>
                  <p className="mt-2 text-sm text-[#F8F9FA]/50">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[#F8F9FA]/60">Loading…</div>}>
      <IntegrationsPageContent />
    </Suspense>
  );
}
