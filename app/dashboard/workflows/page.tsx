'use client';

import React, { useState } from 'react';
import { Zap, GitBranch, Send, Sparkles, CheckCircle2, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';
import { useWorkflows } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';

const TRIGGER_OPTIONS = [
  { value: 'lead_created', label: 'Lead created' },
  { value: 'invoice_paid', label: 'Invoice paid' },
  { value: 'video_uploaded', label: 'Video uploaded' },
  { value: 'manual', label: 'Manual start' },
];

const ACTION_OPTIONS = [
  { type: 'send_email', label: 'Send email' },
  { type: 'add_crm_note', label: 'Add CRM note' },
  { type: 'schedule_social_post', label: 'Schedule social post' },
  { type: 'generate_report', label: 'Generate report' },
];

export default function WorkflowsPage() {
  const [businessId, setBusinessId] = useState<string>('');
  const { workflows, loading, error, createWorkflow, updateStatus, runWorkflow, deleteWorkflow } = useWorkflows(businessId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState(TRIGGER_OPTIONS[0].value);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchBusinessId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: business } = await supabase
        .from('business_users')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      if (business) setBusinessId((business as any).business_id);
    };
    fetchBusinessId();
  }, []);

  function toggleAction(type: string) {
    setSelectedActions((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  async function handleCreateWorkflow() {
    if (!name.trim()) {
      setFormError('Workflow name is required.');
      return;
    }
    if (selectedActions.length === 0) {
      setFormError('Select at least one action.');
      return;
    }

    setCreating(true);
    setFormError(null);

    const actions = selectedActions.map((type) => ({
      type,
      label: ACTION_OPTIONS.find((a) => a.type === type)?.label || type,
    }));

    const err = await createWorkflow({ name: name.trim(), description: description.trim(), triggerType, actions });

    if (err) {
      setFormError(err);
      setCreating(false);
      return;
    }

    setName('');
    setDescription('');
    setTriggerType(TRIGGER_OPTIONS[0].value);
    setSelectedActions([]);
    setShowCreateModal(false);
    setCreating(false);
  }

  async function handleRun(workflowId: string) {
    setRunningId(workflowId);
    await runWorkflow(workflowId);
    setRunningId(null);
  }

  const activeCount = workflows.filter((w) => w.status === 'active').length;
  const totalRuns = workflows.reduce((sum, w) => sum + (w.run_count || 0), 0);

  if (!businessId) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C8FF00]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#C8FF00]/10 bg-[radial-gradient(circle_at_top_left,_rgba(200, 255, 0,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-4 py-2 text-sm text-[#C8FF00]">
              <Zap className="h-4 w-4" /> Automation layer
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Automations that keep your empire moving while you focus on growth.</h1>
            <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Turn customer moments into responsive workflows that feel polished, intelligent and easy to trust.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[#C8FF00] px-5 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90">
            <Plus className="h-4 w-4" /> New workflow
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Active automations" value={activeCount.toString()} description="High-value flows currently live" icon={PlayCircle} accent="gold" trend="Live" />
        <MetricCard title="Total workflows" value={workflows.length.toString()} description="Automations in your workspace" icon={Sparkles} accent="emerald" trend="Live" />
        <MetricCard title="Total runs" value={totalRuns.toString()} description="Times a workflow has been triggered" icon={CheckCircle2} accent="slate" trend="Tracked" />
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#C8FF00]" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-12 text-center">
          <p className="text-lg font-medium text-white">No workflows yet</p>
          <p className="mt-1 text-sm text-[#F8F9FA]/60">Create your first automation to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {workflows.map((workflow) => (
            <SectionPanel
              key={workflow.id}
              title={workflow.name}
              subtitle={`Trigger: ${TRIGGER_OPTIONS.find((t) => t.value === workflow.trigger_type)?.label || workflow.trigger_type}`}
            >
              <div className="rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Actions</p>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">
                      {workflow.actions.length > 0 ? workflow.actions.map((a) => a.label).join(', ') : 'No actions configured'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${workflow.status === 'active' ? 'border border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]' : 'border border-[#C8FF00]/20 bg-[#C8FF00]/10 text-[#C8FF00]'}`}>
                    {workflow.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-[#F8F9FA]/50">
                  Run {workflow.run_count} time{workflow.run_count === 1 ? '' : 's'}
                  {workflow.last_run_at ? ` · last run ${new Date(workflow.last_run_at).toLocaleString()}` : ''}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleRun(workflow.id)}
                    disabled={runningId === workflow.id}
                    className="inline-flex items-center gap-2 rounded-full bg-[#C8FF00] px-4 py-2 text-xs font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> {runningId === workflow.id ? 'Running...' : 'Run now'}
                  </button>
                  <button
                    onClick={() => updateStatus(workflow.id, workflow.status === 'active' ? 'paused' : 'active')}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 px-4 py-2 text-xs font-semibold text-[#C8FF00] transition hover:bg-[#C8FF00]/10"
                  >
                    <GitBranch className="h-4 w-4" /> {workflow.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            </SectionPanel>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.6rem] border border-[#C8FF00]/20 bg-[#0E1116] p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">Create New Workflow</h2>

            {formError && (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{formError}</div>
            )}

            <div className="space-y-4">
              <label className="block space-y-2 text-sm text-[#C8FF00]/70">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. New Lead Nurture"
                  className="w-full rounded-2xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                />
              </label>
              <label className="block space-y-2 text-sm text-[#C8FF00]/70">
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does this automation do?"
                  className="w-full rounded-2xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                />
              </label>
              <label className="block space-y-2 text-sm text-[#C8FF00]/70">
                Trigger
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full rounded-2xl border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none focus:border-[#C8FF00]"
                >
                  {TRIGGER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 text-sm text-[#C8FF00]/70">
                Actions
                <div className="flex flex-wrap gap-2">
                  {ACTION_OPTIONS.map((action) => (
                    <button
                      type="button"
                      key={action.type}
                      onClick={() => toggleAction(action.type)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        selectedActions.includes(action.type)
                          ? 'border-[#C8FF00] bg-[#C8FF00] text-[#07070A]'
                          : 'border-[#C8FF00]/20 bg-transparent text-[#C8FF00] hover:bg-[#C8FF00]/10'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-full border border-[#C8FF00]/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#C8FF00]/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={creating}
                className="flex-1 rounded-full bg-[#C8FF00] px-4 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
