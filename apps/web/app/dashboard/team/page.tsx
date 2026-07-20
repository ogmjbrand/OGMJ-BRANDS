'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  Clock,
  Trash2,
  Shield,
  Activity,
  Mail,
} from 'lucide-react';
import { useBusinessContext } from '@/lib/context/BusinessContext';
import { SectionPanel } from '@/components/dashboard/EmpireCards';
import {
  listTeamMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  listPendingInvitations,
  revokeInvitation,
  listActivity,
  type TeamMember,
  type PendingInvitation,
  type ActivityEntry,
  type TeamRole,
} from '@/lib/services/team.service';

const ROLES: Exclude<TeamRole, 'owner'>[] = ['admin', 'manager', 'member'];

function initials(name: string | null, email: string) {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
  return email[0]?.toUpperCase() || '?';
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function activityLabel(entry: ActivityEntry) {
  const actor = entry.actor?.name || entry.actor?.email || 'Someone';
  switch (entry.action) {
    case 'invited':
      return `${actor} invited ${entry.entity_name || 'a new member'} as ${entry.metadata?.role || 'member'}`;
    case 'joined':
      return `${actor} joined the team`;
    case 'role_changed':
      return `${actor} changed a member's role to ${entry.metadata?.role || 'member'}`;
    case 'removed':
      return `${actor} removed a team member`;
    default:
      return `${actor} ${entry.action.replace(/_/g, ' ')} ${entry.entity_type.replace(/_/g, ' ')}`;
  }
}

export default function TeamPage() {
  const { currentBusiness } = useBusinessContext();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<TeamRole, 'owner'>>('member');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentBusiness) return;
    setLoading(true);
    const [membersResult, invitationsResult, activityResult] = await Promise.all([
      listTeamMembers(currentBusiness.id),
      listPendingInvitations(currentBusiness.id),
      listActivity(currentBusiness.id),
    ]);
    if (membersResult.success && membersResult.data) setMembers(membersResult.data);
    if (invitationsResult.success && invitationsResult.data) setInvitations(invitationsResult.data);
    if (activityResult.success && activityResult.data) setActivity(activityResult.data);
    setLoading(false);
  }, [currentBusiness]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!currentBusiness || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setMessage(null);
    const result = await inviteMember(currentBusiness.id, inviteEmail.trim(), inviteRole);
    if (result.success) {
      setMessage(`Invitation sent to ${inviteEmail.trim()}.`);
      setInviteEmail('');
      load();
    } else {
      setError(result.error?.message || 'Failed to send invitation');
    }
    setInviting(false);
  }

  async function handleRoleChange(userId: string, role: Exclude<TeamRole, 'owner'>) {
    if (!currentBusiness) return;
    const result = await updateMemberRole(currentBusiness.id, userId, role);
    if (result.success) {
      load();
    } else {
      setError(result.error?.message || 'Failed to update role');
    }
  }

  async function handleRemove(userId: string) {
    if (!currentBusiness) return;
    if (!confirm('Remove this member from the team?')) return;
    const result = await removeMember(currentBusiness.id, userId);
    if (result.success) {
      load();
    } else {
      setError(result.error?.message || 'Failed to remove member');
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!currentBusiness) return;
    const result = await revokeInvitation(currentBusiness.id, invitationId);
    if (result.success) {
      load();
    } else {
      setError(result.error?.message || 'Failed to revoke invitation');
    }
  }

  if (!currentBusiness) {
    return <div className="text-sm text-[#F8F9FA]/60">Loading your business…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Team</h1>
        <p className="mt-1 text-sm text-[#F8F9FA]/60">
          Invite teammates, manage roles, and see who did what across your business.
        </p>
      </div>

      <SectionPanel title="Invite a teammate" subtitle="They'll get access once they accept the invite.">
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F8F9FA]/30" />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full rounded-xl border border-white/10 bg-[#11151E] py-2 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:border-[#C8FF00]/40 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-[0.2em] text-[#F8F9FA]/50">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Exclude<TeamRole, 'owner'>)}
              className="w-full rounded-xl border border-white/10 bg-[#11151E] px-3 py-2 text-sm text-white focus:border-[#C8FF00]/40 focus:outline-none sm:w-40"
            >
              {ROLES.map((role) => (
                <option key={role} value={role} className="capitalize">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C8FF00] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#B8EF00] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {inviting ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        {message ? <p className="mt-3 text-xs text-[#10B981]">{message}</p> : null}
        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
      </SectionPanel>

      <SectionPanel title="Members" subtitle={`${members.length} ${members.length === 1 ? 'person' : 'people'} with access`}>
        {loading ? (
          <p className="text-sm text-[#F8F9FA]/50">Loading…</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-2xl bg-[#11151E] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8FF00]/15 text-xs font-semibold text-[#C8FF00]">
                    {initials(member.profile?.name ?? null, member.profile?.email || '')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {member.profile?.name || member.profile?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-[#F8F9FA]/50">{member.profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.role === 'owner' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8FF00]/30 bg-[#C8FF00]/10 px-3 py-1 text-xs font-medium text-[#C8FF00]">
                      <Shield className="h-3.5 w-3.5" />
                      Owner
                    </span>
                  ) : (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.user_id, e.target.value as Exclude<TeamRole, 'owner'>)}
                        className="rounded-xl border border-white/10 bg-[#0E1116] px-2.5 py-1.5 text-xs text-white focus:border-[#C8FF00]/40 focus:outline-none"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemove(member.user_id)}
                        aria-label="Remove member"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 ? <p className="text-sm text-[#F8F9FA]/50">No team members yet.</p> : null}
          </div>
        )}
      </SectionPanel>

      {invitations.length > 0 && (
        <SectionPanel title="Pending invitations" subtitle="Not accepted yet">
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-2xl bg-[#11151E] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-[#F8F9FA]/40" />
                  <div>
                    <p className="text-sm font-medium text-white">{invitation.email}</p>
                    <p className="text-xs capitalize text-[#F8F9FA]/50">{invitation.role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(invitation.id)}
                  className="text-xs font-medium text-red-400 transition hover:text-red-300"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </SectionPanel>
      )}

      <SectionPanel title="Activity" subtitle="Recent changes to your team">
        {activity.length === 0 ? (
          <p className="text-sm text-[#F8F9FA]/50">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-xl bg-[#11151E] px-3 py-2.5">
                <Activity className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#C8FF00]/60" />
                <div className="flex-1">
                  <p className="text-xs text-[#F8F9FA]/70">{activityLabel(entry)}</p>
                </div>
                <span className="whitespace-nowrap text-[10px] text-[#F8F9FA]/40">{relativeTime(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
