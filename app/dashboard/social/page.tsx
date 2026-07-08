'use client';

import React, { useState } from 'react';
import { CalendarDays, MessageCircle, Plus, Share2, Clock3, Sparkles } from 'lucide-react';
import { MetricCard, SectionPanel } from '@/components/dashboard/EmpireCards';
import { AIAssistButton } from '@/components/ai/AIAssistButton';

const initialPosts = [
  {
    id: '1',
    channel: 'Instagram',
    content: 'Launch your next campaign with VIP offers and exclusive storytelling.',
    publishDate: '2026-05-22',
    status: 'Scheduled',
  },
  {
    id: '2',
    channel: 'LinkedIn',
    content: 'Showcase your growth strategy with analytics insights and authority.',
    publishDate: '2026-05-24',
    status: 'Draft',
  },
];

export default function SocialPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [newMessage, setNewMessage] = useState('');
  const [newChannel, setNewChannel] = useState('Instagram');
  const [newDate, setNewDate] = useState('2026-05-29');

  const handleSchedulePost = () => {
    if (!newMessage.trim()) return;
    setPosts((prev) => [
      {
        id: String(Date.now()),
        channel: newChannel,
        content: newMessage.trim(),
        publishDate: newDate,
        status: 'Scheduled',
      },
      ...prev,
    ]);
    setNewMessage('');
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.16),_transparent_38%),linear-gradient(135deg,#0E1116_0%,#07070A_100%)] p-6 sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-sm text-[#D4AF37]">
            <CalendarDays className="h-4 w-4" /> Social studio
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Keep your content calendar polished, strategic and on time.</h1>
          <p className="mt-3 text-base leading-7 text-[#F8F9FA]/70">Create, schedule and review social moments from one premium workspace that feels built for scale.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Scheduled posts" value={posts.length.toString()} description="Content currently queued" icon={CalendarDays} accent="gold" trend="Live" />
        <MetricCard title="Brand coverage" value="4 channels" description="Consistent story delivery across channels" icon={Sparkles} accent="emerald" trend="Strong" />
        <MetricCard title="Next publish" value={posts[0]?.publishDate ?? '—'} description="Your upcoming release window" icon={Clock3} accent="slate" trend="Ready" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionPanel title="Composer" subtitle="Create a new post for your upcoming campaign" actionLabel="Schedule" actionHref="/dashboard/social">
          <div className="space-y-4">
            <textarea
              rows={5}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              className="w-full rounded-[1.35rem] border border-[#D4AF37]/10 bg-[#07070A] p-4 text-sm text-white outline-none transition focus:border-[#D4AF37]"
              placeholder="Write the message for your next social post..."
            />
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <label className="space-y-2 text-sm text-[#D4AF37]/70">
                Channel
                <select
                  value={newChannel}
                  onChange={(event) => setNewChannel(event.target.value)}
                  className="w-full rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none"
                >
                  <option>Instagram</option>
                  <option>LinkedIn</option>
                  <option>Facebook</option>
                  <option>Twitter</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#D4AF37]/70">
                Publish date
                <input
                  type="date"
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                  className="w-full rounded-[1.1rem] border border-[#D4AF37]/10 bg-[#07070A] px-4 py-3 text-white outline-none"
                />
              </label>
              <button
                onClick={handleSchedulePost}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#07070A] transition hover:bg-[#D4AF37]/90"
              >
                <Plus className="h-4 w-4" /> Schedule
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
          <div className="space-y-3">
            {posts.slice(0, 3).map((post) => (
              <div key={post.id} className="rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{post.channel}</h3>
                    <p className="mt-1 text-sm text-[#F8F9FA]/60">{post.publishDate}</p>
                  </div>
                  <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                    {post.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#F8F9FA]/60">{post.content}</p>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <SectionPanel title="All scheduled posts" subtitle="A clear content calendar for every channel">
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-2 rounded-[1.2rem] border border-[#D4AF37]/10 bg-[#11151E] p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{post.channel}</p>
                <p className="mt-1 text-sm text-[#F8F9FA]/60">{post.content}</p>
              </div>
              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                {post.publishDate}
              </span>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}


