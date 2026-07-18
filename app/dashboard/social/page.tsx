'use client';

import React, { useState } from 'react';
import { CalendarDays, Plus, Sparkles, Clock3, Trash2 } from 'lucide-react';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';
import { AIAssistButton } from '@/components/ai/AIAssistButton';
import { useSocialPosts } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';

const CHANNELS = ['Instagram', 'LinkedIn', 'Facebook', 'Twitter'];

function todayPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function SocialPage() {
  const [businessId, setBusinessId] = useState<string>('');
  const { posts, loading, error, createPost, deletePost } = useSocialPosts(businessId);
  const [newMessage, setNewMessage] = useState('');
  const [newChannel, setNewChannel] = useState(CHANNELS[0]);
  const [newDate, setNewDate] = useState(todayPlusDays(7));
  const [scheduling, setScheduling] = useState(false);

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

  async function handleSchedulePost() {
    if (!newMessage.trim()) return;
    setScheduling(true);
    const err = await createPost({
      content: newMessage.trim(),
      platforms: [newChannel],
      scheduledAt: newDate ? new Date(newDate).toISOString() : undefined,
    });
    if (!err) {
      setNewMessage('');
    }
    setScheduling(false);
  }

  const nextPost = posts.find((p) => p.status === 'scheduled') || posts[0];

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
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-4 py-2 text-sm text-[#C8FF00]">
            <CalendarDays className="h-4 w-4" /> Social studio
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Keep your content calendar polished, strategic and on time.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Create and schedule social moments from one premium workspace that feels built for scale.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Scheduled posts" value={posts.length.toString()} description="Content currently queued" icon={CalendarDays} accent="gold" trend="Live" />
        <MetricCard title="Channels" value={`${CHANNELS.length} channels`} description="Available for scheduling" icon={Sparkles} accent="emerald" trend="Ready" />
        <MetricCard
          title="Next publish"
          value={nextPost?.scheduled_at ? new Date(nextPost.scheduled_at).toLocaleDateString() : '—'}
          description="Your upcoming release window"
          icon={Clock3}
          accent="slate"
          trend="Ready"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionPanel title="Composer" subtitle="Create a new post for your upcoming campaign">
          <div className="space-y-4">
            <textarea
              rows={5}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              className="w-full rounded-[1.35rem] border border-[#C8FF00]/10 bg-[#07070A] p-4 text-sm text-white outline-none transition focus:border-[#C8FF00]"
              placeholder="Write the message for your next social post..."
            />
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <label className="space-y-2 text-sm text-[#C8FF00]/70">
                Channel
                <select
                  value={newChannel}
                  onChange={(event) => setNewChannel(event.target.value)}
                  className="w-full rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none"
                >
                  {CHANNELS.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#C8FF00]/70">
                Publish date
                <input
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                  className="w-full rounded-[1.1rem] border border-[#C8FF00]/10 bg-[#07070A] px-4 py-3 text-white outline-none"
                />
              </label>
              <button
                onClick={handleSchedulePost}
                disabled={scheduling || !newMessage.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C8FF00] px-6 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#C8FF00]/90 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> {scheduling ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
            <AIAssistButton
              task="social-post"
              agent="content"
              label={newMessage.trim() ? 'Polish with AI' : 'Draft with AI'}
              context={{
                channel: newChannel,
                publishDate: newDate,
                brand: 'OGMJ BRANDS — AI business operating system, "from idea to empire"',
                draftOrTopic: newMessage.trim() || 'Announce something exciting for founders building their business',
              }}
              instructions="Return only the post text, ready to paste — no commentary."
              onResult={(text) => setNewMessage(text)}
            />
          </div>
        </SectionPanel>

        <SectionPanel title="Upcoming schedule" subtitle="The next posts already aligned to your calendar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#C8FF00]" />
            </div>
          ) : (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#F8F9FA]/60">No posts scheduled yet.</p>
              ) : (
                posts.slice(0, 3).map((post) => (
                  <div key={post.id} className="rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white">{post.platforms.join(', ') || 'Unassigned'}</h3>
                        <p className="mt-1 text-sm text-[#F8F9FA]/60">
                          {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Draft'}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C8FF00]">
                        {post.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#F8F9FA]/60">{post.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </SectionPanel>
      </div>

      <SectionPanel title="All scheduled posts" subtitle="A clear content calendar for every channel">
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#F8F9FA]/60">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="flex flex-col gap-2 rounded-[1.2rem] border border-[#C8FF00]/10 bg-[#11151E] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{post.platforms.join(', ') || 'Unassigned'}</p>
                  <p className="mt-1 text-sm text-[#F8F9FA]/60">{post.content}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[#C8FF00]/20 bg-[#C8FF00]/10 px-3 py-1 text-xs font-semibold text-[#C8FF00]">
                    {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Draft'}
                  </span>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionPanel>
    </div>
  );
}
